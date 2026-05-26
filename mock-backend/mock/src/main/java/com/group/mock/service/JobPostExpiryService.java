package com.group.mock.service;

import com.group.mock.entity.JobPost;
import com.group.mock.repository.JobPostRepository;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobPostExpiryService {

    private final JobPostRepository jobPostRepository;
    private final NotificationEventPublisher notificationEventPublisher;

    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void cancelExpiredOpenPostsWithoutApplicants() {
        LocalDateTime now = LocalDateTime.now();
        List<JobPost> expired = jobPostRepository.findExpiredOpenWithoutApplications(now);
        if (expired.isEmpty()) {
            return;
        }
        for (JobPost jobPost : expired) {
            jobPost.setStatus("CANCELLED");
            jobPostRepository.save(jobPost);
            if (jobPost.getCustomer() != null) {
                notificationEventPublisher.publishJobPostCancelledNoApplicants(
                        jobPost.getCustomer().getId(),
                        jobPost.getId(),
                        jobPost.getTitle());
            }
        }
        log.info("Auto-cancelled {} job post(s) past scheduled time with no applicants", expired.size());
    }
}
