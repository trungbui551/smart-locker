package com.smartlocker.mqtt;

public enum CommandStatus {
    PENDING_OPEN, // Đã gửi cmd/open, đang chờ door_opened (tối đa 10 giây)
    OPENED,       // Tủ đã báo door_opened, đang chờ đóng cửa
    CLOSED,       // Tủ đã báo door_closed, hoàn tất
    TIMED_OUT,    // Quá 10 giây không nhận được door_opened
    FAULT         // Tủ báo sự kiện fault
}
