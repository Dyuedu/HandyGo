package com.group.mock.entity.DTO.response;

import com.group.mock.entity.enums.JobApplicationStatus;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JobApplicationResponse {
    private UUID id;
    private UUID jobPostId;
    private String jobPostTitle;
    private UUID workerId;
    private String workerName;
    private String workerPhone;
    private String jobType;
    private Double avgRating;
    private boolean workerVerified;
    private JobApplicationStatus status;
    private String message;
    private LocalDateTime createdAt;
}
