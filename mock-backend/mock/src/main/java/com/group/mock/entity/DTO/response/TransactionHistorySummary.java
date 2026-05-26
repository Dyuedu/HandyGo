package com.group.mock.entity.DTO.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionHistorySummary {
    private Long id;
    private String vnpTxnRef;
    private BigDecimal amount;
    private String status;
    private String vnpResponseCode;
    private String vnpTransactionNo;
    private String vnpPayDate;
    private LocalDateTime createdAt;
}
