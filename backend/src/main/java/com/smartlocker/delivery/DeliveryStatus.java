package com.smartlocker.delivery;

/**
 * Vòng đời đơn giao nhận:
 * STORING (shipper đang bỏ hàng) -> READY (chờ người nhận) -> PICKED_UP (đã nhận) hoặc EXPIRED (quá 72h).
 */
public enum DeliveryStatus {
    STORING,
    READY,
    PICKED_UP,
    EXPIRED
}
