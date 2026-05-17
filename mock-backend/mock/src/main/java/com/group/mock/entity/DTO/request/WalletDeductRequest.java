package com.group.mock.entity.DTO.request;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class WalletDeductRequest {
    private BigDecimal amount;
    private String description;
}
