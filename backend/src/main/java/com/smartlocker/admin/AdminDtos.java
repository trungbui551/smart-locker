package com.smartlocker.admin;

import com.smartlocker.auth.Role;
import com.smartlocker.locker.CompartmentSize;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Các kiểu dữ liệu (DTO) cho API Quản trị viên (S14 quản lý tài khoản, S15 quản lý tủ & ngăn).
 */
public final class AdminDtos {

    private AdminDtos() {
    }

    public record CreateUserRequest(
            @NotBlank @Size(min = 3, max = 60) String username,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 8, max = 20) String phone,
            @NotBlank String fullName,
            @NotBlank @Size(min = 8, max = 72) String password,
            @NotNull Role role
    ) {
    }

    public record UpdateRoleRequest(@NotNull Role role) {
    }

    public record UpdateActiveRequest(@NotNull Boolean active) {
    }

    public record CreateLockerRequest(
            @NotBlank @Size(min = 2, max = 20) String id,
            @NotBlank @Size(max = 120) String name,
            String location
    ) {
    }

    public record UpdateCompartmentSizeRequest(@NotNull CompartmentSize size) {
    }
}
