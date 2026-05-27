package com.group.mock.repository;

import com.group.mock.entity.WorkerReview;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface WorkerReviewRepository extends JpaRepository<WorkerReview, Long> {
    List<WorkerReview> findByWorker_IdOrderByCreatedAtDesc(UUID workerId);

    Optional<WorkerReview> findByWorker_IdAndReviewer_Id(UUID workerId, UUID reviewerId);

    boolean existsByWorker_IdAndReviewer_Id(UUID workerId, UUID reviewerId);

    @Query("SELECT COALESCE(AVG(r.rating), 0) FROM WorkerReview r WHERE r.worker.id = :workerId")
    Double findAverageRatingByWorkerId(@Param("workerId") UUID workerId);
}
