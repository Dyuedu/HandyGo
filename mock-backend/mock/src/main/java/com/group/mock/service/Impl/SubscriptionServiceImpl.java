package com.group.mock.service.Impl;

import com.group.mock.configuration.VNPayConfiguration.VNPayUtil;
import com.group.mock.entity.Account;
import com.group.mock.entity.Subscription;
import com.group.mock.entity.TransactionHistory;
import com.group.mock.entity.Wallet;
import com.group.mock.entity.WorkerProfile;
import com.group.mock.entity.DTO.request.SubscribeRequest;
import com.group.mock.entity.DTO.response.SubscriptionPaymentResponse;
import com.group.mock.entity.DTO.response.SubscriptionPlanResponse;
import com.group.mock.entity.DTO.response.WorkerSubscriptionResponse;
import com.group.mock.exception.AuthServiceException;
import com.group.mock.repository.SubscriptionRepository;
import com.group.mock.repository.TransactionHistoryRepository;
import com.group.mock.repository.WalletRepository;
import com.group.mock.repository.WorkerProfileRepository;
import com.group.mock.service.AccountService;
import com.group.mock.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.SortedMap;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubscriptionServiceImpl implements SubscriptionService {
    private static final String ROLE_WORKER = "ROLE_WORKER";
    private static final String SUBSCRIPTION_ORDER_TYPE = "SUBSCRIPTION";
    private static final String SUBSCRIPTION_WALLET_ORDER_TYPE = "SUBSCRIPTION_WALLET";
    private static final String SUBSCRIPTION_ORDER_PREFIX = "SUBSCRIPTION_PLAN_";
    private static final String BALANCE_CACHE_KEY_PREFIX = "cache:wallet:balance:";
    private static final String HISTORY_CACHE_KEY_PREFIX = "cache:wallet:history:";

    private final SubscriptionRepository subscriptionRepository;
    private final AccountService accountService;
    private final WorkerProfileRepository workerProfileRepository;
    private final WalletRepository walletRepository;
    private final TransactionHistoryRepository transactionHistoryRepository;
    private final StringRedisTemplate stringRedisTemplate;

    @Value("${vnpay.tmn-code}")
    private String vnpTmnCode;

    @Value("${vnpay.secret-key}")
    private String vnpSecretKey;

    @Value("${vnpay.pay-url}")
    private String vnpPayUrl;

    @Value("${vnpay.return-url}")
    private String vnpReturnUrl;

    @Override
    public List<SubscriptionPlanResponse> getAllActivePlans() {
        return subscriptionRepository.findByStatus("ACTIVE")
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public SubscriptionPaymentResponse subscribeWorker(String username, SubscribeRequest request, String ipAddress) {
        Account account = getWorkerAccount(username);
        workerProfileRepository.findById(account.getId())
                .orElseThrow(() -> new AuthServiceException(
                        HttpStatus.NOT_FOUND,
                        "WORKER_NOT_FOUND",
                        "Worker profile not found"));

        Subscription plan = subscriptionRepository.findByIdAndStatus(request.getSubscriptionPlanId(), "ACTIVE")
                .orElseThrow(() -> new AuthServiceException(
                        HttpStatus.NOT_FOUND,
                        "PLAN_NOT_FOUND",
                        "Subscription plan not found or inactive"));

        if (plan.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            activateWorkerSubscription(account.getId(), plan);
            return new SubscriptionPaymentResponse(null, null, plan.getPrice(), getWorkerSubscriptionInfo(username));
        }

        if (isWalletPayment(request.getPaymentMethod())) {
            TransactionHistory history = paySubscriptionWithWallet(account, plan);
            return new SubscriptionPaymentResponse(
                    null,
                    history.getVnpTxnRef(),
                    plan.getPrice(),
                    getWorkerSubscriptionInfo(username));
        }

        Wallet wallet = getOrCreateWallet(account);
        TransactionHistory history = createPendingSubscriptionPayment(wallet, plan, ipAddress);
        String paymentUrl = buildPaymentUrl(history, plan);

        return new SubscriptionPaymentResponse(paymentUrl, history.getVnpTxnRef(), plan.getPrice(), null);
    }

    @Override
    public WorkerSubscriptionResponse getWorkerSubscriptionInfo(String username) {
        Account account = getWorkerAccount(username);
        WorkerProfile worker = workerProfileRepository.findById(account.getId())
                .orElseThrow(() -> new AuthServiceException(
                        HttpStatus.NOT_FOUND,
                        "WORKER_NOT_FOUND",
                        "Worker profile not found"));

        return new WorkerSubscriptionResponse(
                worker.getTierType(),
                worker.getTierExpiredAt(),
                worker.getTierType() // Using tier type as subscription name
        );
    }

    private Account getWorkerAccount(String username) {
        Account account = accountService.getAccountByUsername(username);
        if (account.getRole() == null
                || account.getRole().getName() == null
                || !ROLE_WORKER.equalsIgnoreCase(account.getRole().getName())) {
            throw new AuthServiceException(
                    HttpStatus.FORBIDDEN,
                    "SUBSCRIPTION_ACCESS_DENIED",
                    "Only workers can manage subscriptions");
        }
        return account;
    }

    private void activateWorkerSubscription(java.util.UUID workerId, Subscription plan) {
        WorkerProfile worker = workerProfileRepository.findById(workerId)
                .orElseThrow(() -> new AuthServiceException(
                        HttpStatus.NOT_FOUND,
                        "WORKER_NOT_FOUND",
                        "Worker profile not found"));

        worker.setTierType(plan.getPlanName());
        worker.setTierExpiredAt(LocalDateTime.now().plusDays(plan.getDurationDays()));
        workerProfileRepository.save(worker);
    }

    private Wallet getOrCreateWallet(Account account) {
        return walletRepository.findByUserId(account.getId()).orElseGet(() -> {
            Wallet wallet = new Wallet();
            wallet.setUserId(account.getId());
            wallet.setBalance(BigDecimal.ZERO);
            wallet.setCurrency("XU");
            return walletRepository.save(wallet);
        });
    }

    private TransactionHistory paySubscriptionWithWallet(Account account, Subscription plan) {
        Wallet wallet = getOrCreateWalletForUpdate(account);
        BigDecimal amount = normalizeAmount(plan.getPrice());
        BigDecimal balanceBefore = normalizeAmount(wallet.getBalance());

        if (balanceBefore.compareTo(amount) < 0) {
            throw new AuthServiceException(
                    HttpStatus.BAD_REQUEST,
                    "INSUFFICIENT_COINS",
                    "Số xu hiện tại không đủ để thanh toán gói cước");
        }

        BigDecimal balanceAfter = normalizeAmount(balanceBefore.subtract(amount));
        wallet.setBalance(balanceAfter);
        wallet.setCurrency("XU");
        walletRepository.save(wallet);

        TransactionHistory history = createWalletSubscriptionHistory(wallet, plan, amount, balanceBefore, balanceAfter);
        activateWorkerSubscription(account.getId(), plan);
        invalidateWalletCache(wallet);
        return history;
    }

    private Wallet getOrCreateWalletForUpdate(Account account) {
        return walletRepository.findByUserIdForUpdate(account.getId()).orElseGet(() -> {
            Wallet wallet = new Wallet();
            wallet.setUserId(account.getId());
            wallet.setBalance(BigDecimal.ZERO);
            wallet.setCurrency("XU");
            return walletRepository.saveAndFlush(wallet);
        });
    }

    private TransactionHistory createWalletSubscriptionHistory(
            Wallet wallet,
            Subscription plan,
            BigDecimal amount,
            BigDecimal balanceBefore,
            BigDecimal balanceAfter) {
        ZonedDateTime now = ZonedDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));

        TransactionHistory history = new TransactionHistory();
        history.setWallet(wallet);
        history.setVnpTxnRef("XU-" + generateTxnRef());
        history.setAmount(amount);
        history.setVnpOrderInfo(subscriptionOrderInfo(plan.getId()));
        history.setVnpOrderType(SUBSCRIPTION_WALLET_ORDER_TYPE);
        history.setVnpCreateDate(now.format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));
        history.setStatus("SUCCESS");
        history.setBalanceBefore(balanceBefore);
        history.setBalanceAfter(balanceAfter);
        return transactionHistoryRepository.save(history);
    }

    private boolean isWalletPayment(String paymentMethod) {
        if (paymentMethod == null || paymentMethod.isBlank()) {
            return false;
        }
        String normalized = paymentMethod.trim().toUpperCase(Locale.ROOT);
        return "WALLET".equals(normalized) || "XU".equals(normalized) || "COINS".equals(normalized);
    }

    private void invalidateWalletCache(Wallet wallet) {
        stringRedisTemplate.delete(BALANCE_CACHE_KEY_PREFIX + wallet.getUserId());
        stringRedisTemplate.delete(HISTORY_CACHE_KEY_PREFIX + wallet.getId());
    }

    private TransactionHistory createPendingSubscriptionPayment(Wallet wallet, Subscription plan, String ipAddress) {
        ZonedDateTime now = ZonedDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));

        TransactionHistory history = new TransactionHistory();
        history.setWallet(wallet);
        history.setVnpTxnRef(generateTxnRef());
        history.setAmount(normalizeAmount(plan.getPrice()));
        history.setVnpOrderInfo(subscriptionOrderInfo(plan.getId()));
        history.setVnpOrderType(SUBSCRIPTION_ORDER_TYPE);
        history.setVnpIpAddr(ipAddress);
        history.setVnpCreateDate(now.format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));
        history.setVnpExpireDate(now.plusMinutes(15).format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));
        history.setStatus("PENDING");

        return transactionHistoryRepository.save(history);
    }

    private String buildPaymentUrl(TransactionHistory history, Subscription plan) {
        SortedMap<String, String> vnpParams = new TreeMap<>();
        vnpParams.put("vnp_Version", "2.1.0");
        vnpParams.put("vnp_Command", "pay");
        vnpParams.put("vnp_TmnCode", vnpTmnCode);
        vnpParams.put("vnp_Amount", toVnpAmount(plan.getPrice()));
        vnpParams.put("vnp_CurrCode", "VND");
        vnpParams.put("vnp_Locale", "vn");
        vnpParams.put("vnp_TxnRef", history.getVnpTxnRef());
        vnpParams.put("vnp_OrderInfo", history.getVnpOrderInfo());
        vnpParams.put("vnp_OrderType", "other");
        vnpParams.put("vnp_ReturnUrl", vnpReturnUrl);
        vnpParams.put("vnp_IpAddr", history.getVnpIpAddr());
        vnpParams.put("vnp_CreateDate", history.getVnpCreateDate());
        vnpParams.put("vnp_ExpireDate", history.getVnpExpireDate());

        String secureHash = VNPayUtil.hashAllFields(vnpParams, vnpSecretKey);
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

    private String generateTxnRef() {
        return "SUB" + System.currentTimeMillis() + VNPayUtil.getRandomNumber(6);
    }

    private String toVnpAmount(BigDecimal amount) {
        return normalizeAmount(amount).setScale(0, RoundingMode.DOWN)
                .multiply(BigDecimal.valueOf(100))
                .toPlainString();
    }

    private BigDecimal normalizeAmount(BigDecimal amount) {
        return amount.setScale(4, RoundingMode.HALF_UP);
    }

    static String subscriptionOrderInfo(Long planId) {
        return SUBSCRIPTION_ORDER_PREFIX + planId;
    }

    private SubscriptionPlanResponse toResponse(Subscription subscription) {
        return new SubscriptionPlanResponse(
                subscription.getId(),
                subscription.getPlanName(),
                subscription.getPrice(),
                subscription.getDurationDays(),
                subscription.getStatus(),
                subscription.getCreatedAt()
        );
    }
}
