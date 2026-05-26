package com.group.mock.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Async
    public void sendVerificationEmail(String to, String otp) {
        try {
            Context context = new Context();
            context.setVariable("otp", otp);
            String htmlContent = templateEngine.process("email-verification", context);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject("Mã xác thực tài khoản HandyGo");
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Đã gửi email xác thực đến {}", to);
        } catch (MessagingException e) {
            log.error("Lỗi khi gửi email xác thực đến " + to, e);
        }
    }
}
