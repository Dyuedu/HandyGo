package com.group.mock.repository;

import com.group.mock.entity.JobApplication;
import com.group.mock.entity.enums.JobApplicationStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface JobApplicationRepository extends JpaRepository<JobApplication, UUID> {

    boolean existsByJobPost_IdAndWorker_Id(UUID jobPostId, UUID workerId);

    Optional<JobApplication> findByJobPost_IdAndWorker_Id(UUID jobPostId, UUID workerId);

    @Query(
            "SELECT a FROM JobApplication a JOIN FETCH a.jobPost JOIN FETCH a.worker "
                    + "WHERE a.jobPost.id = :jobPostId AND a.worker.id = :workerId")
    Optional<JobApplication> findByJobPost_IdAndWorker_IdWithDetails(
            @Param("jobPostId") UUID jobPostId, @Param("workerId") UUID workerId);

    @Query(
            "SELECT a FROM JobApplication a "
                    + "JOIN FETCH a.worker w "
                    + "JOIN FETCH w.account "
                    + "LEFT JOIN FETCH a.jobPost jp "
                    + "LEFT JOIN FETCH jp.customer "
                    + "WHERE a.jobPost.id = :jobPostId ORDER BY a.createdAt DESC")
    List<JobApplication> findByJobPostIdWithWorker(@Param("jobPostId") UUID jobPostId);

    List<JobApplication> findByJobPost_IdAndStatus(UUID jobPostId, JobApplicationStatus status);

    long countByJobPost_IdAndStatus(UUID jobPostId, JobApplicationStatus status);

    @Query(
            "SELECT a FROM JobApplication a "
                    + "JOIN FETCH a.jobPost "
                    + "WHERE a.worker.id = :workerId ORDER BY a.createdAt DESC")
    List<JobApplication> findByWorkerIdWithJobPost(@Param("workerId") UUID workerId);

    void deleteByJobPost_Id(UUID jobPostId);
}
