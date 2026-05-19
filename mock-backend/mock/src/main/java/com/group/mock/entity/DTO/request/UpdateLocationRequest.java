package com.group.mock.entity.DTO.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateLocationRequest {
    @NotNull(message = "Vĩ độ (latitude) không được để trống")
    private Double latitude;

    @NotNull(message = "Kinh độ (longitude) không được để trống")
    private Double longitude;
}
