// Cấu hình tủ khóa mô phỏng L02 trên Wokwi (Cách 1: HiveMQ Cloud / EMQX Cloud có mật khẩu + TLS)
// Lưu ý bảo mật: KHÔNG commit mật khẩu thật lên GitHub. Chỉ điền mật khẩu khi chạy trên trình duyệt Wokwi.

#pragma once

// Mã định danh tủ (trùng với lockers.id trong Backend)
#define LOCKER_ID "L02"

// Mạng Wi-Fi mặc định của Wokwi
#define WIFI_SSID "Wokwi-GUEST"
#define WIFI_PASSWORD ""

// Thông tin MQTT Broker có xác thực (EMQX Cloud Serverless Free — cổng 8883 TLS)
#define MQTT_HOST "your-cluster.ala.asia-southeast1.emqxsl.com"
#define MQTT_PORT 8883
#define MQTT_USE_TLS true
#define MQTT_USER "change-me-user"
#define MQTT_PASS "change-me-pass"

// Tiền tố ngẫu nhiên cho topic (để khớp 100% với MQTT_TOPIC_PREFIX trong file .env của Backend)
#define MQTT_TOPIC_PREFIX "sl-demo-change-me/"

// Chu kỳ gửi nhịp sống heartbeat (ms) — khớp với Backend (10 giây; mất 3 nhịp -> OFFLINE)
#define HEARTBEAT_INTERVAL_MS 10000
