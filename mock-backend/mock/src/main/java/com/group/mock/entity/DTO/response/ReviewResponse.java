package com.group.mock.entity.DTO.response;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Data;

@Data
public class ReviewResponse {
    private Long id;
    private UUID bookingId;
    private String reviewerName;
    private int rating;
    private String comment;
    private LocalDateTime createdAt;
}
