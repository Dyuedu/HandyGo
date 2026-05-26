package com.group.mock.controller;

import com.group.mock.entity.DTO.request.ApplyJobPostRequest;
import com.group.mock.entity.DTO.response.JobApplicationResponse;
import com.group.mock.service.JobApplicationService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/job-posts")
@RequiredArgsConstructor
public class JobApplicationController {

    private final JobApplicationService jobApplicationService;

    @PostMapping("/{jobPostId}/applications")
    public ResponseEntity<JobApplicationResponse> apply(
            Authentication authentication,
            @PathVariable UUID jobPostId,
            @RequestBody(required = false) ApplyJobPostRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(jobApplicationService.apply(authentication.getName(), jobPostId, request));
    }

    @GetMapping("/{jobPostId}/applications")
    public ResponseEntity<List<JobApplicationResponse>> listApplications(
            Authentication authentication, @PathVariable UUID jobPostId) {
        return ResponseEntity.ok(jobApplicationService.listForJobPost(authentication.getName(), jobPostId));
    }

    @GetMapping("/{jobPostId}/applications/me")
    public ResponseEntity<JobApplicationResponse> myApplication(
            Authentication authentication, @PathVariable UUID jobPostId) {
        JobApplicationResponse app =
                jobApplicationService.getMyApplicationForPost(authentication.getName(), jobPostId);
        if (app == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(app);
    }

    @PatchMapping("/{jobPostId}/applications/{applicationId}/accept")
    public ResponseEntity<JobApplicationResponse> accept(
            Authentication authentication,
            @PathVariable UUID jobPostId,
            @PathVariable UUID applicationId) {
        return ResponseEntity.ok(
                jobApplicationService.accept(authentication.getName(), jobPostId, applicationId));
    }

    @PatchMapping("/{jobPostId}/applications/{applicationId}/reject")
    public ResponseEntity<JobApplicationResponse> reject(
            Authentication authentication,
            @PathVariable UUID jobPostId,
            @PathVariable UUID applicationId) {
        return ResponseEntity.ok(
                jobApplicationService.reject(authentication.getName(), jobPostId, applicationId));
    }

}
