package com.group.mock.service;

import com.group.mock.entity.JobPost;
import com.group.mock.entity.DTO.request.CreateJobPostRequest;
import com.group.mock.entity.DTO.request.UpdateJobPostRequest;
import java.util.List;
import java.util.UUID;

public interface JobPostService {

    /**
     * Create a new job post for the authenticated user
     */
    JobPost createJobPost(String username, CreateJobPostRequest request);

    /**
     * Get all job posts created by the authenticated user
     */
    List<JobPost> getMyJobPosts(String username);

    /**
     * Get a specific job post by ID (must be owned by authenticated user)
     */
    JobPost getMyJobPostById(String username, UUID jobPostId);

    /**
     * Update a job post (must be owned by authenticated user)
     */
    JobPost updateJobPost(String username, UUID jobPostId, UpdateJobPostRequest request);

    /**
     * Delete a job post (must be owned by authenticated user)
     */
    void deleteJobPost(String username, UUID jobPostId);

    /**
     * Get all open job posts (for discovery/browsing - no auth required)
     */
    List<JobPost> getAllOpenJobPosts();

    /**
     * Get open job posts filtered by job type (for discovery - no auth required)
     */
    List<JobPost> getOpenJobPostsByJobType(String jobType);

    /**
     * Get a public view of a job post (no auth required)
     */
    JobPost getJobPostById(UUID jobPostId);
}
