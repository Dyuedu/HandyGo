package com.group.mock.entity.DTO.response;

import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PublicWorkerProfileResponse {
    private UUID id;
    private String fullName;
    private String phone;
    private String jobType;
    private boolean verified;
    private Double avgRating;
    private Double latitude;
    private Double longitude;
}
