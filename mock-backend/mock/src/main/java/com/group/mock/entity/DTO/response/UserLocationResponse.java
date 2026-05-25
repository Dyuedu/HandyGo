package com.group.mock.entity.DTO.response;

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
    /** null for non-workers; customers only receive verified workers as TECHNICIAN. */
    private Boolean verified;
}
