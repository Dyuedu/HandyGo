package com.group.mock.service;

import com.group.mock.entity.Voucher;
import com.group.mock.exception.AuthServiceException;
import com.group.mock.repository.VoucherUsageRepository;
import java.time.LocalDateTime;
import org.springframework.http.HttpStatus;

/** Shared rules for whether a catalog voucher can be selected on a new booking. */
public final class VoucherAvailabilityHelper {

    private VoucherAvailabilityHelper() {}

    public static boolean isAvailable(Voucher voucher, VoucherUsageRepository usageRepository) {
        if (voucher == null) {
            return false;
        }
        if (voucher.getExpiryDate() != null && !voucher.getExpiryDate().isAfter(LocalDateTime.now())) {
            return false;
        }
        if (voucher.getMaxUses() != null) {
            long used = usageRepository.countByVoucher_Id(voucher.getId());
            return used < voucher.getMaxUses();
        }
        return !voucher.isUsed();
    }

    public static void assertUsable(Voucher voucher, VoucherUsageRepository usageRepository) {
        if (voucher.getExpiryDate() != null && voucher.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new AuthServiceException(HttpStatus.BAD_REQUEST, "VOUCHER_EXPIRED", "Voucher has expired");
        }
        if (voucher.getMaxUses() != null) {
            long used = usageRepository.countByVoucher_Id(voucher.getId());
            if (used >= voucher.getMaxUses()) {
                throw new AuthServiceException(
                        HttpStatus.BAD_REQUEST,
                        "VOUCHER_LIMIT_REACHED",
                        "Voucher has reached its usage limit");
            }
            return;
        }
        if (voucher.isUsed()) {
            throw new AuthServiceException(
                    HttpStatus.BAD_REQUEST, "VOUCHER_ALREADY_USED", "Voucher is no longer available");
        }
    }

    public static long usedCount(Voucher voucher, VoucherUsageRepository usageRepository) {
        return usageRepository.countByVoucher_Id(voucher.getId());
    }

    public static int remainingUses(Voucher voucher, VoucherUsageRepository usageRepository) {
        if (voucher.getMaxUses() == null) {
            return -1;
        }
        return Math.max(0, voucher.getMaxUses() - (int) usedCount(voucher, usageRepository));
    }
}
