package com.group.mock.entity.DTO.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;
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

    private LocalDateTime bookingDate;

    private String description;

    /** Optional voucher catalog id. */
    private Long voucherId;

    /** Set by technician when marking work complete; optional at booking creation. */
    private BigDecimal totalAmount;
}
