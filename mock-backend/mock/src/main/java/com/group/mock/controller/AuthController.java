package com.group.mock.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.group.mock.configuration.JwtProvider;
import com.group.mock.entity.DTO.request.LoginRequest;
import com.group.mock.entity.DTO.request.LogoutRequest;
import com.group.mock.entity.DTO.request.RefreshTokenRequest;
import com.group.mock.entity.DTO.response.AuthTokenResponse;
import com.group.mock.service.AccountService;
import com.group.mock.service.RefreshTokenService;
import com.group.mock.service.TokenBlacklistService;

@Slf4j
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final JwtProvider jwtProvider;
    private final RefreshTokenService refreshTokenService;
    private final TokenBlacklistService tokenBlacklistService;
    private final AuthenticationManager authenticationManager;
    private final AccountService accountService;

    public AuthController(
            JwtProvider jwtProvider,
            RefreshTokenService refreshTokenService,
            TokenBlacklistService tokenBlacklistService,
            AuthenticationManager authenticationManager,
            AccountService accountService
    ) {
        this.jwtProvider = jwtProvider;
        this.refreshTokenService = refreshTokenService;
        this.tokenBlacklistService = tokenBlacklistService;
        this.authenticationManager = authenticationManager;
        this.accountService = accountService;
    }


    @PostMapping("/login")
    public ResponseEntity<AuthTokenResponse> login(@RequestBody LoginRequest request) {
        UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken
                (request.getUsername(), request.getPassword());
        Authentication authentication = authenticationManager.authenticate(authenticationToken);
        String accessToken = jwtProvider.generateAccessToken(authentication);
        String refreshToken = refreshTokenService.issueAndStoreRefreshToken(authentication.getName());

        return ResponseEntity.ok(new AuthTokenResponse(
                accessToken,
                refreshToken,
                "Bearer",
                jwtProvider.getAccessTokenExpirationSeconds(),
                jwtProvider.getRefreshTokenExpirationSeconds()
        ));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthTokenResponse> refresh(@RequestBody RefreshTokenRequest request) {
        RefreshTokenService.RefreshTokenRotationResult rotationResult =
                refreshTokenService.validateAndRotate(request.getRefreshToken());

        String accessToken = jwtProvider.generateAccessToken(rotationResult.subject());
        return ResponseEntity.ok(new AuthTokenResponse(
                accessToken,
                rotationResult.refreshToken(),
                "Bearer",
                jwtProvider.getAccessTokenExpirationSeconds(),
                jwtProvider.getRefreshTokenExpirationSeconds()
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(Authentication authentication, @RequestBody(required = false) LogoutRequest request) {
        Jwt jwt = extractJwt(authentication);
        tokenBlacklistService.blacklistAccessToken(jwt.getId(), jwt.getExpiresAt());

        if (request != null && request.getRefreshToken() != null && !request.getRefreshToken().isBlank()) {
            refreshTokenService.revokeRefreshToken(request.getRefreshToken());
        }

        return ResponseEntity.ok().body("Logout successfully");
    }

    private Jwt extractJwt(Authentication authentication) {
        if (authentication instanceof JwtAuthenticationToken jwtAuthenticationToken) {
            return jwtAuthenticationToken.getToken();
        }

        throw new IllegalStateException("JWT authentication is required");
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody LoginRequest request) {
        accountService.saveAccount(request);
        return ResponseEntity.ok().body("Register successfully");
    }
}
