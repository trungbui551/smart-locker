package com.smartlocker.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Các kiểu dữ liệu (DTO) vào/ra cho API đăng ký, đăng nhập và quên mật khẩu.
 */
public final class AuthDtos {

    private AuthDtos() {
    }

    public record RegisterRequest(
            @NotBlank(message = "Tên đăng nhập không được để trống.")
            @Size(min = 3, max = 60, message = "Tên đăng nhập từ 3 đến 60 ký tự.")
            String username,

            @NotBlank(message = "Email không được để trống.")
            @Email(message = "Email không đúng định dạng.")
            String email,

            @NotBlank(message = "Số điện thoại không được để trống.")
            @Size(min = 8, max = 20, message = "Số điện thoại không hợp lệ.")
            String phone,

            @NotBlank(message = "Họ tên không được để trống.")
            String fullName,

            @NotBlank(message = "Mật khẩu không được để trống.")
            @Size(min = 8, max = 72, message = "Mật khẩu tối thiểu 8 ký tự.")
            String password
    ) {
    }

    public record LoginRequest(
            @NotBlank(message = "Vui lòng nhập tên đăng nhập hoặc email.")
            String identifier,

            @NotBlank(message = "Vui lòng nhập mật khẩu.")
            String password
    ) {
    }

    public record ForgotPasswordRequest(
            @NotBlank(message = "Vui lòng nhập email.")
            @Email(message = "Email không đúng định dạng.")
            String email
    ) {
    }

    public record ResetPasswordRequest(
            @NotBlank(message = "Vui lòng nhập email.")
            @Email(message = "Email không đúng định dạng.")
            String email,

            @NotBlank(message = "Vui lòng nhập mã xác nhận.")
            String code,

            @NotBlank(message = "Mật khẩu mới không được để trống.")
            @Size(min = 8, max = 72, message = "Mật khẩu mới tối thiểu 8 ký tự.")
            String newPassword
    ) {
    }

    public record UserProfileResponse(
            Long id,
            String username,
            String email,
            String phone,
            String fullName,
            Role role,
            boolean active
    ) {
        public static UserProfileResponse from(User user) {
            return new UserProfileResponse(
                    user.getId(),
                    user.getUsername(),
                    user.getEmail(),
                    user.getPhone(),
                    user.getFullName(),
                    user.getRole(),
                    user.isActive()
            );
        }
    }

    public record AuthResponse(
            String token,
            UserProfileResponse user
    ) {
    }
}
