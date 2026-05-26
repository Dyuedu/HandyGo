package com.group.mock.controller;

import com.group.mock.entity.JobPost;
import com.group.mock.entity.DTO.request.CreateJobPostRequest;
import com.group.mock.entity.DTO.request.UpdateJobPostRequest;
import com.group.mock.service.JobPostService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/job-posts")
@RequiredArgsConstructor
public class JobPostController {

    private final JobPostService jobPostService;

    /**
     * Create a new job post
     * Requires: ROLE_USER (customer)
     */
    @PostMapping
    public ResponseEntity<JobPost> createJobPost(
            Authentication authentication, @Valid @RequestBody CreateJobPostRequest request) {
        JobPost created = jobPostService.createJobPost(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Get all job posts created by the authenticated user
     * Requires: ROLE_USER (customer)
     */
    @GetMapping("/my-posts")
    public ResponseEntity<List<JobPost>> getMyJobPosts(Authentication authentication) {
        List<JobPost> jobPosts = jobPostService.getMyJobPosts(authentication.getName());
        return ResponseEntity.ok(jobPosts);
    }

    /**
     * Get a specific job post created by the authenticated user
     * Requires: ROLE_USER (customer)
     */
    @GetMapping("/my-posts/{id}")
    public ResponseEntity<JobPost> getMyJobPostById(
            Authentication authentication, @PathVariable("id") UUID id) {
        JobPost jobPost = jobPostService.getMyJobPostById(authentication.getName(), id);
        return ResponseEntity.ok(jobPost);
    }

    /**
     * Update a job post created by the authenticated user
     * Requires: ROLE_USER (customer)
     */
    @PatchMapping("/{id}")
    public ResponseEntity<JobPost> updateJobPost(
            Authentication authentication,
            @PathVariable("id") UUID id,
            @RequestBody UpdateJobPostRequest request) {
        JobPost updated = jobPostService.updateJobPost(authentication.getName(), id, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * Delete a job post created by the authenticated user
     * Requires: ROLE_USER (customer)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteJobPost(Authentication authentication, @PathVariable("id") UUID id) {
        jobPostService.deleteJobPost(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get all open job posts (public endpoint, no auth required)
     * Used for job discovery by workers
     */
    @GetMapping("/discover/open")
    public ResponseEntity<List<JobPost>> getAllOpenJobPosts() {
        List<JobPost> jobPosts = jobPostService.getAllOpenJobPosts();
        return ResponseEntity.ok(jobPosts);
    }

    /**
     * Get open job posts filtered by job type (public endpoint, no auth required)
     * Used for filtered job discovery
     */
    @GetMapping("/discover/by-type")
    public ResponseEntity<List<JobPost>> getOpenJobPostsByJobType(@RequestParam String jobType) {
        List<JobPost> jobPosts = jobPostService.getOpenJobPostsByJobType(jobType);
        return ResponseEntity.ok(jobPosts);
    }

    /**
     * Get a public view of a specific job post (public endpoint, no auth required)
     */
    @GetMapping("/{id}")
    public ResponseEntity<JobPost> getJobPostById(@PathVariable("id") UUID id) {
        JobPost jobPost = jobPostService.getJobPostById(id);
        return ResponseEntity.ok(jobPost);
    }
}
