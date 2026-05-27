package com.group.mock.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${spring.mail.from:noreply@handygo.com}")
    private String mailFrom;

    /**
     * Gửi email xác thực (OTP) sau khi đăng ký
     */
    @Async
    public void sendVerificationEmail(String to, String otp) {
        try {
            Context context = new Context();
            context.setVariable("otp", otp);
            context.setVariable("expiryMinutes", 15);
            String htmlContent = templateEngine.process("email-verification", context);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailFrom);
            helper.setTo(to);
            helper.setSubject("🔐 Mã xác thực tài khoản HandyGo - 15 phút hết hạn");
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("✓ Đã gửi email xác thực OTP đến: {}", to);
        } catch (MessagingException e) {
            log.error("✗ Lỗi khi gửi email xác thực đến {}: {}", to, e.getMessage(), e);
        } catch (Exception e) {
            log.error("✗ Lỗi không mong đợi khi gửi email xác thực: {}", e.getMessage(), e);
        }
    }

    /**
     * Gửi email chào mừng sau khi xác thực email thành công
     */
    @Async
    public void sendWelcomeEmail(String to, String fullName, String userRole) {
        try {
            Context context = new Context();
            context.setVariable("fullName", fullName);
            context.setVariable("userRole", userRole);
            context.setVariable("appUrl", "http://localhost:3000");
            String htmlContent = templateEngine.process("email-welcome", context);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailFrom);
            helper.setTo(to);
            helper.setSubject("🎉 Chào mừng bạn đến với HandyGo!");
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("✓ Đã gửi email chào mừng đến: {}", to);
        } catch (MessagingException e) {
            log.error("✗ Lỗi khi gửi email chào mừng đến {}: {}", to, e.getMessage(), e);
        } catch (Exception e) {
            log.error("✗ Lỗi không mong đợi khi gửi email chào mừng: {}", e.getMessage(), e);
        }
    }

    /**
     * Gửi email quên mật khẩu (reset password link)
     */
    @Async
    public void sendForgotPasswordEmail(String to, String fullName, String resetToken) {
        try {
            Context context = new Context();
            context.setVariable("fullName", fullName);
            context.setVariable("resetLink", "http://localhost:3000/auth/reset-password?token=" + resetToken);
            context.setVariable("expiryMinutes", 60);
            String htmlContent = templateEngine.process("email-forgot-password", context);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailFrom);
            helper.setTo(to);
            helper.setSubject("🔑 Đặt lại mật khẩu HandyGo");
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("✓ Đã gửi email quên mật khẩu đến: {}", to);
        } catch (MessagingException e) {
            log.error("✗ Lỗi khi gửi email quên mật khẩu đến {}: {}", to, e.getMessage(), e);
        } catch (Exception e) {
            log.error("✗ Lỗi không mong đợi khi gửi email quên mật khẩu: {}", e.getMessage(), e);
        }
    }

    /**
     * Gửi email thông báo booking mới (cho công nhân)
     */
    @Async
    public void sendNewBookingNotificationEmail(String to, String workerName, String jobTitle, String customerName) {
        try {
            Context context = new Context();
            context.setVariable("workerName", workerName);
            context.setVariable("jobTitle", jobTitle);
            context.setVariable("customerName", customerName);
            context.setVariable("appUrl", "http://localhost:3000");
            String htmlContent = templateEngine.process("email-booking-notification", context);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailFrom);
            helper.setTo(to);
            helper.setSubject("📋 Có một bài đơn công việc mới từ " + customerName);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("✓ Đã gửi email thông báo booking đến: {}", to);
        } catch (MessagingException e) {
            log.error("✗ Lỗi khi gửi email booking đến {}: {}", to, e.getMessage(), e);
        } catch (Exception e) {
            log.error("✗ Lỗi không mong đợi khi gửi email booking: {}", e.getMessage(), e);
        }
    }

    /**
     * Gửi email thông báo thanh toán thành công
     */
    @Async
    public void sendPaymentSuccessEmail(String to, String fullName, Long amount, String bookingId) {
        try {
            Context context = new Context();
            context.setVariable("fullName", fullName);
            context.setVariable("amount", String.format("%,d đ", amount));
            context.setVariable("bookingId", bookingId);
            context.setVariable("transactionDate", LocalDateTime.now());
            String htmlContent = templateEngine.process("email-payment-success", context);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailFrom);
            helper.setTo(to);
            helper.setSubject("✓ Thanh toán thành công - HandyGo");
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("✓ Đã gửi email thanh toán thành công đến: {}", to);
        } catch (MessagingException e) {
            log.error("✗ Lỗi khi gửi email thanh toán thành công đến {}: {}", to, e.getMessage(), e);
        } catch (Exception e) {
            log.error("✗ Lỗi không mong đợi khi gửi email thanh toán: {}", e.getMessage(), e);
        }
    }

    /**
     * Gửi email lỗi thanh toán
     */
    @Async
    public void sendPaymentFailureEmail(String to, String fullName, String reason) {
        try {
            Context context = new Context();
            context.setVariable("fullName", fullName);
            context.setVariable("reason", reason);
            context.setVariable("appUrl", "http://localhost:3000");
            String htmlContent = templateEngine.process("email-payment-failure", context);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailFrom);
            helper.setTo(to);
            helper.setSubject("⚠️ Thanh toán không thành công - Vui lòng thử lại");
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("✓ Đã gửi email thanh toán thất bại đến: {}", to);
        } catch (MessagingException e) {
            log.error("✗ Lỗi khi gửi email thanh toán thất bại đến {}: {}", to, e.getMessage(), e);
        } catch (Exception e) {
            log.error("✗ Lỗi không mong đợi khi gửi email thanh toán thất bại: {}", e.getMessage(), e);
        }
    }
}
