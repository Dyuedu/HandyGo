package com.group.mock.service;

import com.group.mock.entity.DTO.request.CreateReviewRequest;
import com.group.mock.entity.DTO.response.WorkerReviewStatusResponse;
import com.group.mock.entity.WorkerReview;
import java.util.List;
import java.util.UUID;

public interface WorkerReviewService {
    List<WorkerReview> getReviewsByWorkerId(UUID workerId);

    WorkerReview createReview(String username, UUID workerId, CreateReviewRequest request);

    WorkerReviewStatusResponse getMyReviewStatus(String username, UUID workerId);
}
