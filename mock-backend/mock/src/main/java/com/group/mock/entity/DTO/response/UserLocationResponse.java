package com.group.mock.entity.DTO.response;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserLocationResponse {
    private UUID id;
    private String fullName;
    private String phone;
    private String role;
    private Double latitude;
    private Double longitude;
    private String jobType;
    private Boolean available;
    private Boolean online;
    private Boolean busy;
    private Boolean eligible;
    private Boolean verified;
    private LocalDateTime lastUpdate;

    public UserLocationResponse(
            UUID id,
            String fullName,
            String phone,
            String role,
            Double latitude,
            Double longitude,
            String jobType) {
        this(id, fullName, phone, role, latitude, longitude, jobType, null, null, null, null, null, null);
    }
}
