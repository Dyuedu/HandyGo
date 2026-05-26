package com.group.mock.service;

import com.group.mock.entity.DTO.request.ApplyJobPostRequest;
import com.group.mock.entity.DTO.response.JobApplicationResponse;
import java.util.List;
import java.util.UUID;

public interface JobApplicationService {

    JobApplicationResponse apply(String username, UUID jobPostId, ApplyJobPostRequest request);

    List<JobApplicationResponse> listForJobPost(String username, UUID jobPostId);

    List<JobApplicationResponse> listMyApplications(String username);

    JobApplicationResponse accept(String username, UUID jobPostId, UUID applicationId);

    JobApplicationResponse reject(String username, UUID jobPostId, UUID applicationId);

    JobApplicationResponse getMyApplicationForPost(String username, UUID jobPostId);
}
