package com.group.mock.entity.DTO.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubscribeRequest {
    @NotNull(message = "subscriptionPlanId is required")
    private Long subscriptionPlanId; // ID of the subscription plan to subscribe to
}
