package com.group.mock.entity.DTO.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubscribeRequest {
    private Long subscriptionPlanId; // ID of the subscription plan to subscribe to
}
