package com.group.mock.entity.DTO.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminWorkerResponse {
    private UUID id;
    private String username;
    private String fullName;
    private String phone;
    private String jobType;
    private boolean isVerified;
    private String tierType;
    private Double avgRating;
    private String status;
    private String professionalCertificateUrl;
    private String createdAt;
}
