# Thông tin thực hiện dự án — Smart Locker

Dự án được thực hiện bởi **1 sinh viên** (toàn bộ các phần từ phân tích yêu cầu, thiết kế giao diện, Backend, Firmware mô phỏng ESP32 trên Wokwi, triển khai Cloud, đóng gói Android & Desktop Windows và kiểm thử).

| Thành viên | Vai trò & Phạm vi phụ trách | Thư mục chính |
|---|---|---|
| **Bùi Quốc Trung** | Toàn bộ hệ thống:<br>• Tài liệu PRD, Tech Spec, Design Spec, MQTT Contract, Nghiệm thu<br>• Backend Spring Boot 3 (Java 21), PostgreSQL 16, JWT/RBAC, OTP đa kênh, MQTT<br>• Firmware ESP32 (C++ / Wokwi: 6 LED, Servo, LCD 16×2, Bàn phím 4×4, 2 nút cảm biến)<br>• Giao diện React (Web PWA) + đóng gói Android (Capacitor `.apk`) + Desktop Windows (Electron `.exe`)<br>• Triển khai công khai (Render + Vercel + EMQX Cloud TLS) | `backend/`, `web/`, `android/`, `desktop/`, `firmware/`, `docs/` |

- **Nhật ký sử dụng AI hỗ trợ:** ghi chép đầy đủ tại `docs/ai-log.md`.
- **Kế hoạch & tiến độ 12 mốc (M0–M11):** xem tại `docs/build-plan.md`.
