package com.group.mock.entity.DTO.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank(message = "Tên đăng nhập là bắt buộc")
    String username;

    @NotBlank(message = "Mật khẩu là bắt buộc")
    String password;

    private Double latitude;
    private Double longitude;
}
