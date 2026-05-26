package com.group.mock.controller;

import com.group.mock.entity.Account;
import com.group.mock.entity.UserProfile;
import com.group.mock.entity.DTO.request.UpdateLocationRequest;
import com.group.mock.entity.DTO.request.UpdateWorkerAvailabilityRequest;
import com.group.mock.entity.DTO.response.UserLocationResponse;
import com.group.mock.entity.enums.BookingStatus;
import com.group.mock.entity.enums.Status;
import com.group.mock.repository.AccountRepository;
import com.group.mock.repository.BookingRepository;
import com.group.mock.repository.UserProfileRepository;
import com.group.mock.repository.WorkerProfileRepository;
import com.group.mock.repository.WorkerLocationRepository;
import com.group.mock.entity.WorkerProfile;
import com.group.mock.entity.WorkerLocation;
import com.group.mock.exception.AuthServiceException;
import java.time.LocalDateTime;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
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
    private static final List<BookingStatus> BUSY_STATUSES = List.of(
            BookingStatus.ACCEPTED,
            BookingStatus.PROCESSING,
            BookingStatus.WAITING_CUSTOMER_CONFIRMATION
    );

    private final AccountRepository accountRepository;
    private final UserProfileRepository userProfileRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final WorkerLocationRepository workerLocationRepository;
    private final BookingRepository bookingRepository;

    @Value("${app.location.worker-online-window-minutes:15}")
    private long workerOnlineWindowMinutes;

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
                        newLoc.setAvailable(true);
                        return newLoc;
                    });
            workerLoc.setLatitude(request.getLatitude());
            workerLoc.setLongitude(request.getLongitude());
            workerLoc.setLastUpdate(LocalDateTime.now());
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
                jobType,
                null,
                null,
                null,
                null,
                null,
                null
        );

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/worker/availability")
    @Transactional
    public ResponseEntity<UserLocationResponse> updateWorkerAvailability(
            Authentication authentication,
            @Valid @RequestBody UpdateWorkerAvailabilityRequest request) {
        if (authentication == null) {
            throw new AuthServiceException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Bạn cần đăng nhập để cập nhật trạng thái nhận việc");
        }

        Account account = accountRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new AuthServiceException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Không tìm thấy tài khoản người dùng"));

        String roleName = account.getRole() != null ? account.getRole().getName() : "ROLE_USER";
        if (!"ROLE_WORKER".equals(roleName)) {
            throw new AuthServiceException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Chỉ tài khoản thợ mới có thể cập nhật trạng thái nhận việc");
        }

        WorkerProfile workerProfile = workerProfileRepository.findById(account.getId())
                .orElseThrow(() -> new AuthServiceException(HttpStatus.NOT_FOUND, "WORKER_PROFILE_NOT_FOUND", "Không tìm thấy hồ sơ thợ"));
        WorkerLocation workerLocation = workerLocationRepository.findById(account.getId())
                .orElseThrow(() -> new AuthServiceException(HttpStatus.BAD_REQUEST, "LOCATION_REQUIRED", "Vui lòng cập nhật vị trí trước khi bật nhận việc"));

        workerLocation.setAvailable(Boolean.TRUE.equals(request.getAvailable()));
        workerLocationRepository.save(workerLocation);

        UserProfile profile = userProfileRepository.findById(account.getId()).orElse(null);
        boolean busy = isWorkerBusy(workerProfile.getId());
        boolean active = account.getStatus() == Status.ACTIVE;
        boolean online = isLocationFresh(workerLocation);
        boolean verified = workerProfile.isVerified();
        boolean eligible = active && verified && workerLocation.isAvailable() && online && !busy;

        return ResponseEntity.ok(new UserLocationResponse(
                workerProfile.getId(),
                profile != null ? profile.getFullName() : account.getUsername(),
                profile != null ? profile.getPhone() : null,
                "TECHNICIAN",
                workerLocation.getLatitude(),
                workerLocation.getLongitude(),
                workerProfile.getJobType(),
                workerLocation.isAvailable(),
                online,
                busy,
                eligible,
                verified,
                workerLocation.getLastUpdate()
        ));
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
                    
                    boolean active = acc == null || acc.getStatus() == Status.ACTIVE;
                    boolean manuallyAvailable = wl != null && wl.isAvailable();
                    boolean online = isLocationFresh(wl);
                    boolean busy = isWorkerBusy(wp.getId());
                    boolean verified = wp.isVerified();
                    boolean eligible = active && verified && manuallyAvailable && online && !busy;
                    boolean isCurrentWorker = authentication.getName().equals(acc != null ? acc.getUsername() : null);

                    if (!eligible && !isCurrentWorker) {
                        return null;
                    }

                    return new UserLocationResponse(
                            wp.getId(),
                            fullName,
                            phone,
                            "TECHNICIAN",
                            lat,
                            lng,
                            wp.getJobType(),
                            manuallyAvailable,
                            online,
                            busy,
                            eligible,
                            verified,
                            wl != null ? wl.getLastUpdate() : null
                    );
                })
                .filter(java.util.Objects::nonNull)
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

    private boolean isWorkerBusy(java.util.UUID workerId) {
        return bookingRepository.existsByWorker_IdAndStatusIn(workerId, BUSY_STATUSES);
    }

    private boolean isLocationFresh(WorkerLocation workerLocation) {
        if (workerLocation == null || workerLocation.getLastUpdate() == null) {
            return false;
        }
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(workerOnlineWindowMinutes);
        return !workerLocation.getLastUpdate().isBefore(threshold);
    }
}
