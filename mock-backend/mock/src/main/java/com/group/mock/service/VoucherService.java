package com.group.mock.service;

import com.group.mock.entity.DTO.response.VoucherSummaryResponse;
import java.util.List;

public interface VoucherService {

    /** Vouchers available for selection when creating a booking (demo list, no locking). */
    List<VoucherSummaryResponse> listAvailableForBooking();
}
