package com.group.mock.service;

import io.nayuki.qrcodegen.QrCode;
import io.nayuki.qrcodegen.QrSegment;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import javax.imageio.ImageIO;
import org.springframework.stereotype.Service;

@Service
public class VietQrService {
    private static final String VIETQR_GUID = "A000000727";
    private static final String VIETQR_SERVICE_CODE = "QRIBFTTA";

    public String buildPayload(
            String bankBin,
            String accountNo,
            String accountName,
            BigDecimal amount,
            String transferContent) {
        String cleanBankBin = digitsOnly(bankBin);
        String cleanAccountNo = digitsOnly(accountNo);
        String normalizedName = normalizeText(accountName, 25);
        String normalizedContent = normalizeText(transferContent, 99);

        String beneficiaryOrg = tlv("00", cleanBankBin) + tlv("01", cleanAccountNo);
        String consumerAccountInfo = tlv("00", VIETQR_GUID)
                + tlv("01", beneficiaryOrg)
                + tlv("02", VIETQR_SERVICE_CODE);
        String additionalData = tlv("08", normalizedContent);

        String withoutCrc = tlv("00", "01")
                + tlv("01", "12")
                + tlv("38", consumerAccountInfo)
                + tlv("53", "704")
                + tlv("54", toQrAmount(amount))
                + tlv("58", "VN")
                + tlv("59", normalizedName)
                + tlv("60", "VN")
                + tlv("62", additionalData)
                + "6304";

        return withoutCrc + crc16Ccitt(withoutCrc);
    }

    public String renderPngDataUrl(String payload) {
        try {
            QrCode qr = QrCode.encodeSegments(
                    List.of(QrSegment.makeBytes(payload.getBytes(StandardCharsets.UTF_8))),
                    QrCode.Ecc.MEDIUM);
            BufferedImage image = toImage(qr, 8, 4);
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            ImageIO.write(image, "png", output);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(output.toByteArray());
        } catch (Exception ex) {
            throw new IllegalStateException("Could not render VietQR image", ex);
        }
    }

    private BufferedImage toImage(QrCode qr, int scale, int border) {
        int size = (qr.size + border * 2) * scale;
        BufferedImage image = new BufferedImage(size, size, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = image.createGraphics();
        graphics.setColor(Color.WHITE);
        graphics.fillRect(0, 0, size, size);
        graphics.setColor(Color.BLACK);
        for (int y = 0; y < qr.size; y++) {
            for (int x = 0; x < qr.size; x++) {
                if (qr.getModule(x, y)) {
                    graphics.fillRect((x + border) * scale, (y + border) * scale, scale, scale);
                }
            }
        }
        graphics.dispose();
        return image;
    }

    private String tlv(String id, String value) {
        if (value == null) {
            value = "";
        }
        int length = value.getBytes(StandardCharsets.UTF_8).length;
        if (length > 99) {
            throw new IllegalArgumentException("VietQR field is too long");
        }
        return id + String.format("%02d", length) + value;
    }

    private String digitsOnly(String value) {
        if (value == null) {
            return "";
        }
        return value.replaceAll("\\D", "");
    }

    private String normalizeText(String value, int maxLength) {
        String normalized = Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace('Đ', 'D')
                .replace('đ', 'd')
                .replaceAll("[^A-Za-z0-9 ._-]", " ")
                .replaceAll("\\s+", " ")
                .trim()
                .toUpperCase(Locale.ROOT);
        return normalized.length() <= maxLength ? normalized : normalized.substring(0, maxLength);
    }

    private String toQrAmount(BigDecimal amount) {
        return amount.stripTrailingZeros().toPlainString();
    }

    private String crc16Ccitt(String value) {
        int crc = 0xFFFF;
        byte[] bytes = value.getBytes(StandardCharsets.US_ASCII);
        for (byte b : bytes) {
            crc ^= (b & 0xFF) << 8;
            for (int i = 0; i < 8; i++) {
                if ((crc & 0x8000) != 0) {
                    crc = (crc << 1) ^ 0x1021;
                } else {
                    crc <<= 1;
                }
                crc &= 0xFFFF;
            }
        }
        return String.format("%04X", crc);
    }
}
