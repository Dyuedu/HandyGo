package com.group.mock.configuration;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.util.List;

@Configuration
public class SecurityConfig {
    @Value("${app.jwt.secret}")
    private String jwtSecret;
    private final JwtAccountAuthenticationConverter jwtAccountAuthenticationConverter;
    private final JwtBlacklistFilter jwtBlacklistFilter;

    public SecurityConfig(
            JwtAccountAuthenticationConverter jwtAccountAuthenticationConverter,
            JwtBlacklistFilter jwtBlacklistFilter) {
        this.jwtAccountAuthenticationConverter = jwtAccountAuthenticationConverter;
        this.jwtBlacklistFilter = jwtBlacklistFilter;
    }

    @Bean
    public AuthenticationEntryPoint authenticationEntryPoint() {
        return (request, response, authException) -> {
            int status;
            String message;

            // Check the exception type to decide the status code
            if (authException instanceof BadCredentialsException) {
                status = HttpServletResponse.SC_UNAUTHORIZED; // 401
                message = "Invalid username or password";
            } else if (authException instanceof LockedException) {
                status = HttpServletResponse.SC_FORBIDDEN; // 403
                message = "Account is locked";
            } else {
                status = HttpServletResponse.SC_UNAUTHORIZED; // 401 default
                message = authException.getMessage();
            }
            // Set response properties
            response.setStatus(status);
            response.setContentType("application/json");
            response.getWriter().write(String.format("{\"error\": \"%s\", \"status\": %d}", message, status));
        };
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public AuthenticationProvider authenticationProvider(UserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        SecretKey key = new SecretKeySpec(jwtSecret.getBytes(), "HS256");
        return NimbusJwtDecoder.withSecretKey(key).build();
    }

    @Bean
    public JwtEncoder jwtEncoder() {
        SecretKey key = new SecretKeySpec(jwtSecret.getBytes(), "HS256");
        return new NimbusJwtEncoder(new ImmutableSecret<>(key));
    }

    /**
     * Security filter chain chung cho tất cả các api, sẽ được ghi đè bởi security
     * filter chain riêng cho api auth để có thể cấu hình các endpoint public như
     * login, register, refresh token mà không ảnh hưởng đến các api khác.
     * 
     * @param http
     * @return
     * @throws Exception
     */
    @Bean
    @Order(2)
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/actuator/health").permitAll()
                        .requestMatchers("/api/v1/admin/**").hasAuthority("ROLE_ADMIN")
                        .anyRequest().authenticated())
                .oauth2ResourceServer((oauth2) -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAccountAuthenticationConverter)))
                // vì filter này chỉ check access token nên chỉ cần đặt sau filter xử lí access
                // token là được,
                // không cần phân biệt api auth hay api khác.
                .addFilterAfter(jwtBlacklistFilter, BearerTokenAuthenticationFilter.class)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(entry -> entry.authenticationEntryPoint(authenticationEntryPoint()));
        return http.build();
    }

    /**
     * Security filter chain riêng cho api auth để có thể cấu hình các endpoint
     * public như login,
     * register, refresh token mà không ảnh hưởng đến các api khác.
     * 
     * @param http
     * @return
     * @throws Exception
     */
    @Bean
    @Order(1)
    public SecurityFilterChain securityFilterChainW(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                // Chỉ áp dụng cấu hình này cho các endpoint bắt đầu bằng /api/auth,
                // các endpoint khác sẽ sử dụng security filter chain chung ở trên.
                .securityMatcher("/api/auth/**")
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/login", "/api/auth/register", "/api/auth/refresh", "/api/auth/google-login").permitAll()
                        .requestMatchers("/api/auth/logout").authenticated()
                        .anyRequest().authenticated())
                .oauth2ResourceServer((oauth2) -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAccountAuthenticationConverter)))
                .addFilterAfter(jwtBlacklistFilter, BearerTokenAuthenticationFilter.class)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(entry -> entry.authenticationEntryPoint(authenticationEntryPoint()));
        return http.build();
    }

    @Bean
    @Order(0)
    public SecurityFilterChain paymentSecurityFilterChain(HttpSecurity http) throws Exception {
        http
                .securityMatcher("/api/v1/payment/**") // Chỉ áp dụng cho luồng thanh toán
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(auth -> auth
                        .anyRequest().permitAll() // Cho phép tất cả (VNPay IPN, Return URL)
                );
        return http.build();
    }

    /**
     * Cấu hình CORS để cho phép frontend có thể gọi api mà không bị chặn bởi trình
     * duyệt.
     * Cấu hình này sẽ áp dụng cho tất cả các api, nếu muốn cấu hình riêng
     * cho api auth thì có thể tạo một bean CorsConfigurationSource khác và
     * đặt @Order cao hơn để ghi đè.
     * 
     * @return
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
