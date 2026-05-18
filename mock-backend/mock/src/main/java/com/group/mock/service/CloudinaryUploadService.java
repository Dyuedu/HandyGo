package com.group.mock.service;

import com.group.mock.configuration.CloudinaryProperties;
import com.group.mock.exception.AuthServiceException;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HexFormat;

@Service
public class CloudinaryUploadService {
    private static final long MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

    private final CloudinaryProperties properties;
    private final RestClient restClient;

    public CloudinaryUploadService(CloudinaryProperties properties) {
        this.properties = properties;
        this.restClient = RestClient.create();
    }

    public String uploadProfessionalCertificate(MultipartFile file) {
        validateFile(file);
        validateConfiguration();

        long timestamp = Instant.now().getEpochSecond();
        String signatureBase = "folder=" + properties.getFolder() + "&timestamp=" + timestamp + properties.getApiSecret();
        String signature = sha1Hex(signatureBase);

        MultipartBodyBuilder bodyBuilder = new MultipartBodyBuilder();
        bodyBuilder.part("file", file.getResource());
        bodyBuilder.part("api_key", properties.getApiKey());
        bodyBuilder.part("timestamp", timestamp);
        bodyBuilder.part("folder", properties.getFolder());
        bodyBuilder.part("signature", signature);

        String uploadUrl = "https://api.cloudinary.com/v1_1/" + properties.getCloudName() + "/auto/upload";
        try {
            CloudinaryUploadResponse response = restClient.post()
                    .uri(uploadUrl)
                    .body(bodyBuilder.build())
                    .retrieve()
                    .body(CloudinaryUploadResponse.class);

            if (response == null || !StringUtils.hasText(response.secure_url())) {
                throw new AuthServiceException(HttpStatus.BAD_GATEWAY, "CERTIFICATE_UPLOAD_FAILED", "Không thể tải chứng chỉ hành nghề");
            }

            return response.secure_url();
        } catch (RuntimeException ex) {
            throw new AuthServiceException(HttpStatus.BAD_GATEWAY, "CERTIFICATE_UPLOAD_FAILED", "Không thể tải chứng chỉ hành nghề");
        }
    }

    private void validateConfiguration() {
        if (!StringUtils.hasText(properties.getCloudName())
                || !StringUtils.hasText(properties.getApiKey())
                || !StringUtils.hasText(properties.getApiSecret())) {
            throw new AuthServiceException(HttpStatus.INTERNAL_SERVER_ERROR, "CLOUDINARY_NOT_CONFIGURED", "Cloudinary chưa được cấu hình");
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AuthServiceException(HttpStatus.BAD_REQUEST, "CERTIFICATE_REQUIRED", "Chứng chỉ hành nghề là bắt buộc");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new AuthServiceException(HttpStatus.BAD_REQUEST, "CERTIFICATE_TOO_LARGE", "Chứng chỉ hành nghề tối đa 10MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !(contentType.equals("application/pdf") || contentType.startsWith("image/"))) {
            throw new AuthServiceException(HttpStatus.BAD_REQUEST, "CERTIFICATE_TYPE_INVALID", "Chứng chỉ hành nghề phải là PDF hoặc ảnh");
        }

        try {
            file.getInputStream().close();
        } catch (IOException ex) {
            throw new AuthServiceException(HttpStatus.BAD_REQUEST, "CERTIFICATE_INVALID", "File chứng chỉ không hợp lệ");
        }
    }

    private String sha1Hex(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-1");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-1 digest is not available", ex);
        }
    }

    private record CloudinaryUploadResponse(String secure_url) {
    }
}
