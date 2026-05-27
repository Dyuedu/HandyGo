package com.group.mock.entity.DTO.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ResendVerificationRequest {
    @NotBlank(message = "Tên đăng nhập là bắt buộc")
    private String username;
}
