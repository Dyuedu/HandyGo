package com.group.mock.service.Impl;

import com.group.mock.entity.Account;
import com.group.mock.entity.Booking;
import com.group.mock.entity.Review;
import com.group.mock.entity.WorkerProfile;
import com.group.mock.entity.DTO.request.CreateReviewRequest;
import com.group.mock.exception.AuthServiceException;
import com.group.mock.repository.AccountRepository;
import com.group.mock.repository.BookingRepository;
import com.group.mock.repository.ReviewRepository;
import com.group.mock.repository.WorkerProfileRepository;
import com.group.mock.service.ReviewService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private static final String ROLE_USER = "ROLE_USER";
    private static final String ROLE_WORKER = "ROLE_WORKER";

    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final AccountRepository accountRepository;

    @Override
    @Transactional
    public Review createReview(String username, UUID bookingId, CreateReviewRequest request) {
        Account account = loadAccount(username);
        requireRole(account, ROLE_USER, "Only customers can leave reviews");

        Booking booking = bookingRepository.findDetailById(bookingId).orElseThrow(bookingNotFound());
        if (!booking.getCustomer().getId().equals(account.getId())) {
            throw new AuthServiceException(HttpStatus.FORBIDDEN, "NOT_BOOKING_CUSTOMER", "You are not the customer for this booking");
        }
        if (booking.getStatus() != com.group.mock.entity.enums.BookingStatus.FINISHED) {
            throw new AuthServiceException(HttpStatus.CONFLICT, "INVALID_BOOKING_STATE", "Reviews can only be submitted for finished bookings");
        }
        if (reviewRepository.existsByBooking_Id(bookingId)) {
            throw new AuthServiceException(HttpStatus.CONFLICT, "REVIEW_ALREADY_EXISTS", "A review already exists for this booking");
        }

        Review review = new Review();
        review.setBooking(booking);
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        Review saved = reviewRepository.save(review);

        refreshWorkerAverageRating(booking.getWorker());
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public Review getReviewByBookingId(String username, UUID bookingId) {
        Account account = loadAccount(username);
        Booking booking = bookingRepository.findDetailById(bookingId).orElseThrow(bookingNotFound());

        boolean customer = hasRole(account, ROLE_USER) && booking.getCustomer().getId().equals(account.getId());
        boolean worker = hasRole(account, ROLE_WORKER) && booking.getWorker().getId().equals(account.getId());
        if (!customer && !worker) {
            throw new AuthServiceException(HttpStatus.FORBIDDEN, "REVIEW_ACCESS_DENIED", "You cannot access this review");
        }

        return reviewRepository.findByBooking_Id(bookingId)
                .orElseThrow(() -> new AuthServiceException(HttpStatus.NOT_FOUND, "REVIEW_NOT_FOUND", "Review not found for this booking"));
    }

    private void refreshWorkerAverageRating(WorkerProfile worker) {
        Double average = reviewRepository.findAverageRatingByWorkerId(worker.getId());
        if (average == null) {
            average = 0.0;
        }
        worker.setAvgRating(average);
        workerProfileRepository.save(worker);
    }

    private Account loadAccount(String username) {
        return accountRepository
                .findByUsername(username)
                .orElseThrow(() -> new AuthServiceException(HttpStatus.UNAUTHORIZED, "ACCOUNT_NOT_FOUND", "Account not found"));
    }

    private java.util.function.Supplier<AuthServiceException> bookingNotFound() {
        return () -> new AuthServiceException(HttpStatus.NOT_FOUND, "BOOKING_NOT_FOUND", "Booking not found");
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
