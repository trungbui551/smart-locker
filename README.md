# Smart Locker

Hệ thống tủ khóa thông minh quản lý giao nhận hàng hóa. Đồ án môn Phát triển hệ thống nhúng.

Phần cứng tủ được mô phỏng bằng ESP32 trên Wokwi, giao tiếp với backend qua MQTT.

## Cấu trúc thư mục

| Thư mục | Nội dung |
| --- | --- |
| `backend/` | Spring Boot 3 (Java 21): REST API, MQTT, PostgreSQL, giao diện web (Thymeleaf, PWA) |
| `android/` | Ứng dụng Android (Java) cho người nhận và shipper |
| `desktop/` | Ứng dụng JavaFX cho nhân viên vận hành |
| `firmware/` | Mã ESP32 (Arduino C++) và file mạch Wokwi (`diagram.json`) |
| `docs/` | Tài liệu: SRS, thiết kế, test, nhật ký dùng AI |
| `mosquitto/` | Cấu hình MQTT broker cho môi trường local |

Tài liệu dự án đầy đủ (kế hoạch, SRS, use case, thiết kế, kiểm thử): xem link trong `docs/README.md`.

## Chạy môi trường local

Yêu cầu: JDK 21, Git, Docker Desktop.

```bash
cp .env.example .env        # lần đầu; Windows PowerShell: Copy-Item .env.example .env
docker compose up -d        # bật PostgreSQL và Mosquitto
docker compose ps           # cả hai phải ở trạng thái running
```

Backend (sau khi có mã nguồn trong `backend/`):

```bash
cd backend
./mvnw spring-boot:run      # Windows: mvnw.cmd spring-boot:run
# kiểm tra: http://localhost:8080/actuator/health  ->  {"status":"UP"}
```

## Quy trình làm việc nhóm

Xem [CONTRIBUTING.md](CONTRIBUTING.md). Tóm tắt: không đẩy thẳng lên `main`, mỗi việc một nhánh `feature/...`, mở pull request, có ít nhất một người khác xem trước khi gộp.
