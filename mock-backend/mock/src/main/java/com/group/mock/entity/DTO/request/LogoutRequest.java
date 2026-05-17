package com.group.mock.entity.DTO.request;
import lombok.Data;

@Data
public class LogoutRequest {
    private String refreshToken;
}
