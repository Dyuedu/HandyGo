package com.group.mock.service.Impl;

import com.group.mock.entity.Account;
import com.group.mock.entity.DTO.request.CreateReviewRequest;
import com.group.mock.entity.DTO.response.ReviewResponse;
import com.group.mock.entity.DTO.response.WorkerReviewStatusResponse;
import com.group.mock.entity.UserProfile;
import com.group.mock.entity.WorkerProfile;
import com.group.mock.entity.WorkerReview;
import com.group.mock.entity.enums.BookingStatus;
import com.group.mock.exception.AuthServiceException;
import com.group.mock.repository.AccountRepository;
import com.group.mock.repository.BookingRepository;
import com.group.mock.repository.UserProfileRepository;
import com.group.mock.repository.WorkerProfileRepository;
import com.group.mock.repository.WorkerReviewRepository;
import com.group.mock.service.NotificationEventPublisher;
import com.group.mock.service.WorkerReviewService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class WorkerReviewServiceImpl implements WorkerReviewService {

    private static final String ROLE_USER = "ROLE_USER";

    private final WorkerReviewRepository workerReviewRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final UserProfileRepository userProfileRepository;
    private final BookingRepository bookingRepository;
    private final AccountRepository accountRepository;
    private final NotificationEventPublisher notificationEventPublisher;

    @Override
    @Transactional(readOnly = true)
    public List<WorkerReview> getReviewsByWorkerId(UUID workerId) {
        requireWorker(workerId);
        return workerReviewRepository.findByWorker_IdOrderByCreatedAtDesc(workerId);
    }

    @Override
    @Transactional
    public WorkerReview createReview(String username, UUID workerId, CreateReviewRequest request) {
        Account account = loadAccount(username);
        requireRole(account, ROLE_USER, "Only customers can leave worker reviews");

        WorkerProfile worker = requireWorker(workerId);
        UserProfile reviewer = userProfileRepository.findById(account.getId())
                .orElseThrow(() -> new AuthServiceException(HttpStatus.NOT_FOUND, "ACCOUNT_NOT_FOUND", "Customer profile not found"));

        if (workerReviewRepository.existsByWorker_IdAndReviewer_Id(workerId, reviewer.getId())) {
            throw new AuthServiceException(
                    HttpStatus.CONFLICT,
                    "WORKER_REVIEW_ALREADY_EXISTS",
                    "You have already reviewed this worker");
        }

        boolean hasFinishedBooking = bookingRepository.existsByCustomer_IdAndWorker_IdAndStatus(
                reviewer.getId(), workerId, BookingStatus.FINISHED);
        if (!hasFinishedBooking) {
            throw new AuthServiceException(
                    HttpStatus.CONFLICT,
                    "WORKER_REVIEW_ELIGIBILITY_FAILED",
                    "You can only review workers after completing at least one booking");
        }

        WorkerReview review = new WorkerReview();
        review.setWorker(worker);
        review.setReviewer(reviewer);
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        WorkerReview saved = workerReviewRepository.save(review);

        refreshWorkerAverageRating(worker);
        try {
            notificationEventPublisher.publishReviewCreated(
                    workerId,
                    saved.getId(),
                    reviewer.getFullName(),
                    request.getRating(),
                    request.getComment());
        } catch (Exception e) {
            log.warn("Failed to send worker review notification", e);
        }
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public WorkerReviewStatusResponse getMyReviewStatus(String username, UUID workerId) {
        Account account = loadAccount(username);
        WorkerReviewStatusResponse response = new WorkerReviewStatusResponse();
        requireWorker(workerId);

        if (!hasRole(account, ROLE_USER)) {
            response.setCanReview(false);
            response.setHasReview(false);
            response.setHasFinishedBooking(false);
            return response;
        }

        boolean hasFinishedBooking = bookingRepository.existsByCustomer_IdAndWorker_IdAndStatus(
                account.getId(), workerId, BookingStatus.FINISHED);
        response.setHasFinishedBooking(hasFinishedBooking);

        workerReviewRepository.findByWorker_IdAndReviewer_Id(workerId, account.getId()).ifPresent(review -> {
            response.setHasReview(true);
            response.setReview(toResponse(review));
        });

        response.setCanReview(hasFinishedBooking && !response.isHasReview());
        return response;
    }

    private ReviewResponse toResponse(WorkerReview review) {
        ReviewResponse response = new ReviewResponse();
        response.setId(review.getId());
        response.setReviewerName(review.getReviewer() != null ? review.getReviewer().getFullName() : null);
        response.setRating(review.getRating());
        response.setComment(review.getComment());
        response.setCreatedAt(review.getCreatedAt());
        return response;
    }

    private WorkerProfile requireWorker(UUID workerId) {
        return workerProfileRepository.findById(workerId)
                .orElseThrow(() -> new AuthServiceException(HttpStatus.NOT_FOUND, "WORKER_NOT_FOUND", "Worker not found"));
    }

    private void refreshWorkerAverageRating(WorkerProfile worker) {
        Double average = workerReviewRepository.findAverageRatingByWorkerId(worker.getId());
        worker.setAvgRating(average == null ? 0.0 : average);
        workerProfileRepository.save(worker);
    }

    private Account loadAccount(String username) {
        return accountRepository
                .findByUsername(username)
                .orElseThrow(() -> new AuthServiceException(HttpStatus.UNAUTHORIZED, "ACCOUNT_NOT_FOUND", "Account not found"));
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
