package com.group.mock.service;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;

/**
 * Service for managing blacklisted access tokens. 
 * When a user logs out, their access token's JTI is added to the blacklist in Redis with an expiration time matching the token's expiry.
 * During authentication, the JTI of the presented access token is checked against the blacklist to prevent usage of blacklisted tokens.
 */
@Service
public class TokenBlacklistService {

    private static final String ACCESS_BLACKLIST_PREFIX = "bl:access:";
    private final StringRedisTemplate redisTemplate;

    /**
     * Constructs the TokenBlacklistService with the given StringRedisTemplate for interacting with Redis.
     * @param redisTemplate
     */
    public TokenBlacklistService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * Adds the given access token JTI to the blacklist in Redis with an expiration time matching the token's expiry.
     * @param jti
     * @param expiresAt
     */

    public void blacklistAccessToken(String jti, Instant expiresAt) {
        if (jti == null || expiresAt == null) {
            return;
        }

        long ttlSeconds = Duration.between(Instant.now(), expiresAt).getSeconds();
        if (ttlSeconds <= 0) {
            return;
        }

        redisTemplate.opsForValue().set(accessBlacklistKey(jti), "1", Duration.ofSeconds(ttlSeconds));
    }

    /**
     * Checks if the given access token JTI is blacklisted by looking it up in Redis.
     * @param jti
     * @return
     */
    public boolean isAccessTokenBlacklisted(String jti) {
        if (jti == null) {
            return false;
        }

        return Boolean.TRUE.equals(redisTemplate.hasKey(accessBlacklistKey(jti)));
    }

    /**
     * Constructs the Redis key for blacklisting an access token based on its JTI.
     * @param jti
     * @return
     */
    private String accessBlacklistKey(String jti) {
        return ACCESS_BLACKLIST_PREFIX + jti;
    }
}
