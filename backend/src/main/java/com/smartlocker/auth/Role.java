package com.smartlocker.auth;

/**
 * 4 vai trò chính thức trong hệ thống Smart Locker theo docs/prd.md (v2).
 */
public enum Role {
    RECIPIENT, // Người nhận hàng
    COURIER,   // Shipper gửi hàng
    OPERATOR,  // Nhân viên vận hành
    ADMIN      // Quản trị viên hệ thống
}
