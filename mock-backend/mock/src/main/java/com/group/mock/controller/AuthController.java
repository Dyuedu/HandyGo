package com.group.mock.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.group.mock.configuration.JwtProvider;
import com.group.mock.configuration.RequestIdFilter;
import com.group.mock.entity.DTO.request.LoginRequest;
import com.group.mock.entity.DTO.request.LogoutRequest;
import com.group.mock.entity.DTO.request.RefreshTokenRequest;
import com.group.mock.entity.DTO.request.RegisterRequest;
import com.group.mock.entity.DTO.response.ApiResponse;
import com.group.mock.entity.DTO.response.AuthTokenResponse;
import com.group.mock.service.AccountService;
import com.group.mock.service.LoginAttemptService;
import com.group.mock.service.RefreshTokenService;
import com.group.mock.service.TokenBlacklistService;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final JwtProvider jwtProvider;
    private final RefreshTokenService refreshTokenService;
    private final TokenBlacklistService tokenBlacklistService;
    private final AuthenticationManager authenticationManager;
    private final AccountService accountService;
    private final LoginAttemptService loginAttemptService;

    public AuthController(
            JwtProvider jwtProvider,
            RefreshTokenService refreshTokenService,
            TokenBlacklistService tokenBlacklistService,
            AuthenticationManager authenticationManager,
            AccountService accountService,
            LoginAttemptService loginAttemptService
    ) {
        this.jwtProvider = jwtProvider;
        this.refreshTokenService = refreshTokenService;
        this.tokenBlacklistService = tokenBlacklistService;
        this.authenticationManager = authenticationManager;
        this.accountService = accountService;
        this.loginAttemptService = loginAttemptService;
    }


    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthTokenResponse>> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        loginAttemptService.assertNotLocked(request.getUsername());
        UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken
                (request.getUsername(), request.getPassword());
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(authenticationToken);
            loginAttemptService.recordSuccess(request.getUsername());
        } catch (BadCredentialsException ex) {
            loginAttemptService.recordFailure(request.getUsername());
            throw ex;
        }

        String accessToken = jwtProvider.generateAccessToken(authentication);
        String refreshToken = refreshTokenService.issueAndStoreRefreshToken(authentication.getName());

        AuthTokenResponse response = new AuthTokenResponse(
                accessToken,
                refreshToken,
                "Bearer",
                jwtProvider.getAccessTokenExpirationSeconds(),
                jwtProvider.getRefreshTokenExpirationSeconds(),
                accountService.getAccountRole(authentication.getName()),
                accountService.getWorkerVerificationStatus(authentication.getName())
        );
        return ResponseEntity.ok(ApiResponse.success(response, requestId(httpRequest)));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthTokenResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request, HttpServletRequest httpRequest) {
        RefreshTokenService.RefreshTokenRotationResult rotationResult =
                refreshTokenService.validateAndRotate(request.getRefreshToken());

        String accessToken = jwtProvider.generateAccessToken(rotationResult.subject());
        AuthTokenResponse response = new AuthTokenResponse(
                accessToken,
                rotationResult.refreshToken(),
                "Bearer",
                jwtProvider.getAccessTokenExpirationSeconds(),
                jwtProvider.getRefreshTokenExpirationSeconds(),
                accountService.getAccountRole(rotationResult.subject()),
                accountService.getWorkerVerificationStatus(rotationResult.subject())
        );
        return ResponseEntity.ok(ApiResponse.success(response, requestId(httpRequest)));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Map<String, String>>> logout(
            Authentication authentication,
            @RequestBody(required = false) LogoutRequest request,
            HttpServletRequest httpRequest
    ) {
        Jwt jwt = extractJwt(authentication);
        tokenBlacklistService.blacklistAccessToken(jwt.getId(), jwt.getExpiresAt());

        if (request != null && request.getRefreshToken() != null && !request.getRefreshToken().isBlank()) {
            refreshTokenService.revokeRefreshToken(request.getRefreshToken());
        }

        return ResponseEntity.ok(ApiResponse.success(Map.of("message", "Đăng xuất thành công"), requestId(httpRequest)));
    }

    private Jwt extractJwt(Authentication authentication) {
        if (authentication instanceof JwtAuthenticationToken jwtAuthenticationToken) {
            return jwtAuthenticationToken.getToken();
        }

        throw new IllegalStateException("JWT authentication is required");
    }

    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, String>>> register(
            @Valid @ModelAttribute RegisterRequest request,
            HttpServletRequest httpRequest
    ) {
        accountService.register(request);
        return ResponseEntity.ok(ApiResponse.success(Map.of("message", "Đăng ký thành công"), requestId(httpRequest)));
    }

    private String requestId(HttpServletRequest request) {
        Object requestId = request.getAttribute(RequestIdFilter.REQUEST_ID_ATTRIBUTE);
        return requestId == null ? null : requestId.toString();
    }
}
