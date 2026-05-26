package com.group.mock.service.Impl;

import com.group.mock.entity.Account;
import com.group.mock.entity.Booking;
import com.group.mock.entity.JobApplication;
import com.group.mock.entity.JobPost;
import com.group.mock.entity.UserProfile;
import com.group.mock.entity.WorkerProfile;
import com.group.mock.entity.DTO.request.ApplyJobPostRequest;
import com.group.mock.entity.DTO.response.JobApplicationResponse;
import com.group.mock.entity.enums.JobApplicationStatus;
import com.group.mock.exception.AuthServiceException;
import com.group.mock.repository.AccountRepository;
import com.group.mock.repository.JobApplicationRepository;
import com.group.mock.repository.JobPostRepository;
import com.group.mock.repository.UserProfileRepository;
import com.group.mock.repository.WorkerProfileRepository;
import com.group.mock.service.BookingService;
import com.group.mock.service.JobApplicationService;
import com.group.mock.service.NotificationEventPublisher;
import com.group.mock.util.JobPostScheduleHelper;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class JobApplicationServiceImpl implements JobApplicationService {

    private static final String ROLE_USER = "ROLE_USER";
    private static final String ROLE_WORKER = "ROLE_WORKER";

    private final JobApplicationRepository jobApplicationRepository;
    private final JobPostRepository jobPostRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final UserProfileRepository userProfileRepository;
    private final AccountRepository accountRepository;
    private final NotificationEventPublisher notificationEventPublisher;
    private final BookingService bookingService;

    @Override
    @Transactional
    public JobApplicationResponse apply(String username, UUID jobPostId, ApplyJobPostRequest request) {
        Account account = loadAccount(username);
        requireRole(account, ROLE_WORKER, "Only workers can apply to job posts");

        WorkerProfile worker = workerProfileRepository
                .findById(account.getId())
                .orElseThrow(() -> new AuthServiceException(
                        HttpStatus.NOT_FOUND, "WORKER_PROFILE_NOT_FOUND", "Không tìm thấy hồ sơ thợ"));

        if (!worker.isVerified()) {
            throw new AuthServiceException(
                    HttpStatus.FORBIDDEN,
                    "WORKER_NOT_VERIFIED",
                    "Thợ chưa được duyệt chứng chỉ, không thể đăng ký công việc");
        }

        JobPost jobPost = jobPostRepository.findByIdWithCustomer(jobPostId).orElseThrow(jobPostNotFound());

        if (!"OPEN".equalsIgnoreCase(jobPost.getStatus())) {
            if ("CANCELLED".equalsIgnoreCase(jobPost.getStatus())) {
                throw new AuthServiceException(
                        HttpStatus.GONE,
                        "JOBPOST_EXPIRED",
                        "Đã quá thời gian đặt, không thể đăng ký công việc này");
            }
            throw new AuthServiceException(
                    HttpStatus.CONFLICT, "JOBPOST_NOT_OPEN", "Công việc không còn nhận đăng ký");
        }

        JobPostScheduleHelper.assertNotExpired(jobPost);

        if (jobPost.getCustomer() != null && jobPost.getCustomer().getId().equals(account.getId())) {
            throw new AuthServiceException(
                    HttpStatus.BAD_REQUEST, "CANNOT_APPLY_OWN_POST", "Không thể đăng ký công việc của chính bạn");
        }

        if (!jobTypesMatch(jobPost.getJobType(), worker.getJobType())) {
            throw new AuthServiceException(
                    HttpStatus.BAD_REQUEST,
                    "JOB_TYPE_MISMATCH",
                    "Loại công việc của bạn không khớp với yêu cầu");
        }

        if (jobApplicationRepository.existsByJobPost_IdAndWorker_Id(jobPostId, account.getId())) {
            throw new AuthServiceException(
                    HttpStatus.CONFLICT, "ALREADY_APPLIED", "Bạn đã đăng ký công việc này rồi");
        }

        JobApplication application = new JobApplication();
        application.setJobPost(jobPost);
        application.setWorker(worker);
        application.setStatus(JobApplicationStatus.PENDING);
        if (request != null && request.getMessage() != null && !request.getMessage().isBlank()) {
            application.setMessage(request.getMessage().trim());
        }
        application = jobApplicationRepository.save(application);

        UserProfile workerUser = userProfileRepository.findById(worker.getId()).orElse(null);
        String workerName = workerUser != null ? workerUser.getFullName() : account.getUsername();

        if (jobPost.getCustomer() != null) {
            notificationEventPublisher.publishJobApplicationNew(
                    jobPost.getCustomer().getId(),
                    jobPost.getId(),
                    application.getId(),
                    workerName,
                    jobPost.getTitle());
        }

        return toResponse(application, jobPost, workerUser);
    }

    @Override
    @Transactional(readOnly = true)
    public List<JobApplicationResponse> listForJobPost(String username, UUID jobPostId) {
        Account account = loadAccount(username);
        requireRole(account, ROLE_USER, "Only customers can view applicants");
        JobPost jobPost = jobPostRepository
                .findByIdAndCustomerId(jobPostId, account.getId())
                .orElseThrow(jobPostNotFound());

        return jobApplicationRepository.findByJobPostIdWithWorker(jobPost.getId()).stream()
                .map(app -> toResponse(app, jobPost, userProfileRepository.findById(app.getWorker().getId()).orElse(null)))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<JobApplicationResponse> listMyApplications(String username) {
        Account account = loadAccount(username);
        requireRole(account, ROLE_WORKER, "Only workers can list their applications");

        return jobApplicationRepository.findByWorkerIdWithJobPost(account.getId()).stream()
                .map(app -> toResponse(
                        app,
                        app.getJobPost(),
                        userProfileRepository.findById(account.getId()).orElse(null)))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public JobApplicationResponse getMyApplicationForPost(String username, UUID jobPostId) {
        Account account = loadAccount(username);
        requireRole(account, ROLE_WORKER, "Only workers can view their application");

        return jobApplicationRepository
                .findByJobPost_IdAndWorker_IdWithDetails(jobPostId, account.getId())
                .map(app -> toResponse(
                        app,
                        app.getJobPost(),
                        userProfileRepository.findById(account.getId()).orElse(null)))
                .orElse(null);
    }

    @Override
    @Transactional
    public JobApplicationResponse accept(String username, UUID jobPostId, UUID applicationId) {
        Account account = loadAccount(username);
        requireRole(account, ROLE_USER, "Only customers can accept applicants");
        JobPost jobPost = jobPostRepository
                .findByIdAndCustomerId(jobPostId, account.getId())
                .orElseThrow(jobPostNotFound());

        if (!"OPEN".equalsIgnoreCase(jobPost.getStatus())) {
            throw new AuthServiceException(
                    HttpStatus.CONFLICT, "JOBPOST_NOT_OPEN", "Công việc đã được giao hoặc đã đóng");
        }

        JobApplication accepted = jobApplicationRepository
                .findById(applicationId)
                .orElseThrow(applicationNotFound());

        if (!accepted.getJobPost().getId().equals(jobPostId)) {
            throw new AuthServiceException(
                    HttpStatus.BAD_REQUEST, "APPLICATION_MISMATCH", "Đơn đăng ký không thuộc công việc này");
        }

        if (accepted.getStatus() != JobApplicationStatus.PENDING) {
            throw new AuthServiceException(
                    HttpStatus.CONFLICT, "APPLICATION_NOT_PENDING", "Đơn đăng ký không ở trạng thái chờ duyệt");
        }

        accepted.setStatus(JobApplicationStatus.ACCEPTED);
        jobApplicationRepository.save(accepted);

        Booking booking = bookingService.createBookingFromJobPost(jobPost, accepted.getWorker());
        jobPost.setBooking(booking);

        List<JobApplication> pendingOthers =
                jobApplicationRepository.findByJobPost_IdAndStatus(jobPostId, JobApplicationStatus.PENDING);
        for (JobApplication other : pendingOthers) {
            other.setStatus(JobApplicationStatus.REJECTED);
            jobApplicationRepository.save(other);
            notificationEventPublisher.publishJobApplicationRejected(
                    other.getWorker().getId(),
                    jobPost.getId(),
                    other.getId(),
                    jobPost.getTitle());
        }

        jobPost.setStatus("ASSIGNED");
        jobPost.setAssignedWorker(accepted.getWorker());
        jobPostRepository.save(jobPost);

        UserProfile acceptedWorkerUser =
                userProfileRepository.findById(accepted.getWorker().getId()).orElse(null);
        String workerName = acceptedWorkerUser != null ? acceptedWorkerUser.getFullName() : "Thợ";

        notificationEventPublisher.publishJobApplicationAccepted(
                accepted.getWorker().getId(),
                jobPost.getId(),
                accepted.getId(),
                jobPost.getTitle());

        return toResponse(accepted, jobPost, acceptedWorkerUser);
    }

    @Override
    @Transactional
    public JobApplicationResponse reject(String username, UUID jobPostId, UUID applicationId) {
        Account account = loadAccount(username);
        requireRole(account, ROLE_USER, "Only customers can reject applicants");
        jobPostRepository
                .findByIdAndCustomerId(jobPostId, account.getId())
                .orElseThrow(jobPostNotFound());

        JobApplication application = jobApplicationRepository
                .findById(applicationId)
                .orElseThrow(applicationNotFound());

        if (!application.getJobPost().getId().equals(jobPostId)) {
            throw new AuthServiceException(
                    HttpStatus.BAD_REQUEST, "APPLICATION_MISMATCH", "Đơn đăng ký không thuộc công việc này");
        }

        if (application.getStatus() != JobApplicationStatus.PENDING) {
            throw new AuthServiceException(
                    HttpStatus.CONFLICT, "APPLICATION_NOT_PENDING", "Chỉ có thể từ chối đơn đang chờ duyệt");
        }

        application.setStatus(JobApplicationStatus.REJECTED);
        jobApplicationRepository.save(application);

        JobPost jobPost = application.getJobPost();
        notificationEventPublisher.publishJobApplicationRejected(
                application.getWorker().getId(),
                jobPost.getId(),
                application.getId(),
                jobPost.getTitle());

        UserProfile workerUser = userProfileRepository.findById(application.getWorker().getId()).orElse(null);
        return toResponse(application, jobPost, workerUser);
    }

    private JobApplicationResponse toResponse(JobApplication app, JobPost jobPost, UserProfile workerUser) {
        WorkerProfile worker = app.getWorker();
        JobApplicationResponse dto = new JobApplicationResponse();
        dto.setId(app.getId());
        dto.setJobPostId(jobPost != null ? jobPost.getId() : app.getJobPost().getId());
        dto.setJobPostTitle(jobPost != null ? jobPost.getTitle() : null);
        dto.setWorkerId(worker.getId());
        dto.setWorkerName(workerUser != null ? workerUser.getFullName() : "Thợ");
        dto.setWorkerPhone(workerUser != null ? workerUser.getPhone() : null);
        dto.setJobType(worker.getJobType());
        dto.setAvgRating(worker.getAvgRating());
        dto.setWorkerVerified(worker.isVerified());
        dto.setStatus(app.getStatus());
        dto.setMessage(app.getMessage());
        dto.setCreatedAt(app.getCreatedAt());
        return dto;
    }

    private boolean jobTypesMatch(String postType, String workerType) {
        if (postType == null || workerType == null) {
            return false;
        }
        return postType.trim().equalsIgnoreCase(workerType.trim());
    }

    private Account loadAccount(String username) {
        return accountRepository
                .findByUsername(username)
                .orElseThrow(() -> new AuthServiceException(
                        HttpStatus.UNAUTHORIZED, "ACCOUNT_NOT_FOUND", "Account not found"));
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

    private java.util.function.Supplier<AuthServiceException> jobPostNotFound() {
        return () -> new AuthServiceException(HttpStatus.NOT_FOUND, "JOBPOST_NOT_FOUND", "Job post not found");
    }

    private java.util.function.Supplier<AuthServiceException> applicationNotFound() {
        return () -> new AuthServiceException(
                HttpStatus.NOT_FOUND, "JOB_APPLICATION_NOT_FOUND", "Không tìm thấy đơn đăng ký");
    }
}
