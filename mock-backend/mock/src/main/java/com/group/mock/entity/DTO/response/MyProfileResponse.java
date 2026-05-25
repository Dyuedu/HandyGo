package com.group.mock.entity.DTO.response;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MyProfileResponse {
    private UUID id;
    private String username;
    private String role;
    private String fullName;
    private String phone;
    private Double latitude;
    private Double longitude;
    private LocalDateTime createdAt;
    private WorkerProfileSection worker;
}
