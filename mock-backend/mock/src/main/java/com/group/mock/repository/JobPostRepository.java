package com.group.mock.repository;

import com.group.mock.entity.JobPost;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface JobPostRepository extends JpaRepository<JobPost, UUID> {

    /**
     * Find all job posts created by a specific customer
     */
    @Query("SELECT j FROM JobPost j WHERE j.customer.id = :customerId ORDER BY j.createdAt DESC")
    List<JobPost> findByCustomerId(@Param("customerId") UUID customerId);

    /**
     * Find all open job posts (for discovery/browsing)
     */
    @Query(
            "SELECT j FROM JobPost j WHERE j.status = 'OPEN' AND j.scheduledAt > :now ORDER BY j.scheduledAt ASC")
    List<JobPost> findAllOpenJobPosts(@Param("now") LocalDateTime now);

    /**
     * Find open job posts by job type
     */
    @Query(
            "SELECT j FROM JobPost j WHERE j.status = 'OPEN' AND j.jobType = :jobType AND j.scheduledAt > :now "
                    + "ORDER BY j.scheduledAt ASC")
    List<JobPost> findOpenJobPostsByJobType(@Param("jobType") String jobType, @Param("now") LocalDateTime now);

    @Query(
            "SELECT j FROM JobPost j WHERE j.status = 'OPEN' AND j.scheduledAt < :now "
                    + "AND NOT EXISTS (SELECT 1 FROM JobApplication a WHERE a.jobPost.id = j.id)")
    List<JobPost> findExpiredOpenWithoutApplications(@Param("now") LocalDateTime now);

    /**
     * Find a job post by ID and verify it belongs to the customer
     */
    @Query("SELECT j FROM JobPost j WHERE j.id = :id AND j.customer.id = :customerId")
    Optional<JobPost> findByIdAndCustomerId(@Param("id") UUID id, @Param("customerId") UUID customerId);

    /**
     * Find a job post by ID (basic query)
     */
    Optional<JobPost> findById(UUID id);

    @Query("SELECT j FROM JobPost j JOIN FETCH j.customer WHERE j.id = :id")
    Optional<JobPost> findByIdWithCustomer(@Param("id") UUID id);
}
