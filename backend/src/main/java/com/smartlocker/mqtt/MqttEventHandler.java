package com.smartlocker.mqtt;

import com.smartlocker.audit.AuditService;
import com.smartlocker.auth.User;
import com.smartlocker.auth.UserRepository;
import com.smartlocker.delivery.Delivery;
import com.smartlocker.delivery.DeliveryRepository;
import com.smartlocker.delivery.DeliveryStatus;
import com.smartlocker.locker.Compartment;
import com.smartlocker.locker.CompartmentRepository;
import com.smartlocker.locker.CompartmentStatus;
import com.smartlocker.locker.Locker;
import com.smartlocker.locker.LockerRepository;
import com.smartlocker.locker.LockerStatus;
import com.smartlocker.otp.OtpService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

/**
 * Xử lý các sự kiện gửi từ tủ khóa ESP32 lên Backend theo docs/mqtt-contract.md:
 * - heartbeat -> cập nhật last_heartbeat_at & khôi phục ONLINE
 * - door_opened -> đánh dấu lệnh OPENED (bỏ qua nếu trùng correlationId)
 * - door_closed -> hoàn tất DROPOFF (chuyển READY + sinh OTP) hoặc PICKUP (chuyển PICKED_UP + ngăn FREE)
 * - fault -> đánh dấu ngăn FAULT & ghi nhật ký cảnh báo
 */
@Service
public class MqttEventHandler {

    private static final Logger log = LoggerFactory.getLogger(MqttEventHandler.class);

    private final LockerRepository lockerRepository;
    private final CompartmentRepository compartmentRepository;
    private final LockerCommandRepository commandRepository;
    private final DeliveryRepository deliveryRepository;
    private final UserRepository userRepository;
    private final OtpService otpService;
    private final AuditService auditService;

    public MqttEventHandler(
            LockerRepository lockerRepository,
            CompartmentRepository compartmentRepository,
            LockerCommandRepository commandRepository,
            DeliveryRepository deliveryRepository,
            UserRepository userRepository,
            OtpService otpService,
            AuditService auditService
    ) {
        this.lockerRepository = lockerRepository;
        this.compartmentRepository = compartmentRepository;
        this.commandRepository = commandRepository;
        this.deliveryRepository = deliveryRepository;
        this.userRepository = userRepository;
        this.otpService = otpService;
        this.auditService = auditService;
    }

    @Transactional
    public void handleHeartbeat(String lockerId) {
        Optional<Locker> lockerOpt = lockerRepository.findById(lockerId.trim().toUpperCase());
        if (lockerOpt.isEmpty()) {
            log.warn("Nhan heartbeat tu tu khong ton tai: {}", lockerId);
            return;
        }
        Locker locker = lockerOpt.get();
        boolean wasOffline = locker.getStatus() == LockerStatus.OFFLINE;
        locker.setLastHeartbeatAt(Instant.now());
        locker.setStatus(LockerStatus.ONLINE);
        lockerRepository.save(locker);

        if (wasOffline) {
            auditService.record(null, "LOCKER_ONLINE", "Tủ " + locker.getId() + " đã có heartbeat trở lại (ONLINE).");
        }
    }

    @Transactional
    public void handleEvent(String lockerId, String type, Integer compartmentNumber, String correlationId) {
        String normalizedLockerId = lockerId.trim().toUpperCase();
        if (type == null || compartmentNumber == null) {
            log.warn("Bo qua su kien MQTT thieu du lieu tu tu {}", normalizedLockerId);
            return;
        }

        // Kiểm tra ngăn tồn tại (PRD mục ⑤: bỏ qua sự kiện cho ngăn không tồn tại và ghi log)
        Optional<Compartment> compOpt = compartmentRepository.findByLockerIdAndNumber(normalizedLockerId, compartmentNumber);
        if (compOpt.isEmpty()) {
            log.warn("Bo qua su kien {} cho ngan khong ton tai {} #{}", type, normalizedLockerId, compartmentNumber);
            auditService.record(null, "MQTT_UNKNOWN_COMPARTMENT",
                    "Nhận sự kiện " + type + " cho ngăn không tồn tại " + normalizedLockerId + " #" + compartmentNumber);
            return;
        }

        switch (type.trim().toLowerCase()) {
            case "door_opened" -> handleDoorOpened(normalizedLockerId, compartmentNumber, correlationId);
            case "door_closed" -> handleDoorClosed(normalizedLockerId, compartmentNumber, correlationId, compOpt.get());
            case "fault" -> handleFault(normalizedLockerId, compartmentNumber, correlationId, compOpt.get());
            default -> log.warn("Loai su kien MQTT khong ho tro: {}", type);
        }
    }

    private void handleDoorOpened(String lockerId, int compartmentNumber, String correlationId) {
        if (correlationId == null || correlationId.isBlank()) {
            return;
        }
        Optional<LockerCommand> cmdOpt = commandRepository.findById(correlationId);
        if (cmdOpt.isEmpty()) {
            log.warn("Nhan door_opened voi correlationId khong ton tai: {}", correlationId);
            return;
        }
        LockerCommand cmd = cmdOpt.get();
        // Bỏ qua lệnh trùng correlationId (idempotent)
        if (cmd.getStatus() != CommandStatus.PENDING_OPEN) {
            log.info("Bo qua su kien door_opened trung correlationId={} (trang thai={})", correlationId, cmd.getStatus());
            return;
        }

        cmd.setStatus(CommandStatus.OPENED);
        cmd.setOpenedAt(Instant.now());
        commandRepository.save(cmd);
        auditService.record(cmd.getRequestedByUserId(), "DOOR_OPENED",
                "Tủ " + lockerId + " ngăn #" + compartmentNumber + " đã mở (correlationId=" + correlationId + ").");
    }

    private void handleDoorClosed(String lockerId, int compartmentNumber, String correlationId, Compartment compartment) {
        if (correlationId == null || correlationId.isBlank()) {
            return;
        }
        Optional<LockerCommand> cmdOpt = commandRepository.findById(correlationId);
        if (cmdOpt.isEmpty()) {
            log.warn("Nhan door_closed voi correlationId khong ton tai: {}", correlationId);
            return;
        }
        LockerCommand cmd = cmdOpt.get();
        // Bỏ qua sự kiện đóng cửa gửi trùng
        if (cmd.getStatus() == CommandStatus.CLOSED || cmd.getStatus() == CommandStatus.TIMED_OUT) {
            log.info("Bo qua su kien door_closed trung correlationId={} (trang thai={})", correlationId, cmd.getStatus());
            return;
        }

        cmd.setStatus(CommandStatus.CLOSED);
        cmd.setClosedAt(Instant.now());
        commandRepository.save(cmd);

        auditService.record(cmd.getRequestedByUserId(), "DOOR_CLOSED",
                "Tủ " + lockerId + " ngăn #" + compartmentNumber + " đã đóng (correlationId=" + correlationId + ").");

        if (cmd.getDeliveryId() == null) {
            return;
        }

        if (cmd.getPurpose() == CommandPurpose.DROPOFF) {
            // Shipper đóng cửa -> chuyển đơn STORING sang READY và phát hành OTP đa kênh
            Delivery delivery = deliveryRepository.findById(cmd.getDeliveryId()).orElse(null);
            if (delivery != null && delivery.getStatus() == DeliveryStatus.STORING) {
                User actor = cmd.getRequestedByUserId() != null
                        ? userRepository.findById(cmd.getRequestedByUserId()).orElse(delivery.getCourier())
                        : delivery.getCourier();
                otpService.markDeliveryReadyAndIssueOtp(delivery.getId(), actor);
            }
        } else if (cmd.getPurpose() == CommandPurpose.PICKUP) {
            // Người nhận đóng cửa -> đơn hoàn tất PICKED_UP và trả ngăn về FREE
            Delivery delivery = deliveryRepository.findById(cmd.getDeliveryId()).orElse(null);
            if (delivery != null && delivery.getStatus() == DeliveryStatus.READY) {
                delivery.setStatus(DeliveryStatus.PICKED_UP);
                delivery.setPickedUpAt(Instant.now());
                deliveryRepository.save(delivery);

                compartment.setStatus(CompartmentStatus.FREE);
                compartmentRepository.save(compartment);

                auditService.record(delivery.getRecipient().getId(), "PICKUP_COMPLETED",
                        "Đơn #" + delivery.getId() + " hoàn tất lấy hàng; " + lockerId + " ngăn #" + compartmentNumber + " trở về FREE.");
            }
        }
    }

    private void handleFault(String lockerId, int compartmentNumber, String correlationId, Compartment compartment) {
        compartment.setStatus(CompartmentStatus.FAULT);
        compartmentRepository.save(compartment);

        if (correlationId != null && !correlationId.isBlank()) {
            commandRepository.findById(correlationId).ifPresent(cmd -> {
                cmd.setStatus(CommandStatus.FAULT);
                commandRepository.save(cmd);
            });
        }

        auditService.record(null, "DOOR_FAULT",
                "Cảnh báo lỗi (fault) tại tủ " + lockerId + " ngăn #" + compartmentNumber + ".");
    }
}
