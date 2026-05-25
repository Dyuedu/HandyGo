package com.group.mock.controller;

import com.group.mock.entity.Account;
import com.group.mock.entity.UserProfile;
import com.group.mock.entity.DTO.request.UpdateLocationRequest;
import com.group.mock.entity.DTO.response.UserLocationResponse;
import com.group.mock.repository.AccountRepository;
import com.group.mock.repository.UserProfileRepository;
import com.group.mock.repository.WorkerProfileRepository;
import com.group.mock.repository.WorkerLocationRepository;
import com.group.mock.entity.WorkerProfile;
import com.group.mock.entity.WorkerLocation;
import com.group.mock.exception.AuthServiceException;
import java.time.LocalDateTime;
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
    private final WorkerProfileRepository workerProfileRepository;
    private final WorkerLocationRepository workerLocationRepository;

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
                .orElseGet(() -> {
                    UserProfile newProfile = new UserProfile();
                    newProfile.setAccount(account);
                    newProfile.setFullName(account.getUsername() != null ? account.getUsername() : "Người dùng");
                    newProfile.setCreatedAt(LocalDateTime.now());
                    return newProfile;
                });

        profile.setLatitude(request.getLatitude());
        profile.setLongitude(request.getLongitude());
        UserProfile savedProfile = userProfileRepository.save(profile);

        String roleName = account.getRole() != null ? account.getRole().getName() : "ROLE_USER";
        String jobType = null;
        if ("ROLE_WORKER".equals(roleName)) {
            WorkerProfile workerProfile = workerProfileRepository.findById(account.getId())
                    .orElseThrow(() -> new AuthServiceException(HttpStatus.NOT_FOUND, "WORKER_PROFILE_NOT_FOUND", "Không tìm thấy hồ sơ thợ"));
            
            WorkerLocation workerLoc = workerLocationRepository.findById(account.getId())
                    .orElseGet(() -> {
                        WorkerLocation newLoc = new WorkerLocation();
                        newLoc.setWorkerProfile(workerProfile);
                        return newLoc;
                    });
            workerLoc.setLatitude(request.getLatitude());
            workerLoc.setLongitude(request.getLongitude());
            workerLoc.setLastUpdate(LocalDateTime.now());
            workerLoc.setAvailable(true);
            workerLocationRepository.save(workerLoc);
            
            jobType = workerProfile.getJobType();
        }

        UserLocationResponse response = new UserLocationResponse(
                savedProfile.getId(),
                savedProfile.getFullName(),
                savedProfile.getPhone(),
                mapRole(roleName),
                savedProfile.getLatitude(),
                savedProfile.getLongitude(),
                jobType
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/locations")
    public ResponseEntity<List<UserLocationResponse>> getUserLocations(Authentication authentication) {
        if (authentication == null) {
            throw new AuthServiceException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Bạn cần đăng nhập để xem danh sách tọa độ");
        }

        // Collect worker IDs to avoid duplicates later
        java.util.Set<java.util.UUID> workerIds = new java.util.HashSet<>();

        // Fetch ALL worker profiles (not just those with worker_locations)
        List<WorkerProfile> allWorkers = workerProfileRepository.findAll();
        List<java.util.UUID> workerIdsList = allWorkers.stream().map(WorkerProfile::getId).collect(Collectors.toList());
        
        java.util.Map<java.util.UUID, UserProfile> upMap = userProfileRepository.findAllById(workerIdsList).stream()
                .collect(Collectors.toMap(UserProfile::getId, up -> up));
        
        java.util.Map<java.util.UUID, WorkerLocation> wlMap = workerLocationRepository.findAllById(workerIdsList).stream()
                .collect(Collectors.toMap(WorkerLocation::getWorkerId, wl -> wl));

        List<UserLocationResponse> workerResponses = allWorkers.stream()
                .map(wp -> {
                    workerIds.add(wp.getId());
                    Account acc = wp.getAccount();
                    UserProfile up = upMap.get(wp.getId());
                    
                    // Try worker_locations first for real-time location
                    WorkerLocation wl = wlMap.get(wp.getId());
                    
                    Double lat = null;
                    Double lng = null;
                    
                    if (wl != null && wl.getLatitude() != null && wl.getLongitude() != null) {
                        // Use worker_locations (real-time tracking)
                        lat = wl.getLatitude();
                        lng = wl.getLongitude();
                    } else if (up != null && up.getLatitude() != null && up.getLongitude() != null) {
                        // Fallback to user_profile location
                        lat = up.getLatitude();
                        lng = up.getLongitude();
                    }
                    
                    String fullName = up != null ? up.getFullName() : (acc != null ? acc.getUsername() : "Thợ sửa chữa");
                    String phone = up != null ? up.getPhone() : null;
                    
                    return new UserLocationResponse(
                            wp.getId(),
                            fullName,
                            phone,
                            "TECHNICIAN",
                            lat,
                            lng,
                            wp.getJobType()
                    );
                })
                .collect(Collectors.toList());

        // Fetch non-worker user profiles (filtering out workers to avoid duplicates)
        List<UserProfile> profiles = userProfileRepository.findByLatitudeIsNotNullAndLongitudeIsNotNull();
        List<UserLocationResponse> userResponses = profiles.stream()
                .filter(p -> !workerIds.contains(p.getId()))
                .map(profile -> {
                    String roleName = profile.getAccount() != null && profile.getAccount().getRole() != null 
                            ? profile.getAccount().getRole().getName() 
                            : "ROLE_USER";
                    return new UserLocationResponse(
                            profile.getId(),
                            profile.getFullName(),
                            profile.getPhone(),
                            mapRole(roleName),
                            profile.getLatitude(),
                            profile.getLongitude(),
                            null
                    );
                })
                .collect(Collectors.toList());

        // Combine both lists
        workerResponses.addAll(userResponses);

        return ResponseEntity.ok(workerResponses);
    }

    private String mapRole(String rawRole) {
        if ("ROLE_WORKER".equals(rawRole)) {
            return "TECHNICIAN";
        } else if (rawRole != null) {
            return rawRole.replaceFirst("^ROLE_", "");
        }
        return "USER";
    }
}
