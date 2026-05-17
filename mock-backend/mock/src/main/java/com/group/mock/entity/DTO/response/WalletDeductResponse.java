package com.group.mock.entity.DTO.response;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class WalletDeductResponse {
    private BigDecimal balance;
    private String currency;
}
