package com.group.mock.util;

import com.group.mock.entity.JobPost;
import com.group.mock.exception.AuthServiceException;
import java.time.LocalDateTime;
import org.springframework.http.HttpStatus;

public final class JobPostScheduleHelper {

    private JobPostScheduleHelper() {}

    public static void assertScheduledAtValid(LocalDateTime scheduledAt) {
        if (scheduledAt == null) {
            throw new AuthServiceException(
                    HttpStatus.BAD_REQUEST,
                    "JOBPOST_SCHEDULE_REQUIRED",
                    "Vui lòng chọn ngày và giờ hẹn");
        }
        if (scheduledAt.isBefore(LocalDateTime.now())) {
            throw new AuthServiceException(
                    HttpStatus.BAD_REQUEST,
                    "JOBPOST_SCHEDULE_INVALID",
                    "Giờ hẹn không được trước thời gian hiện tại");
        }
    }

    public static boolean isExpired(JobPost jobPost) {
        if (jobPost == null || jobPost.getScheduledAt() == null) {
            return false;
        }
        return jobPost.getScheduledAt().isBefore(LocalDateTime.now());
    }

    public static void assertNotExpired(JobPost jobPost) {
        if (isExpired(jobPost)) {
            throw new AuthServiceException(
                    HttpStatus.GONE,
                    "JOBPOST_EXPIRED",
                    "Đã quá thời gian đặt, không thể đăng ký công việc này");
        }
    }
}
