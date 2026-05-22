package com.group.mock.service;

import com.group.mock.entity.DTO.request.SubscribeRequest;
import com.group.mock.entity.DTO.response.SubscriptionPlanResponse;
import com.group.mock.entity.DTO.response.WorkerSubscriptionResponse;

import java.util.List;

public interface SubscriptionService {
    List<SubscriptionPlanResponse> getAllActivePlans();
    WorkerSubscriptionResponse subscribeWorker(String username, SubscribeRequest request);
    WorkerSubscriptionResponse getWorkerSubscriptionInfo(String username);
}
