package com.group.mock.controller;

import com.group.mock.entity.DTO.request.UpdateProfileRequest;
import com.group.mock.entity.DTO.request.UpdateWorkerProfileRequest;
import com.group.mock.entity.DTO.response.MyProfileResponse;
import com.group.mock.entity.DTO.response.PublicWorkerProfileResponse;
import com.group.mock.service.ProfileService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping("/api/v1/profile/me")
    public ResponseEntity<MyProfileResponse> getMyProfile(Authentication authentication) {
        return ResponseEntity.ok(profileService.getMyProfile(authentication.getName()));
    }

    @PutMapping("/api/v1/profile/me")
    public ResponseEntity<MyProfileResponse> updateMyProfile(
            Authentication authentication, @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(profileService.updateMyProfile(authentication.getName(), request));
    }

    @PutMapping(value = "/api/v1/profile/me/worker", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MyProfileResponse> updateMyWorkerProfile(
            Authentication authentication, @Valid @ModelAttribute UpdateWorkerProfileRequest request) {
        return ResponseEntity.ok(profileService.updateMyWorkerProfile(authentication.getName(), request));
    }

    @GetMapping("/api/v1/workers/{workerId}")
    public ResponseEntity<PublicWorkerProfileResponse> getPublicWorkerProfile(@PathVariable UUID workerId) {
        return ResponseEntity.ok(profileService.getPublicWorkerProfile(workerId));
    }
}
