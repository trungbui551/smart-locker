package com.smartlocker;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartlocker.audit.AuditEventRepository;
import com.smartlocker.auth.AuthService;
import com.smartlocker.auth.PasswordResetToken;
import com.smartlocker.auth.PasswordResetTokenRepository;
import com.smartlocker.auth.Role;
import com.smartlocker.auth.User;
import com.smartlocker.auth.UserRepository;
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
 * Bộ kiểm thử M1: đăng ký (chống leo thang quyền), đăng nhập đúng/sai,
 * phân quyền 4 vai trò (403), đặt lại mật khẩu dùng 1 lần / hết hạn, và bảo mật nhật ký.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthAndRbacTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository resetTokenRepository;

    @Autowired
    private AuditEventRepository auditEventRepository;

    @Autowired
    private AuthService authService;

    @Test
    void registerAlwaysForcesRecipientRoleAndHashesPassword() throws Exception {
        // Cố tình gửi thêm trường role=ADMIN để kiểm tra backend vẫn ép cứng RECIPIENT
        String body = """
                {
                  "username": "tan_nguoinhan",
                  "email": "tan@example.com",
                  "phone": "0911223344",
                  "fullName": "Nguyễn Văn Tân",
                  "password": "Password@123",
                  "role": "ADMIN"
                }
                """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.role").value("RECIPIENT"));

        User saved = userRepository.findByUsernameIgnoreCase("tan_nguoinhan").orElseThrow();
        assertThat(saved.getRole()).isEqualTo(Role.RECIPIENT);
        assertThat(saved.getPasswordHash()).isNotEqualTo("Password@123");
        assertThat(saved.getPasswordHash()).startsWith("$2");
    }

    @Test
    void loginRejectsWrongPasswordAndEnforces4RoleRbac() throws Exception {
        // Sai mật khẩu -> 400
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"identifier\":\"recipient\",\"password\":\"WrongPass\"}"))
                .andExpect(status().isBadRequest());

        // Chưa đăng nhập gọi API bảo vệ -> 401
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized());

        String recipientToken = loginAndGetToken("recipient", "Locker@123");
        String courierToken = loginAndGetToken("courier", "Locker@123");
        String operatorToken = loginAndGetToken("operator", "Locker@123");
        String adminToken = loginAndGetToken("admin", "Locker@123");

        // Người nhận xem được hồ sơ của chính mình, nhưng bị chặn ở API của Courier / Operator / Admin
        mockMvc.perform(get("/api/users/me").header("Authorization", "Bearer " + recipientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("recipient"));

        mockMvc.perform(get("/api/courier/ping").header("Authorization", "Bearer " + recipientToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/operator/ping").header("Authorization", "Bearer " + recipientToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/ping").header("Authorization", "Bearer " + recipientToken))
                .andExpect(status().isForbidden());

        // Shipper vào được /api/courier/ping nhưng bị chặn /api/operator/ping
        mockMvc.perform(get("/api/courier/ping").header("Authorization", "Bearer " + courierToken))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/operator/ping").header("Authorization", "Bearer " + courierToken))
                .andExpect(status().isForbidden());

        // Vận hành vào được /api/operator/ping nhưng bị chặn /api/admin/ping
        mockMvc.perform(get("/api/operator/ping").header("Authorization", "Bearer " + operatorToken))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/admin/ping").header("Authorization", "Bearer " + operatorToken))
                .andExpect(status().isForbidden());

        // Admin vào được cả /api/operator/ping và /api/admin/ping
        mockMvc.perform(get("/api/operator/ping").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/admin/ping").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    void passwordResetWorksOnceAndRejectsReuseOrExpiredToken() throws Exception {
        String registerBody = """
                {
                  "username": "reset_user",
                  "email": "reset_user@example.com",
                  "phone": "0988776655",
                  "fullName": "Người Dùng Reset",
                  "password": "OldPassword@1"
                }
                """;
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody))
                .andExpect(status().isCreated());

        // Yêu cầu mã đặt lại mật khẩu
        String plainCode = authService.requestPasswordReset("reset_user@example.com").orElseThrow();
        User user = userRepository.findByEmailIgnoreCase("reset_user@example.com").orElseThrow();

        // Kiểm tra không lưu mã dạng chữ thường trong bảng token và nhật ký
        PasswordResetToken stored = resetTokenRepository
                .findByUserIdAndUsedAtIsNullOrderByCreatedAtDesc(user.getId()).getFirst();
        assertThat(stored.getTokenHash()).doesNotContain(plainCode);
        assertThat(auditEventRepository.findAll())
                .noneMatch(e -> e.getDetail() != null && e.getDetail().contains(plainCode));

        // Đặt lại mật khẩu thành công bằng mã hợp lệ
        String resetPayload = """
                {
                  "email": "reset_user@example.com",
                  "code": "%s",
                  "newPassword": "NewPassword@2"
                }
                """.formatted(plainCode);

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(resetPayload))
                .andExpect(status().isOk());

        // Dùng lại cùng mã lần 2 -> bị từ chối
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(resetPayload))
                .andExpect(status().isBadRequest());

        // Đăng nhập bằng mật khẩu mới thành công
        loginAndGetToken("reset_user", "NewPassword@2");

        // Kiểm tra mã hết hạn bị từ chối
        String expiredCode = authService.requestPasswordReset("reset_user@example.com").orElseThrow();
        PasswordResetToken latest = resetTokenRepository
                .findByUserIdAndUsedAtIsNullOrderByCreatedAtDesc(user.getId()).getFirst();
        latest.setExpiresAt(Instant.now().minus(5, ChronoUnit.MINUTES));
        resetTokenRepository.save(latest);

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "reset_user@example.com",
                                  "code": "%s",
                                  "newPassword": "AnotherPass@3"
                                }
                                """.formatted(expiredCode)))
                .andExpect(status().isBadRequest());
    }

    private String loginAndGetToken(String identifier, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"identifier\":\"" + identifier + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get("token").asText();
    }
}
