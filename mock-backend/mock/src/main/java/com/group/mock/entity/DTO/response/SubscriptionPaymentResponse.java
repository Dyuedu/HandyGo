package com.group.mock.entity.DTO.response;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SubscriptionPaymentResponse {
    private String paymentUrl;
    private String vnpTxnRef;
    private BigDecimal amount;
    private WorkerSubscriptionResponse subscription;
}
