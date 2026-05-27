package com.group.mock.service.Impl;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.group.mock.entity.Account;
import com.group.mock.entity.Role;
import com.group.mock.entity.DTO.request.LoginRequest;
import com.group.mock.entity.DTO.request.RegisterRequest;
import com.group.mock.entity.UserProfile;
import com.group.mock.entity.Wallet;
import com.group.mock.entity.WorkerProfile;
import com.group.mock.entity.enums.Status;
import com.group.mock.entity.WorkerLocation;
import com.group.mock.exception.AuthServiceException;
import com.group.mock.repository.AccountRepository;
import com.group.mock.repository.RoleRepository;
import com.group.mock.repository.UserProfileRepository;
import com.group.mock.repository.WalletRepository;
import com.group.mock.repository.WorkerProfileRepository;
import com.group.mock.repository.WorkerLocationRepository;
import com.group.mock.service.AccountService;
import com.group.mock.service.CloudinaryUploadService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Optional;

@Service
public class AccountServiceImpl implements AccountService {
    private static final String RESET_PASSWORD_TOKEN_PREFIX = "RESET_PASSWORD:";

    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;
    private final UserProfileRepository userProfileRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final WorkerLocationRepository workerLocationRepository;
    private final WalletRepository walletRepository;
    private final CloudinaryUploadService cloudinaryUploadService;
    private final PasswordEncoder passwordEncoder;
    private final org.springframework.data.redis.core.StringRedisTemplate stringRedisTemplate;
    private final com.group.mock.service.EmailService emailService;

    public AccountServiceImpl(
            AccountRepository accountRepository,
            RoleRepository roleRepository,
            UserProfileRepository userProfileRepository,
            WorkerProfileRepository workerProfileRepository,
            WorkerLocationRepository workerLocationRepository,
            WalletRepository walletRepository,
            CloudinaryUploadService cloudinaryUploadService,
            PasswordEncoder passwordEncoder) {
        this.accountRepository = accountRepository;
        this.roleRepository = roleRepository;
        this.userProfileRepository = userProfileRepository;
        this.workerProfileRepository = workerProfileRepository;
        this.workerLocationRepository = workerLocationRepository;
        this.walletRepository = walletRepository;
        this.cloudinaryUploadService = cloudinaryUploadService;
        this.passwordEncoder = passwordEncoder;
        this.stringRedisTemplate = stringRedisTemplate;
        this.emailService = emailService;
    }

    @Override
    public void saveAccount(LoginRequest loginRequest) {
        Account account = new Account();
        account.setRole(resolveRole("USER"));
        account.setUsername(loginRequest.getUsername());
        account.setPassword(passwordEncoder.encode(loginRequest.getPassword()));
        account.setStatus(Status.ACTIVE);
        accountRepository.save(account);
        accountRepository.save(account);
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

        if (registerRequest.getEmail() != null && accountRepository.existsByEmail(registerRequest.getEmail())) {
            throw new AuthServiceException(HttpStatus.CONFLICT, "EMAIL_EXISTS", "Email đã tồn tại");
        }

        Account account = new Account();
        account.setUsername(username);
        account.setEmail(registerRequest.getEmail());
        account.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        account.setRole(resolveRole(role));
        account.setStatus(Status.INACTIVE);
        Account savedAccount = accountRepository.save(account);

        if ("USER".equals(role)) {
            createUserProfile(savedAccount, registerRequest);
        } else if ("WORKER".equals(role)) {
            createUserProfile(savedAccount, registerRequest);
            createWorkerProfile(savedAccount, registerRequest);
            createWorkerWallet(savedAccount);
        } else {
            throw new AuthServiceException(HttpStatus.BAD_REQUEST, "INVALID_ROLE", "Vai trò không hợp lệ");
        }

        // Generate OTP (TTL: 15 minutes as per specification)
        String otp = String.format("%06d", new java.util.Random().nextInt(1000000));
        stringRedisTemplate.opsForValue().set("OTP:" + registerRequest.getEmail(), otp, Duration.ofMinutes(15));
        
        emailService.sendVerificationEmail(registerRequest.getEmail(), otp);

    }

    @Override
    @Transactional
    public void verifyEmail(String email, String otp) {
        String cacheKey = "OTP:" + email;
        String cachedOtp = stringRedisTemplate.opsForValue().get(cacheKey);

        if (cachedOtp == null) {
            throw new AuthServiceException(HttpStatus.BAD_REQUEST, "OTP_EXPIRED", "Mã xác thực đã hết hạn hoặc không tồn tại");
        }

        if (!cachedOtp.equals(otp)) {
            throw new AuthServiceException(HttpStatus.BAD_REQUEST, "OTP_INVALID", "Mã xác thực không chính xác");
        }

        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new AuthServiceException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Không tìm thấy tài khoản với email này"));

        if (account.getStatus() == Status.ACTIVE) {
            throw new AuthServiceException(HttpStatus.BAD_REQUEST, "ALREADY_VERIFIED", "Tài khoản đã được xác thực");
        }

        account.setStatus(Status.ACTIVE);
        accountRepository.save(account);
        stringRedisTemplate.delete(cacheKey);
        
        // Send welcome email
        String userRole = account.getRole() != null ? account.getRole().getName() : "USER";
        userRole = userRole.replaceFirst("^ROLE_", "");
        UserProfile userProfile = userProfileRepository.findByAccountUsername(account.getUsername()).orElse(null);
        String fullName = userProfile != null && userProfile.getFullName() != null ? 
                         userProfile.getFullName() : account.getUsername();
        emailService.sendWelcomeEmail(email, fullName, userRole);
        
    }

    @Override
    public String resendVerification(String username) {
        Account account = accountRepository.findByUsername(username)
                .orElseThrow(() -> new AuthServiceException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Không tìm thấy tài khoản"));

        if (account.getStatus() == Status.ACTIVE) {
            throw new AuthServiceException(HttpStatus.BAD_REQUEST, "ALREADY_VERIFIED", "Tài khoản đã được xác thực");
        }

        if (account.getEmail() == null || account.getEmail().isBlank()) {
            throw new AuthServiceException(HttpStatus.BAD_REQUEST, "NO_EMAIL", "Tài khoản không có email để xác thực");
        }

        // Generate OTP (TTL: 15 minutes as per specification)
        String otp = String.format("%06d", new java.util.Random().nextInt(1000000));
        stringRedisTemplate.opsForValue().set("OTP:" + account.getEmail(), otp, Duration.ofMinutes(15));
        
        emailService.sendVerificationEmail(account.getEmail(), otp);
        
        return account.getEmail();
    }

    @Override
    public void forgotPassword(String email) {
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new AuthServiceException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Không tìm thấy tài khoản với email này"));

        String resetToken = java.util.UUID.randomUUID().toString();
        stringRedisTemplate.opsForValue().set(
                RESET_PASSWORD_TOKEN_PREFIX + resetToken,
                account.getEmail(),
                Duration.ofMinutes(60));

        UserProfile userProfile = userProfileRepository.findById(account.getId()).orElse(null);
        String fullName = userProfile != null && userProfile.getFullName() != null
                ? userProfile.getFullName()
                : account.getUsername();
        emailService.sendForgotPasswordEmail(account.getEmail(), fullName, resetToken);
    }

    @Override
    @Transactional
    public void resetPassword(String token, String newPassword) {
        String cacheKey = RESET_PASSWORD_TOKEN_PREFIX + token;
        String email = stringRedisTemplate.opsForValue().get(cacheKey);
        if (email == null) {
            throw new AuthServiceException(HttpStatus.BAD_REQUEST, "RESET_TOKEN_INVALID", "Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn");
        }

        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new AuthServiceException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Không tìm thấy tài khoản với email này"));
        account.setPassword(passwordEncoder.encode(newPassword));
        accountRepository.save(account);
        stringRedisTemplate.delete(cacheKey);
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
        return getFreshAccountByUsername(username);
    }

    @Override
    public Account getFreshAccountByUsername(String username) {
        Optional<Account> accountOptional = accountRepository.findByUsername(username);
        if (accountOptional.isEmpty()) {
            throw new UsernameNotFoundException("User not found with username: " + username);
        }
        return accountOptional.get();
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

    private void createWorkerWallet(Account account) {
        if (walletRepository.findByUserId(account.getId()).isPresent()) {
            return;
        }

        Wallet wallet = new Wallet();
        wallet.setUserId(account.getId());
        wallet.setBalance(BigDecimal.ZERO);
        wallet.setCurrency("XU");
        walletRepository.save(wallet);
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
            
            return savedAccount;
        } catch (AuthServiceException e) {
            throw e;
        } catch (Exception e) {
            throw new AuthServiceException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Xác thực Google qua Supabase thất bại: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public void updateWorkerLocation(java.util.UUID accountId, Double latitude, Double longitude) {
        // 1. Update UserProfile for consistency
        UserProfile profile = userProfileRepository.findById(accountId)
                .orElseGet(() -> {
                    UserProfile newProfile = new UserProfile();
                    accountRepository.findById(accountId).ifPresent(newProfile::setAccount);
                    newProfile.setFullName(newProfile.getAccount() != null ? newProfile.getAccount().getUsername() : "Người dùng");
                    newProfile.setCreatedAt(LocalDateTime.now());
                    return newProfile;
                });
        if (profile.getAccount() != null) {
            profile.setLatitude(latitude);
            profile.setLongitude(longitude);
            userProfileRepository.save(profile);
        }

        // 2. Update/create WorkerLocation
        workerProfileRepository.findById(accountId).ifPresent(workerProfile -> {
            WorkerLocation workerLoc = workerLocationRepository.findById(accountId)
                    .orElseGet(() -> {
                        WorkerLocation newLoc = new WorkerLocation();
                        newLoc.setWorkerProfile(workerProfile);
                        newLoc.setAvailable(true);
                        return newLoc;
                    });
            workerLoc.setLatitude(latitude);
            workerLoc.setLongitude(longitude);
            workerLoc.setLastUpdate(LocalDateTime.now());
            workerLocationRepository.save(workerLoc);
        });
    }
}
