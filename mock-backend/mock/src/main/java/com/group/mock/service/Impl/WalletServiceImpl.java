package com.group.mock.service.Impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.group.mock.configuration.VNPayConfiguration.VNPayUtil;
import com.group.mock.entity.Account;
import com.group.mock.entity.TransactionHistory;
import com.group.mock.entity.Wallet;
import com.group.mock.entity.DTO.request.TopUpRequest;
import com.group.mock.entity.DTO.request.WalletDeductRequest;
import com.group.mock.entity.DTO.response.PaymentCallbackResponse;
import com.group.mock.entity.DTO.response.TopUpResponse;
import com.group.mock.entity.DTO.response.TransactionHistorySummary;
import com.group.mock.entity.DTO.response.WalletBalanceResponse;
import com.group.mock.entity.DTO.response.WalletDeductResponse;
import com.group.mock.repository.TransactionHistoryRepository;
import com.group.mock.repository.WalletRepository;
import com.group.mock.service.AccountService;
import com.group.mock.service.WalletService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.Duration;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.SortedMap;
import java.util.TreeMap;
import java.util.UUID;

@Slf4j
@Service
public class WalletServiceImpl implements WalletService {
    private static final String BALANCE_CACHE_KEY_PREFIX = "cache:wallet:balance:";
    private static final String HISTORY_CACHE_KEY_PREFIX = "cache:wallet:history:";

    private final WalletRepository walletRepository;
    private final TransactionHistoryRepository transactionHistoryRepository;
    private final AccountService accountService;
    private final StringRedisTemplate stringRedisTemplate;
    private final DefaultRedisScript<Long> walletDeductScript;
    private final ObjectMapper objectMapper;

    @Value("${app.cache.wallet-balance-ttl-seconds:300}")
    private long walletBalanceTtlSeconds;

    @Value("${app.cache.wallet-history-ttl-seconds:120}")
    private long walletHistoryTtlSeconds;

    @Value("${vnpay.tmn-code}")
    private String vnpTmnCode;

    @Value("${vnpay.secret-key}")
    private String vnpSecretKey;

    @Value("${vnpay.pay-url}")
    private String vnpPayUrl;

    @Value("${vnpay.return-url}")
    private String vnpReturnUrl;

    public WalletServiceImpl(
            WalletRepository walletRepository,
            TransactionHistoryRepository transactionHistoryRepository,
            AccountService accountService,
            StringRedisTemplate stringRedisTemplate,
            DefaultRedisScript<Long> walletDeductScript,
            ObjectMapper objectMapper) {
        this.walletRepository = walletRepository;
        this.transactionHistoryRepository = transactionHistoryRepository;
        this.accountService = accountService;
        this.stringRedisTemplate = stringRedisTemplate;
        this.walletDeductScript = walletDeductScript;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public WalletBalanceResponse createWallet(String username) {
        Account account = accountService.getAccountByUsername(username);
        Wallet wallet = getOrCreateWallet(account.getId());
        updateBalanceCache(wallet.getUserId(), wallet.getBalance());
        return new WalletBalanceResponse(normalizeAmount(wallet.getBalance()), wallet.getCurrency());
    }

    @Override
    @Transactional
    public WalletBalanceResponse getBalance(String username) {
        Account account = accountService.getAccountByUsername(username);
        Wallet wallet = getOrCreateWallet(account.getId());

        String cachedBalance = stringRedisTemplate.opsForValue().get(balanceCacheKey(account.getId()));
        if (cachedBalance != null) {
            BigDecimal balance = fromScaledAmount(Long.parseLong(cachedBalance));
            return new WalletBalanceResponse(balance, wallet.getCurrency());
        }

        BigDecimal balance = normalizeAmount(wallet.getBalance());
        stringRedisTemplate.opsForValue().set(
                balanceCacheKey(account.getId()),
                String.valueOf(toScaledAmount(balance)),
                Duration.ofSeconds(walletBalanceTtlSeconds));

        return new WalletBalanceResponse(balance, wallet.getCurrency());
    }

    @Override
    @Transactional
    public TopUpResponse createTopUp(String username, TopUpRequest request, String ipAddress) {
        Account account = accountService.getAccountByUsername(username);
        Wallet wallet = getOrCreateWallet(account.getId());

        BigDecimal amount = normalizeAmount(request.getAmount());
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be greater than 0");
        }

        String vnpTxnRef = generateTxnRef();
        TransactionHistory history = new TransactionHistory();
        history.setWallet(wallet);
        history.setVnpTxnRef(vnpTxnRef);
        history.setAmount(amount);
        history.setVnpOrderInfo(sanitizeOrderInfo(request.getOrderInfo(), "Wallet top up"));
        history.setVnpOrderType("other");
        history.setVnpIpAddr(ipAddress);
        history.setBalanceBefore(wallet.getBalance());

        ZonedDateTime now = ZonedDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        history.setVnpCreateDate(now.format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));
        history.setVnpExpireDate(now.plusMinutes(15).format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));

        transactionHistoryRepository.save(history);

        SortedMap<String, String> vnpParams = new TreeMap<>();
        vnpParams.put("vnp_Version", "2.1.0");
        vnpParams.put("vnp_Command", "pay");
        vnpParams.put("vnp_TmnCode", vnpTmnCode);
        vnpParams.put("vnp_Amount", toVnpAmount(amount));
        vnpParams.put("vnp_CurrCode", "VND");
        vnpParams.put("vnp_Locale", "vn");
        vnpParams.put("vnp_TxnRef", vnpTxnRef);
        vnpParams.put("vnp_OrderInfo", history.getVnpOrderInfo());
        vnpParams.put("vnp_OrderType", "other");
        vnpParams.put("vnp_ReturnUrl", vnpReturnUrl);
        vnpParams.put("vnp_IpAddr", ipAddress);
        vnpParams.put("vnp_CreateDate", history.getVnpCreateDate());
        vnpParams.put("vnp_ExpireDate", history.getVnpExpireDate());

        if (request.getBankCode() != null && !request.getBankCode().isBlank()) {
            vnpParams.put("vnp_BankCode", request.getBankCode());
        }

        String secureHash = VNPayUtil.hashAllFields(vnpParams, vnpSecretKey);
        String paymentUrl = buildPaymentUrl(vnpParams, secureHash);

        return new TopUpResponse(paymentUrl, vnpTxnRef, amount);
    }

    @Override
    @Transactional
    public PaymentCallbackResponse handleVnpayCallback(Map<String, String> params) {
        String vnpTxnRef = params.get("vnp_TxnRef");
        if (vnpTxnRef == null) {
            return new PaymentCallbackResponse(false, "Missing vnp_TxnRef", null);
        }

        SortedMap<String, String> hashParams = new TreeMap<>(params);
        String secureHash = hashParams.remove("vnp_SecureHash");
        hashParams.remove("vnp_SecureHashType");
        String calculatedHash = VNPayUtil.hashAllFields(hashParams, vnpSecretKey);
        if (secureHash == null || !secureHash.equalsIgnoreCase(calculatedHash)) {
            return new PaymentCallbackResponse(false, "Invalid signature", vnpTxnRef);
        }

        Optional<TransactionHistory> historyOptional = transactionHistoryRepository.findByVnpTxnRef(vnpTxnRef);
        if (historyOptional.isEmpty()) {
            return new PaymentCallbackResponse(false, "Transaction not found", vnpTxnRef);
        }

        TransactionHistory history = historyOptional.get();
        if ("SUCCESS".equalsIgnoreCase(history.getStatus())) {
            return new PaymentCallbackResponse(true, "Already processed", vnpTxnRef);
        }

        String responseCode = params.get("vnp_ResponseCode");
        String transactionStatus = params.get("vnp_TransactionStatus");
        boolean success = "00".equals(responseCode) && (transactionStatus == null || "00".equals(transactionStatus));

        history.setVnpTransactionNo(params.get("vnp_TransactionNo"));
        history.setVnpBankCode(params.get("vnp_BankCode"));
        history.setVnpBankTranNo(params.get("vnp_BankTranNo"));
        history.setVnpCardType(params.get("vnp_CardType"));
        history.setVnpPayDate(params.get("vnp_PayDate"));
        history.setVnpResponseCode(responseCode);

        if (success) {
            Wallet wallet = history.getWallet();
            BigDecimal balanceBefore = wallet.getBalance();
            BigDecimal newBalance = balanceBefore.add(history.getAmount());
            wallet.setBalance(newBalance);
            walletRepository.save(wallet);

            history.setStatus("SUCCESS");
            history.setBalanceBefore(balanceBefore);
            history.setBalanceAfter(newBalance);
            transactionHistoryRepository.save(history);

            updateBalanceCache(wallet.getUserId(), newBalance);
            invalidateHistoryCache(wallet.getId());
            return new PaymentCallbackResponse(true, "Success", vnpTxnRef);
        }

        history.setStatus("FAILED");
        transactionHistoryRepository.save(history);
        invalidateHistoryCache(history.getWallet().getId());
        return new PaymentCallbackResponse(false, "Payment failed", vnpTxnRef);
    }

    @Override
    @Transactional
    public List<TransactionHistorySummary> getHistory(String username) {
        Account account = accountService.getAccountByUsername(username);
        Wallet wallet = getOrCreateWallet(account.getId());

        String cacheKey = historyCacheKey(wallet.getId());
        String cachedJson = stringRedisTemplate.opsForValue().get(cacheKey);
        if (cachedJson != null) {
            List<TransactionHistorySummary> cached = readHistoryCache(cachedJson);
            if (cached != null) {
                return cached;
            }
        }

        List<TransactionHistory> histories = transactionHistoryRepository
                .findByWalletIdOrderByCreatedAtDesc(wallet.getId());
        List<TransactionHistorySummary> summaries = new ArrayList<>();
        for (TransactionHistory history : histories) {
            summaries.add(toSummary(history));
        }

        writeHistoryCache(cacheKey, summaries);
        return summaries;
    }

    @Override
    @Transactional
    public WalletDeductResponse deduct(String username, WalletDeductRequest request) {
        Account account = accountService.getAccountByUsername(username);
        Wallet wallet = getOrCreateWallet(account.getId());

        BigDecimal amount = normalizeAmount(request.getAmount());
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be greater than 0");
        }

        BigDecimal balanceBefore = wallet.getBalance();
        String balanceKey = balanceCacheKey(account.getId());
        ensureBalanceCache(wallet, balanceKey);

        long scaledAmount = toScaledAmount(amount);
        Long newScaledBalance = stringRedisTemplate.execute(
                walletDeductScript,
                Collections.singletonList(balanceKey),
                String.valueOf(scaledAmount));

        if (newScaledBalance == null || newScaledBalance == -2L) {
            throw new IllegalStateException("Balance cache missing");
        }
        if (newScaledBalance == -1L) {
            throw new IllegalStateException("Insufficient balance");
        }

        BigDecimal newBalance = fromScaledAmount(newScaledBalance);
        wallet.setBalance(newBalance);
        walletRepository.save(wallet);

        TransactionHistory history = new TransactionHistory();
        history.setWallet(wallet);
        history.setVnpTxnRef("DEBIT-" + generateTxnRef());
        history.setAmount(amount);
        history.setVnpOrderInfo(request.getDescription() != null ? request.getDescription() : "Wallet deduction");
        history.setVnpOrderType("DEBIT");
        history.setVnpCreateDate(ZonedDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"))
                .format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));
        history.setStatus("SUCCESS");
        history.setBalanceBefore(balanceBefore);
        history.setBalanceAfter(newBalance);
        transactionHistoryRepository.save(history);

        updateBalanceCache(wallet.getUserId(), newBalance);
        invalidateHistoryCache(wallet.getId());
        return new WalletDeductResponse(newBalance, wallet.getCurrency());
    }

    private Wallet getOrCreateWallet(UUID userId) {
        return walletRepository.findByUserId(userId).orElseGet(() -> {
            Wallet wallet = new Wallet();
            wallet.setUserId(userId);
            wallet.setBalance(BigDecimal.ZERO);
            return walletRepository.save(wallet);
        });
    }

    private String generateTxnRef() {
        return String.valueOf(System.currentTimeMillis()) + VNPayUtil.getRandomNumber(6);
    }

    private String toVnpAmount(BigDecimal amount) {
        BigDecimal vnpAmount = amount.setScale(0, RoundingMode.DOWN).multiply(BigDecimal.valueOf(100));
        return vnpAmount.toPlainString();
    }

    private String buildPaymentUrl(SortedMap<String, String> vnpParams, String secureHash) {
        StringBuilder url = new StringBuilder(vnpPayUrl);
        url.append("?");
        for (Map.Entry<String, String> entry : vnpParams.entrySet()) {
            url.append(URLEncoder.encode(entry.getKey(), StandardCharsets.UTF_8));
            url.append("=");
            url.append(URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8));
            url.append("&");
        }
        url.append("vnp_SecureHash=").append(secureHash);
        return url.toString();
    }

    private BigDecimal normalizeAmount(BigDecimal amount) {
        if (amount == null) {
            throw new IllegalArgumentException("Amount is required");
        }
        return amount.setScale(4, RoundingMode.HALF_UP);
    }

    private long toScaledAmount(BigDecimal amount) {
        return amount.movePointRight(4).longValueExact();
    }

    private BigDecimal fromScaledAmount(long scaled) {
        return BigDecimal.valueOf(scaled).movePointLeft(4);
    }

    private String sanitizeOrderInfo(String input, String fallback) {
        String raw = (input == null || input.isBlank()) ? fallback : input;
        String normalized = Normalizer.normalize(raw, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replaceAll("[^A-Za-z0-9 ]", " ")
                .replaceAll("\\s+", " ")
                .trim();
        if (normalized.isEmpty()) {
            return fallback;
        }
        return normalized;
    }

    private void ensureBalanceCache(Wallet wallet, String balanceKey) {
        if (Boolean.TRUE.equals(stringRedisTemplate.hasKey(balanceKey))) {
            return;
        }
        stringRedisTemplate.opsForValue().set(
                balanceKey,
                String.valueOf(toScaledAmount(normalizeAmount(wallet.getBalance()))),
                Duration.ofSeconds(walletBalanceTtlSeconds));
    }

    private void updateBalanceCache(UUID userId, BigDecimal balance) {
        stringRedisTemplate.opsForValue().set(
                balanceCacheKey(userId),
                String.valueOf(toScaledAmount(normalizeAmount(balance))),
                Duration.ofSeconds(walletBalanceTtlSeconds));
    }

    private void invalidateHistoryCache(Long walletId) {
        stringRedisTemplate.delete(historyCacheKey(walletId));
    }

    private String balanceCacheKey(UUID userId) {
        return BALANCE_CACHE_KEY_PREFIX + userId;
    }

    private String historyCacheKey(Long walletId) {
        return HISTORY_CACHE_KEY_PREFIX + walletId;
    }

    private TransactionHistorySummary toSummary(TransactionHistory history) {
        return new TransactionHistorySummary(
                history.getId(),
                history.getVnpTxnRef(),
                history.getAmount(),
                history.getStatus(),
                history.getVnpResponseCode(),
                history.getVnpTransactionNo(),
                history.getVnpPayDate(),
                history.getCreatedAt());
    }

    private List<TransactionHistorySummary> readHistoryCache(String cachedJson) {
        try {
            return objectMapper.readValue(cachedJson, new TypeReference<List<TransactionHistorySummary>>() {});
        } catch (Exception ex) {
            log.warn("Failed to read wallet history cache", ex);
            return null;
        }
    }

    private void writeHistoryCache(String cacheKey, List<TransactionHistorySummary> summaries) {
        try {
            String json = objectMapper.writeValueAsString(summaries);
            stringRedisTemplate.opsForValue().set(cacheKey, json, Duration.ofSeconds(walletHistoryTtlSeconds));
        } catch (Exception ex) {
            log.warn("Failed to write wallet history cache", ex);
        }
    }
}
