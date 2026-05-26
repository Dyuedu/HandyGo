package com.group.mock.controller;

import com.group.mock.entity.DTO.request.CreateReviewRequest;
import com.group.mock.entity.DTO.response.ReviewResponse;
import com.group.mock.entity.DTO.response.WorkerReviewStatusResponse;
import com.group.mock.entity.WorkerReview;
import com.group.mock.service.WorkerReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/workers/{workerId}/reviews")
@RequiredArgsConstructor
public class WorkerReviewController {

    private final WorkerReviewService workerReviewService;

    @GetMapping
    public ResponseEntity<List<ReviewResponse>> listReviews(@PathVariable("workerId") UUID workerId) {
        List<WorkerReview> reviews = workerReviewService.getReviewsByWorkerId(workerId);
        return ResponseEntity.ok(reviews.stream().map(this::toResponse).collect(Collectors.toList()));
    }

    @GetMapping("/me")
    public ResponseEntity<WorkerReviewStatusResponse> getMyReviewStatus(
            Authentication authentication,
            @PathVariable("workerId") UUID workerId) {
        return ResponseEntity.ok(workerReviewService.getMyReviewStatus(authentication.getName(), workerId));
    }

    @PostMapping
    public ResponseEntity<ReviewResponse> createReview(
            Authentication authentication,
            @PathVariable("workerId") UUID workerId,
            @Valid @RequestBody CreateReviewRequest request) {
        WorkerReview review = workerReviewService.createReview(authentication.getName(), workerId, request);
        return ResponseEntity.ok(toResponse(review));
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
}
