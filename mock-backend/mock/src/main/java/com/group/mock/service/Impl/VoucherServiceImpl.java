package com.group.mock.service.Impl;

import com.group.mock.entity.Voucher;
import com.group.mock.entity.DTO.response.VoucherSummaryResponse;
import com.group.mock.entity.enums.VoucherDiscountType;
import com.group.mock.repository.VoucherRepository;
import com.group.mock.repository.VoucherUsageRepository;
import com.group.mock.service.VoucherAvailabilityHelper;
import com.group.mock.service.VoucherService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class VoucherServiceImpl implements VoucherService {

    private final VoucherRepository voucherRepository;
    private final VoucherUsageRepository voucherUsageRepository;

    @Override
    @Transactional(readOnly = true)
    public List<VoucherSummaryResponse> listAvailableForBooking() {
        return voucherRepository.findAllByOrderByCodeAsc().stream()
                .filter(v -> VoucherAvailabilityHelper.isAvailable(v, voucherUsageRepository))
                .map(this::toSummary)
                .toList();
    }

    private VoucherSummaryResponse toSummary(Voucher voucher) {
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
        dto.setDiscountPreview(buildDiscountPreview(voucher));
        return dto;
    }

    private String buildDiscountPreview(Voucher voucher) {
        VoucherDiscountType type =
                voucher.getDiscountType() != null ? voucher.getDiscountType() : VoucherDiscountType.FIXED_AMOUNT;
        if (type == VoucherDiscountType.PERCENTAGE && voucher.getDiscountPercent() != null) {
            String base = "Giảm " + voucher.getDiscountPercent().stripTrailingZeros().toPlainString() + "%";
            if (voucher.getMaxDiscountAmount() != null
                    && voucher.getMaxDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
                base = base + " (tối đa " + formatVnd(voucher.getMaxDiscountAmount()) + ")";
            }
            return appendUsageHint(voucher, base);
        }
        if (voucher.getValue() != null && voucher.getValue().compareTo(BigDecimal.ZERO) > 0) {
            String base = "Giảm " + formatVnd(voucher.getValue());
            return appendUsageHint(voucher, base);
        }
        return appendUsageHint(voucher, "Giảm giá");
    }

    private String appendUsageHint(Voucher voucher, String base) {
        if (voucher.getMaxUses() == null) {
            return base;
        }
        int remaining = VoucherAvailabilityHelper.remainingUses(voucher, voucherUsageRepository);
        return base + " (còn " + remaining + "/" + voucher.getMaxUses() + " lượt)";
    }

    private String formatVnd(BigDecimal amount) {
        return amount.stripTrailingZeros().toPlainString() + " VND";
    }
}
