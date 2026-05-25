package com.group.mock.entity.DTO.request;

import com.group.mock.entity.enums.VoucherDiscountType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

@Data
public class CreateVoucherRequest {
    @NotBlank(message = "code is required")
    private String code;

    @NotNull(message = "discountType is required")
    private VoucherDiscountType discountType = VoucherDiscountType.FIXED_AMOUNT;

    @DecimalMin(value = "0.0", inclusive = false, message = "value must be positive")
    private BigDecimal value;

    @DecimalMin(value = "0.0", inclusive = false, message = "discountPercent must be positive")
    @DecimalMax(value = "100.0", inclusive = true, message = "discountPercent must be at most 100")
    private BigDecimal discountPercent;

    @DecimalMin(value = "0.0", inclusive = false, message = "maxDiscountAmount must be positive")
    private BigDecimal maxDiscountAmount;

    private LocalDateTime expiryDate;

    @Min(value = 1, message = "maxUses must be at least 1")
    private Integer maxUses;
}
