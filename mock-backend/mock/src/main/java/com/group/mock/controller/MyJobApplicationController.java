package com.group.mock.controller;

import com.group.mock.entity.DTO.response.JobApplicationResponse;
import com.group.mock.service.JobApplicationService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/workers/me/job-applications")
@RequiredArgsConstructor
public class MyJobApplicationController {

    private final JobApplicationService jobApplicationService;

    @GetMapping
    public ResponseEntity<List<JobApplicationResponse>> myApplications(Authentication authentication) {
        return ResponseEntity.ok(jobApplicationService.listMyApplications(authentication.getName()));
    }
}
