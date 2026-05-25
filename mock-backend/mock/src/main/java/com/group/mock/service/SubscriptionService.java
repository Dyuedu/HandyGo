package com.group.mock.service;

import com.group.mock.entity.DTO.request.SubscribeRequest;
import com.group.mock.entity.DTO.response.SubscriptionPaymentResponse;
import com.group.mock.entity.DTO.response.SubscriptionPlanResponse;
import com.group.mock.entity.DTO.response.WorkerSubscriptionResponse;

import java.util.List;

public interface SubscriptionService {
    List<SubscriptionPlanResponse> getAllActivePlans();
    SubscriptionPaymentResponse subscribeWorker(String username, SubscribeRequest request, String ipAddress);
    WorkerSubscriptionResponse getWorkerSubscriptionInfo(String username);
}
