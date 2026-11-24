package com.smartlocker.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Tạo sẵn 4 tài khoản mẫu cho 4 vai trò khi chạy local (app.seed-demo-users=true).
 * Khi triển khai demo công khai, tắt cờ APP_SEED_DEMO_USERS=false và đổi mật khẩu riêng.
 */
@Component
@ConditionalOnProperty(name = "app.seed-demo-users", havingValue = "true")
public class DemoUserSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoUserSeeder.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DemoUserSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        seedIfAbsent("recipient", "recipient@smartlocker.local", "0900000001", "Nguyễn Văn An", Role.RECIPIENT);
        seedIfAbsent("courier", "courier@smartlocker.local", "0900000002", "Phạm Quốc Hùng", Role.COURIER);
        seedIfAbsent("operator", "operator@smartlocker.local", "0900000003", "Trần Ngọc Lan", Role.OPERATOR);
        seedIfAbsent("admin", "admin@smartlocker.local", "0900000004", "Quốc Trung (Admin)", Role.ADMIN);
    }

    private void seedIfAbsent(String username, String email, String phone, String fullName, Role role) {
        if (userRepository.existsByUsernameIgnoreCase(username)) {
            return;
        }
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPhone(phone);
        user.setFullName(fullName);
        user.setPasswordHash(passwordEncoder.encode("Locker@123"));
        user.setRole(role);
        user.setActive(true);
        userRepository.save(user);
        log.info("Da khoi tao tai khoan mau local: {} (vai tro {})", username, role);
    }
}
