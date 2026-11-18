# Phân công đề xuất cho nhóm 3 người (chỉnh lại cho phù hợp)

| Người | Phụ trách chính | Thư mục |
| --- | --- | --- |
| A | Backend: API, cơ sở dữ liệu, OTP, MQTT phía server, bảo mật | `backend/` |
| B | Ứng dụng khách: Android, web PWA, desktop JavaFX | `android/`, `desktop/`, giao diện trong `backend/` |
| C | Nhúng và kiểm thử: firmware ESP32 trên Wokwi, kiểm thử hệ thống, an toàn, tài liệu bàn giao | `firmware/`, `docs/` |

Phần chung: SRS, thiết kế, hợp đồng MQTT (`docs/mqtt-contract.md`) do cả nhóm chốt trong tuần đầu.
Mỗi người vẫn tự viết unit test cho phần mình.
