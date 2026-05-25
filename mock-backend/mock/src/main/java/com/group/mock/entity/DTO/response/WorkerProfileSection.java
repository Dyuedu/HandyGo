package com.group.mock.entity.DTO.response;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkerProfileSection {
    private String jobType;
    private boolean verified;
    private String verificationStatus;
    private String tierType;
    private LocalDateTime tierExpiredAt;
    private Double avgRating;
    private String professionalCertificateUrl;
}
