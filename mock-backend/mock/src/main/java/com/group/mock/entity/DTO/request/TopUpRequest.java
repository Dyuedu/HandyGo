package com.group.mock.entity.DTO.request;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class TopUpRequest {
    private BigDecimal amount;
    private String orderInfo;
    private String bankCode;
}
