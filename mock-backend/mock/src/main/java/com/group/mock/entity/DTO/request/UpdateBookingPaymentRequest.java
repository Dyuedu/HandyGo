package com.group.mock.entity.DTO.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class UpdateBookingPaymentRequest {

    /** Final service fee entered by the technician before customer payment. */
    @NotNull
    @Positive(message = "totalAmount must be positive")
    private BigDecimal totalAmount;
}
