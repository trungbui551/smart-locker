package com.smartlocker.otp;

import com.smartlocker.auth.User;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST API cho vòng đời OTP: kích hoạt READY + gửi OTP, xem OTP (chính chủ),
 * xác thực OTP mở ngăn và xin cấp lại OTP mới.
 */
@RestController
@RequestMapping("/api/deliveries/{deliveryId}")
public class OtpController {

    private final OtpService otpService;

    public OtpController(OtpService otpService) {
        this.otpService = otpService;
    }

    @PostMapping("/ready")
    public OtpDtos.OtpStatusResponse markReady(
            @PathVariable Long deliveryId,
            @AuthenticationPrincipal User actor
    ) {
        return otpService.markDeliveryReadyAndIssueOtp(deliveryId, actor);
    }

    @GetMapping("/otp")
    public OtpDtos.OtpStatusResponse getMyOtp(
            @PathVariable Long deliveryId,
            @AuthenticationPrincipal User recipient
    ) {
        return otpService.getOtpForOwner(deliveryId, recipient);
    }

    @PostMapping("/otp/verify")
    public OtpDtos.VerifyOtpResponse verifyOtp(
            @PathVariable Long deliveryId,
            @Valid @RequestBody OtpDtos.VerifyOtpRequest request,
            @AuthenticationPrincipal User recipient
    ) {
        return otpService.verifyOtp(deliveryId, request.code(), recipient);
    }

    @PostMapping("/otp/resend")
    public OtpDtos.OtpStatusResponse resendOtp(
            @PathVariable Long deliveryId,
            @AuthenticationPrincipal User actor
    ) {
        return otpService.resendOtp(deliveryId, actor);
    }
}
