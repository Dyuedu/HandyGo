package com.group.mock.controller;

import com.group.mock.entity.DTO.response.ReviewResponse;
import com.group.mock.entity.Review;
import com.group.mock.service.ReviewService;
import lombok.RequiredArgsConstructor;
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

    @GetMapping
    public ResponseEntity<List<ReviewResponse>> listReviews(@PathVariable("workerId") UUID workerId) {
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
