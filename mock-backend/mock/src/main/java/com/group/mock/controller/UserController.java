package com.group.mock.controller;

import com.group.mock.entity.Account;
import com.group.mock.entity.UserProfile;
import com.group.mock.entity.DTO.request.UpdateLocationRequest;
import com.group.mock.entity.DTO.response.UserLocationResponse;
import com.group.mock.repository.AccountRepository;
import com.group.mock.repository.UserProfileRepository;
import com.group.mock.exception.AuthServiceException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final AccountRepository accountRepository;
    private final UserProfileRepository userProfileRepository;

    @PutMapping("/location")
    @Transactional
    public ResponseEntity<UserLocationResponse> updateLocation(
            Authentication authentication,
            @Valid @RequestBody UpdateLocationRequest request) {
        
        if (authentication == null) {
            throw new AuthServiceException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Bạn cần đăng nhập để cập nhật vị trí");
        }

        String username = authentication.getName();
        Account account = accountRepository.findByUsername(username)
                .orElseThrow(() -> new AuthServiceException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Không tìm thấy tài khoản người dùng"));

        UserProfile profile = userProfileRepository.findById(account.getId())
                .orElseThrow(() -> new AuthServiceException(HttpStatus.NOT_FOUND, "PROFILE_NOT_FOUND", "Không tìm thấy hồ sơ người dùng"));

        profile.setLatitude(request.getLatitude());
        profile.setLongitude(request.getLongitude());
        UserProfile savedProfile = userProfileRepository.save(profile);

        UserLocationResponse response = new UserLocationResponse(
                savedProfile.getId(),
                savedProfile.getFullName(),
                savedProfile.getPhone(),
                account.getRole().getName(),
                savedProfile.getLatitude(),
                savedProfile.getLongitude()
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/locations")
    public ResponseEntity<List<UserLocationResponse>> getUserLocations(Authentication authentication) {
        if (authentication == null) {
            throw new AuthServiceException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Bạn cần đăng nhập để xem danh sách tọa độ");
        }

        List<UserProfile> profiles = userProfileRepository.findByLatitudeIsNotNullAndLongitudeIsNotNull();
        List<UserLocationResponse> responses = profiles.stream()
                .map(profile -> {
                    String roleName = profile.getAccount() != null && profile.getAccount().getRole() != null 
                            ? profile.getAccount().getRole().getName() 
                            : "USER";
                    return new UserLocationResponse(
                            profile.getId(),
                            profile.getFullName(),
                            profile.getPhone(),
                            roleName,
                            profile.getLatitude(),
                            profile.getLongitude()
                    );
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }
}
