package com.smartlocker.locker;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * Bảng compartments: từng ngăn tủ (số ngăn 1..9, kích cỡ Nhỏ/Vừa/Lớn, trạng thái FREE/OCCUPIED/FAULT).
 */
@Entity
@Table(name = "compartments")
public class Compartment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "locker_id", nullable = false)
    private Locker locker;

    @Column(nullable = false)
    private Integer number;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CompartmentSize size;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CompartmentStatus status = CompartmentStatus.FREE;

    public Long getId() {
        return id;
    }

    public Locker getLocker() {
        return locker;
    }

    public void setLocker(Locker locker) {
        this.locker = locker;
    }

    public Integer getNumber() {
        return number;
    }

    public void setNumber(Integer number) {
        this.number = number;
    }

    public CompartmentSize getSize() {
        return size;
    }

    public void setSize(CompartmentSize size) {
        this.size = size;
    }

    public CompartmentStatus getStatus() {
        return status;
    }

    public void setStatus(CompartmentStatus status) {
        this.status = status;
    }
}
