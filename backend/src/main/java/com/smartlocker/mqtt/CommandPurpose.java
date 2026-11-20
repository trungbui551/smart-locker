package com.smartlocker.mqtt;

public enum CommandPurpose {
    DROPOFF, // Shipper mở ngăn bỏ hàng
    PICKUP,  // Người nhận mở ngăn lấy hàng bằng OTP
    MANUAL   // Nhân viên vận hành / Admin mở ngăn thủ công
}
