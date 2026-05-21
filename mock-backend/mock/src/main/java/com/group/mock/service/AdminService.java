package com.group.mock.service;

import com.group.mock.entity.Account;
import com.group.mock.entity.UserProfile;
import com.group.mock.entity.WorkerProfile;
import com.group.mock.entity.DTO.response.AdminWorkerResponse;
import com.group.mock.entity.enums.Status;
import com.group.mock.exception.AuthServiceException;
import com.group.mock.repository.AccountRepository;
import com.group.mock.repository.UserProfileRepository;
import com.group.mock.repository.WorkerProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final WorkerProfileRepository workerProfileRepository;
    private final UserProfileRepository userProfileRepository;
    private final AccountRepository accountRepository;

    public List<AdminWorkerResponse> getAllWorkers() {
        List<WorkerProfile> workers = workerProfileRepository.findAll();
        
        List<UUID> workerIds = workers.stream().map(WorkerProfile::getId).collect(Collectors.toList());
        Map<UUID, UserProfile> userProfileMap = userProfileRepository.findAllById(workerIds).stream()
                .collect(Collectors.toMap(UserProfile::getId, up -> up));
        
        return workers.stream().map(worker -> {
            UserProfile userProfile = userProfileMap.get(worker.getId());
            Account account = worker.getAccount();
            
            return new AdminWorkerResponse(
                    worker.getId(),
                    account != null ? account.getUsername() : null,
                    userProfile != null ? userProfile.getFullName() : null,
                    userProfile != null ? userProfile.getPhone() : null,
                    worker.getJobType(),
                    worker.isVerified(),
                    worker.getTierType(),
                    worker.getAvgRating(),
                    account != null && account.getStatus() != null ? account.getStatus().name() : "UNKNOWN",
                    worker.getProfessionalCertificateUrl(),
                    userProfile != null && userProfile.getCreatedAt() != null ? userProfile.getCreatedAt().toString() : null
            );
        }).collect(Collectors.toList());
    }

    public AdminWorkerResponse getWorkerById(UUID workerId) {
        WorkerProfile worker = workerProfileRepository.findById(workerId)
                .orElseThrow(() -> new AuthServiceException(HttpStatus.NOT_FOUND, "WORKER_NOT_FOUND", "Không tìm thấy thợ"));
        
        UserProfile userProfile = userProfileRepository.findById(workerId).orElse(null);
        Account account = worker.getAccount();
        
        return new AdminWorkerResponse(
                worker.getId(),
                account != null ? account.getUsername() : null,
                userProfile != null ? userProfile.getFullName() : null,
                userProfile != null ? userProfile.getPhone() : null,
                worker.getJobType(),
                worker.isVerified(),
                worker.getTierType(),
                worker.getAvgRating(),
                account != null && account.getStatus() != null ? account.getStatus().name() : "UNKNOWN",
                worker.getProfessionalCertificateUrl(),
                userProfile != null && userProfile.getCreatedAt() != null ? userProfile.getCreatedAt().toString() : null
        );
    }

    @Transactional
    public void toggleWorkerVerification(UUID workerId) {
        WorkerProfile worker = workerProfileRepository.findById(workerId)
                .orElseThrow(() -> new AuthServiceException(HttpStatus.NOT_FOUND, "WORKER_NOT_FOUND", "Không tìm thấy thợ"));
        
        worker.setVerified(!worker.isVerified());
        workerProfileRepository.save(worker);
    }

    @Transactional
    public void toggleWorkerStatus(UUID workerId) {
        Account account = accountRepository.findById(workerId)
                .orElseThrow(() -> new AuthServiceException(HttpStatus.NOT_FOUND, "ACCOUNT_NOT_FOUND", "Không tìm thấy tài khoản"));
        
        if (account.getStatus() == Status.ACTIVE) {
            account.setStatus(Status.BLOCKED);
        } else {
            account.setStatus(Status.ACTIVE);
        }
        accountRepository.save(account);
    }
}
