package com.group.mock.service;

import com.group.mock.exception.AuthServiceException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
public class LoginAttemptService {
    private final ConcurrentMap<String, AttemptState> attempts = new ConcurrentHashMap<>();
    private final Clock clock = Clock.systemUTC();

    @Value("${auth.login-attempt.max-attempts:5}")
    private int maxAttempts;

    @Value("${auth.login-attempt.window-minutes:10}")
    private long windowMinutes;

    @Value("${auth.login-attempt.block-duration-minutes:10}")
    private long blockDurationMinutes;

    public void assertNotLocked(String username) {
        AttemptState state = attempts.get(normalize(username));
        if (state == null || state.lockedUntil == null) {
            return;
        }

        Instant now = Instant.now(clock);
        if (state.lockedUntil.isAfter(now)) {
            throw new AuthServiceException(
                    HttpStatus.FORBIDDEN,
                    "LOGIN_LOCKED",
                    "Bạn đã đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 10 phút"
            );
        }

        attempts.remove(normalize(username));
    }

    public void recordSuccess(String username) {
        attempts.remove(normalize(username));
    }

    public void recordFailure(String username) {
        String key = normalize(username);
        Instant now = Instant.now(clock);
        attempts.compute(key, (ignored, state) -> {
            if (state == null || Duration.between(state.firstFailureAt, now).toMinutes() >= windowMinutes) {
                state = new AttemptState(now, 0, null);
            }

            state.failureCount++;
            if (state.failureCount >= maxAttempts) {
                state.lockedUntil = now.plus(Duration.ofMinutes(blockDurationMinutes));
            }
            return state;
        });
    }

    private String normalize(String username) {
        return username == null ? "" : username.trim().toLowerCase(Locale.ROOT);
    }

    private static final class AttemptState {
        private final Instant firstFailureAt;
        private int failureCount;
        private Instant lockedUntil;

        private AttemptState(Instant firstFailureAt, int failureCount, Instant lockedUntil) {
            this.firstFailureAt = firstFailureAt;
            this.failureCount = failureCount;
            this.lockedUntil = lockedUntil;
        }
    }
}
