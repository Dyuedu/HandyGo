package com.group.mock.entity.DTO.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GoogleLoginRequest {
    @NotBlank(message = "Access token là bắt buộc")
    private String accessToken;
}
