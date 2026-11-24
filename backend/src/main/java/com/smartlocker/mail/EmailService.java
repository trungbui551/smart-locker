package com.smartlocker.mail;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

/**
 * Dịch vụ gửi Email hỗ trợ 3 chế độ cấu hình qua biến MAIL_MODE trong .env:
 * - "smtp": gửi qua Gmail SMTP (App Password)
 * - "oauth2": gửi qua Google OAuth 2 + Gmail API (tái sử dụng Client ID/Secret/Refresh Token)
 * - "log": chế độ chạy thử local khi chưa điền khóa Gmail (chỉ ghi trạng thái, KHÔNG ghi mã bí mật)
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final RestClient restClient;
    private final String mode;
    private final String fromAddress;
    private final String oauthClientId;
    private final String oauthClientSecret;
    private final String oauthRefreshToken;

    public EmailService(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${app.mail.mode:log}") String mode,
            @Value("${app.mail.from:no-reply@smartlocker.local}") String fromAddress,
            @Value("${app.mail.oauth2.client-id:}") String oauthClientId,
            @Value("${app.mail.oauth2.client-secret:}") String oauthClientSecret,
            @Value("${app.mail.oauth2.refresh-token:}") String oauthRefreshToken
    ) {
        this.mailSenderProvider = mailSenderProvider;
        this.restClient = RestClient.create();
        this.mode = mode == null ? "log" : mode.trim().toLowerCase();
        this.fromAddress = fromAddress;
        this.oauthClientId = oauthClientId;
        this.oauthClientSecret = oauthClientSecret;
        this.oauthRefreshToken = oauthRefreshToken;
    }

    /**
     * Gửi email văn bản thuần. Không làm sập luồng chính nếu gặp lỗi kết nối ngoài.
     */
    public void sendText(String toEmail, String subject, String body) {
        try {
            switch (mode) {
                case "smtp" -> sendViaSmtp(toEmail, subject, body);
                case "oauth2" -> sendViaGmailOAuth2(toEmail, subject, body);
                default -> log.info("[MAIL_MODE=log] Gia lap gui email toi={} | tieuDe={}", toEmail, subject);
            }
        } catch (Exception ex) {
            log.error("Khong the gui email toi={} (mode={}): {}", toEmail, mode, ex.getMessage());
        }
    }

    private void sendViaSmtp(String toEmail, String subject, String body) {
        JavaMailSender sender = mailSenderProvider.getIfAvailable();
        if (sender == null) {
            log.warn("JavaMailSender chua san sang, bo qua gui SMTP toi={}", toEmail);
            return;
        }
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(fromAddress);
        msg.setTo(toEmail);
        msg.setSubject(subject);
        msg.setText(body);
        sender.send(msg);
        log.info("Da gui email thanh cong qua Gmail SMTP toi={}", toEmail);
    }

    @SuppressWarnings("unchecked")
    private void sendViaGmailOAuth2(String toEmail, String subject, String body) {
        if (oauthClientId.isBlank() || oauthClientSecret.isBlank() || oauthRefreshToken.isBlank()) {
            log.warn("MAIL_MODE=oauth2 nhung chua dien du GMAIL_OAUTH_* trong .env");
            return;
        }

        // Bước 1: Đổi refresh_token lấy access_token mới từ Google OAuth 2
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", oauthClientId);
        form.add("client_secret", oauthClientSecret);
        form.add("refresh_token", oauthRefreshToken);
        form.add("grant_type", "refresh_token");

        Map<String, Object> tokenResponse = restClient.post()
                .uri("https://oauth2.googleapis.com/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(Map.class);

        if (tokenResponse == null || tokenResponse.get("access_token") == null) {
            log.error("Google OAuth 2 khong tra ve access_token");
            return;
        }

        String accessToken = tokenResponse.get("access_token").toString();

        // Bước 2: Đóng gói email theo chuẩn MIME UTF-8 và mã hóa Base64URL cho Gmail API
        String encodedSubject = "=?UTF-8?B?"
                + Base64.getEncoder().encodeToString(subject.getBytes(StandardCharsets.UTF_8))
                + "?=";
        String rawMime = "From: " + fromAddress + "\r\n"
                + "To: " + toEmail + "\r\n"
                + "Subject: " + encodedSubject + "\r\n"
                + "Content-Type: text/plain; charset=UTF-8\r\n\r\n"
                + body;
        String base64UrlRaw = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(rawMime.getBytes(StandardCharsets.UTF_8));

        // Bước 3: Gọi Gmail API gửi thư
        restClient.post()
                .uri("https://gmail.googleapis.com/gmail/v1/users/me/messages/send")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("raw", base64UrlRaw))
                .retrieve()
                .toBodilessEntity();

        log.info("Da gui email thanh cong qua Google OAuth 2 (Gmail API) toi={}", toEmail);
    }
}
