package com.smartlocker.delivery;

import com.smartlocker.audit.AuditService;
import com.smartlocker.auth.Role;
import com.smartlocker.auth.User;
import com.smartlocker.auth.UserRepository;
import com.smartlocker.locker.Compartment;
import com.smartlocker.locker.CompartmentRepository;
import com.smartlocker.locker.CompartmentStatus;
import com.smartlocker.locker.Locker;
import com.smartlocker.locker.LockerRepository;
import com.smartlocker.locker.LockerStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Nghiệp vụ cấp ngăn theo kích cỡ và quản lý đơn giao nhận (M2).
 * Sử dụng khóa bi quan (PESSIMISTIC_WRITE) để 2 shipper gửi cùng lúc không bao giờ bị cấp trùng ngăn.
 */
@Service
public class DeliveryService {

    private static final long STORAGE_HOURS = 72;

    private final LockerRepository lockerRepository;
    private final CompartmentRepository compartmentRepository;
    private final DeliveryRepository deliveryRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public DeliveryService(
            LockerRepository lockerRepository,
            CompartmentRepository compartmentRepository,
            DeliveryRepository deliveryRepository,
            UserRepository userRepository,
            AuditService auditService
    ) {
        this.lockerRepository = lockerRepository;
        this.compartmentRepository = compartmentRepository;
        this.deliveryRepository = deliveryRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional
    public DeliveryDtos.DeliveryResponse allocateAndCreate(User courier, DeliveryDtos.CreateDeliveryRequest request) {
        if (courier.getRole() != Role.COURIER) {
            throw new IllegalStateException("Chỉ tài khoản Shipper mới được phép tạo đơn gửi hàng.");
        }

        Locker locker = lockerRepository.findById(request.lockerId().trim().toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tủ khóa: " + request.lockerId()));

        if (locker.getStatus() != LockerStatus.ONLINE) {
            throw new IllegalArgumentException("Tủ " + locker.getId() + " đang ngoại tuyến, không thể cấp ngăn mới.");
        }

        String recipientIdOrEmail = request.recipientIdentifier().trim();
        User recipient = (recipientIdOrEmail.contains("@")
                ? userRepository.findByEmailIgnoreCase(recipientIdOrEmail)
                : userRepository.findByUsernameIgnoreCase(recipientIdOrEmail))
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người nhận: " + recipientIdOrEmail));

        // Khóa dòng ngăn trống đúng cỡ để chống 2 shipper cấp trùng ngăn
        List<Compartment> freeList = compartmentRepository.findAvailableForUpdate(
                locker.getId(), request.packageSize(), CompartmentStatus.FREE
        );
        if (freeList.isEmpty()) {
            throw new IllegalArgumentException(
                    "Tủ " + locker.getId() + " đã hết ngăn trống cỡ " + request.packageSize().getLabelVi() + "."
            );
        }

        Compartment allocated = freeList.getFirst();
        allocated.setStatus(CompartmentStatus.OCCUPIED);
        compartmentRepository.save(allocated);

        Delivery delivery = new Delivery();
        delivery.setCourier(courier);
        delivery.setRecipient(recipient);
        delivery.setCompartment(allocated);
        delivery.setPackageSize(request.packageSize());
        delivery.setStatus(DeliveryStatus.STORING);
        delivery.setExpiresAt(Instant.now().plus(STORAGE_HOURS, ChronoUnit.HOURS));
        Delivery saved = deliveryRepository.save(delivery);

        auditService.record(
                courier.getId(),
                "ALLOCATE_COMPARTMENT",
                "Cấp " + locker.getId() + " ngăn #" + allocated.getNumber()
                        + " (cỡ " + request.packageSize().getLabelVi() + ") cho đơn #" + saved.getId()
        );

        return DeliveryDtos.DeliveryResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<DeliveryDtos.DeliveryResponse> listForCurrentUser(User currentUser) {
        List<Delivery> list = switch (currentUser.getRole()) {
            case RECIPIENT -> deliveryRepository.findByRecipientIdOrderByCreatedAtDesc(currentUser.getId());
            case COURIER -> deliveryRepository.findByCourierIdOrderByCreatedAtDesc(currentUser.getId());
            case OPERATOR, ADMIN -> deliveryRepository.findAllByOrderByCreatedAtDesc();
        };
        return list.stream().map(DeliveryDtos.DeliveryResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public DeliveryDtos.DeliveryResponse getByIdForUser(Long deliveryId, User currentUser) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng #" + deliveryId));

        boolean allowed = switch (currentUser.getRole()) {
            case ADMIN, OPERATOR -> true;
            case RECIPIENT -> delivery.getRecipient().getId().equals(currentUser.getId());
            case COURIER -> delivery.getCourier().getId().equals(currentUser.getId());
        };
        if (!allowed) {
            throw new IllegalStateException("Bạn không có quyền xem đơn hàng của người khác.");
        }
        return DeliveryDtos.DeliveryResponse.from(delivery);
    }
}
