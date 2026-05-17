package com.group.mock.entity.DTO.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class PaymentCallbackResponse {
    private boolean success;
    private String message;
    private String vnpTxnRef;
}
