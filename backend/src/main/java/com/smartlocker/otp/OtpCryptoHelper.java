package com.smartlocker.otp;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Tiện ích bảo mật cho OTP:
 * - hash(): băm SHA-256 kèm deliveryId + OTP_SECRET để kiểm tra OTP
 * - encrypt()/decrypt(): mã hóa AES-256-GCM để chỉ giải mã cho đúng chủ đơn trên Web/App
 *   mà KHÔNG bao giờ lưu OTP dạng chữ thường trong CSDL.
 */
@Component
public class OtpCryptoHelper {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_BITS = 128;

    private final String secret;
    private final SecretKeySpec aesKey;

    public OtpCryptoHelper(@Value("${app.security.otp-secret}") String secret) {
        this.secret = secret;
        this.aesKey = new SecretKeySpec(sha256Bytes(secret), "AES");
    }

    public String generateSixDigitCode() {
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    public String hash(Long deliveryId, String plainOtp) {
        byte[] digest = sha256Bytes(deliveryId + ":" + plainOtp + ":" + secret);
        return HexFormat.of().formatHex(digest);
    }

    public String encrypt(String plainOtp) {
        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            RANDOM.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, aesKey, new GCMParameterSpec(GCM_TAG_BITS, iv));
            byte[] encrypted = cipher.doFinal(plainOtp.getBytes(StandardCharsets.UTF_8));

            byte[] combined = new byte[iv.length + encrypted.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(encrypted, 0, combined, iv.length, encrypted.length);
            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception ex) {
            throw new IllegalStateException("Lỗi mã hóa OTP", ex);
        }
    }

    public String decrypt(String cipherBase64) {
        if (cipherBase64 == null || cipherBase64.isBlank()) {
            return null;
        }
        try {
            byte[] combined = Base64.getDecoder().decode(cipherBase64);
            byte[] iv = new byte[GCM_IV_LENGTH];
            byte[] encrypted = new byte[combined.length - GCM_IV_LENGTH];
            System.arraycopy(combined, 0, iv, 0, iv.length);
            System.arraycopy(combined, iv.length, encrypted, 0, encrypted.length);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, aesKey, new GCMParameterSpec(GCM_TAG_BITS, iv));
            return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
        } catch (Exception ex) {
            throw new IllegalStateException("Lỗi giải mã OTP", ex);
        }
    }

    private byte[] sha256Bytes(String text) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return md.digest(text.getBytes(StandardCharsets.UTF_8));
        } catch (Exception ex) {
            throw new IllegalStateException("Lỗi khởi tạo SHA-256", ex);
        }
    }
}
