package com.smartlocker;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartlocker.audit.AuditEventRepository;
import com.smartlocker.delivery.Delivery;
import com.smartlocker.delivery.DeliveryExpiryScheduler;
import com.smartlocker.delivery.DeliveryRepository;
import com.smartlocker.delivery.DeliveryStatus;
import com.smartlocker.otp.OtpCode;
import com.smartlocker.otp.OtpCodeRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Bộ kiểm thử M3:
 * - Sinh OTP khi đơn READY, không lưu chữ thường trong CSDL và không ghi vào nhật ký
 * - OTP đúng mở được 1 lần; dùng lại bị từ chối
 * - Nhập sai 3 lần tự khóa đơn; xin cấp lại mở khóa & cấp mã mới
 * - OTP quá hạn 24h bị từ chối
 * - Đơn READY quá 72 giờ tự chuyển EXPIRED qua DeliveryExpiryScheduler
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OtpAndExpiryTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private OtpCodeRepository otpCodeRepository;

    @Autowired
    private DeliveryRepository deliveryRepository;

    @Autowired
    private AuditEventRepository auditEventRepository;

    @Autowired
    private DeliveryExpiryScheduler expiryScheduler;

    @Test
    void otpWorksOnceNeverStoredPlaintextAndRejectsReuse() throws Exception {
        String courierToken = login("courier", "Locker@123");
        String recipientToken = login("recipient", "Locker@123");

        long deliveryId = createAndMarkReady(courierToken, "L02", "SMALL");

        // Chủ đơn xem được mã OTP trên Web/App
        MvcResult otpRes = mockMvc.perform(get("/api/deliveries/" + deliveryId + "/otp")
                        .header("Authorization", "Bearer " + recipientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.otpCode").isNotEmpty())
                .andReturn();
        String plainOtp = objectMapper.readTree(otpRes.getResponse().getContentAsString()).get("otpCode").asText();
        assertThat(plainOtp).matches("^\\d{6}$");

        // Kiểm tra CSDL và nhật ký KHÔNG chứa OTP chữ thường
        OtpCode stored = otpCodeRepository.findByDeliveryId(deliveryId).orElseThrow();
        assertThat(stored.getCodeHash()).doesNotContain(plainOtp);
        assertThat(stored.getCodeEncrypted()).doesNotContain(plainOtp);
        assertThat(auditEventRepository.findAll())
                .noneMatch(e -> e.getDetail() != null && e.getDetail().contains(plainOtp));

        // Nhập đúng OTP -> thành công
        mockMvc.perform(post("/api/deliveries/" + deliveryId + "/otp/verify")
                        .header("Authorization", "Bearer " + recipientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"" + plainOtp + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verified").value(true));

        // Dùng lại lần 2 -> bị từ chối
        mockMvc.perform(post("/api/deliveries/" + deliveryId + "/otp/verify")
                        .header("Authorization", "Bearer " + recipientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"" + plainOtp + "\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void threeWrongAttemptsLockOrderAndResendUnlocksWithFreshOtp() throws Exception {
        String courierToken = login("courier", "Locker@123");
        String recipientToken = login("recipient", "Locker@123");
        String operatorToken = login("operator", "Locker@123");

        long deliveryId = createAndMarkReady(courierToken, "L02", "MEDIUM");

        MvcResult otpRes = mockMvc.perform(get("/api/deliveries/" + deliveryId + "/otp")
                        .header("Authorization", "Bearer " + recipientToken))
                .andExpect(status().isOk())
                .andReturn();
        String firstOtp = objectMapper.readTree(otpRes.getResponse().getContentAsString()).get("otpCode").asText();
        String wrongOtp = firstOtp.equals("000000") ? "111111" : "000000";

        // Nhập sai 3 lần liên tiếp -> khóa đơn
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/api/deliveries/" + deliveryId + "/otp/verify")
                            .header("Authorization", "Bearer " + recipientToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"code\":\"" + wrongOtp + "\"}"))
                    .andExpect(status().isBadRequest());
        }

        // Sau khi khóa, nhập lại mã đúng cũ cũng phải bị từ chối
        mockMvc.perform(post("/api/deliveries/" + deliveryId + "/otp/verify")
                        .header("Authorization", "Bearer " + recipientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"" + firstOtp + "\"}"))
                .andExpect(status().isBadRequest());

        // Nhân viên vận hành hỗ trợ cấp lại OTP mới -> mở khóa thành công
        mockMvc.perform(post("/api/deliveries/" + deliveryId + "/otp/resend")
                        .header("Authorization", "Bearer " + operatorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.locked").value(false))
                .andExpect(jsonPath("$.resendCount").value(1));

        // Người nhận lấy mã mới và xác thực thành công
        MvcResult newOtpRes = mockMvc.perform(get("/api/deliveries/" + deliveryId + "/otp")
                        .header("Authorization", "Bearer " + recipientToken))
                .andExpect(status().isOk())
                .andReturn();
        String secondOtp = objectMapper.readTree(newOtpRes.getResponse().getContentAsString()).get("otpCode").asText();

        mockMvc.perform(post("/api/deliveries/" + deliveryId + "/otp/verify")
                        .header("Authorization", "Bearer " + recipientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"" + secondOtp + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verified").value(true));
    }

    @Test
    void expiredOtpIsRejectedAndOverdue72hDeliveryBecomesExpired() throws Exception {
        String courierToken = login("courier", "Locker@123");
        String recipientToken = login("recipient", "Locker@123");

        long deliveryId = createAndMarkReady(courierToken, "L02", "LARGE");

        // Lấy mã rồi đẩy thời hạn OTP về quá khứ 1 giờ -> bị từ chối
        MvcResult otpRes = mockMvc.perform(get("/api/deliveries/" + deliveryId + "/otp")
                        .header("Authorization", "Bearer " + recipientToken))
                .andExpect(status().isOk())
                .andReturn();
        String otp = objectMapper.readTree(otpRes.getResponse().getContentAsString()).get("otpCode").asText();

        OtpCode storedOtp = otpCodeRepository.findByDeliveryId(deliveryId).orElseThrow();
        storedOtp.setExpiresAt(Instant.now().minus(1, ChronoUnit.HOURS));
        otpCodeRepository.save(storedOtp);

        mockMvc.perform(post("/api/deliveries/" + deliveryId + "/otp/verify")
                        .header("Authorization", "Bearer " + recipientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"" + otp + "\"}"))
                .andExpect(status().isBadRequest());

        // Đẩy hạn lưu hàng của đơn về quá 72 giờ và chạy tác vụ định kỳ -> chuyển EXPIRED
        Delivery delivery = deliveryRepository.findById(deliveryId).orElseThrow();
        delivery.setExpiresAt(Instant.now().minus(1, ChronoUnit.HOURS));
        deliveryRepository.save(delivery);

        int expiredCount = expiryScheduler.expireOverdueDeliveries();
        assertThat(expiredCount).isGreaterThanOrEqualTo(1);
        assertThat(deliveryRepository.findById(deliveryId).orElseThrow().getStatus())
                .isEqualTo(DeliveryStatus.EXPIRED);
    }

    private long createAndMarkReady(String courierToken, String lockerId, String size) throws Exception {
        MvcResult created = mockMvc.perform(post("/api/deliveries")
                        .header("Authorization", "Bearer " + courierToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lockerId\":\"" + lockerId + "\",\"recipientIdentifier\":\"recipient\",\"packageSize\":\"" + size + "\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        long id = objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(post("/api/deliveries/" + id + "/ready")
                        .header("Authorization", "Bearer " + courierToken))
                .andExpect(status().isOk());
        return id;
    }

    private String login(String identifier, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"identifier\":\"" + identifier + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get("token").asText();
    }
}
