package com.group.mock.entity.DTO.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateWorkerAvailabilityRequest {
    @NotNull(message = "Trạng thái nhận việc là bắt buộc")
    private Boolean available;
}
