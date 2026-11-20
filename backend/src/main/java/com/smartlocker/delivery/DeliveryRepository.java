package com.smartlocker.delivery;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DeliveryRepository extends JpaRepository<Delivery, Long> {

    List<Delivery> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);

    List<Delivery> findByCourierIdOrderByCreatedAtDesc(Long courierId);

    List<Delivery> findAllByOrderByCreatedAtDesc();
}
