package com.smartlocker.auth;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Các endpoint kiểm tra hồ sơ cá nhân và kiểm chứng phân quyền 4 vai trò ở M1.
 */
@RestController
public class UserController {

    @GetMapping("/api/users/me")
    public AuthDtos.UserProfileResponse me(@AuthenticationPrincipal User currentUser) {
        return AuthDtos.UserProfileResponse.from(currentUser);
    }

    @GetMapping("/api/courier/ping")
    public Map<String, String> courierPing(@AuthenticationPrincipal User currentUser) {
        return Map.of("role", currentUser.getRole().name(), "message", "Xin chào Shipper");
    }

    @GetMapping("/api/operator/ping")
    public Map<String, String> operatorPing(@AuthenticationPrincipal User currentUser) {
        return Map.of("role", currentUser.getRole().name(), "message", "Xin chào Nhân viên vận hành");
    }

    @GetMapping("/api/admin/ping")
    public Map<String, String> adminPing(@AuthenticationPrincipal User currentUser) {
        return Map.of("role", currentUser.getRole().name(), "message", "Xin chào Quản trị viên");
    }
}
