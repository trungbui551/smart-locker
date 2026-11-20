package com.smartlocker.delivery;

import com.smartlocker.audit.AuditService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Tác vụ định kỳ kiểm tra các đơn đang READY vượt quá thời hạn lưu hàng 72 giờ
 * và tự động chuyển sang trạng thái EXPIRED để nhân viên vận hành xử lý.
 */
@Component
public class DeliveryExpiryScheduler {

    private static final Logger log = LoggerFactory.getLogger(DeliveryExpiryScheduler.class);

    private final DeliveryRepository deliveryRepository;
    private final AuditService auditService;

    public DeliveryExpiryScheduler(DeliveryRepository deliveryRepository, AuditService auditService) {
        this.deliveryRepository = deliveryRepository;
        this.auditService = auditService;
    }

    @Scheduled(fixedDelayString = "${app.delivery.expiry-check-ms:300000}")
    @Transactional
    public int expireOverdueDeliveries() {
        List<Delivery> overdue = deliveryRepository.findByStatusAndExpiresAtBefore(DeliveryStatus.READY, Instant.now());
        for (Delivery d : overdue) {
            d.setStatus(DeliveryStatus.EXPIRED);
            deliveryRepository.save(d);
            auditService.record(null, "DELIVERY_EXPIRED",
                    "Đơn #" + d.getId() + " vượt quá 72 giờ lưu hàng -> chuyển sang EXPIRED.");
        }
        if (!overdue.isEmpty()) {
            log.info("Da chuyen {} don hang qua han 72 gio sang EXPIRED", overdue.size());
        }
        return overdue.size();
    }
}
