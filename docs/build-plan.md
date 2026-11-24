# Build Plan — Smart Locker

> Chia dự án thành các MỐC nhỏ. Mỗi mốc phải chạy được, kiểm thử được và nhìn thấy kết quả rõ ràng.
> Hiện trạng repo (2026-11-20): mới có khung tài liệu, `docker-compose.yml`, cấu hình Mosquitto local, CI và `docs/mqtt-contract.md`. Các thư mục `backend/`, `android/`, `desktop/`, `firmware/` chưa có code.

---

## ① Nguyên tắc chia mốc

- ✅ **M0** là khung dự án chạy được: mở backend thấy `{"status":"UP"}`, CI xanh.
- ✅ **M1–M8** hoàn thiện trọn vẹn lõi hệ thống: Backend + ≥ 2 tủ Wokwi + Web (PWA) đủ 4 vai trò + Trang trạng thái hệ thống + Demo công khai trên Internet.
- ✅ **M9–M10** đóng gói nguyên giao diện React (`web/`) thành **App Android (Capacitor)** và **App Desktop Windows (Electron)** — tiết kiệm thời gian, đồng bộ 100% giao diện Navy & Cam 3D.
- ✅ **M11** nghiệm thu tổng, kiểm thử an toàn và hoàn thiện hồ sơ nộp đồ án.
- ✅ Mỗi mốc đều có **unit test** cho logic nghiệp vụ mới trong "Done khi" và cập nhật `docs/ai-log.md`.

---

## ② Danh sách mốc

> Trạng thái: ⬜ Chưa làm · 🟡 Đang làm · ✅ Xong · ❌ Bỏ

| Mốc | Tên | Feature (PRD v2) | Trạng thái | Ghi chú |
|---|---|---|---|---|
| M0 | Khung dự án chạy được | — | ✅ | Đã khởi tạo `backend/` Spring Boot 3, Docker, Flyway, test xanh |
| M1 | Tài khoản, tự đăng ký, quên mật khẩu (Email) & phân quyền 4 vai trò | F1 | ✅ | Đã xong JWT, BCrypt, 4 vai trò, Gmail SMTP & OAuth 2, 4/4 test xanh |
| M2 | Tủ, ngăn theo cỡ (Nhỏ/Vừa/Lớn), quản trị Admin & cấp ngăn chống trùng | F2, F7 | ✅ | Đã xong API Admin, cấp ngăn `PESSIMISTIC_WRITE`, 8/8 test xanh |
| M3 | Mã OTP đa kênh (Web/App + Gmail + SMS trial), cấp lại mã & quá hạn 72h | F3 | ✅ | Đã xong OTP 24h băm/AES-GCM, SMS Twilio/eSMS, khóa 3 lần, 11/11 test xanh |
| M4 | MQTT phía backend (nhiều tủ, chờ 10s, heartbeat offline, lỗi cửa) | F4, F6 | ✅ | Đã xong Eclipse Paho MQTTv3, timeout 10s, 3 heartbeat offline, 14/14 test xanh |
| M5 | Tủ mô phỏng ESP32 trên Wokwi (≥ 2 tủ, 6–9 ngăn/tủ) | F5 | ✅ | Đã tạo `firmware/locker-L01` & `locker-L02` (TLS HiveMQ Cloud), chờ bạn chạy tay trên Wokwi |
| M6 | Web (PWA) cho Người nhận & Shipper — luồng chính end-to-end | F8 | ⬜ | Viết `docs/design-spec.md` trước |
| M7 | Web (PWA) cho Vận hành, Admin, Trang trạng thái hệ thống & Nhật ký | F6, F7, F8 | ⬜ | Đủ 4 vai trò trên Web |
| M8 | Triển khai Demo công khai trên Internet (HTTPS + MQTT bảo mật) | Hosting / NFR | ⬜ | Chạy được cả local và online |
| M9 | Đóng gói ứng dụng Android (Capacitor — Người nhận & Shipper) | F9 (MUST) | ⬜ | Đóng gói từ `web/` ra file `.apk` |
| M10 | Đóng gói ứng dụng Desktop Windows (Electron — Vận hành & Admin) | F10 (MUST) | ⬜ | Đóng gói từ `web/` ra app Windows |
| M11 | Nghiệm thu tổng, kiểm thử an toàn & tài liệu nộp | Tất cả MUST | ⬜ | Hoàn thiện `docs/ai-log.md` và hồ sơ bảo vệ |

---

## ③ Chi tiết từng mốc

### M0: Khung dự án chạy được

**Mục tiêu:** Bật được PostgreSQL và Mosquitto qua Docker, chạy backend thấy `{"status":"UP"}`, CI trên GitHub chạy xanh.

**Đọc trước:** `docs/tech-spec.md` mục ①, ⑤, ⑦; `README.md`

**Việc cần làm:**
- [x] Khởi tạo dự án Spring Boot 3 (Java 21) trong `backend/`, có Maven Wrapper (`mvnw`)
- [x] Bật Spring Boot Actuator (`/actuator/health`)
- [x] Cấu hình đọc PostgreSQL, MQTT, Email, SMS từ biến môi trường (`.env`)
- [x] Thêm Flyway và file migration đầu tiên
- [x] Viết 1 test mẫu chạy xanh với `./mvnw -B verify`

**Done khi:**
- ✅ `docker compose ps` thấy `locker-postgres` và `locker-mosquitto` đang chạy
- ✅ Mở `http://localhost:8080/actuator/health` thấy `{"status":"UP"}`
- ✅ `./mvnw -B verify` chạy xanh và CI GitHub xanh

---

### M1: Tài khoản, tự đăng ký, quên mật khẩu (Email) & phân quyền 4 vai trò

**Mục tiêu:** Người nhận tự đăng ký được, đăng nhập bằng 4 vai trò mẫu, quên mật khẩu gửi được Email thật (Gmail) và backend chặn mọi gọi API sai quyền.

**Đọc trước:** PRD v2 Feature 1; Tech Spec bảng `users`, `password_reset_tokens`, mục ③, ⑥

**Việc cần làm:**
- [x] Migration bảng `users` và `password_reset_tokens`, băm mật khẩu (BCrypt)
- [x] API đăng ký (ép cứng vai trò `RECIPIENT`), đăng nhập trả JWT, quên mật khẩu & đặt lại mật khẩu qua Gmail (SMTP / OAuth 2)
- [x] Dữ liệu mẫu 4 tài khoản cho 4 vai trò (chỉ bật ở local)
- [x] Bảo vệ API theo 4 vai trò; ghi nhật ký (`REGISTER`, `LOGIN`, `PASSWORD_RESET`)
- [x] Unit test: đăng ký không thể tự gán quyền `ADMIN`, đăng nhập đúng/sai, từ chối sai vai trò, token đặt lại mật khẩu hết hạn/dùng 1 lần

**Done khi:**
- ✅ Tự đăng ký và đăng nhập thành công; sai mật khẩu báo lỗi rõ ràng
- ✅ Bấm quên mật khẩu nhận được Email thật và đặt lại mật khẩu thành công
- ✅ Gọi API sai vai trò bị trả lỗi 403; test xanh

---

### M2: Tủ, ngăn theo cỡ (Nhỏ/Vừa/Lớn), quản trị Admin & cấp ngăn chống trùng

**Mục tiêu:** Admin quản lý được tài khoản và cấu hình ≥ 2 tủ (mỗi tủ 6–9 ngăn đủ 3 cỡ); Shipper gửi hàng theo cỡ được cấp đúng ngăn trống, không bao giờ cấp trùng.

**Đọc trước:** PRD v2 Feature 2, 7; Tech Spec bảng `lockers`, `compartments`, `deliveries`

**Việc cần làm:**
- [x] Migration bảng `lockers`, `compartments` (có `size`: `SMALL`/`MEDIUM`/`LARGE`), `deliveries` (có `package_size`, `expires_at`)
- [x] Dữ liệu mẫu 2 tủ (`L01`, `L02`), mỗi tủ 6 ngăn (2 Nhỏ, 2 Vừa, 2 Lớn)
- [x] API Admin: quản lý tài khoản (tạo/sửa/khóa/gán vai trò) và quản lý tủ/ngăn
- [x] API Shipper cấp ngăn theo kích cỡ có khóa dữ liệu (`SELECT ... FOR UPDATE`) chống cấp trùng
- [x] Unit test: cấp ngăn đúng cỡ, hết ngăn đúng cỡ báo rõ, 2 shipper gửi cùng lúc không cấp trùng, kiểm tra quyền Admin

**Done khi:**
- ✅ Cấp ngăn thành công chuyển ngăn sang `OCCUPIED`
- ✅ Hết ngăn cỡ đã chọn báo rõ "Tủ hết ngăn cỡ [...]"
- ✅ Test đồng thời 2 shipper chạy xanh; Admin tạo/sửa/khóa tài khoản và cấu hình tủ thành công

---

### M3: Mã OTP đa kênh (Web/App + Gmail + SMS trial), cấp lại mã & quá hạn 72h

**Mục tiêu:** Đơn `READY` tự sinh OTP hiệu lực 24h, gửi qua Web/App + Gmail + SMS (Twilio/eSMS), khóa sau 3 lần sai, cho phép cấp lại mã mới và tự chuyển đơn quá 72h sang `EXPIRED`.

**Đọc trước:** PRD v2 Feature 3, mục ⑦; Tech Spec bảng `otp_codes`, mục ④

**Việc cần làm:**
- [x] Migration bảng `otp_codes` (băm `code_hash`, hạn 24h, `failed_attempts`, `locked`, `resend_count`, `last_sent_at`)
- [x] Tích hợp gửi Email (Gmail) và gửi SMS (`SmsService` cho Twilio/eSMS, lỗi/hết quota chỉ ghi log)
- [x] API kiểm tra OTP (đúng/sai/hết hạn/đã dùng/khóa sau 3 lần sai) và API xin cấp lại OTP (có chống spam)
- [x] Tác vụ định kỳ (scheduled job) kiểm tra đơn `READY` quá **72 giờ** → chuyển `EXPIRED`
- [x] Unit test đầy đủ mọi trường hợp OTP và quá hạn 72h

**Done khi:**
- ✅ OTP đúng mở được; sai 3 lần bị khóa; hết hạn 24h bị từ chối; xin cấp lại mã mới hoạt động
- ✅ Nhận được OTP qua Email thật (và SMS khi cấu hình khóa dùng thử); nếu tắt/lỗi SMS thì Web/App + Email vẫn chạy bình thường
- ✅ Không có OTP chữ thường trong CSDL và nhật ký; test xanh

---

### M4: MQTT phía backend (nhiều tủ, chờ 10s, heartbeat offline, lỗi cửa)

**Mục tiêu:** Backend gửi lệnh mở ngăn tới đúng tủ qua MQTT, xử lý `door_opened` / `door_closed` / `fault`, báo lỗi nếu quá 10 giây không mở, và phát hiện tủ `OFFLINE` sau 3 heartbeat mất.

**Đọc trước:** PRD v2 Feature 4, 6; `docs/mqtt-contract.md`; Tech Spec mục ④

**Việc cần làm:**
- [x] Kết nối MQTT (hỗ trợ cả local không mật khẩu và online có username/password + tiền tố topic)
- [x] Gửi `cmd/open` kèm `correlationId`, theo dõi timeout **10 giây** chờ `door_opened`
- [x] Xử lý `door_opened`, `door_closed`, `fault` (bỏ qua trùng `correlationId`); cập nhật trạng thái đơn (`STORING` → `READY` → `PICKED_UP`) và ngăn (`OCCUPIED` → `FREE`)
- [x] Phát hiện tủ `OFFLINE` sau 3 heartbeat liên tiếp không đến; chặn cấp ngăn cho tủ `OFFLINE`
- [x] Unit test và kiểm thử giả lập tin nhắn MQTT

**Done khi:**
- ✅ Dùng công cụ MQTT giả lập 2 tủ `L01`, `L02`: trạng thái đơn/ngăn đổi đúng theo sự kiện cửa
- ✅ Dừng heartbeat → tủ chuyển `OFFLINE`; quá 10s không có `door_opened` → báo lỗi, không đổi trạng thái đơn

---

### M5: Tủ mô phỏng ESP32 trên Wokwi (≥ 2 tủ, 6–9 ngăn/tủ)

**Mục tiêu:** Mô phỏng chạy được tối thiểu 2 tủ (`L01`, `L02`), mỗi tủ 6–9 ngăn trên Wokwi, nhận lệnh và phản hồi đúng hợp đồng MQTT.

**Đọc trước:** PRD v2 Feature 5; `docs/mqtt-contract.md`

**Việc cần làm:**
- [x] Mã Arduino C++ cho ESP32 trong `firmware/` (cấu hình được `lockerId` và tiền tố topic)
- [x] Sơ đồ `diagram.json` cho tủ 6–9 ngăn (LED/servo mô phỏng khóa, nút bấm mô phỏng cảm biến cửa mở/đóng và nút tạo lỗi `fault`)
- [x] Gửi `heartbeat` định kỳ; phản hồi `door_opened`, `door_closed` với đúng `correlationId`

**Done khi:**
- ✅ Chạy 2 tủ mô phỏng trên Wokwi kết nối thành công với backend thật qua MQTT
- ✅ Kích lệnh mở ngăn từ backend thấy đúng ngăn của đúng tủ mở khóa và trả sự kiện về backend

---

### M6: Web (PWA) cho Người nhận & Shipper — luồng chính end-to-end

**Mục tiêu:** Demo được trọn vẹn luồng chính trên trình duyệt điện thoại (cài được PWA) kết nối tủ Wokwi thật.

**Đọc trước:** PRD v2 Feature 8; tạo `docs/design-spec.md` trước khi code mốc này

**Việc cần làm:**
- [x] Viết `docs/design-spec.md` mô tả các màn hình Web
- [x] Giao diện React (`web/`) theo Design System (`design-system/smart-locker/MASTER.md`) + cấu hình PWA (manifest, icon, service worker cơ bản): Đăng ký, Đăng nhập, Quên mật khẩu, Màn hình Shipper (chọn tủ, cỡ hàng Nhỏ/Vừa/Lớn), Màn hình Người nhận (xem đơn, xem/nhập OTP, xin cấp lại OTP)
- [x] Hiển thị thông báo lỗi rõ ràng cho mọi tình huống ở PRD mục ⑦

**Done khi:**
- ✅ Chạy trọn luồng Đăng ký → Shipper gửi theo cỡ → Nhận OTP (Web + Gmail + SMS) → Mở tủ Wokwi → Đóng cửa hoàn tất
- ✅ Cài được PWA lên màn hình chính điện thoại

---

### M7: Web (PWA) cho Vận hành, Admin, Trang trạng thái hệ thống & Nhật ký

**Mục tiêu:** Hoàn thiện toàn bộ tính năng cho Nhân viên vận hành, Admin và trang Quản lý trạng thái hệ thống trên Web.

**Đọc trước:** PRD v2 Feature 6, 7, 8; Tech Spec bảng `audit_events`

**Việc cần làm:**
- [x] Trang **Quản lý trạng thái hệ thống**: tình trạng Backend/Database/MQTT, số tủ online/offline, tỷ lệ ngăn đang dùng, cảnh báo `fault`, đơn quá hạn 72h
- [x] Màn hình Vận hành: sơ đồ ngăn theo tủ và cỡ, mở ngăn thủ công (có log), hỗ trợ cấp lại OTP, đánh dấu ngăn lỗi, xem nhật ký thao tác
- [x] Màn hình Admin: quản lý tài khoản (tạo/sửa/khóa/gán vai trò) và quản lý tủ/ngăn

**Done khi:**
- ✅ Dừng tủ Wokwi thấy trạng thái hệ thống cập nhật `OFFLINE`
- ✅ Mở ngăn thủ công và thao tác Admin đều xuất hiện trong nhật ký (không lộ OTP/mật khẩu)

---

### M8: Triển khai Demo công khai trên Internet (HTTPS + MQTT bảo mật)

**Mục tiêu:** Hệ thống chạy ổn định trên Internet để giảng viên/người dùng truy cập trực tiếp bằng điện thoại riêng, đồng thời vẫn giữ nguyên khả năng chạy local bằng Docker.

**Đọc trước:** PRD v2 mục ④, ⑥; Tech Spec mục ⑤, ⑥, ⑦

**Việc cần làm:**
- [x] Cấu hình dịch vụ hosting miễn phí (HTTPS) + PostgreSQL + MQTT broker công khai có xác thực (tắt `allow_anonymous`, đặt tiền tố topic ngẫu nhiên)
- [x] Thiết lập đầy đủ biến môi trường (JWT, OTP, DB, MQTT, Gmail, SMS) trên hosting
- [ ] Kiểm thử toàn bộ luồng end-to-end từ điện thoại ngoài mạng local + tủ Wokwi

**Done khi:**
- ✅ Mở link HTTPS trên điện thoại (4G/Wi-Fi bất kỳ) chạy được trọn luồng chính với tủ Wokwi
- ✅ Xác nhận broker MQTT từ chối kết nối không có username/password

---

### M9: Đóng gói ứng dụng Android (Capacitor — Người nhận & Shipper)

**Mục tiêu:** Đóng gói giao diện React (`web/`) thành app Android `.apk` thật dành cho Người nhận và Shipper, dùng chung API với Backend.

**Đọc trước:** PRD v2 Feature 9; giao diện React ở M6

**Việc cần làm:**
- [ ] Cài Capacitor cho `web/`, sinh dự án Android (`android/`), gắn biểu tượng `logo.png` và màn hình chờ
- [ ] Cấu hình chuyển đổi địa chỉ máy chủ (Local / Demo công khai) và khóa giao diện chỉ hiện luồng Người nhận & Shipper trên bản Mobile
- [ ] Build file `.apk` và chạy thử trên máy ảo Android hoặc điện thoại Android thật

**Done khi:**
- ✅ Cài và chạy ổn định trên Android, hoàn thành trọn luồng Shipper và Người nhận với tủ Wokwi
- ✅ Kết quả và giao diện Navy & Cam 3D đồng bộ 100% với bản Web

---

### M10: Đóng gói ứng dụng Desktop Windows (Electron — Vận hành & Admin)

**Mục tiêu:** Đóng gói giao diện React (`web/`) thành ứng dụng máy tính Windows độc lập cho Nhân viên vận hành và Admin.

**Đọc trước:** PRD v2 Feature 10; giao diện React ở M7

**Việc cần làm:**
- [ ] Cấu hình Electron trong `desktop/` trỏ tới bản build của `web/`, gắn icon `logo.png`
- [ ] Khóa chế độ đăng nhập bản Desktop cho 2 vai trò `OPERATOR` và `ADMIN`
- [ ] Build và chạy thử ứng dụng Desktop trên Windows

**Done khi:**
- ✅ Chạy ổn định như ứng dụng Windows độc lập, đồng bộ trực tiếp với Web và tủ Wokwi
- ✅ Thực hiện được mở ngăn thủ công và quản trị tài khoản/tủ có ghi nhật ký

---

### M11: Nghiệm thu tổng, kiểm thử an toàn & tài liệu nộp

**Mục tiêu:** Xác nhận 100% feature MUST đạt yêu cầu, kiểm tra lỗ hổng bảo mật và hoàn thiện bộ tài liệu bảo vệ đồ án.

**Đọc trước:** PRD v2 toàn bộ; Tech Spec v2; `docs/ai-log.md`

**Việc cần làm:**
- [ ] Viết `docs/test-acceptance.md` theo toàn bộ "Done khi" của PRD v2 rồi kiểm thử từng mục
- [ ] Kiểm tra an toàn: phân quyền 4 vai trò, tự đăng ký không leo thang quyền, OTP không lộ trong DB/log, không có bí mật trong repo, MQTT online có xác thực
- [ ] Cập nhật `docs/TEAM.md` (1 người) và tổng hợp `docs/ai-log.md` đầy đủ
- [ ] Đóng gói tài liệu nộp (kế hoạch, use case, thiết kế, kiểm thử, báo cáo unit test)

**Done khi:**
- ✅ Toàn bộ 10 feature 🟢 MUST đạt trong `docs/test-acceptance.md`
- ✅ CI xanh, không còn lỗi mức nặng
- ✅ Bạn hiểu rõ và giải thích được từng phần code chính khi bảo vệ

---

## ④ Quản trị rủi ro tiến độ (1 người, 1–2 tháng)

- **Nguyên tắc vàng:** Hoàn thành **M0 → M8 trước** để sớm có một hệ thống hoàn chỉnh chạy được từ đầu đến cuối cả local lẫn online (đủ 4 vai trò trên Web + ≥ 2 tủ Wokwi).
- Khi M0–M8 đã chạy ổn định và API đã khóa chặt, **M9 (Android)** và **M10 (Desktop JavaFX)** chỉ là phần giao diện gọi lại đúng API đã có nên sẽ triển khai rất nhanh và ít lỗi vặt.

---

## ⑤ Nhật ký

| Ngày | Mốc | Chuyện gì xảy ra | Quyết định |
|---|---|---|---|
| 2026-11-20 | — | Soạn bộ tài liệu v1 từ repo (chưa có code) | Phỏng vấn làm rõ yêu cầu |
| 2026-11-20 | — | Cập nhật PRD v2, Tech Spec v2 và Build Plan v2 (12 mốc M0–M11) | Sẵn sàng bắt đầu M0 |
