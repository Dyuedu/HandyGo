package com.group.mock.entity.DTO.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class CreateSubscriptionPlanRequest {
    @NotBlank(message = "planName is required")
    private String planName;

    @NotNull(message = "price is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "price must be zero or positive")
    private BigDecimal price;

    @NotNull(message = "durationDays is required")
    @Min(value = 1, message = "durationDays must be at least 1")
    private Integer durationDays;

    private String status = "ACTIVE";
}
