package com.group.mock.entity.DTO.response;

import com.group.mock.entity.enums.VoucherDiscountType;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VoucherSummaryResponse {
    private Long id;
    private String code;
    private VoucherDiscountType discountType;
    private BigDecimal value;
    private BigDecimal discountPercent;
    private BigDecimal maxDiscountAmount;
    private LocalDateTime expiryDate;
    private Integer maxUses;
    private Long usedCount;
    private Integer remainingUses;
    /** Short label for UI preview (e.g. "Giảm 30.000 ₫" or "Giảm 10%"). */
    private String discountPreview;
}
