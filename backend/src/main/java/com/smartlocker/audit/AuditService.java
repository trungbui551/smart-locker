package com.smartlocker.audit;

import org.springframework.stereotype.Service;

/**
 * Dịch vụ ghi nhật ký thao tác an toàn vào bảng audit_events.
 */
@Service
public class AuditService {

    private final AuditEventRepository auditEventRepository;

    public AuditService(AuditEventRepository auditEventRepository) {
        this.auditEventRepository = auditEventRepository;
    }

    public void record(Long actorId, String action, String detail) {
        AuditEvent event = new AuditEvent();
        event.setActorId(actorId);
        event.setAction(action);
        event.setDetail(detail);
        auditEventRepository.save(event);
    }
}
