package com.group.mock.configuration;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.MessageSource;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.group.mock.service.TokenBlacklistService;

import java.io.IOException;

@Component
public class JwtBlacklistFilter extends OncePerRequestFilter {

    private final TokenBlacklistService tokenBlacklistService;
    private final MessageSource messageSource;

    public JwtBlacklistFilter(TokenBlacklistService tokenBlacklistService, MessageSource messageSource) {
        this.tokenBlacklistService = tokenBlacklistService;
        this.messageSource = messageSource;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication instanceof JwtAuthenticationToken jwtAuthenticationToken) {
            String jti = jwtAuthenticationToken.getToken().getId();
            if (tokenBlacklistService.isAccessTokenBlacklisted(jti)) {
                String message = messageSource.getMessage(
                        "error.TOKEN_REVOKED",
                        null,
                        "Token has been revoked",
                        request.getLocale());
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write(String.format(
                        "{\"success\":false,\"error\":{\"code\":\"TOKEN_REVOKED\",\"message\":\"%s\"},\"status\":401}",
                        message.replace("\"", "\\\"")));
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
