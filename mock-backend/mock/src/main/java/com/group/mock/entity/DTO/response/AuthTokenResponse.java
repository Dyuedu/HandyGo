package com.group.mock.entity.DTO.response;

import java.util.UUID;

public record AuthTokenResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long accessTokenExpiresIn,
        long refreshTokenExpiresIn,
        String role,
        String workerVerificationStatus,
        UUID id,
        String username
) {
    public AuthTokenResponse(
            String accessToken,
            String refreshToken,
            String tokenType,
            long accessTokenExpiresIn,
            long refreshTokenExpiresIn
    ) {
        this(accessToken, refreshToken, tokenType, accessTokenExpiresIn, refreshTokenExpiresIn, null, null, null, null);
    }
}
