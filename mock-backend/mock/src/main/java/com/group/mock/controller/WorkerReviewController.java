package com.group.mock.controller;

import com.group.mock.entity.DTO.response.ReviewResponse;
import com.group.mock.entity.Review;
import com.group.mock.entity.WorkerProfile;
import com.group.mock.exception.AuthServiceException;
import com.group.mock.repository.WorkerProfileRepository;
import com.group.mock.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/workers/{workerId}/reviews")
@RequiredArgsConstructor
public class WorkerReviewController {

    private final ReviewService reviewService;
    private final WorkerProfileRepository workerProfileRepository;

    @GetMapping
    public ResponseEntity<List<ReviewResponse>> listReviews(@PathVariable("workerId") UUID workerId) {
        WorkerProfile worker = workerProfileRepository
                .findById(workerId)
                .orElseThrow(() -> new AuthServiceException(
                        HttpStatus.NOT_FOUND, "WORKER_NOT_FOUND", "Không tìm thấy thợ"));
        if (!worker.isVerified()) {
            throw new AuthServiceException(
                    HttpStatus.NOT_FOUND, "WORKER_NOT_FOUND", "Thợ chưa được duyệt chứng chỉ");
        }
        List<Review> reviews = reviewService.getReviewsByWorkerId(workerId);
        List<ReviewResponse> resp = reviews.stream().map(r -> {
            ReviewResponse rr = new ReviewResponse();
            rr.setId(r.getId());
            rr.setBookingId(r.getBooking().getId());
            rr.setReviewerName(r.getBooking().getCustomer() != null ? r.getBooking().getCustomer().getFullName() : null);
            rr.setRating(r.getRating());
            rr.setComment(r.getComment());
            rr.setCreatedAt(r.getCreatedAt());
            return rr;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(resp);
    }
}
