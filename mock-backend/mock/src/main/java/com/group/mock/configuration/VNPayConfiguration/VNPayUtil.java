package com.group.mock.configuration.VNPayConfiguration;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import jakarta.servlet.http.HttpServletRequest;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Random;
import java.util.SortedMap;

public class VNPayUtil {

    public static String hmacSHA512(final String key, final String data) {
        try {
            if (key == null || data == null)
                return null;
            final Mac hmac512 = Mac.getInstance("HmacSHA512");
            byte[] hmacKeyBytes = key.getBytes(StandardCharsets.UTF_8);
            final SecretKeySpec secretKey = new SecretKeySpec(hmacKeyBytes, "HmacSHA512");
            hmac512.init(secretKey);
            byte[] dataBytes = data.getBytes(StandardCharsets.UTF_8);
            byte[] result = hmac512.doFinal(dataBytes);
            StringBuilder sb = new StringBuilder(2 * result.length);
            for (byte b : result) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception ex) {
            return "";
        }
    }

    public static String hashAllFields(SortedMap<String, String> fields, String secretKey) {
        StringBuilder sb = new StringBuilder();
        try {
            for (Map.Entry<String, String> entry : fields.entrySet()) {
                String fieldName = entry.getKey();
                String fieldValue = entry.getValue();

                // Chỉ băm các trường có giá trị khác null và không rỗng
                if ((fieldValue != null) && (!fieldValue.isEmpty())) {
                    sb.append(fieldName);
                    sb.append("=");
                    // Sử dụng StandardCharsets.US_ASCII trực tiếp
                    sb.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                    sb.append("&");
                }
            }

            // Xóa bỏ dấu '&' thừa ở cuối cùng nếu chuỗi không rỗng
            if (sb.length() > 0) {
                sb.deleteCharAt(sb.length() - 1);
            }

            return hmacSHA512(secretKey, sb.toString());
        } catch (Exception e) {
            return "";
        }
    }

    public static String getIpAddress(HttpServletRequest request) {
        String ipAddress = request.getHeader("X-Forwarded-For");
        if (ipAddress != null && !ipAddress.isEmpty() && !"unknown".equalsIgnoreCase(ipAddress)) {
            // Lấy IP đầu tiên trong chuỗi nếu có nhiều Proxy
            return ipAddress.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    public static String getRandomNumber(int len) {
        Random rnd = new Random();
        String chars = "0123456789";
        StringBuilder sb = new StringBuilder(len);
        for (int i = 0; i < len; i++) {
            sb.append(chars.charAt(rnd.nextInt(chars.length())));
        }
        return sb.toString();
    }
}