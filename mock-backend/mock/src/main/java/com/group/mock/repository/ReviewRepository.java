package com.group.mock.repository;

import com.group.mock.entity.Review;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    Optional<Review> findByBooking_Id(UUID bookingId);

    boolean existsByBooking_Id(UUID bookingId);

    @Query("SELECT COALESCE(AVG(r.rating), 0) FROM Review r WHERE r.booking.worker.id = :workerId")
    Double findAverageRatingByWorkerId(@Param("workerId") UUID workerId);
}
