package com.group.mock.service;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Service;

import com.group.mock.configuration.JwtProvider;

import java.time.Duration;
import java.time.Instant;

/**
 * Service for managing refresh tokens, including issuing, validating, rotating, and revoking refresh tokens.
 * Refresh tokens are stored in Redis with their JTI as the key to allow for revocation and rotation.
 */
@Service
public class RefreshTokenService {

    private static final String REFRESH_TOKEN_PREFIX = "rt:";
    private final StringRedisTemplate redisTemplate;
    private final JwtDecoder jwtDecoder;
    private final JwtProvider jwtProvider;

    public RefreshTokenService(StringRedisTemplate redisTemplate, JwtDecoder jwtDecoder, JwtProvider jwtProvider) {
        this.redisTemplate = redisTemplate;
        this.jwtDecoder = jwtDecoder;
        this.jwtProvider = jwtProvider;
    }

    /**
     * Issues a new refresh token for the given subject and stores it in Redis.
     * @param subject
     * @return
     */
    public String issueAndStoreRefreshToken(String subject) {
        String refreshToken = jwtProvider.generateRefreshToken(subject);
        Jwt decoded = decodeToken(refreshToken);
        assertRefreshToken(decoded);
        storeRefreshToken(decoded.getId(), subject, decoded.getExpiresAt());
        return refreshToken;
    }

    /**
     * Validates the given refresh token, checks it against Redis for revocation, 
     * and if valid, rotates it by issuing a new refresh token and deleting the old one from Redis.
     * @param refreshToken
     * @return
     */
    public RefreshTokenRotationResult validateAndRotate(String refreshToken) {
        Jwt decoded = decodeToken(refreshToken);
        assertRefreshToken(decoded);

        String subject = decoded.getSubject();
        String jti = decoded.getId();

        String key = refreshTokenKey(jti);
        String storedSubject = redisTemplate.opsForValue().get(key);
        if (storedSubject == null || !storedSubject.equals(subject)) {
            throw new BadCredentialsException("Refresh token is invalid or revoked");
        }

        redisTemplate.delete(key);
        String newRefreshToken = issueAndStoreRefreshToken(subject);
        return new RefreshTokenRotationResult(subject, newRefreshToken);
    }

    /**
     * Revokes the given refresh token by deleting its JTI from Redis, 
     * preventing any future use of that token for refreshing.
     * @param refreshToken
     */
    public void revokeRefreshToken(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            return;
        }

        Jwt decoded = decodeToken(refreshToken);
        String jti = decoded.getId();
        if (jti != null) {
            redisTemplate.delete(refreshTokenKey(jti));
        }
    }

    /**
     * Stores the refresh token's JTI and subject in Redis with an expiration time matching the token's expiry.
     * @param jti
     * @param subject
     * @param expiresAt
     */
    private void storeRefreshToken(String jti, String subject, Instant expiresAt) {
        if (jti == null || subject == null || expiresAt == null) {
            throw new BadCredentialsException("Refresh token payload is invalid");
        }

        long ttlSeconds = Duration.between(Instant.now(), expiresAt).getSeconds();
        if (ttlSeconds <= 0) {
            throw new BadCredentialsException("Refresh token has already expired");
        }

        redisTemplate.opsForValue().set(refreshTokenKey(jti), subject, Duration.ofSeconds(ttlSeconds));
    }

    private Jwt decodeToken(String token) {
        try {
            return jwtDecoder.decode(token);
        } catch (JwtException ex) {
            throw new BadCredentialsException("Invalid token", ex);
        }
    }

    /**
     * Asserts that the given JWT is a refresh token by checking its "token_type" claim.
     * @param jwt
     */
    private void assertRefreshToken(Jwt jwt) {
        String tokenType = jwt.getClaimAsString("token_type");
        if (!"refresh".equals(tokenType)) {
            throw new BadCredentialsException("Token is not a refresh token");
        }
    }

    /**
     * Constructs the Redis key for storing a refresh token based on its JTI.
     * @param jti
     * @return
     */
    private String refreshTokenKey(String jti) {
        return REFRESH_TOKEN_PREFIX + jti;
    }

    /**
     * Result of a successful refresh token rotation, containing the subject and the new refresh token.
     */
    public record RefreshTokenRotationResult(String subject, String refreshToken) {
    }
}
