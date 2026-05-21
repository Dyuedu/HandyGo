package com.group.mock.service;

import com.group.mock.entity.Review;
import com.group.mock.entity.DTO.request.CreateReviewRequest;
import java.util.UUID;

public interface ReviewService {
    Review createReview(String username, UUID bookingId, CreateReviewRequest request);

    Review getReviewByBookingId(String username, UUID bookingId);
}
