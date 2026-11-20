package com.smartlocker.auth;

import com.smartlocker.audit.AuditService;
import com.smartlocker.mail.EmailService;
import com.smartlocker.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

/**
 * Nghiệp vụ xác thực tài khoản (M1):
 * - Tự đăng ký luôn ép cứng vai trò RECIPIENT
 * - Đăng nhập bằng tên đăng nhập hoặc email, trả về JWT
 * - Quên mật khẩu qua Email (mã 6 số băm SHA-256 + khóa bí mật, hạn 15 phút, dùng 1 lần)
 */
@Service
public class AuthService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final AuditService auditService;
    private final String tokenSecret;
    private final long resetTokenMinutes;

    public AuthService(
            UserRepository userRepository,
            PasswordResetTokenRepository resetTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            EmailService emailService,
            AuditService auditService,
            @Value("${app.security.otp-secret}") String tokenSecret,
            @Value("${app.security.reset-token-minutes:15}") long resetTokenMinutes
    ) {
        this.userRepository = userRepository;
        this.resetTokenRepository = resetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.emailService = emailService;
        this.auditService = auditService;
        this.tokenSecret = tokenSecret;
        this.resetTokenMinutes = resetTokenMinutes;
    }

    @Transactional
    public AuthDtos.AuthResponse registerRecipient(AuthDtos.RegisterRequest request) {
        String username = request.username().trim();
        String email = request.email().trim().toLowerCase();
        String phone = request.phone().trim();

        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new IllegalArgumentException("Tên đăng nhập đã được sử dụng.");
        }
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("Email đã được đăng ký.");
        }
        if (userRepository.existsByPhone(phone)) {
            throw new IllegalArgumentException("Số điện thoại đã được đăng ký.");
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPhone(phone);
        user.setFullName(request.fullName().trim());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        // Luôn ép cứng vai trò RECIPIENT khi tự đăng ký (chống tự nâng quyền ADMIN/OPERATOR)
        user.setRole(Role.RECIPIENT);
        user.setActive(true);

        User saved = userRepository.save(user);
        auditService.record(saved.getId(), "REGISTER", "Đăng ký tài khoản người nhận mới: " + saved.getUsername());

        String token = jwtService.generateToken(saved);
        return new AuthDtos.AuthResponse(token, AuthDtos.UserProfileResponse.from(saved));
    }

    @Transactional
    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        String identifier = request.identifier().trim();
        Optional<User> userOpt = identifier.contains("@")
                ? userRepository.findByEmailIgnoreCase(identifier)
                : userRepository.findByUsernameIgnoreCase(identifier);

        User user = userOpt.orElseThrow(
                () -> new IllegalArgumentException("Tên đăng nhập hoặc mật khẩu không đúng.")
        );

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            auditService.record(user.getId(), "LOGIN_FAILED", "Đăng nhập sai mật khẩu.");
            throw new IllegalArgumentException("Tên đăng nhập hoặc mật khẩu không đúng.");
        }

        if (!user.isActive()) {
            auditService.record(user.getId(), "LOGIN_BLOCKED", "Tài khoản đang bị khóa.");
            throw new IllegalStateException("Tài khoản của bạn đang bị khóa. Vui lòng liên hệ quản trị viên.");
        }

        auditService.record(user.getId(), "LOGIN", "Đăng nhập thành công với vai trò " + user.getRole());
        String token = jwtService.generateToken(user);
        return new AuthDtos.AuthResponse(token, AuthDtos.UserProfileResponse.from(user));
    }

    /**
     * Tạo mã đặt lại mật khẩu 6 chữ số, băm trước khi lưu CSDL và gửi qua Email.
     * Trả về mã chỉ dùng cho lớp test nội bộ; API public KHÔNG bao giờ trả mã ra ngoài.
     */
    @Transactional
    public Optional<String> requestPasswordReset(String rawEmail) {
        String email = rawEmail.trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(email);
        if (userOpt.isEmpty()) {
            // Không tiết lộ email có tồn tại hay không để tránh dò tài khoản
            return Optional.empty();
        }

        User user = userOpt.get();
        String plainCode = String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUser(user);
        resetToken.setTokenHash(hashCode(user.getId(), plainCode));
        resetToken.setExpiresAt(Instant.now().plus(resetTokenMinutes, ChronoUnit.MINUTES));
        resetTokenRepository.save(resetToken);

        String body = "Xin chào " + user.getFullName() + ",\n\n"
                + "Mã xác nhận đặt lại mật khẩu Smart Locker của bạn là: " + plainCode + "\n"
                + "Mã có hiệu lực trong " + resetTokenMinutes + " phút và chỉ dùng một lần.\n\n"
                + "Nếu bạn không yêu cầu thao tác này, vui lòng bỏ qua email này.";

        emailService.sendText(user.getEmail(), "[Smart Locker] Mã đặt lại mật khẩu", body);
        auditService.record(user.getId(), "PASSWORD_RESET_REQUEST", "Đã gửi mã đặt lại mật khẩu qua Email.");
        return Optional.of(plainCode);
    }

    @Transactional
    public void resetPassword(AuthDtos.ResetPasswordRequest request) {
        String email = request.email().trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("Mã xác nhận không hợp lệ hoặc đã hết hạn."));

        String expectedHash = hashCode(user.getId(), request.code().trim());
        Instant now = Instant.now();

        List<PasswordResetToken> activeTokens =
                resetTokenRepository.findByUserIdAndUsedAtIsNullOrderByCreatedAtDesc(user.getId());

        PasswordResetToken matched = activeTokens.stream()
                .filter(t -> t.getTokenHash().equals(expectedHash))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Mã xác nhận không đúng."));

        if (matched.getExpiresAt().isBefore(now)) {
            throw new IllegalArgumentException("Mã xác nhận đã hết hạn. Vui lòng yêu cầu mã mới.");
        }

        // Đánh dấu mã đã sử dụng để không thể dùng lại lần thứ 2
        matched.setUsedAt(now);
        resetTokenRepository.save(matched);

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        auditService.record(user.getId(), "PASSWORD_RESET", "Đặt lại mật khẩu thành công.");
    }

    // Băm SHA-256 kèm userId và khóa bí mật để không lưu mã đặt lại mật khẩu dạng chữ thường
    String hashCode(Long userId, String plainCode) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            String payload = userId + ":" + plainCode + ":" + tokenSecret;
            byte[] digest = md.digest(payload.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception ex) {
            throw new IllegalStateException("Lỗi băm mã xác nhận", ex);
        }
    }
}
