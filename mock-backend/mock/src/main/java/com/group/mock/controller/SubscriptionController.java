package com.group.mock.controller;

import com.group.mock.entity.DTO.request.SubscribeRequest;
import com.group.mock.entity.DTO.response.SubscriptionPlanResponse;
import com.group.mock.entity.DTO.response.WorkerSubscriptionResponse;
import com.group.mock.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {
    private final SubscriptionService subscriptionService;

    @GetMapping("/plans")
    public ResponseEntity<List<SubscriptionPlanResponse>> getAllPlans() {
        return ResponseEntity.ok(subscriptionService.getAllActivePlans());
    }

    @PostMapping("/subscribe")
    public ResponseEntity<WorkerSubscriptionResponse> subscribe(
            Authentication authentication,
            @RequestBody SubscribeRequest request) {
        return ResponseEntity.ok(subscriptionService.subscribeWorker(authentication.getName(), request));
    }

    @GetMapping("/info")
    public ResponseEntity<WorkerSubscriptionResponse> getSubscriptionInfo(Authentication authentication) {
        return ResponseEntity.ok(subscriptionService.getWorkerSubscriptionInfo(authentication.getName()));
    }
}
