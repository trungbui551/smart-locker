package com.smartlocker.otp;

import com.smartlocker.audit.AuditService;
import com.smartlocker.auth.Role;
import com.smartlocker.auth.User;
import com.smartlocker.delivery.Delivery;
import com.smartlocker.delivery.DeliveryRepository;
import com.smartlocker.delivery.DeliveryStatus;
import com.smartlocker.mail.EmailService;
import com.smartlocker.mqtt.CommandPurpose;
import com.smartlocker.mqtt.LockerCommand;
import com.smartlocker.mqtt.LockerCommandService;
import com.smartlocker.sms.SmsService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * Nghiệp vụ mã OTP đa kênh (M3):
 * - Sinh OTP hạn 24 giờ khi đơn chuyển sang READY; gửi đồng thời Web/App + Gmail + SMS
 * - Kiểm tra OTP: đúng chủ đơn, sai tối đa 3 lần tự khóa, dùng 1 lần duy nhất
 * - Xin cấp lại OTP mới (chống spam giãn cách) cho Người nhận hoặc Nhân viên vận hành hỗ trợ
 */
@Service
public class OtpService {

    private static final long STORAGE_HOURS = 72;

    private final DeliveryRepository deliveryRepository;
    private final OtpCodeRepository otpCodeRepository;
    private final OtpCryptoHelper cryptoHelper;
    private final EmailService emailService;
    private final SmsService smsService;
    private final AuditService auditService;
    private final LockerCommandService lockerCommandService;
    private final long otpExpirationHours;
    private final int maxFailedAttempts;
    private final long resendCooldownSeconds;

    public OtpService(
            DeliveryRepository deliveryRepository,
            OtpCodeRepository otpCodeRepository,
            OtpCryptoHelper cryptoHelper,
            EmailService emailService,
            SmsService smsService,
            AuditService auditService,
            LockerCommandService lockerCommandService,
            @Value("${app.otp.expiration-hours:24}") long otpExpirationHours,
            @Value("${app.otp.max-failed-attempts:3}") int maxFailedAttempts,
            @Value("${app.otp.resend-cooldown-seconds:30}") long resendCooldownSeconds
    ) {
        this.deliveryRepository = deliveryRepository;
        this.otpCodeRepository = otpCodeRepository;
        this.cryptoHelper = cryptoHelper;
        this.emailService = emailService;
        this.smsService = smsService;
        this.auditService = auditService;
        this.lockerCommandService = lockerCommandService;
        this.otpExpirationHours = otpExpirationHours;
        this.maxFailedAttempts = maxFailedAttempts;
        this.resendCooldownSeconds = resendCooldownSeconds;
    }

    /**
     * Chuyển đơn từ STORING -> READY (khi shipper đã bỏ hàng và đóng cửa) và phát hành OTP 24h.
     */
    @Transactional
    public OtpDtos.OtpStatusResponse markDeliveryReadyAndIssueOtp(Long deliveryId, User actor) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng #" + deliveryId));

        boolean canMarkReady = actor.getRole() == Role.ADMIN
                || actor.getRole() == Role.OPERATOR
                || (actor.getRole() == Role.COURIER && delivery.getCourier().getId().equals(actor.getId()));
        if (!canMarkReady) {
            throw new IllegalStateException("Bạn không có quyền xác nhận hoàn tất gửi cho đơn này.");
        }
        if (delivery.getStatus() != DeliveryStatus.STORING) {
            throw new IllegalArgumentException("Chỉ đơn đang ở trạng thái STORING mới chuyển sang READY được.");
        }

        Instant now = Instant.now();
        delivery.setStatus(DeliveryStatus.READY);
        delivery.setExpiresAt(now.plus(STORAGE_HOURS, ChronoUnit.HOURS));
        deliveryRepository.save(delivery);

        String plainOtp = cryptoHelper.generateSixDigitCode();
        OtpCode otp = otpCodeRepository.findByDeliveryId(deliveryId).orElseGet(OtpCode::new);
        otp.setDelivery(delivery);
        otp.setCodeHash(cryptoHelper.hash(deliveryId, plainOtp));
        otp.setCodeEncrypted(cryptoHelper.encrypt(plainOtp));
        otp.setExpiresAt(now.plus(otpExpirationHours, ChronoUnit.HOURS));
        otp.setFailedAttempts(0);
        otp.setLocked(false);
        otp.setUsedAt(null);
        otp.setLastSentAt(now);
        otpCodeRepository.save(otp);

        boolean smsOk = dispatchNotifications(delivery, plainOtp, false);
        auditService.record(actor.getId(), "OTP_SENT",
                "Đơn #" + deliveryId + " chuyển READY và đã gửi OTP đa kênh (SMS=" + smsOk + ").");

        return toStatusResponse(otp, null, smsOk);
    }

    /**
     * Xem trạng thái OTP và mã OTP (chỉ giải mã trả về cho ĐÚNG chủ đơn RECIPIENT).
     */
    @Transactional(readOnly = true)
    public OtpDtos.OtpStatusResponse getOtpForOwner(Long deliveryId, User recipient) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng #" + deliveryId));
        if (!delivery.getRecipient().getId().equals(recipient.getId())) {
            throw new IllegalStateException("Bạn không có quyền xem mã OTP của người khác.");
        }
        OtpCode otp = otpCodeRepository.findByDeliveryId(deliveryId)
                .orElseThrow(() -> new IllegalArgumentException("Đơn hàng chưa có mã OTP."));

        boolean expired = otp.getExpiresAt().isBefore(Instant.now());
        boolean used = otp.getUsedAt() != null;
        String visibleCode = (!used && !otp.isLocked() && !expired)
                ? cryptoHelper.decrypt(otp.getCodeEncrypted())
                : null;
        return toStatusResponse(otp, visibleCode, true);
    }

    /**
     * Xác thực mã OTP người nhận nhập vào (chống brute-force 3 lần sai, dùng 1 lần, kiểm tra hạn 24h).
     */
    @Transactional(noRollbackFor = IllegalArgumentException.class)
    public OtpDtos.VerifyOtpResponse verifyOtp(Long deliveryId, String enteredCode, User recipient) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng #" + deliveryId));
        if (!delivery.getRecipient().getId().equals(recipient.getId())) {
            throw new IllegalStateException("Bạn không có quyền mở ngăn của người khác.");
        }
        if (delivery.getStatus() != DeliveryStatus.READY) {
            throw new IllegalArgumentException("Đơn hàng hiện không ở trạng thái chờ nhận.");
        }

        OtpCode otp = otpCodeRepository.findByDeliveryId(deliveryId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy mã OTP cho đơn hàng này."));

        if (otp.getUsedAt() != null) {
            throw new IllegalArgumentException("Mã OTP này đã được sử dụng.");
        }
        if (otp.isLocked()) {
            throw new IllegalArgumentException("Đơn hàng đang tạm khóa do nhập sai quá " + maxFailedAttempts + " lần. Hãy bấm xin cấp lại mã mới.");
        }
        if (otp.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Mã OTP đã hết hạn 24 giờ. Hãy bấm xin cấp lại mã mới.");
        }

        String enteredHash = cryptoHelper.hash(deliveryId, enteredCode.trim());
        if (!enteredHash.equals(otp.getCodeHash())) {
            int nextFails = otp.getFailedAttempts() + 1;
            otp.setFailedAttempts(nextFails);
            if (nextFails >= maxFailedAttempts) {
                otp.setLocked(true);
                otp.setCodeEncrypted(null);
                otpCodeRepository.save(otp);
                auditService.record(recipient.getId(), "OTP_LOCKED",
                        "Đơn #" + deliveryId + " nhập sai OTP " + nextFails + "/" + maxFailedAttempts + " lần -> tạm khóa.");
                throw new IllegalArgumentException("Nhập sai OTP quá " + maxFailedAttempts + " lần. Đơn hàng đã tạm khóa — hãy bấm xin cấp lại mã mới.");
            }
            otpCodeRepository.save(otp);
            auditService.record(recipient.getId(), "OTP_FAILED",
                    "Đơn #" + deliveryId + " nhập sai OTP (" + nextFails + "/" + maxFailedAttempts + ").");
            throw new IllegalArgumentException("Mã OTP không đúng (sai " + nextFails + "/" + maxFailedAttempts + " lần).");
        }

        // OTP hợp lệ -> đánh dấu đã dùng 1 lần và xóa bản mã hóa
        otp.setUsedAt(Instant.now());
        otp.setCodeEncrypted(null);
        otpCodeRepository.save(otp);

        auditService.record(recipient.getId(), "OTP_VERIFIED",
                "Xác thực OTP thành công cho đơn #" + deliveryId + " (" + delivery.getCompartment().getLocker().getId()
                        + " ngăn #" + delivery.getCompartment().getNumber() + ").");

        // Gửi lệnh mở ngăn qua MQTT tới tủ khóa cho người nhận lấy hàng
        LockerCommand cmd = lockerCommandService.sendOpenCommand(
                delivery.getCompartment().getLocker().getId(),
                delivery.getCompartment().getNumber(),
                delivery.getId(),
                CommandPurpose.PICKUP,
                recipient,
                null
        );

        return new OtpDtos.VerifyOtpResponse(
                delivery.getId(),
                delivery.getCompartment().getLocker().getId(),
                delivery.getCompartment().getNumber(),
                true,
                cmd.getCorrelationId(),
                "Mã OTP hợp lệ! Đã gửi lệnh mở ngăn số " + delivery.getCompartment().getNumber() + "."
        );
    }

    /**
     * Xác thực mã OTP nhập trực tiếp từ bàn phím 4x4 gắn trên tủ khóa (qua MQTT locker/{id}/otp/submit).
     * Tìm đơn READY trong đúng tủ đó khớp mã băm OTP; nếu hợp lệ thì tự gửi lệnh mở ngăn cmd/open.
     */
    @Transactional
    public boolean verifyKeypadOtpForLocker(String lockerId, String enteredCode) {
        String normalizedLocker = lockerId.trim().toUpperCase();
        String code = enteredCode == null ? "" : enteredCode.trim();
        if (!code.matches("^\\d{6}$")) {
            return false;
        }

        Instant now = Instant.now();
        var readyDeliveries = deliveryRepository.findByCompartmentLockerIdAndStatus(normalizedLocker, DeliveryStatus.READY);
        for (Delivery delivery : readyDeliveries) {
            var otpOpt = otpCodeRepository.findByDeliveryId(delivery.getId());
            if (otpOpt.isEmpty()) {
                continue;
            }
            OtpCode otp = otpOpt.get();
            if (otp.getUsedAt() != null || otp.isLocked() || otp.getExpiresAt().isBefore(now)) {
                continue;
            }
            if (cryptoHelper.hash(delivery.getId(), code).equals(otp.getCodeHash())) {
                otp.setUsedAt(now);
                otp.setCodeEncrypted(null);
                otpCodeRepository.save(otp);

                auditService.record(delivery.getRecipient().getId(), "OTP_KEYPAD_VERIFIED",
                        "Mở ngăn từ bàn phím tủ " + normalizedLocker + " ngăn #" + delivery.getCompartment().getNumber()
                                + " cho đơn #" + delivery.getId() + ".");

                lockerCommandService.sendOpenCommand(
                        normalizedLocker,
                        delivery.getCompartment().getNumber(),
                        delivery.getId(),
                        CommandPurpose.PICKUP,
                        delivery.getRecipient(),
                        null
                );
                return true;
            }
        }

        auditService.record(null, "OTP_KEYPAD_FAILED",
                "Nhập sai mã OTP từ bàn phím vật lý trên tủ " + normalizedLocker + ".");
        return false;
    }

    /**
     * Xin cấp lại mã OTP mới (khi hết hạn 24h hoặc bị khóa 3 lần sai).
     * Cho phép chính chủ RECIPIENT (có giãn cách chống spam) hoặc OPERATOR/ADMIN hỗ trợ ngay.
     */
    @Transactional
    public OtpDtos.OtpStatusResponse resendOtp(Long deliveryId, User actor) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng #" + deliveryId));

        boolean isStaff = actor.getRole() == Role.OPERATOR || actor.getRole() == Role.ADMIN;
        boolean isOwner = actor.getRole() == Role.RECIPIENT && delivery.getRecipient().getId().equals(actor.getId());
        if (!isStaff && !isOwner) {
            throw new IllegalStateException("Bạn không có quyền xin cấp lại OTP cho đơn này.");
        }
        if (delivery.getStatus() != DeliveryStatus.READY) {
            throw new IllegalArgumentException("Chỉ cấp lại OTP cho đơn đang chờ nhận (READY).");
        }

        OtpCode otp = otpCodeRepository.findByDeliveryId(deliveryId)
                .orElseThrow(() -> new IllegalArgumentException("Đơn hàng chưa có mã OTP."));
        if (otp.getUsedAt() != null) {
            throw new IllegalArgumentException("Đơn hàng đã sử dụng OTP để mở ngăn.");
        }

        Instant now = Instant.now();
        if (!isStaff && resendCooldownSeconds > 0 && otp.getLastSentAt() != null) {
            Instant allowedAt = otp.getLastSentAt().plusSeconds(resendCooldownSeconds);
            if (now.isBefore(allowedAt)) {
                throw new IllegalArgumentException("Vui lòng chờ " + resendCooldownSeconds + " giây trước khi xin cấp lại mã mới.");
            }
        }

        String freshOtp = cryptoHelper.generateSixDigitCode();
        otp.setCodeHash(cryptoHelper.hash(deliveryId, freshOtp));
        otp.setCodeEncrypted(cryptoHelper.encrypt(freshOtp));
        otp.setExpiresAt(now.plus(otpExpirationHours, ChronoUnit.HOURS));
        otp.setFailedAttempts(0);
        otp.setLocked(false);
        otp.setResendCount(otp.getResendCount() + 1);
        otp.setLastSentAt(now);
        otpCodeRepository.save(otp);

        boolean smsOk = dispatchNotifications(delivery, freshOtp, true);
        auditService.record(actor.getId(), "OTP_RESEND",
                (isStaff ? "Nhân viên hỗ trợ" : "Người nhận") + " cấp lại OTP mới cho đơn #" + deliveryId + ".");

        return toStatusResponse(otp, isOwner ? freshOtp : null, smsOk);
    }

    private boolean dispatchNotifications(Delivery delivery, String plainOtp, boolean isResend) {
        User recipient = delivery.getRecipient();
        String lockerId = delivery.getCompartment().getLocker().getId();
        Integer compNum = delivery.getCompartment().getNumber();

        String subject = isResend
                ? "[Smart Locker] Mã OTP mới cho đơn #" + delivery.getId()
                : "[Smart Locker] Hàng đã vào tủ " + lockerId + " — Ngăn #" + compNum;

        String body = "Xin chào " + recipient.getFullName() + ",\n\n"
                + "Đơn hàng #" + delivery.getId() + " đang ở tủ " + lockerId
                + " (" + delivery.getCompartment().getLocker().getName() + "), ngăn số #" + compNum + ".\n"
                + "Mã OTP mở ngăn của bạn là: " + plainOtp + "\n"
                + "Mã có hiệu lực trong " + otpExpirationHours + " giờ và dùng 1 lần.\n"
                + "Thời gian lưu hàng tối đa: " + STORAGE_HOURS + " giờ.";

        emailService.sendText(recipient.getEmail(), subject, body);

        String smsText = "Smart Locker: Don #" + delivery.getId() + " tai tu " + lockerId
                + " ngan #" + compNum + ". Ma OTP: " + plainOtp + " (han 24h).";
        return smsService.sendOtpSms(recipient.getPhone(), smsText);
    }

    private OtpDtos.OtpStatusResponse toStatusResponse(OtpCode otp, String visibleCode, boolean smsDelivered) {
        return new OtpDtos.OtpStatusResponse(
                otp.getDelivery().getId(),
                visibleCode,
                otp.getExpiresAt(),
                otp.getFailedAttempts(),
                maxFailedAttempts,
                otp.isLocked(),
                otp.getExpiresAt().isBefore(Instant.now()),
                otp.getUsedAt() != null,
                otp.getResendCount(),
                smsDelivered
        );
    }
}
