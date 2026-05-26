package com.group.mock.service.Impl;

import com.group.mock.entity.Account;
import com.group.mock.entity.JobPost;
import com.group.mock.entity.UserProfile;
import com.group.mock.entity.DTO.request.CreateJobPostRequest;
import com.group.mock.entity.DTO.request.UpdateJobPostRequest;
import com.group.mock.exception.AuthServiceException;
import com.group.mock.repository.AccountRepository;
import com.group.mock.entity.WorkerProfile;
import com.group.mock.repository.JobApplicationRepository;
import com.group.mock.repository.JobPostRepository;
import com.group.mock.repository.UserProfileRepository;
import com.group.mock.repository.WorkerProfileRepository;
import com.group.mock.service.JobPostService;
import com.group.mock.service.NotificationEventPublisher;
import com.group.mock.util.JobPostScheduleHelper;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class JobPostServiceImpl implements JobPostService {

    private static final String ROLE_USER = "ROLE_USER";

    private final JobPostRepository jobPostRepository;
    private final UserProfileRepository userProfileRepository;
    private final AccountRepository accountRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final NotificationEventPublisher notificationEventPublisher;

    @Override
    @Transactional
    public JobPost createJobPost(String username, CreateJobPostRequest request) {
        Account account = loadAccount(username);
        requireRole(account, ROLE_USER, "Only customers can create job posts");

        UserProfile customer = userProfileRepository
                .findById(account.getId())
                .orElseThrow(() -> new AuthServiceException(
                        HttpStatus.NOT_FOUND, "PROFILE_NOT_FOUND", "Customer profile not found"));

        JobPostScheduleHelper.assertScheduledAtValid(request.getScheduledAt());

        JobPost jobPost = new JobPost();
        jobPost.setCustomer(customer);
        jobPost.setTitle(request.getTitle());
        jobPost.setDescription(request.getDescription());
        jobPost.setJobType(request.getJobType());
        jobPost.setAddress(request.getAddress());
        jobPost.setLatitude(request.getLatitude());
        jobPost.setLongitude(request.getLongitude());
        jobPost.setScheduledAt(request.getScheduledAt());
        jobPost.setStatus("OPEN");

        jobPost = jobPostRepository.save(jobPost);

        notifyMatchingWorkers(jobPost);

        return jobPost;
    }

    private void notifyMatchingWorkers(JobPost jobPost) {
        if (jobPost.getJobType() == null || jobPost.getJobType().isBlank()) {
            return;
        }
        java.util.List<WorkerProfile> workers =
                workerProfileRepository.findByJobTypeAndIsVerifiedTrue(jobPost.getJobType().trim());
        for (WorkerProfile worker : workers) {
            if (jobPost.getCustomer() != null && worker.getId().equals(jobPost.getCustomer().getId())) {
                continue;
            }
            notificationEventPublisher.publishJobPostNew(
                    worker.getId(), jobPost.getId(), jobPost.getTitle(), jobPost.getJobType());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<JobPost> getMyJobPosts(String username) {
        Account account = loadAccount(username);
        return jobPostRepository.findByCustomerId(account.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public JobPost getMyJobPostById(String username, UUID jobPostId) {
        Account account = loadAccount(username);
        return jobPostRepository
                .findByIdAndCustomerId(jobPostId, account.getId())
                .orElseThrow(jobPostNotFound());
    }

    @Override
    @Transactional
    public JobPost updateJobPost(String username, UUID jobPostId, UpdateJobPostRequest request) {
        Account account = loadAccount(username);
        JobPost jobPost = jobPostRepository
                .findByIdAndCustomerId(jobPostId, account.getId())
                .orElseThrow(jobPostNotFound());

        if (request.getTitle() != null) {
            jobPost.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            jobPost.setDescription(request.getDescription());
        }
        if (request.getJobType() != null) {
            jobPost.setJobType(request.getJobType());
        }
        if (request.getAddress() != null) {
            jobPost.setAddress(request.getAddress());
        }
        if (request.getLatitude() != null) {
            jobPost.setLatitude(request.getLatitude());
        }
        if (request.getLongitude() != null) {
            jobPost.setLongitude(request.getLongitude());
        }
        if (request.getScheduledAt() != null) {
            JobPostScheduleHelper.assertScheduledAtValid(request.getScheduledAt());
            jobPost.setScheduledAt(request.getScheduledAt());
        }
        if (request.getStatus() != null) {
            jobPost.setStatus(request.getStatus());
        }

        return jobPostRepository.save(jobPost);
    }

    @Override
    @Transactional
    public void deleteJobPost(String username, UUID jobPostId) {
        Account account = loadAccount(username);
        JobPost jobPost = jobPostRepository
                .findByIdAndCustomerId(jobPostId, account.getId())
                .orElseThrow(jobPostNotFound());

        if ("ASSIGNED".equalsIgnoreCase(jobPost.getStatus()) || jobPost.getBooking() != null) {
            throw new AuthServiceException(
                    HttpStatus.CONFLICT,
                    "JOBPOST_CANNOT_DELETE_ASSIGNED",
                    "Công việc đã giao thợ, không thể xóa. Bạn có thể xem trong Hoạt động.");
        }

        // Ensure FK integrity regardless of actual DB constraint options
        jobApplicationRepository.deleteByJobPost_Id(jobPostId);
        jobPostRepository.delete(jobPost);
    }

    @Override
    @Transactional(readOnly = true)
    public List<JobPost> getAllOpenJobPosts() {
        return jobPostRepository.findAllOpenJobPosts(LocalDateTime.now());
    }

    @Override
    @Transactional(readOnly = true)
    public List<JobPost> getOpenJobPostsByJobType(String jobType) {
        return jobPostRepository.findOpenJobPostsByJobType(jobType, LocalDateTime.now());
    }

    @Override
    @Transactional(readOnly = true)
    public JobPost getJobPostById(UUID jobPostId) {
        return jobPostRepository
                .findById(jobPostId)
                .orElseThrow(jobPostNotFound());
    }

    private Account loadAccount(String username) {
        return accountRepository
                .findByUsername(username)
                .orElseThrow(() -> new AuthServiceException(
                        HttpStatus.UNAUTHORIZED, "ACCOUNT_NOT_FOUND", "Account not found"));
    }

    private java.util.function.Supplier<AuthServiceException> jobPostNotFound() {
        return () -> new AuthServiceException(
                HttpStatus.NOT_FOUND, "JOBPOST_NOT_FOUND", "Job post not found");
    }

    private void requireRole(Account account, String role, String message) {
        if (!hasRole(account, role)) {
            throw new AuthServiceException(HttpStatus.FORBIDDEN, "FORBIDDEN", message);
        }
    }

    private boolean hasRole(Account account, String role) {
        for (GrantedAuthority authority : account.getAuthorities()) {
            if (role.equalsIgnoreCase(authority.getAuthority())) {
                return true;
            }
        }
        return false;
    }
}
