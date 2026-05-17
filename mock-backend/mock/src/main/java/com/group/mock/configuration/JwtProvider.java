package com.group.mock.configuration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Component
public class JwtProvider {

    @Value("${app.jwt.expiration-ms}")
    private long accessTokenExpirationMs;

    @Value("${app.jwt.refresh-expiration-ms:604800000}")
    private long refreshTokenExpirationMs;

    private final JwtEncoder jwtEncoder;

    public JwtProvider(JwtEncoder jwtEncoder) {
        this.jwtEncoder = jwtEncoder;
    }

    public String generateAccessToken(Authentication authentication) {
        return generateAccessToken(authentication.getName());
    }

    public String generateAccessToken(String subject) {
        return generateToken(subject, accessTokenExpirationMs, "access", true);
    }

    public String generateRefreshToken(String subject) {
        return generateToken(subject, refreshTokenExpirationMs, "refresh", false);
    }

    public long getAccessTokenExpirationSeconds() {
        return accessTokenExpirationMs / 1000;
    }

    public long getRefreshTokenExpirationSeconds() {
        return refreshTokenExpirationMs / 1000;
    }

    private String generateToken(String subject, long expirationMs, String tokenType, boolean includeScope) {
        Instant now = Instant.now();
        JwtClaimsSet.Builder claimsBuilder = JwtClaimsSet.builder()
                .issuer("self")
                .issuedAt(now)
                .expiresAt(now.plus(expirationMs, ChronoUnit.MILLIS))
                .subject(subject)
                .id(UUID.randomUUID().toString())
                .claim("token_type", tokenType);

        if (includeScope) {
            claimsBuilder.claim("scope", "read write");
        }

        JwtClaimsSet claims = claimsBuilder.build();

        JwsHeader jwsHeader = JwsHeader.with(MacAlgorithm.HS256).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(jwsHeader, claims)).getTokenValue();
    }
}
