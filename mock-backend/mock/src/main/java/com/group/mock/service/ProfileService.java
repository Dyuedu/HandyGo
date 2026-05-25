package com.group.mock.service;

import com.group.mock.entity.DTO.request.UpdateProfileRequest;
import com.group.mock.entity.DTO.request.UpdateWorkerProfileRequest;
import com.group.mock.entity.DTO.response.MyProfileResponse;
import com.group.mock.entity.DTO.response.PublicWorkerProfileResponse;
import java.util.UUID;

public interface ProfileService {

    MyProfileResponse getMyProfile(String username);

    MyProfileResponse updateMyProfile(String username, UpdateProfileRequest request);

    MyProfileResponse updateMyWorkerProfile(String username, UpdateWorkerProfileRequest request);

    PublicWorkerProfileResponse getPublicWorkerProfile(UUID workerId, String viewerUsername);
}
