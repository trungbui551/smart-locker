package com.smartlocker.mqtt;

import com.smartlocker.audit.AuditService;
import com.smartlocker.auth.User;
import com.smartlocker.locker.CompartmentRepository;
import com.smartlocker.locker.Locker;
import com.smartlocker.locker.LockerRepository;
import com.smartlocker.locker.LockerStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Điều phối lệnh mở ngăn qua MQTT, phát hiện quá hạn 10 giây không mở cửa
 * và phát hiện tủ ngoại tuyến khi mất 3 heartbeat liên tiếp.
 */
@Service
public class LockerCommandService {

    private static final Logger log = LoggerFactory.getLogger(LockerCommandService.class);

    private final LockerCommandRepository commandRepository;
    private final LockerRepository lockerRepository;
    private final CompartmentRepository compartmentRepository;
    private final MqttPublisher mqttPublisher;
    private final AuditService auditService;
    private final long openTimeoutSeconds;
    private final long heartbeatIntervalSeconds;
    private final int missedHeartbeatsOffline;

    public LockerCommandService(
            LockerCommandRepository commandRepository,
            LockerRepository lockerRepository,
            CompartmentRepository compartmentRepository,
            MqttPublisher mqttPublisher,
            AuditService auditService,
            @Value("${app.mqtt.open-timeout-seconds:10}") long openTimeoutSeconds,
            @Value("${app.mqtt.heartbeat-interval-seconds:10}") long heartbeatIntervalSeconds,
            @Value("${app.mqtt.missed-heartbeats-offline:3}") int missedHeartbeatsOffline
    ) {
        this.commandRepository = commandRepository;
        this.lockerRepository = lockerRepository;
        this.compartmentRepository = compartmentRepository;
        this.mqttPublisher = mqttPublisher;
        this.auditService = auditService;
        this.openTimeoutSeconds = openTimeoutSeconds;
        this.heartbeatIntervalSeconds = heartbeatIntervalSeconds;
        this.missedHeartbeatsOffline = missedHeartbeatsOffline;
    }

    @Transactional
    public LockerCommand sendOpenCommand(
            String lockerId,
            int compartmentNumber,
            Long deliveryId,
            CommandPurpose purpose,
            User actor,
            String reason
    ) {
        String normalizedId = lockerId.trim().toUpperCase();
        Locker locker = lockerRepository.findById(normalizedId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tủ khóa: " + normalizedId));
        if (locker.getStatus() != LockerStatus.ONLINE) {
            throw new IllegalArgumentException("Tủ " + normalizedId + " đang ngoại tuyến, không thể gửi lệnh mở.");
        }
        compartmentRepository.findByLockerIdAndNumber(normalizedId, compartmentNumber)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy ngăn #" + compartmentNumber + " của tủ " + normalizedId));

        String correlationId = UUID.randomUUID().toString();
        LockerCommand cmd = new LockerCommand();
        cmd.setCorrelationId(correlationId);
        cmd.setLockerId(normalizedId);
        cmd.setCompartmentNumber(compartmentNumber);
        cmd.setDeliveryId(deliveryId);
        cmd.setPurpose(purpose);
        cmd.setStatus(CommandStatus.PENDING_OPEN);
        cmd.setRequestedByUserId(actor != null ? actor.getId() : null);
        cmd.setReason(reason);
        commandRepository.save(cmd);

        mqttPublisher.publishOpenCommand(normalizedId, compartmentNumber, correlationId);

        if (purpose == CommandPurpose.MANUAL) {
            auditService.record(actor != null ? actor.getId() : null, "MANUAL_OPEN",
                    "Mở thủ công " + normalizedId + " ngăn #" + compartmentNumber + " — Lý do: " + reason);
        } else {
            auditService.record(actor != null ? actor.getId() : null, "CMD_OPEN_SENT",
                    "Gửi lệnh mở " + normalizedId + " ngăn #" + compartmentNumber + " (" + purpose + ", id=" + correlationId + ").");
        }
        return cmd;
    }

    /**
     * Quá 10 giây không nhận được door_opened -> đánh dấu lệnh TIMED_OUT, KHÔNG đổi trạng thái đơn hàng.
     */
    @Scheduled(fixedDelay = 2000)
    @Transactional
    public int expireTimedOutCommands() {
        Instant cutoff = Instant.now().minusSeconds(openTimeoutSeconds);
        List<LockerCommand> timedOut = commandRepository.findByStatusAndCreatedAtBefore(CommandStatus.PENDING_OPEN, cutoff);
        for (LockerCommand cmd : timedOut) {
            cmd.setStatus(CommandStatus.TIMED_OUT);
            commandRepository.save(cmd);
            auditService.record(cmd.getRequestedByUserId(), "OPEN_TIMEOUT",
                    "Quá " + openTimeoutSeconds + " giây không nhận door_opened cho "
                            + cmd.getLockerId() + " ngăn #" + cmd.getCompartmentNumber() + " (id=" + cmd.getCorrelationId() + ").");
        }
        return timedOut.size();
    }

    /**
     * Mất 3 heartbeat liên tiếp -> tự động đánh dấu tủ OFFLINE (theo docs/mqtt-contract.md).
     */
    @Scheduled(fixedDelay = 5000)
    @Transactional
    public int detectOfflineLockers() {
        long offlineThresholdSeconds = heartbeatIntervalSeconds * missedHeartbeatsOffline;
        Instant cutoff = Instant.now().minusSeconds(offlineThresholdSeconds);
        int marked = 0;

        for (Locker locker : lockerRepository.findAll()) {
            if (locker.getStatus() == LockerStatus.ONLINE
                    && locker.getLastHeartbeatAt() != null
                    && locker.getLastHeartbeatAt().isBefore(cutoff)) {
                locker.setStatus(LockerStatus.OFFLINE);
                lockerRepository.save(locker);
                auditService.record(null, "LOCKER_OFFLINE",
                        "Tủ " + locker.getId() + " mất " + missedHeartbeatsOffline + " heartbeat liên tiếp -> OFFLINE.");
                log.warn("Tu {} mat heartbeat qua {}s -> danh dau OFFLINE", locker.getId(), offlineThresholdSeconds);
                marked++;
            }
        }
        return marked;
    }

    @Transactional(readOnly = true)
    public LockerCommand getCommand(String correlationId) {
        return commandRepository.findById(correlationId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lệnh mở: " + correlationId));
    }

    public boolean isBrokerConnected() {
        return mqttPublisher.isConnected();
    }
}
