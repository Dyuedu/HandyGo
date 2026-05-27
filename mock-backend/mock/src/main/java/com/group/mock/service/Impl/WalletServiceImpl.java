package com.group.mock.service.Impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.group.mock.configuration.VNPayConfiguration.VNPayUtil;
import com.group.mock.entity.Account;
import com.group.mock.entity.Subscription;
import com.group.mock.entity.TransactionHistory;
import com.group.mock.entity.Wallet;
import com.group.mock.entity.WithdrawalRequest;
import com.group.mock.entity.WorkerProfile;
import com.group.mock.entity.UserProfile;
import com.group.mock.entity.DTO.request.CreateWithdrawalRequest;
import com.group.mock.entity.DTO.request.WalletDeductRequest;
import com.group.mock.entity.DTO.response.PaymentCallbackResponse;
import com.group.mock.entity.DTO.response.TransactionHistorySummary;
import com.group.mock.entity.DTO.response.WalletBalanceResponse;
import com.group.mock.entity.DTO.response.WalletDeductResponse;
import com.group.mock.entity.DTO.response.WithdrawalResponse;
import com.group.mock.exception.AuthServiceException;
import com.group.mock.repository.AccountRepository;
import com.group.mock.repository.SubscriptionRepository;
import com.group.mock.repository.TransactionHistoryRepository;
import com.group.mock.repository.UserProfileRepository;
import com.group.mock.repository.WalletRepository;
import com.group.mock.repository.WithdrawalRequestRepository;
import com.group.mock.repository.WorkerProfileRepository;
import com.group.mock.service.AccountService;
import com.group.mock.service.EmailService;
import com.group.mock.service.VietQrService;
import com.group.mock.service.WalletService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.group.mock.service.NotificationEventPublisher;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
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
    private static final String ROLE_WORKER = "ROLE_WORKER";
    private static final String SUBSCRIPTION_ORDER_TYPE = "SUBSCRIPTION";
    private static final String SUBSCRIPTION_ORDER_PREFIX = "SUBSCRIPTION_PLAN_";
    private static final String WALLET_UNIT = "XU";
    private static final String BALANCE_CACHE_KEY_PREFIX = "cache:wallet:balance:";
    private static final String HISTORY_CACHE_KEY_PREFIX = "cache:wallet:history:";

    private final WalletRepository walletRepository;
    private final TransactionHistoryRepository transactionHistoryRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final UserProfileRepository userProfileRepository;
    private final WithdrawalRequestRepository withdrawalRequestRepository;
    private final AccountRepository accountRepository;
    private final AccountService accountService;
    private final VietQrService vietQrService;
    private final StringRedisTemplate stringRedisTemplate;
    private final DefaultRedisScript<Long> walletDeductScript;
    private final ObjectMapper objectMapper;
    private final NotificationEventPublisher notificationEventPublisher;
    private final EmailService emailService;


    @Value("${app.cache.wallet-balance-ttl-seconds:300}")
    private long walletBalanceTtlSeconds;

    @Value("${app.cache.wallet-history-ttl-seconds:120}")
    private long walletHistoryTtlSeconds;

    @Value("${vnpay.secret-key}")
    private String vnpSecretKey;

    public WalletServiceImpl(
            WalletRepository walletRepository,
            TransactionHistoryRepository transactionHistoryRepository,
            SubscriptionRepository subscriptionRepository,
            WorkerProfileRepository workerProfileRepository,
            UserProfileRepository userProfileRepository,
            WithdrawalRequestRepository withdrawalRequestRepository,
            AccountRepository accountRepository,
            AccountService accountService,
            VietQrService vietQrService,
            StringRedisTemplate stringRedisTemplate,
            DefaultRedisScript<Long> walletDeductScript,
            ObjectMapper objectMapper,
            NotificationEventPublisher notificationEventPublisher,
            EmailService emailService) {
        this.walletRepository = walletRepository;
        this.transactionHistoryRepository = transactionHistoryRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.workerProfileRepository = workerProfileRepository;
        this.userProfileRepository = userProfileRepository;
        this.withdrawalRequestRepository = withdrawalRequestRepository;
        this.accountRepository = accountRepository;
        this.accountService = accountService;
        this.vietQrService = vietQrService;
        this.stringRedisTemplate = stringRedisTemplate;
        this.walletDeductScript = walletDeductScript;
        this.objectMapper = objectMapper;
        this.notificationEventPublisher = notificationEventPublisher;
        this.emailService = emailService;

    }

    @Override
    @Transactional
    public WalletBalanceResponse createWallet(String username) {
        Account account = getWorkerAccount(username);
        Wallet wallet = getOrCreateWallet(account.getId());
        updateBalanceCache(wallet.getUserId(), wallet.getBalance());
        return new WalletBalanceResponse(normalizeAmount(wallet.getBalance()), WALLET_UNIT);
    }

    @Override
    @Transactional
    public WalletBalanceResponse getBalance(String username) {
        Account account = getWorkerAccount(username);
        Wallet wallet = getOrCreateWallet(account.getId());

        String cachedBalance = stringRedisTemplate.opsForValue().get(balanceCacheKey(account.getId()));
        if (cachedBalance != null) {
            BigDecimal balance = fromScaledAmount(Long.parseLong(cachedBalance));
            return new WalletBalanceResponse(balance, WALLET_UNIT);
        }

        BigDecimal balance = normalizeAmount(wallet.getBalance());
        stringRedisTemplate.opsForValue().set(
                balanceCacheKey(account.getId()),
                String.valueOf(toScaledAmount(balance)),
                Duration.ofSeconds(walletBalanceTtlSeconds));

        return new WalletBalanceResponse(balance, WALLET_UNIT);
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
            if (SUBSCRIPTION_ORDER_TYPE.equalsIgnoreCase(history.getVnpOrderType())) {
                Subscription plan = activateSubscriptionPayment(history);
                try {
                    notificationEventPublisher.publishSubscriptionUpgrade(
                        history.getWallet().getUserId(),
                        plan.getPlanName(),
                        plan.getDurationDays()
                    );
                } catch (Exception e) {
                    log.warn("Failed to send subscription upgrade notification", e);
                }
                sendPaymentSuccessEmail(history);
                return new PaymentCallbackResponse(true, "Subscription payment success", vnpTxnRef);
            }

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
            try {
                notificationEventPublisher.publishWalletTopupSuccess(
                    wallet.getUserId(),
                    history.getId(),
                    toNotificationAmount(history.getAmount())
                );
            } catch (Exception e) {
                log.warn("Failed to send wallet topup success notification", e);
            }
            sendPaymentSuccessEmail(history);
            return new PaymentCallbackResponse(true, "Success", vnpTxnRef);
        }

        history.setStatus("FAILED");
        transactionHistoryRepository.save(history);
        invalidateHistoryCache(history.getWallet().getId());
        if (!SUBSCRIPTION_ORDER_TYPE.equalsIgnoreCase(history.getVnpOrderType())) {
            try {
                notificationEventPublisher.publishWalletTopupFailed(
                    history.getWallet().getUserId(),
                    history.getId(),
                    toNotificationAmount(history.getAmount())
                );
            } catch (Exception e) {
                log.warn("Failed to send wallet topup failed notification", e);
            }
        }
        sendPaymentFailureEmail(history, "VNPay response code: " + responseCode);
        return new PaymentCallbackResponse(false, "Payment failed", vnpTxnRef);
    }

    private Subscription activateSubscriptionPayment(TransactionHistory history) {
        Long planId = parseSubscriptionPlanId(history.getVnpOrderInfo());
        Subscription plan = subscriptionRepository.findByIdAndStatus(planId, "ACTIVE")
                .orElseThrow(() -> new AuthServiceException(
                        HttpStatus.NOT_FOUND,
                        "PLAN_NOT_FOUND",
                        "Subscription plan not found or inactive"));

        Wallet wallet = history.getWallet();
        WorkerProfile worker = workerProfileRepository.findById(wallet.getUserId())
                .orElseThrow(() -> new AuthServiceException(
                        HttpStatus.NOT_FOUND,
                        "WORKER_NOT_FOUND",
                        "Worker profile not found"));

        worker.setTierType(plan.getPlanName());
        worker.setTierExpiredAt(LocalDateTime.now().plusDays(plan.getDurationDays()));
        workerProfileRepository.save(worker);

        history.setStatus("SUCCESS");
        history.setBalanceBefore(wallet.getBalance());
        history.setBalanceAfter(wallet.getBalance());
        transactionHistoryRepository.save(history);
        invalidateHistoryCache(wallet.getId());
        return plan;
    }

    private Long parseSubscriptionPlanId(String orderInfo) {
        if (orderInfo == null || !orderInfo.startsWith(SUBSCRIPTION_ORDER_PREFIX)) {
            throw new AuthServiceException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_SUBSCRIPTION_PAYMENT",
                    "Invalid subscription payment metadata");
        }
        try {
            return Long.parseLong(orderInfo.substring(SUBSCRIPTION_ORDER_PREFIX.length()));
        } catch (NumberFormatException ex) {
            throw new AuthServiceException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_SUBSCRIPTION_PAYMENT",
                    "Invalid subscription plan id");
        }
    }

    @Override
    @Transactional
    public List<TransactionHistorySummary> getHistory(String username) {
        Account account = getWorkerAccount(username);
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
        Account account = getWorkerAccount(username);
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
        return new WalletDeductResponse(newBalance, WALLET_UNIT);
    }

    @Override
    @Transactional
    public WithdrawalResponse createWithdrawal(String username, CreateWithdrawalRequest request) {
        Account account = getWorkerAccount(username);
        Wallet wallet = walletRepository.findByUserIdForUpdate(account.getId())
                .orElseGet(() -> getOrCreateWallet(account.getId()));

        BigDecimal amount = normalizeAmount(request.getAmount());
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new AuthServiceException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_WITHDRAWAL_AMOUNT",
                    "Withdrawal amount must be greater than 0");
        }
        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new AuthServiceException(
                    HttpStatus.BAD_REQUEST,
                    "INSUFFICIENT_BALANCE",
                    "Insufficient wallet balance");
        }

        UserProfile profile = userProfileRepository.findById(account.getId()).orElse(null);
        BigDecimal balanceBefore = wallet.getBalance();
        BigDecimal newAvailable = balanceBefore.subtract(amount);
        wallet.setBalance(newAvailable);
        wallet.setLockedBalance(normalizeNullableAmount(wallet.getLockedBalance()).add(amount));
        walletRepository.save(wallet);

        WithdrawalRequest withdrawal = new WithdrawalRequest();
        withdrawal.setWallet(wallet);
        withdrawal.setWorkerId(account.getId());
        withdrawal.setWorkerUsername(account.getUsername());
        withdrawal.setWorkerFullName(profile != null ? profile.getFullName() : null);
        withdrawal.setAmount(amount);
        withdrawal.setBankBin(request.getBankBin().trim());
        withdrawal.setBankName(request.getBankName().trim());
        withdrawal.setAccountNo(request.getAccountNo().trim());
        withdrawal.setAccountName(request.getAccountName().trim());

        String transferContent = "RUTXU " + generateTxnRef();
        String payload = vietQrService.buildPayload(
                withdrawal.getBankBin(),
                withdrawal.getAccountNo(),
                withdrawal.getAccountName(),
                withdrawal.getAmount(),
                transferContent);
        withdrawal.setTransferContent(transferContent);
        withdrawal.setVietQrPayload(payload);
        withdrawal = withdrawalRequestRepository.save(withdrawal);

        TransactionHistory history = new TransactionHistory();
        history.setWallet(wallet);
        history.setVnpTxnRef("WITHDRAW-" + withdrawal.getId() + "-" + generateTxnRef());
        history.setAmount(amount.negate());
        history.setVnpOrderInfo(transferContent);
        history.setVnpOrderType("WITHDRAWAL_LOCK");
        history.setVnpCreateDate(ZonedDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"))
                .format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));
        history.setStatus("PENDING");
        history.setBalanceBefore(balanceBefore);
        history.setBalanceAfter(newAvailable);
        transactionHistoryRepository.save(history);

        updateBalanceCache(wallet.getUserId(), newAvailable);
        invalidateHistoryCache(wallet.getId());
        return toWithdrawalResponse(withdrawal);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WithdrawalResponse> getWithdrawals(String username) {
        Account account = getWorkerAccount(username);
        return withdrawalRequestRepository.findByWorkerIdOrderByCreatedAtDesc(account.getId()).stream()
                .map(this::toWithdrawalResponse)
                .toList();
    }

    private Wallet getOrCreateWallet(UUID userId) {
        return walletRepository.findByUserId(userId).orElseGet(() -> {
            Wallet wallet = new Wallet();
            wallet.setUserId(userId);
            wallet.setBalance(BigDecimal.ZERO);
            wallet.setLockedBalance(BigDecimal.ZERO);
            wallet.setCurrency(WALLET_UNIT);
            return walletRepository.save(wallet);
        });
    }

    private Account getWorkerAccount(String username) {
        Account account = accountService.getAccountByUsername(username);
        if (account.getRole() == null
                || account.getRole().getName() == null
                || !ROLE_WORKER.equalsIgnoreCase(account.getRole().getName())) {
            throw new AuthServiceException(
                    HttpStatus.FORBIDDEN,
                    "WALLET_ACCESS_DENIED",
                    "Only technicians can use wallet features");
        }
        return account;
    }

    private String generateTxnRef() {
        return String.valueOf(System.currentTimeMillis()) + VNPayUtil.getRandomNumber(6);
    }

    private BigDecimal normalizeAmount(BigDecimal amount) {
        if (amount == null) {
            throw new IllegalArgumentException("Amount is required");
        }
        return amount.setScale(4, RoundingMode.HALF_UP);
    }

    private BigDecimal normalizeNullableAmount(BigDecimal amount) {
        return amount == null ? BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP) : normalizeAmount(amount);
    }

    private long toScaledAmount(BigDecimal amount) {
        return amount.movePointRight(4).longValueExact();
    }

    private BigDecimal fromScaledAmount(long scaled) {
        return BigDecimal.valueOf(scaled).movePointLeft(4);
    }

    private Long toNotificationAmount(BigDecimal amount) {
        if (amount == null) {
            return 0L;
        }
        return amount.setScale(0, RoundingMode.HALF_UP).longValue();
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

    public WithdrawalResponse toWithdrawalResponse(WithdrawalRequest withdrawal) {
        return new WithdrawalResponse(
                withdrawal.getId(),
                withdrawal.getWorkerId(),
                withdrawal.getWorkerUsername(),
                withdrawal.getWorkerFullName(),
                withdrawal.getAmount(),
                WALLET_UNIT,
                withdrawal.getBankBin(),
                withdrawal.getBankName(),
                withdrawal.getAccountNo(),
                withdrawal.getAccountName(),
                withdrawal.getTransferContent(),
                withdrawal.getStatus(),
                withdrawal.getAdminNote(),
                withdrawal.getConfirmedAt(),
                withdrawal.getCreatedAt(),
                withdrawal.getUpdatedAt());
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

    private void sendPaymentSuccessEmail(TransactionHistory history) {
        Account account = accountRepository.findById(history.getWallet().getUserId()).orElse(null);
        if (account == null || account.getEmail() == null || account.getEmail().isBlank()) {
            return;
        }

        try {
            emailService.sendPaymentSuccessEmail(
                    account.getEmail(),
                    resolveFullName(account),
                    history.getAmount().setScale(0, RoundingMode.HALF_UP).longValue(),
                    String.valueOf(history.getId()));
        } catch (Exception e) {
            log.warn("Failed to send payment success email", e);
        }
    }

    private void sendPaymentFailureEmail(TransactionHistory history, String reason) {
        Account account = accountRepository.findById(history.getWallet().getUserId()).orElse(null);
        if (account == null || account.getEmail() == null || account.getEmail().isBlank()) {
            return;
        }

        try {
            emailService.sendPaymentFailureEmail(account.getEmail(), resolveFullName(account), reason);
        } catch (Exception e) {
            log.warn("Failed to send payment failure email", e);
        }
    }

    private String resolveFullName(Account account) {
        return userProfileRepository.findById(account.getId())
                .map(UserProfile::getFullName)
                .orElse(account.getUsername());
    }
}
