package com.smartlocker.sms;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

/**
 * Dịch vụ gửi SMS OTP bản dùng thử (hỗ trợ Twilio hoặc eSMS qua biến môi trường .env).
 * Quy tắc PRD: nếu SMS_ENABLED=false hoặc hết hạn mức dùng thử thì chỉ ghi log trạng thái
 * (tuyệt đối không ghi mã OTP ra log) và KHÔNG làm gián đoạn luồng Web/App + Gmail.
 */
@Service
public class SmsService {

    private static final Logger log = LoggerFactory.getLogger(SmsService.class);

    private final RestClient restClient;
    private final boolean enabled;
    private final String provider;
    private final String apiKey;
    private final String apiSecret;
    private final String fromNumber;

    public SmsService(
            @Value("${app.sms.enabled:false}") boolean enabled,
            @Value("${app.sms.provider:twilio}") String provider,
            @Value("${app.sms.api-key:}") String apiKey,
            @Value("${app.sms.api-secret:}") String apiSecret,
            @Value("${app.sms.from:}") String fromNumber
    ) {
        this.restClient = RestClient.create();
        this.enabled = enabled;
        this.provider = provider == null ? "twilio" : provider.trim().toLowerCase();
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.fromNumber = fromNumber;
    }

    /**
     * Trả về true nếu gửi SMS thành công, false nếu đang tắt hoặc gặp lỗi hạn mức dùng thử.
     */
    public boolean sendOtpSms(String toPhone, String messageBody) {
        if (!enabled) {
            log.info("[SMS_ENABLED=false] Bo qua gui SMS toi={}", maskPhone(toPhone));
            return false;
        }
        if (apiKey.isBlank() || apiSecret.isBlank()) {
            log.warn("SMS_ENABLED=true nhung chua dien SMS_API_KEY / SMS_API_SECRET trong .env");
            return false;
        }

        try {
            if ("esms".equals(provider)) {
                sendViaEsms(toPhone, messageBody);
            } else {
                sendViaTwilio(toPhone, messageBody);
            }
            log.info("Da gui SMS thanh cong qua {} toi={}", provider, maskPhone(toPhone));
            return true;
        } catch (Exception ex) {
            log.error("Khong the gui SMS qua {} toi={}: {}", provider, maskPhone(toPhone), ex.getMessage());
            return false;
        }
    }

    private void sendViaTwilio(String toPhone, String body) {
        String normalized = normalizeVietnamPhone(toPhone);
        String basicAuth = Base64.getEncoder()
                .encodeToString((apiKey + ":" + apiSecret).getBytes(StandardCharsets.UTF_8));

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("To", normalized);
        form.add("From", fromNumber);
        form.add("Body", body);

        restClient.post()
                .uri("https://api.twilio.com/2010-04-01/Accounts/" + apiKey + "/Messages.json")
                .header("Authorization", "Basic " + basicAuth)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .toBodilessEntity();
    }

    private void sendViaEsms(String toPhone, String body) {
        String digits = toPhone.replaceAll("\\s+", "");
        restClient.post()
                .uri("https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json/")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of(
                        "ApiKey", apiKey,
                        "SecretKey", apiSecret,
                        "Phone", digits,
                        "Content", body,
                        "SmsType", "8",
                        "Brandname", fromNumber
                ))
                .retrieve()
                .toBodilessEntity();
    }

    private String normalizeVietnamPhone(String phone) {
        String clean = phone.replaceAll("[^0-9+]", "");
        if (clean.startsWith("0")) {
            return "+84" + clean.substring(1);
        }
        return clean;
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) {
            return "***";
        }
        return "***" + phone.substring(phone.length() - 4);
    }
}
