package com.group.mock.repository;

import com.group.mock.entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface UserProfileRepository extends JpaRepository<UserProfile, UUID> {
    boolean existsByPhone(String phone);

    boolean existsByPhoneAndIdNot(String phone, UUID id);

    java.util.List<UserProfile> findByLatitudeIsNotNullAndLongitudeIsNotNull();
}
