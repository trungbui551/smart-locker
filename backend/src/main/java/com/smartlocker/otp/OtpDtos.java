package com.smartlocker.otp;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import java.time.Instant;

public final class OtpDtos {

    private OtpDtos() {
    }

    public record VerifyOtpRequest(
            @NotBlank(message = "Vui lòng nhập mã OTP.")
            @Pattern(regexp = "^\\d{6}$", message = "Mã OTP phải gồm đúng 6 chữ số.")
            String code
    ) {
    }

    public record OtpStatusResponse(
            Long deliveryId,
            String otpCode, // Chỉ hiển thị cho chính chủ đơn khi còn hiệu lực & chưa khóa
            Instant expiresAt,
            int failedAttempts,
            int maxFailedAttempts,
            boolean locked,
            boolean expired,
            boolean used,
            int resendCount,
            boolean smsDelivered
    ) {
    }

    public record VerifyOtpResponse(
            Long deliveryId,
            String lockerId,
            Integer compartmentNumber,
            boolean verified,
            String message
    ) {
    }
}
