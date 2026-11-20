package com.smartlocker.delivery;

import com.smartlocker.locker.CompartmentSize;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public final class DeliveryDtos {

    private DeliveryDtos() {
    }

    public record CreateDeliveryRequest(
            @NotBlank(message = "Vui lòng chọn tủ khóa.")
            String lockerId,

            @NotBlank(message = "Vui lòng nhập email hoặc tên đăng nhập người nhận.")
            String recipientIdentifier,

            @NotNull(message = "Vui lòng chọn kích cỡ hàng (SMALL, MEDIUM, LARGE).")
            CompartmentSize packageSize
    ) {
    }

    public record DeliveryResponse(
            Long id,
            String lockerId,
            String lockerName,
            Integer compartmentNumber,
            CompartmentSize packageSize,
            String courierUsername,
            String recipientUsername,
            String recipientFullName,
            DeliveryStatus status,
            Instant createdAt,
            Instant expiresAt,
            Instant pickedUpAt,
            String correlationId
    ) {
        public static DeliveryResponse from(Delivery d) {
            return from(d, null);
        }

        public static DeliveryResponse from(Delivery d, String correlationId) {
            return new DeliveryResponse(
                    d.getId(),
                    d.getCompartment().getLocker().getId(),
                    d.getCompartment().getLocker().getName(),
                    d.getCompartment().getNumber(),
                    d.getPackageSize(),
                    d.getCourier().getUsername(),
                    d.getRecipient().getUsername(),
                    d.getRecipient().getFullName(),
                    d.getStatus(),
                    d.getCreatedAt(),
                    d.getExpiresAt(),
                    d.getPickedUpAt(),
                    correlationId
            );
        }
    }
}
