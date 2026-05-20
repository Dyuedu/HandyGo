package com.group.mock.service.Impl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.group.mock.entity.Account;
import com.group.mock.entity.Role;
import com.group.mock.entity.DTO.cache.AccountCache;
import com.group.mock.entity.DTO.request.LoginRequest;
import com.group.mock.entity.DTO.request.RegisterRequest;
import com.group.mock.entity.UserProfile;
import com.group.mock.entity.WorkerProfile;
import com.group.mock.entity.enums.Status;
import com.group.mock.exception.AuthServiceException;
import com.group.mock.repository.AccountRepository;
import com.group.mock.repository.RoleRepository;
import com.group.mock.repository.UserProfileRepository;
import com.group.mock.repository.WorkerProfileRepository;
import com.group.mock.service.AccountService;
import com.group.mock.service.CloudinaryUploadService;

import java.time.LocalDateTime;
import java.time.Duration;
import java.util.Locale;
import java.util.Optional;

@Service
public class AccountServiceImpl implements AccountService {
    private static final String ACCOUNT_BY_USERNAME_CACHE_KEY_PREFIX = "cache:account:username:";

    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;
    private final UserProfileRepository userProfileRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final CloudinaryUploadService cloudinaryUploadService;
    private final PasswordEncoder passwordEncoder;
    private final RedisTemplate<String, AccountCache> accountCacheTemplate;

    @Value("${app.cache.account-ttl-seconds:300}")
    private long accountCacheTtlSeconds;

    public AccountServiceImpl(
            AccountRepository accountRepository,
            RoleRepository roleRepository,
            UserProfileRepository userProfileRepository,
            WorkerProfileRepository workerProfileRepository,
            CloudinaryUploadService cloudinaryUploadService,
            PasswordEncoder passwordEncoder,
            RedisTemplate<String, AccountCache> accountCacheTemplate) {
        this.accountRepository = accountRepository;
        this.roleRepository = roleRepository;
        this.userProfileRepository = userProfileRepository;
        this.workerProfileRepository = workerProfileRepository;
        this.cloudinaryUploadService = cloudinaryUploadService;
        this.passwordEncoder = passwordEncoder;
        this.accountCacheTemplate = accountCacheTemplate;
    }

    @Override
    public void saveAccount(LoginRequest loginRequest) {
        Account account = new Account();
        account.setRole(resolveRole("USER"));
        account.setUsername(loginRequest.getUsername());
        account.setPassword(passwordEncoder.encode(loginRequest.getPassword()));
        account.setStatus(Status.ACTIVE);
        Account savedAccount = accountRepository.save(account);
        cacheAccount(savedAccount);
    }

    @Override
    @Transactional
    public void register(RegisterRequest registerRequest) {
        String username = registerRequest.getUsername().trim();
        if (accountRepository.existsByUsername(username)) {
            throw new AuthServiceException(HttpStatus.CONFLICT, "USERNAME_EXISTS", "Tên đăng nhập đã tồn tại");
        }

        String role = registerRequest.getRole().toUpperCase(Locale.ROOT);
        if (registerRequest.getPhone() != null && !registerRequest.getPhone().isBlank()
                && userProfileRepository.existsByPhone(registerRequest.getPhone())) {
            throw new AuthServiceException(HttpStatus.CONFLICT, "PHONE_EXISTS", "Số điện thoại đã được sử dụng");
        }

        Account account = new Account();
        account.setUsername(username);
        account.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        account.setRole(resolveRole(role));
        account.setStatus(Status.ACTIVE);
        Account savedAccount = accountRepository.save(account);

        if ("USER".equals(role)) {
            createUserProfile(savedAccount, registerRequest);
        } else if ("WORKER".equals(role)) {
            createUserProfile(savedAccount, registerRequest);
            createWorkerProfile(savedAccount, registerRequest);
        } else {
            throw new AuthServiceException(HttpStatus.BAD_REQUEST, "INVALID_ROLE", "Vai trò không hợp lệ");
        }

        cacheAccount(savedAccount);
    }

    @Override
    public String getAccountRole(String username) {
        Account account = getAccountByUsername(username);
        if (account.getRole() == null || account.getRole().getName() == null) {
            return null;
        }

        return account.getRole().getName().replaceFirst("^ROLE_", "");
    }

    @Override
    public String getWorkerVerificationStatus(String username) {
        return workerProfileRepository.findByAccountUsername(username)
                .map(profile -> profile.isVerified() ? "VERIFIED" : "PENDING")
                .orElse(null);
    }

    @Override
    public void deleteAccount() {

    }

    @Override
    public void updateAccount() {

    }

    @Override
    public Account loadUserByUsername(String username) throws UsernameNotFoundException {
        return getAccountByUsername(username);
    }

    @Override
    public Account getAccountByUsername(String username) {
        AccountCache cachedAccount = accountCacheTemplate.opsForValue().get(accountByUsernameCacheKey(username));
        if (cachedAccount != null) {
            return cachedAccount.toAccount();
        }

        Optional<Account> accountOptional = accountRepository.findByUsername(username);
        if (accountOptional.isEmpty()) {
            throw new UsernameNotFoundException("User not found with username: " + username);
        }
        Account account = accountOptional.get();
        cacheAccount(account);
        return account;
    }

    private void cacheAccount(Account account) {
        if (account == null || account.getUsername() == null) {
            return;
        }

        AccountCache cacheValue = AccountCache.fromAccount(account);
        accountCacheTemplate.opsForValue().set(
                accountByUsernameCacheKey(account.getUsername()),
                cacheValue,
                Duration.ofSeconds(accountCacheTtlSeconds));
    }

    private String accountByUsernameCacheKey(String username) {
        return ACCOUNT_BY_USERNAME_CACHE_KEY_PREFIX + username;
    }

    private Role resolveRole(String role) {
        return roleRepository.findByName("ROLE_" + role.toUpperCase(Locale.ROOT))
                .orElseThrow(() -> new AuthServiceException(HttpStatus.BAD_REQUEST, "ROLE_NOT_FOUND", "Vai trò chưa được cấu hình"));
    }

    private void createUserProfile(Account account, RegisterRequest request) {
        if (request.getFullName() == null || request.getFullName().isBlank()) {
            throw new AuthServiceException(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", "Họ tên là bắt buộc");
        }

        UserProfile userProfile = new UserProfile();
        userProfile.setAccount(account);
        userProfile.setFullName(request.getFullName().trim());
        userProfile.setPhone(blankToNull(request.getPhone()));
        userProfile.setCreatedAt(LocalDateTime.now());
        userProfileRepository.save(userProfile);
    }

    private void createWorkerProfile(Account account, RegisterRequest request) {
        if (request.getJobType() == null || request.getJobType().isBlank()) {
            throw new AuthServiceException(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", "Loại công việc là bắt buộc");
        }

        String certificateUrl = cloudinaryUploadService.uploadProfessionalCertificate(request.getProfessionalCertificate());

        WorkerProfile workerProfile = new WorkerProfile();
        workerProfile.setAccount(account);
        workerProfile.setJobType(request.getJobType().trim());
        workerProfile.setProfessionalCertificateUrl(certificateUrl);
        workerProfile.setVerified(false);
        workerProfile.setTierType("FREE");
        workerProfile.setAvgRating(0.0);
        workerProfileRepository.save(workerProfile);
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    @Override
    @Transactional
    public Account loginOrRegisterGoogleUser(String supabaseAccessToken) {
        try {
            // Decode the JWT local payload to be robust against 401 gatekeeping of JWKS on Kong gateway
            String[] chunks = supabaseAccessToken.split("\\.");
            if (chunks.length < 2) {
                throw new AuthServiceException(HttpStatus.BAD_REQUEST, "INVALID_TOKEN", "Định dạng token không hợp lệ");
            }
            
            String payloadJson = new String(
                java.util.Base64.getUrlDecoder().decode(chunks[1]), 
                java.nio.charset.StandardCharsets.UTF_8
            );
            
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode rootNode = mapper.readTree(payloadJson);
            
            String email = rootNode.path("email").asText();
            if (email == null || email.isBlank()) {
                throw new AuthServiceException(HttpStatus.BAD_REQUEST, "INVALID_TOKEN", "Email không tìm thấy trong token");
            }
            
            Optional<Account> accountOpt = accountRepository.findByUsername(email);
            if (accountOpt.isPresent()) {
                return accountOpt.get();
            }
            
            // Create a new account
            Account account = new Account();
            account.setUsername(email);
            account.setPassword(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));
            account.setRole(resolveRole("USER"));
            account.setStatus(Status.ACTIVE);
            Account savedAccount = accountRepository.save(account);
            
            // Create user profile
            UserProfile userProfile = new UserProfile();
            userProfile.setAccount(savedAccount);
            
            // Extract full name from user_metadata
            String fullName = "Google User";
            com.fasterxml.jackson.databind.JsonNode metadataNode = rootNode.path("user_metadata");
            if (!metadataNode.isMissingNode() && metadataNode.has("full_name")) {
                fullName = metadataNode.path("full_name").asText();
            }
            
            userProfile.setFullName(fullName);
            userProfile.setCreatedAt(LocalDateTime.now());
            userProfileRepository.save(userProfile);
            
            cacheAccount(savedAccount);
            return savedAccount;
        } catch (AuthServiceException e) {
            throw e;
        } catch (Exception e) {
            throw new AuthServiceException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Xác thực Google qua Supabase thất bại: " + e.getMessage());
        }
    }
}
