package com.group.mock.entity.DTO.response;

public record AuthTokenResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long accessTokenExpiresIn,
        long refreshTokenExpiresIn,
        String role,
        String workerVerificationStatus
) {
    public AuthTokenResponse(
            String accessToken,
            String refreshToken,
            String tokenType,
            long accessTokenExpiresIn,
            long refreshTokenExpiresIn
    ) {
        this(accessToken, refreshToken, tokenType, accessTokenExpiresIn, refreshTokenExpiresIn, null, null);
    }
}
