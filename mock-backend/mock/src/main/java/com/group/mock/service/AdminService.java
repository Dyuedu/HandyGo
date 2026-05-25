package com.group.mock.service;

import com.group.mock.entity.Account;
import com.group.mock.entity.Subscription;
import com.group.mock.entity.UserProfile;
import com.group.mock.entity.Voucher;
import com.group.mock.entity.WorkerProfile;
import com.group.mock.entity.DTO.request.CreateSubscriptionPlanRequest;
import com.group.mock.entity.DTO.request.CreateVoucherRequest;
import com.group.mock.entity.DTO.response.AdminWorkerResponse;
import com.group.mock.entity.DTO.response.SubscriptionPlanResponse;
import com.group.mock.entity.DTO.response.VoucherSummaryResponse;
import com.group.mock.entity.enums.Status;
import com.group.mock.entity.enums.VoucherDiscountType;
import com.group.mock.exception.AuthServiceException;
import com.group.mock.repository.AccountRepository;
import com.group.mock.repository.SubscriptionRepository;
import com.group.mock.repository.UserProfileRepository;
import com.group.mock.repository.VoucherRepository;
import com.group.mock.repository.VoucherUsageRepository;
import com.group.mock.repository.WorkerProfileRepository;
import com.group.mock.service.VoucherAvailabilityHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final WorkerProfileRepository workerProfileRepository;
    private final UserProfileRepository userProfileRepository;
    private final AccountRepository accountRepository;
    private final VoucherRepository voucherRepository;
    private final VoucherUsageRepository voucherUsageRepository;
    private final SubscriptionRepository subscriptionRepository;

    public List<AdminWorkerResponse> getAllWorkers() {
        List<WorkerProfile> workers = workerProfileRepository.findAll();
        
        List<UUID> workerIds = workers.stream().map(WorkerProfile::getId).collect(Collectors.toList());
        Map<UUID, UserProfile> userProfileMap = userProfileRepository.findAllById(workerIds).stream()
                .collect(Collectors.toMap(UserProfile::getId, up -> up));
        
        return workers.stream().map(worker -> {
            UserProfile userProfile = userProfileMap.get(worker.getId());
            Account account = worker.getAccount();
            
            return new AdminWorkerResponse(
                    worker.getId(),
                    account != null ? account.getUsername() : null,
                    userProfile != null ? userProfile.getFullName() : null,
                    userProfile != null ? userProfile.getPhone() : null,
                    worker.getJobType(),
                    worker.isVerified(),
                    worker.getTierType(),
                    worker.getAvgRating(),
                    account != null && account.getStatus() != null ? account.getStatus().name() : "UNKNOWN",
                    worker.getProfessionalCertificateUrl(),
                    userProfile != null && userProfile.getCreatedAt() != null ? userProfile.getCreatedAt().toString() : null
            );
        }).collect(Collectors.toList());
    }

    public AdminWorkerResponse getWorkerById(UUID workerId) {
        WorkerProfile worker = workerProfileRepository.findById(workerId)
                .orElseThrow(() -> new AuthServiceException(HttpStatus.NOT_FOUND, "WORKER_NOT_FOUND", "Không tìm thấy thợ"));
        
        UserProfile userProfile = userProfileRepository.findById(workerId).orElse(null);
        Account account = worker.getAccount();
        
        return new AdminWorkerResponse(
                worker.getId(),
                account != null ? account.getUsername() : null,
                userProfile != null ? userProfile.getFullName() : null,
                userProfile != null ? userProfile.getPhone() : null,
                worker.getJobType(),
                worker.isVerified(),
                worker.getTierType(),
                worker.getAvgRating(),
                account != null && account.getStatus() != null ? account.getStatus().name() : "UNKNOWN",
                worker.getProfessionalCertificateUrl(),
                userProfile != null && userProfile.getCreatedAt() != null ? userProfile.getCreatedAt().toString() : null
        );
    }

    @Transactional
    public void toggleWorkerVerification(UUID workerId) {
        WorkerProfile worker = workerProfileRepository.findById(workerId)
                .orElseThrow(() -> new AuthServiceException(HttpStatus.NOT_FOUND, "WORKER_NOT_FOUND", "Không tìm thấy thợ"));
        
        worker.setVerified(!worker.isVerified());
        workerProfileRepository.save(worker);
    }

    @Transactional
    public void toggleWorkerStatus(UUID workerId) {
        Account account = accountRepository.findById(workerId)
                .orElseThrow(() -> new AuthServiceException(HttpStatus.NOT_FOUND, "ACCOUNT_NOT_FOUND", "Không tìm thấy tài khoản"));
        
        if (account.getStatus() == Status.ACTIVE) {
            account.setStatus(Status.BLOCKED);
        } else {
            account.setStatus(Status.ACTIVE);
        }
        accountRepository.save(account);
    }

    @Transactional(readOnly = true)
    public List<VoucherSummaryResponse> getAllVouchers() {
        return voucherRepository.findAllByOrderByCodeAsc().stream()
                .map(this::toVoucherSummary)
                .toList();
    }

    @Transactional
    public VoucherSummaryResponse createVoucher(CreateVoucherRequest request) {
        String code = request.getCode().trim().toUpperCase(Locale.ROOT);
        voucherRepository.findByCode(code).ifPresent(existing -> {
            throw new AuthServiceException(
                    HttpStatus.CONFLICT,
                    "VOUCHER_CODE_EXISTS",
                    "Mã voucher đã tồn tại");
        });

        VoucherDiscountType discountType = request.getDiscountType() != null
                ? request.getDiscountType()
                : VoucherDiscountType.FIXED_AMOUNT;
        validateVoucherDiscount(request, discountType);

        Voucher voucher = new Voucher();
        voucher.setCode(code);
        voucher.setDiscountType(discountType);
        voucher.setValue(discountType == VoucherDiscountType.FIXED_AMOUNT ? request.getValue() : null);
        voucher.setDiscountPercent(discountType == VoucherDiscountType.PERCENTAGE ? request.getDiscountPercent() : null);
        voucher.setMaxDiscountAmount(discountType == VoucherDiscountType.PERCENTAGE ? request.getMaxDiscountAmount() : null);
        voucher.setExpiryDate(request.getExpiryDate());
        voucher.setMaxUses(request.getMaxUses());
        voucher.setUsed(false);

        return toVoucherSummary(voucherRepository.save(voucher));
    }

    @Transactional(readOnly = true)
    public List<SubscriptionPlanResponse> getAllSubscriptionPlans() {
        return subscriptionRepository.findAll().stream()
                .map(this::toSubscriptionPlanResponse)
                .toList();
    }

    @Transactional
    public SubscriptionPlanResponse createSubscriptionPlan(CreateSubscriptionPlanRequest request) {
        String planName = request.getPlanName().trim().toUpperCase(Locale.ROOT);
        subscriptionRepository.findByPlanNameIgnoreCase(planName).ifPresent(existing -> {
            throw new AuthServiceException(
                    HttpStatus.CONFLICT,
                    "SUBSCRIPTION_PLAN_EXISTS",
                    "Tên gói cước đã tồn tại");
        });

        Subscription plan = new Subscription();
        plan.setPlanName(planName);
        plan.setPrice(request.getPrice());
        plan.setDurationDays(request.getDurationDays());
        plan.setStatus(normalizePlanStatus(request.getStatus()));

        return toSubscriptionPlanResponse(subscriptionRepository.save(plan));
    }

    private void validateVoucherDiscount(CreateVoucherRequest request, VoucherDiscountType discountType) {
        if (discountType == VoucherDiscountType.PERCENTAGE) {
            BigDecimal percent = request.getDiscountPercent();
            if (percent == null || percent.compareTo(BigDecimal.ZERO) <= 0 || percent.compareTo(BigDecimal.valueOf(100)) > 0) {
                throw new AuthServiceException(
                        HttpStatus.BAD_REQUEST,
                        "INVALID_PERCENTAGE_VOUCHER",
                        "Voucher phần trăm phải có discountPercent trong khoảng 0 đến 100");
            }
            if (request.getMaxDiscountAmount() != null
                    && request.getMaxDiscountAmount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new AuthServiceException(
                        HttpStatus.BAD_REQUEST,
                        "INVALID_MAX_DISCOUNT",
                        "Giới hạn giảm tối đa phải lớn hơn 0");
            }
            return;
        }

        if (request.getValue() == null || request.getValue().compareTo(BigDecimal.ZERO) <= 0) {
            throw new AuthServiceException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_FIXED_VOUCHER",
                    "Voucher giảm tiền phải có value lớn hơn 0");
        }
    }

    private String normalizePlanStatus(String status) {
        String normalized = status == null || status.isBlank()
                ? "ACTIVE"
                : status.trim().toUpperCase(Locale.ROOT);
        if (!"ACTIVE".equals(normalized) && !"INACTIVE".equals(normalized)) {
            throw new AuthServiceException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_SUBSCRIPTION_STATUS",
                    "Trạng thái gói cước chỉ nhận ACTIVE hoặc INACTIVE");
        }
        return normalized;
    }

    private VoucherSummaryResponse toVoucherSummary(Voucher voucher) {
        VoucherSummaryResponse dto = new VoucherSummaryResponse();
        dto.setId(voucher.getId());
        dto.setCode(voucher.getCode());
        dto.setDiscountType(
                voucher.getDiscountType() != null ? voucher.getDiscountType() : VoucherDiscountType.FIXED_AMOUNT);
        dto.setValue(voucher.getValue());
        dto.setDiscountPercent(voucher.getDiscountPercent());
        dto.setMaxDiscountAmount(voucher.getMaxDiscountAmount());
        dto.setExpiryDate(voucher.getExpiryDate());
        dto.setMaxUses(voucher.getMaxUses());
        dto.setUsed(voucher.isUsed());
        if (voucher.getMaxUses() != null) {
            long used = VoucherAvailabilityHelper.usedCount(voucher, voucherUsageRepository);
            dto.setUsedCount(used);
            dto.setRemainingUses(VoucherAvailabilityHelper.remainingUses(voucher, voucherUsageRepository));
        }
        dto.setDiscountPreview(buildVoucherPreview(voucher));
        return dto;
    }

    private String buildVoucherPreview(Voucher voucher) {
        VoucherDiscountType type =
                voucher.getDiscountType() != null ? voucher.getDiscountType() : VoucherDiscountType.FIXED_AMOUNT;
        if (type == VoucherDiscountType.PERCENTAGE && voucher.getDiscountPercent() != null) {
            String preview = "Giảm " + voucher.getDiscountPercent().stripTrailingZeros().toPlainString() + "%";
            if (voucher.getMaxDiscountAmount() != null
                    && voucher.getMaxDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
                preview += " tối đa " + voucher.getMaxDiscountAmount().stripTrailingZeros().toPlainString() + " VND";
            }
            return preview;
        }
        if (voucher.getValue() != null) {
            return "Giảm " + voucher.getValue().stripTrailingZeros().toPlainString() + " VND";
        }
        return "Giảm giá";
    }

    private SubscriptionPlanResponse toSubscriptionPlanResponse(Subscription subscription) {
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
