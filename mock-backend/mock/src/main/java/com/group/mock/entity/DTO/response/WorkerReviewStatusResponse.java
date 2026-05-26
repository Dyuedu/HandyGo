package com.group.mock.entity.DTO.response;

import lombok.Data;

@Data
public class WorkerReviewStatusResponse {
    private boolean canReview;
    private boolean hasReview;
    private boolean hasFinishedBooking;
    private ReviewResponse review;
}
