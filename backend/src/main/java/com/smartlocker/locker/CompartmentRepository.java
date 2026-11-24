package com.smartlocker.locker;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CompartmentRepository extends JpaRepository<Compartment, Long> {

    List<Compartment> findByLockerIdOrderByNumberAsc(String lockerId);

    Optional<Compartment> findByLockerIdAndNumber(String lockerId, Integer number);

    /**
     * Tìm các ngăn đang trống đúng kích cỡ và KHÓA DỮ LIỆU (SELECT ... FOR UPDATE)
     * để 2 shipper gửi cùng lúc không bao giờ bị cấp trùng 1 ngăn.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT c FROM Compartment c
            WHERE c.locker.id = :lockerId
              AND c.size = :size
              AND c.status = :status
            ORDER BY c.number ASC
            """)
    List<Compartment> findAvailableForUpdate(
            @Param("lockerId") String lockerId,
            @Param("size") CompartmentSize size,
            @Param("status") CompartmentStatus status
    );
}
