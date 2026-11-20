package com.smartlocker.mqtt;

import com.smartlocker.audit.AuditEvent;
import com.smartlocker.audit.AuditEventRepository;
import com.smartlocker.audit.AuditService;
import com.smartlocker.auth.User;
import com.smartlocker.delivery.DeliveryRepository;
import com.smartlocker.delivery.DeliveryStatus;
import com.smartlocker.locker.Compartment;
import com.smartlocker.locker.CompartmentRepository;
import com.smartlocker.locker.CompartmentStatus;
import com.smartlocker.locker.Locker;
import com.smartlocker.locker.LockerRepository;
import com.smartlocker.locker.LockerStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

/**
 * API Vận hành (S10 Trạng thái hệ thống, S11 Mở ngăn thủ công & đánh dấu lỗi, S13 Nhật ký)
 * và API tra cứu trạng thái lệnh mở cửa theo correlationId.
 */
@RestController
public class OperatorController {

    private final LockerCommandService commandService;
    private final LockerRepository lockerRepository;
    private final CompartmentRepository compartmentRepository;
    private final DeliveryRepository deliveryRepository;
    private final AuditEventRepository auditEventRepository;
    private final AuditService auditService;

    public OperatorController(
            LockerCommandService commandService,
            LockerRepository lockerRepository,
            CompartmentRepository compartmentRepository,
            DeliveryRepository deliveryRepository,
            AuditEventRepository auditEventRepository,
            AuditService auditService
    ) {
        this.commandService = commandService;
        this.lockerRepository = lockerRepository;
        this.compartmentRepository = compartmentRepository;
        this.deliveryRepository = deliveryRepository;
        this.auditEventRepository = auditEventRepository;
        this.auditService = auditService;
    }

    @PostMapping("/api/operator/lockers/{lockerId}/compartments/{number}/open")
    public CommandView manualOpen(
            @PathVariable String lockerId,
            @PathVariable Integer number,
            @AuthenticationPrincipal User operator,
            @Valid @RequestBody ManualOpenRequest request
    ) {
        LockerCommand cmd = commandService.sendOpenCommand(
                lockerId, number, null, CommandPurpose.MANUAL, operator, request.reason().trim()
        );
        return CommandView.from(cmd);
    }

    @PatchMapping("/api/operator/lockers/{lockerId}/compartments/{number}/status")
    public CompartmentStatusResponse updateCompartmentStatus(
            @PathVariable String lockerId,
            @PathVariable Integer number,
            @AuthenticationPrincipal User operator,
            @Valid @RequestBody UpdateCompartmentStatusRequest request
    ) {
        String id = lockerId.trim().toUpperCase();
        Compartment comp = compartmentRepository.findByLockerIdAndNumber(id, number)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy ngăn #" + number + " của tủ " + id));
        comp.setStatus(request.status());
        compartmentRepository.save(comp);
        auditService.record(operator.getId(), "COMPARTMENT_STATUS",
                "Đổi trạng thái " + id + " ngăn #" + number + " sang " + request.status());
        return new CompartmentStatusResponse(id, number, comp.getStatus());
    }

    @GetMapping("/api/commands/{correlationId}")
    public CommandView getCommandStatus(@PathVariable String correlationId) {
        return CommandView.from(commandService.getCommand(correlationId));
    }

    @GetMapping("/api/operator/system-status")
    public SystemStatusResponse systemStatus() {
        List<Locker> lockers = lockerRepository.findAll();
        List<Compartment> comps = compartmentRepository.findAll();
        long onlineLockers = lockers.stream().filter(l -> l.getStatus() == LockerStatus.ONLINE).count();
        long occupiedComps = comps.stream().filter(c -> c.getStatus() == CompartmentStatus.OCCUPIED).count();
        long faultComps = comps.stream().filter(c -> c.getStatus() == CompartmentStatus.FAULT).count();
        long expiredDeliveries = deliveryRepository.findAll().stream()
                .filter(d -> d.getStatus() == DeliveryStatus.EXPIRED).count();

        return new SystemStatusResponse(
                "UP",
                commandService.isBrokerConnected(),
                lockers.size(),
                onlineLockers,
                comps.size(),
                occupiedComps,
                faultComps,
                expiredDeliveries
        );
    }

    @GetMapping("/api/operator/audit-logs")
    public List<AuditEvent> listAuditLogs() {
        return auditEventRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    public record ManualOpenRequest(@NotBlank(message = "Vui lòng nhập lý do mở ngăn thủ công.") String reason) {
    }

    public record UpdateCompartmentStatusRequest(@NotNull CompartmentStatus status) {
    }

    public record CompartmentStatusResponse(String lockerId, Integer number, CompartmentStatus status) {
    }

    public record CommandView(
            String correlationId,
            String lockerId,
            Integer compartmentNumber,
            Long deliveryId,
            CommandPurpose purpose,
            CommandStatus status,
            Instant createdAt,
            Instant openedAt,
            Instant closedAt
    ) {
        public static CommandView from(LockerCommand c) {
            return new CommandView(
                    c.getCorrelationId(), c.getLockerId(), c.getCompartmentNumber(),
                    c.getDeliveryId(), c.getPurpose(), c.getStatus(),
                    c.getCreatedAt(), c.getOpenedAt(), c.getClosedAt()
            );
        }
    }

    public record SystemStatusResponse(
            String backendStatus,
            boolean mqttConnected,
            long totalLockers,
            long onlineLockers,
            long totalCompartments,
            long occupiedCompartments,
            long faultCompartments,
            long expiredDeliveries
    ) {
    }
}
