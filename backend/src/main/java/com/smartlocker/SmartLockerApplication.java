package com.smartlocker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

/**
 * Điểm khởi chạy chính của máy chủ Backend Smart Locker (Spring Boot 3, Java 21).
 */
@SpringBootApplication
public class SmartLockerApplication {

    public static void main(String[] args) {
        // Chuẩn hóa múi giờ sang Asia/Ho_Chi_Minh (tránh lỗi Asia/Saigon trên Windows khi nối PostgreSQL 16)
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        SpringApplication.run(SmartLockerApplication.class, args);
    }
}
