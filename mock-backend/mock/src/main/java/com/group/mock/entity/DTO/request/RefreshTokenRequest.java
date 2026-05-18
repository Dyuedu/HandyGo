package com.group.mock.entity.DTO.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RefreshTokenRequest {
    @NotBlank(message = "Refresh token là bắt buộc")
    private String refreshToken;
}
