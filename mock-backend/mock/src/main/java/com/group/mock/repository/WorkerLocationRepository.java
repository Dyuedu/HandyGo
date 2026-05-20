package com.group.mock.repository;

import com.group.mock.entity.WorkerLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface WorkerLocationRepository extends JpaRepository<WorkerLocation, UUID> {
}
