package com.group.mock.entity.DTO.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkerSubscriptionResponse {
    private String tierType; // Current tier: FREE, BASIC, PRO
    private LocalDateTime tierExpiredAt; // When current tier expires
    private String subscriptionName; // Name of current subscription plan
}
