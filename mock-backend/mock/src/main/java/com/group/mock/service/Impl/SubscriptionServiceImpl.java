package com.group.mock.service.Impl;

import com.group.mock.entity.Account;
import com.group.mock.entity.Subscription;
import com.group.mock.entity.WorkerProfile;
import com.group.mock.entity.DTO.request.SubscribeRequest;
import com.group.mock.entity.DTO.response.SubscriptionPlanResponse;
import com.group.mock.entity.DTO.response.WorkerSubscriptionResponse;
import com.group.mock.exception.AuthServiceException;
import com.group.mock.repository.SubscriptionRepository;
import com.group.mock.repository.WorkerProfileRepository;
import com.group.mock.service.AccountService;
import com.group.mock.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubscriptionServiceImpl implements SubscriptionService {
    private static final String ROLE_WORKER = "ROLE_WORKER";

    private final SubscriptionRepository subscriptionRepository;
    private final AccountService accountService;
    private final WorkerProfileRepository workerProfileRepository;

    @Override
    public List<SubscriptionPlanResponse> getAllActivePlans() {
        return subscriptionRepository.findByStatus("ACTIVE")
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public WorkerSubscriptionResponse subscribeWorker(String username, SubscribeRequest request) {
        // Verify worker role
        Account account = getWorkerAccount(username);
        WorkerProfile worker = workerProfileRepository.findById(account.getId())
                .orElseThrow(() -> new AuthServiceException(
                        HttpStatus.NOT_FOUND,
                        "WORKER_NOT_FOUND",
                        "Worker profile not found"));

        // Get subscription plan
        Subscription plan = subscriptionRepository.findByIdAndStatus(request.getSubscriptionPlanId(), "ACTIVE")
                .orElseThrow(() -> new AuthServiceException(
                        HttpStatus.NOT_FOUND,
                        "PLAN_NOT_FOUND",
                        "Subscription plan not found or inactive"));

        // Update worker tier and expiration date
        worker.setTierType(plan.getPlanName());
        worker.setTierExpiredAt(LocalDateTime.now().plusDays(plan.getDurationDays()));
        workerProfileRepository.save(worker);

        return getWorkerSubscriptionInfo(username);
    }

    @Override
    public WorkerSubscriptionResponse getWorkerSubscriptionInfo(String username) {
        Account account = getWorkerAccount(username);
        WorkerProfile worker = workerProfileRepository.findById(account.getId())
                .orElseThrow(() -> new AuthServiceException(
                        HttpStatus.NOT_FOUND,
                        "WORKER_NOT_FOUND",
                        "Worker profile not found"));

        return new WorkerSubscriptionResponse(
                worker.getTierType(),
                worker.getTierExpiredAt(),
                worker.getTierType() // Using tier type as subscription name
        );
    }

    private Account getWorkerAccount(String username) {
        Account account = accountService.getAccountByUsername(username);
        if (account.getRole() == null
                || account.getRole().getName() == null
                || !ROLE_WORKER.equalsIgnoreCase(account.getRole().getName())) {
            throw new AuthServiceException(
                    HttpStatus.FORBIDDEN,
                    "SUBSCRIPTION_ACCESS_DENIED",
                    "Only workers can manage subscriptions");
        }
        return account;
    }

    private SubscriptionPlanResponse toResponse(Subscription subscription) {
        return new SubscriptionPlanResponse(
                subscription.getId(),
                subscription.getPlanName(),
                subscription.getPrice(),
                subscription.getDurationDays(),
                subscription.getStatus(),
                subscription.getCreatedAt()
        );
    }
}
