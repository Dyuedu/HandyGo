package com.group.mock.entity.DTO.response;

import java.time.Instant;

public record ApiResponse<T>(
        boolean success,
        T data,
        ApiError error,
        Instant timestamp,
        String requestId
) {
    public static <T> ApiResponse<T> success(T data, String requestId) {
        return new ApiResponse<>(true, data, null, Instant.now(), requestId);
    }

    public static <T> ApiResponse<T> error(String code, String message, Object details, String requestId) {
        return new ApiResponse<>(false, null, new ApiError(code, message, details), Instant.now(), requestId);
    }

    public record ApiError(String code, String message, Object details) {
    }
}
