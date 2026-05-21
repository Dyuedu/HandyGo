package com.group.mock.controller;

import com.group.mock.entity.DTO.request.CreateReviewRequest;
import com.group.mock.entity.DTO.response.ReviewResponse;
import com.group.mock.entity.Review;
import com.group.mock.service.ReviewService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/bookings/{bookingId}/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<ReviewResponse> createReview(
            Authentication authentication,
            @PathVariable("bookingId") UUID bookingId,
            @Valid @RequestBody CreateReviewRequest request) {
        Review review = reviewService.createReview(authentication.getName(), bookingId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(review));
    }

    @GetMapping
    public ResponseEntity<ReviewResponse> getReview(
            Authentication authentication,
            @PathVariable("bookingId") UUID bookingId) {
        Review review = reviewService.getReviewByBookingId(authentication.getName(), bookingId);
        return ResponseEntity.ok(toResponse(review));
    }

    private ReviewResponse toResponse(Review review) {
        ReviewResponse response = new ReviewResponse();
        response.setId(review.getId());
        response.setBookingId(review.getBooking().getId());
        response.setRating(review.getRating());
        response.setComment(review.getComment());
        response.setCreatedAt(review.getCreatedAt());
        return response;
    }
}
