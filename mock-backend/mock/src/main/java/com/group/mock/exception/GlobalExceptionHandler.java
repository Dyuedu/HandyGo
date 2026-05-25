package com.group.mock.exception;

import com.group.mock.configuration.RequestIdFilter;
import com.group.mock.entity.DTO.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private final MessageSource messageSource;

    public GlobalExceptionHandler(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    @ExceptionHandler(AuthServiceException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuthServiceException(
            AuthServiceException ex,
            HttpServletRequest request
    ) {
        return ResponseEntity.status(ex.getStatus())
                .body(ApiResponse.error(ex.getCode(), errorMessage(ex.getCode(), ex.getMessage()), null, requestId(request)));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadCredentials(
            BadCredentialsException ex,
            HttpServletRequest request
    ) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("INVALID_CREDENTIALS", errorMessage("INVALID_CREDENTIALS", "Tên đăng nhập hoặc mật khẩu không đúng"), null, requestId(request)));
    }

    @ExceptionHandler(LockedException.class)
    public ResponseEntity<ApiResponse<Void>> handleLocked(LockedException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("ACCOUNT_LOCKED", errorMessage("ACCOUNT_LOCKED", "Tài khoản đang bị khóa"), null, requestId(request)));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(
            MethodArgumentNotValidException ex,
            HttpServletRequest request
    ) {
        Map<String, String> details = new LinkedHashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            details.put(fieldError.getField(), validationMessage(fieldError));
        }

        return ResponseEntity.badRequest()
                .body(ApiResponse.error("VALIDATION_FAILED", errorMessage("VALIDATION_FAILED", "Dữ liệu không hợp lệ"), details, requestId(request)));
    }

    private String requestId(HttpServletRequest request) {
        Object requestId = request.getAttribute(RequestIdFilter.REQUEST_ID_ATTRIBUTE);
        return requestId == null ? null : requestId.toString();
    }

    private String errorMessage(String code, String fallback) {
        Locale locale = LocaleContextHolder.getLocale();
        return messageSource.getMessage("error." + code, null, fallback, locale);
    }

    private String validationMessage(FieldError fieldError) {
        Locale locale = LocaleContextHolder.getLocale();
        String key = "validation." + fieldError.getObjectName() + "." + fieldError.getField() + "." + fieldError.getCode();
        return messageSource.getMessage(key, null, fieldError.getDefaultMessage(), locale);
    }
}
