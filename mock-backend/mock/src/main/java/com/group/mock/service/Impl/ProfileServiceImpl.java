package com.group.mock.service.Impl;

import com.group.mock.entity.Account;
import com.group.mock.entity.UserProfile;
import com.group.mock.entity.WorkerProfile;
import com.group.mock.entity.DTO.request.UpdateProfileRequest;
import com.group.mock.entity.DTO.request.UpdateWorkerProfileRequest;
import com.group.mock.entity.DTO.response.MyProfileResponse;
import com.group.mock.entity.DTO.response.PublicWorkerProfileResponse;
import com.group.mock.entity.DTO.response.WorkerProfileSection;
import com.group.mock.exception.AuthServiceException;
import com.group.mock.repository.AccountRepository;
import com.group.mock.repository.UserProfileRepository;
import com.group.mock.repository.WorkerProfileRepository;
import com.group.mock.service.CloudinaryUploadService;
import com.group.mock.service.ProfileService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProfileServiceImpl implements ProfileService {

    private final AccountRepository accountRepository;
    private final UserProfileRepository userProfileRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final CloudinaryUploadService cloudinaryUploadService;

    @Override
    @Transactional(readOnly = true)
    public MyProfileResponse getMyProfile(String username) {
        Account account = loadAccount(username);
        UserProfile profile = requireUserProfile(account.getId());
        return toMyProfileResponse(account, profile);
    }

    @Override
    @Transactional
    public MyProfileResponse updateMyProfile(String username, UpdateProfileRequest request) {
        Account account = loadAccount(username);
        UserProfile profile = requireUserProfile(account.getId());

        String fullName = request.getFullName().trim();
        String phone = blankToNull(request.getPhone());

        if (phone != null && userProfileRepository.existsByPhoneAndIdNot(phone, profile.getId())) {
            throw new AuthServiceException(HttpStatus.CONFLICT, "PHONE_EXISTS", "Số điện thoại đã được sử dụng");
        }

        profile.setFullName(fullName);
        profile.setPhone(phone);
        userProfileRepository.save(profile);

        return toMyProfileResponse(account, profile);
    }

    @Override
    @Transactional
    public MyProfileResponse updateMyWorkerProfile(String username, UpdateWorkerProfileRequest request) {
        Account account = loadAccount(username);
        requireRoleWorker(account);
        UserProfile profile = requireUserProfile(account.getId());
        WorkerProfile worker = workerProfileRepository
                .findById(account.getId())
                .orElseThrow(() -> new AuthServiceException(
                        HttpStatus.NOT_FOUND, "WORKER_PROFILE_NOT_FOUND", "Không tìm thấy hồ sơ thợ"));

        worker.setJobType(request.getJobType().trim());

        if (request.getProfessionalCertificate() != null
                && !request.getProfessionalCertificate().isEmpty()) {
            String certificateUrl =
                    cloudinaryUploadService.uploadProfessionalCertificate(request.getProfessionalCertificate());
            worker.setProfessionalCertificateUrl(certificateUrl);
            worker.setVerified(false);
        }

        workerProfileRepository.save(worker);
        return toMyProfileResponse(account, profile);
    }

    @Override
    @Transactional(readOnly = true)
    public PublicWorkerProfileResponse getPublicWorkerProfile(UUID workerId) {
        WorkerProfile worker = workerProfileRepository
                .findById(workerId)
                .orElseThrow(() -> new AuthServiceException(
                        HttpStatus.NOT_FOUND, "WORKER_NOT_FOUND", "Không tìm thấy thợ"));

        UserProfile userProfile = userProfileRepository
                .findById(workerId)
                .orElseThrow(() -> new AuthServiceException(
                        HttpStatus.NOT_FOUND, "PROFILE_NOT_FOUND", "Không tìm thấy hồ sơ"));

        return new PublicWorkerProfileResponse(
                worker.getId(),
                userProfile.getFullName(),
                userProfile.getPhone(),
                worker.getJobType(),
                worker.isVerified(),
                worker.getAvgRating(),
                userProfile.getLatitude(),
                userProfile.getLongitude());
    }

    private MyProfileResponse toMyProfileResponse(Account account, UserProfile profile) {
        MyProfileResponse dto = new MyProfileResponse();
        dto.setId(profile.getId());
        dto.setUsername(account.getUsername());
        dto.setRole(roleLabel(account));
        dto.setFullName(profile.getFullName());
        dto.setPhone(profile.getPhone());
        dto.setLatitude(profile.getLatitude());
        dto.setLongitude(profile.getLongitude());
        dto.setCreatedAt(profile.getCreatedAt());

        workerProfileRepository.findById(profile.getId()).ifPresent(worker -> dto.setWorker(toWorkerSection(worker)));
        return dto;
    }

    private WorkerProfileSection toWorkerSection(WorkerProfile worker) {
        WorkerProfileSection section = new WorkerProfileSection();
        section.setJobType(worker.getJobType());
        section.setVerified(worker.isVerified());
        section.setVerificationStatus(worker.isVerified() ? "VERIFIED" : "PENDING");
        section.setTierType(worker.getTierType());
        section.setTierExpiredAt(worker.getTierExpiredAt());
        section.setAvgRating(worker.getAvgRating());
        section.setProfessionalCertificateUrl(worker.getProfessionalCertificateUrl());
        return section;
    }

    private Account loadAccount(String username) {
        return accountRepository
                .findByUsername(username)
                .orElseThrow(() -> new AuthServiceException(
                        HttpStatus.UNAUTHORIZED, "ACCOUNT_NOT_FOUND", "Tài khoản không tồn tại"));
    }

    private UserProfile requireUserProfile(UUID accountId) {
        return userProfileRepository
                .findById(accountId)
                .orElseThrow(() -> new AuthServiceException(
                        HttpStatus.NOT_FOUND, "PROFILE_NOT_FOUND", "Không tìm thấy hồ sơ người dùng"));
    }

    private void requireRoleWorker(Account account) {
        if (account.getRole() == null || !"ROLE_WORKER".equals(account.getRole().getName())) {
            throw new AuthServiceException(
                    HttpStatus.FORBIDDEN, "FORBIDDEN", "Chỉ tài khoản thợ mới cập nhật hồ sơ thợ");
        }
    }

    private String roleLabel(Account account) {
        if (account.getRole() == null || account.getRole().getName() == null) {
            return "USER";
        }
        return account.getRole().getName().replaceFirst("^ROLE_", "");
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
