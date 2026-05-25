package com.group.mock.repository;

import com.group.mock.entity.WorkerProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface WorkerProfileRepository extends JpaRepository<WorkerProfile, UUID> {
    Optional<WorkerProfile> findByAccountUsername(String username);

    java.util.List<WorkerProfile> findByIsVerifiedTrue();
}
