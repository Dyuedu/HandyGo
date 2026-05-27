package com.group.mock.entity.DTO.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ResendVerificationResponse {
    private String email;
    private String message;
}
