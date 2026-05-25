package com.group.mock.entity.DTO.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionPlanResponse {
    private Long id;
    private String planName;
    private BigDecimal price;
    private Integer durationDays;
    private String status;
    private LocalDateTime createdAt;
}
