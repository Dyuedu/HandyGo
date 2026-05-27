# 📧 Email Configuration Guide - HandyGo

## Overview

The email system in HandyGo is configured to send emails via Gmail SMTP. This guide walks you through setting up email functionality.

## Prerequisites

1. **Gmail Account** - You need a Gmail account to send emails
2. **App Password** - Gmail requires an app-specific password (not your regular Gmail password)
3. **Spring Boot Backend** - The backend is already configured with Spring Mail

## Step-by-Step Setup

### 1. Create Gmail App Password

Gmail no longer allows using your regular password for third-party applications. You must create an **App Password**:

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** (if not already enabled)
3. Navigate to **App passwords**
4. Select:
   - App: **Mail**
   - Device: **Windows PC** (or your device type)
5. Generate the app password
6. Copy the generated 16-character password

**Important:** This password is different from your Gmail login password.

### 2. Configure Environment Variables

#### Option A: Using .env file (Local Development)

Create a `.env.local` file in `mock-backend/` directory:

```bash
# Email Configuration
SPRING_MAIL_HOST=smtp.gmail.com
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=your-email@gmail.com
SPRING_MAIL_PASSWORD=your-app-specific-password-16-chars
SPRING_MAIL_FROM=noreply@handygo.com
```

#### Option B: Using System Environment Variables

Set environment variables on your system:

```bash
# Windows (PowerShell)
$env:SPRING_MAIL_USERNAME="your-email@gmail.com"
$env:SPRING_MAIL_PASSWORD="your-app-specific-password"

# Linux/Mac (bash)
export SPRING_MAIL_USERNAME="your-email@gmail.com"
export SPRING_MAIL_PASSWORD="your-app-specific-password"
```

#### Option C: Using Docker Compose

Update `docker-compose.yml`:

```yaml
services:
  backend:
    environment:
      - SPRING_MAIL_HOST=smtp.gmail.com
      - SPRING_MAIL_PORT=587
      - SPRING_MAIL_USERNAME=your-email@gmail.com
      - SPRING_MAIL_PASSWORD=your-app-specific-password
```

### 3. Verify Configuration

The configuration is now set in `application.yml`:

```yaml
spring:
  mail:
    host: ${SPRING_MAIL_HOST:smtp.gmail.com}
    port: ${SPRING_MAIL_PORT:587}
    username: ${SPRING_MAIL_USERNAME:}
    password: ${SPRING_MAIL_PASSWORD:}
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
            required: true
          connectiontimeout: 5000
          timeout: 5000
          writetimeout: 5000
          starttls-fallback: false
```

## Email Templates

The system includes professional HTML email templates for various events:

### 1. **Email Verification** (`email-verification.html`)
- Sent during user registration
- Contains 6-digit OTP code
- Valid for **15 minutes**
- Languages: Vietnamese

### 2. **Welcome Email** (`email-welcome.html`)
- Sent after successful email verification
- Contains next steps for WORKER and USER roles
- Includes platform benefits
- Languages: Vietnamese

### 3. **Forgot Password** (`email-forgot-password.html`)
- Sent when user requests password reset
- Contains secure reset link
- Valid for **60 minutes**
- Languages: Vietnamese

### 4. **Payment Success** (`email-payment-success.html`)
- Sent after successful payment
- Contains transaction details and receipt
- Shows booking ID and transaction amount
- Languages: Vietnamese

### 5. **Payment Failure** (`email-payment-failure.html`)
- Sent when payment fails
- Contains failure reason and troubleshooting steps
- Includes support contact information
- Languages: Vietnamese

### 6. **Booking Notification** (`email-booking-notification.html`)
- Sent to workers when new job matches their skills
- Contains job details and customer information
- Includes tips to increase chances of being selected
- Languages: Vietnamese

## Email Service Methods

The `EmailService` class provides async methods:

```java
// Send OTP verification email
emailService.sendVerificationEmail(email, otp);

// Send welcome email after verification
emailService.sendWelcomeEmail(email, fullName, userRole);

// Send password reset email
emailService.sendForgotPasswordEmail(email, fullName, resetToken);

// Send booking notification to worker
emailService.sendNewBookingNotificationEmail(email, workerName, jobTitle, customerName);

// Send payment success notification
emailService.sendPaymentSuccessEmail(email, fullName, amount, bookingId);

// Send payment failure notification
emailService.sendPaymentFailureEmail(email, fullName, reason);
```

All methods are **asynchronous** (marked with `@Async`), so they don't block the request.

## Email Specifications

| Email Type | Trigger | TTL | Template | Status |
|-----------|---------|-----|----------|--------|
| OTP Verification | User Registration | 15 min | ✅ Done | Production |
| Welcome | Email Verified | - | ✅ Done | Production |
| Forgot Password | Password Reset Request | 60 min | ✅ Done | Ready |
| Booking Notification | New Job Match | - | ✅ Done | Ready |
| Payment Success | Payment Completed | - | ✅ Done | Ready |
| Payment Failure | Payment Failed | - | ✅ Done | Ready |

## Testing Email Sending

### Test via API

```bash
# Register a new user (this will send OTP email)
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "your-email@gmail.com",
    "password": "Password@123",
    "role": "USER",
    "fullName": "Test User",
    "phone": "0123456789"
  }'
```

### Expected Flow

1. ✅ OTP email is sent to the provided email
2. ✅ Email appears in inbox within 1-2 seconds
3. ✅ Contains 6-digit code and 15-minute timer
4. Use the OTP to verify email:
   ```bash
   curl -X POST http://localhost:8080/api/auth/verify-email \
     -H "Content-Type: application/json" \
     -d '{
       "email": "your-email@gmail.com",
       "otp": "123456"
     }'
   ```
5. ✅ Welcome email is sent upon successful verification

## Troubleshooting

### Issue: "No username/password provided"
- **Cause:** Environment variables not set
- **Solution:** Check `.env.local` or system environment variables
- **Verify:** `echo $SPRING_MAIL_USERNAME` (Linux/Mac) or `echo $env:SPRING_MAIL_USERNAME` (Windows)

### Issue: "Connection timeout"
- **Cause:** Network or firewall blocking port 587
- **Solution:** 
  - Check internet connection
  - Allow firewall access to SMTP connections
  - Try port 465 (SSL) instead of 587 (TLS)

### Issue: "Authentication failed"
- **Cause:** Wrong app password or non-app password used
- **Solution:**
  - Verify you're using 16-character app password (not Gmail password)
  - Generate a new app password from Google Account
  - Ensure 2-Step Verification is enabled

### Issue: "Email not received"
- **Cause:** Email blocked by Gmail or spam filter
- **Solution:**
  - Check Spam/Junk folder
  - Add `noreply@handygo.com` to contacts
  - Check Gmail filter settings

### Issue: Application starts but emails don't send (no error logs)
- **Cause:** Async method not called or @EnableAsync missing
- **Solution:**
  - Verify `@Async` annotation on email methods
  - Check if Spring Mail beans are properly initialized
  - Look for `INFO: ✓ Đã gửi email...` logs

## Monitoring & Logging

The EmailService logs all email operations:

```
✓ Đã gửi email xác thực OTP đến: user@example.com
✓ Đã gửi email chào mừng đến: user@example.com
✓ Đã gửi email quên mật khẩu đến: user@example.com
✗ Lỗi khi gửi email...
```

Check application logs (usually in `target/logs/`) for email status.

## Security Considerations

1. ✅ **Never commit credentials** - Use environment variables
2. ✅ **Use App Password** - Not your Gmail password
3. ✅ **Enable 2FA** - Required for App Password generation
4. ✅ **Change "from" address** - Update `SPRING_MAIL_FROM` for production
5. ✅ **Rate limiting** - Implement resend limits (max 3 per hour)
6. ✅ **OTP expiry** - Currently 15 minutes per specification

## Next Steps

1. ✅ Configure environment variables (this document)
2. ✅ Test email sending with registration endpoint
3. Next: Implement rate limiting for resend requests
4. Next: Add password reset feature
5. Next: Integrate booking and payment notifications

## Support

For issues or questions:
- 📧 Email: support@handygo.com
- 📝 Documentation: See `NOTIFICATION_IMPLEMENTATION.md`
- 🔧 Configuration: Check `application.yml`

---

**Last Updated:** 2026-01-XX  
**Version:** 1.0  
**Status:** Production Ready
