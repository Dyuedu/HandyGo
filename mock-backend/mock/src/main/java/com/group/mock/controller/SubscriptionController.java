package com.group.mock.controller;

import com.group.mock.configuration.VNPayConfiguration.VNPayUtil;
import com.group.mock.entity.DTO.request.SubscribeRequest;
import com.group.mock.entity.DTO.response.SubscriptionPaymentResponse;
import com.group.mock.entity.DTO.response.SubscriptionPlanResponse;
import com.group.mock.entity.DTO.response.WorkerSubscriptionResponse;
import com.group.mock.service.SubscriptionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
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
    public ResponseEntity<SubscriptionPaymentResponse> subscribe(
            Authentication authentication,
            @Valid @RequestBody SubscribeRequest request,
            HttpServletRequest httpRequest) {
        String ipAddress = VNPayUtil.getIpAddress(httpRequest);
        return ResponseEntity.ok(subscriptionService.subscribeWorker(authentication.getName(), request, ipAddress));
    }

    @GetMapping("/info")
    public ResponseEntity<WorkerSubscriptionResponse> getSubscriptionInfo(Authentication authentication) {
        return ResponseEntity.ok(subscriptionService.getWorkerSubscriptionInfo(authentication.getName()));
    }
}
