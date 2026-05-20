package com.group.mock.entity.DTO.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Data;

@Data
public class CreateBookingRequest {

    /** Required; may be a temporary hard-coded technician while map matching is unfinished. */
    @NotNull
    private UUID workerId;

    /** Optional label until a services catalog exists. */
    private String serviceCode;

    @NotBlank(message = "address is required")
    private String address;

    /** Optional voucher catalog id. */
    private Long voucherId;

    /** Service fee (e.g. 300000). */
    @NotNull
    @Positive(message = "totalAmount must be positive")
    private BigDecimal totalAmount;
}
