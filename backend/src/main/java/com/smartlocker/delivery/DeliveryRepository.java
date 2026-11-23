package com.smartlocker.delivery;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface DeliveryRepository extends JpaRepository<Delivery, Long> {

    List<Delivery> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);

    List<Delivery> findByCourierIdOrderByCreatedAtDesc(Long courierId);

    List<Delivery> findAllByOrderByCreatedAtDesc();

    List<Delivery> findByStatusAndExpiresAtBefore(DeliveryStatus status, Instant cutoff);

    List<Delivery> findByCompartmentLockerIdAndStatus(String lockerId, DeliveryStatus status);
}
