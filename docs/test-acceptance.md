# Báo cáo Nghiệm thu & Kiểm thử An toàn — Smart Locker (M11)

- **Ngày nghiệm thu:** 2026-11-27
- **Người thực hiện:** Bùi Quốc Trung
- **Phạm vi:** Toàn bộ 10 tính năng 🟢 **MUST** trong `docs/prd.md` (v2) + Kiểm thử bảo mật theo `docs/tech-spec.md` mục ⑥.

---

## 1. Kết quả kiểm thử tự động & Build thực tế

| Thành phần | Lệnh kiểm tra | Kết quả thật | Ghi chú |
|---|---|---|---|
| **Backend Spring Boot 3 (Java 21)** | `cd backend; .\mvnw.cmd -B verify` | ✅ **15/15 test xanh** (`BUILD SUCCESS`) | `AuthAndRbacTests`, `LockerAndAllocationTests` (gồm test đồng thời 2 shipper), `OtpAndExpiryTests`, `MqttAndHeartbeatTests` (gồm nhập OTP bàn phím 4×4), `SmartLockerApplicationTests` |
| **Web PWA (React 19 + Tailwind v4)** | `cd web; npm run build` | ✅ **0 lỗi** | Có `manifest.json` + `sw.js`, cài được PWA trên điện thoại |
| **Demo công khai Internet (HTTPS)** | Render + Vercel + EMQX Cloud TLS 8883 | ✅ **Đạt** | Backend sống tại `https://smart-locker-api-hy55.onrender.com/actuator/health`, Web HTTPS trên Vercel, đã test thực tế bằng điện thoại 4G + Wokwi |
| **Android App (Capacitor 8)** | `cd android; .\gradlew.bat assembleDebug` | ✅ **BUILD SUCCESSFUL** | Xuất file `android/app/build/outputs/apk/debug/app-debug.apk` (23.07 MB), khóa chế độ Mobile chỉ hiện `S1–S9` |
| **Desktop Windows (Electron)** | `cd desktop; npm run build:win` | ✅ **Thành công** | Xuất file độc lập `desktop/release/Smart-Locker-Desktop.exe` (81.74 MB), khóa đăng nhập chỉ cho `OPERATOR` & `ADMIN` |

---

## 2. Bảng nghiệm thu 10 tính năng 🟢 MUST (theo `docs/prd.md`)

| # | Tính năng (PRD v2) | Tiêu chí "Done khi" | Kết quả | Bằng chứng kiểm thử |
|---|---|---|---|---|
| **F1** | Đăng ký, Đăng nhập JWT, Quên mật khẩu & Phân quyền 4 vai trò | Tự đăng ký ép cứng `RECIPIENT`; JWT phân quyền 4 vai trò; quên mật khẩu qua Email | ✅ **Đạt** | `AuthAndRbacTests` (4/4 xanh), màn hình `S1–S4` nối API thật |
| **F2** | Shipper chọn tủ & cấp ngăn theo cỡ (Nhỏ/Vừa/Lớn) | Cấp ngăn đúng cỡ; hết ngăn đúng cỡ báo rõ; 2 shipper cùng lúc không cấp trùng | ✅ **Đạt** | `LockerAndAllocationTests` (gồm test đồng thời dùng `PESSIMISTIC_WRITE`), màn hình `S7–S9` |
| **F3** | Mã OTP đa kênh (Web/App + Gmail + SMS), cấp lại & quá hạn 72h | Hạn 24h, dùng 1 lần, sai 3 lần khóa, xin cấp lại có chống spam, quá 72h → `EXPIRED` | ✅ **Đạt** | `OtpAndExpiryTests` (3/3 xanh), màn hình `S5–S6`, không lưu OTP chữ thường trong DB/log |
| **F4** | Giao tiếp tủ qua MQTT (nhiều tủ, timeout 10s, heartbeat offline, lỗi cửa) | Gửi `cmd/open` có `correlationId`; quá 10s → `TIMED_OUT`; mất 3 heartbeat → `OFFLINE`; bỏ qua trùng `correlationId` | ✅ **Đạt** | `MqttAndHeartbeatTests` (4/4 xanh), `PahoMqttGateway` tự nối lại mỗi 10s |
| **F5** | Tủ mô phỏng ESP32 trên Wokwi (≥ 2 tủ, 6–9 ngăn/tủ + Bàn phím 4×4, LCD, Servo) | Kết nối EMQX Cloud TLS 8883; mở ngăn theo lệnh; nhập OTP trực tiếp trên bàn phím 4×4; nút đóng cửa & nút lỗi `fault` | ✅ **Đạt** | Đã chạy thật trên Wokwi kết nối Backend local & Render qua EMQX Cloud |
| **F6** | Nhân viên vận hành & Trang quản lý trạng thái hệ thống | Trang `S10` tự làm mới 5s; sơ đồ ngăn `S11` mở thủ công gửi MQTT thật & đổi `FAULT`; `S12` xử lý đơn; `S13` nhật ký thật | ✅ **Đạt** | Màn hình `S10–S13` nối 100% API thật, tắt Wokwi thấy `S10` báo `OFFLINE` |
| **F7** | Quản trị viên (Admin): tài khoản & cấu hình tủ/ngăn | Tạo/đổi vai trò/khóa-mở khóa tài khoản (chặn tự khóa); thêm tủ mới, thêm ngăn, đổi cỡ ngăn | ✅ **Đạt** | `LockerAndAllocationTests`, màn hình `S14–S15`, mọi thao tác ghi vào `audit_events` |
| **F8** | Ứng dụng Web (PWA — đủ 4 vai trò) | Đủ 15 màn hình `S1–S15` phong cách Navy & Cam 3D, responsive mobile/desktop, cài được PWA | ✅ **Đạt** | Đã triển khai HTTPS trên Vercel, cài được PWA trên điện thoại |
| **F9** | Ứng dụng Android (Capacitor — Người nhận & Shipper) | Đóng gói `.apk` thật, chỉ hiện `S1–S9`, đổi được địa chỉ máy chủ ở `S4`, đồng bộ dữ liệu với Web & Wokwi | ✅ **Đạt** | Đã build & test `app-debug.apk` (23.07 MB) |
| **F10** | Ứng dụng Desktop Windows (Electron — Vận hành & Admin) | Đóng gói `.exe` độc lập, khóa đăng nhập chỉ cho `OPERATOR` & `ADMIN`, mở ngăn thủ công & quản trị có ghi log | ✅ **Đạt** | Đã build & test `Smart-Locker-Desktop.exe` (81.74 MB) |

---

## 3. Kiểm thử An toàn & Bảo mật (Security Checklist)

| Hạng mục bảo mật | Cách kiểm tra | Kết quả |
|---|---|---|
| Không có file `.env` hay bí mật trong Git | `git ls-files .env` trả về rỗng (`False`); quét `git grep` khóa/mật khẩu trả về `0` kết quả | ✅ **An toàn** |
| Mật khẩu người dùng băm BCrypt | Kiểm tra `PasswordEncoder` (`BCryptPasswordEncoder`) trong `SecurityConfig.java` | ✅ **An toàn** |
| Tự đăng ký không thể leo thang lên `ADMIN` | `AuthService.register()` luôn ép cứng `Role.RECIPIENT` (đã test trong `AuthAndRbacTests`) | ✅ **An toàn** |
| Cách ly dữ liệu Người nhận (A không xem được đơn của B) | `DeliveryService.getByIdForUser()` & `OtpService` kiểm tra chủ sở hữu (đã test trong `LockerAndAllocationTests`) | ✅ **An toàn** |
| OTP không lưu chữ thường trong DB hay log | `OtpCryptoHelper` lưu `code_hash` (SHA-256) và `code_encrypted` (AES-256-GCM), `AuditService` tuyệt đối không ghi OTP/mật khẩu | ✅ **An toàn** |
| MQTT Demo công khai bắt buộc xác thực & TLS | Chạy `mosquitto_pub` không mật khẩu tới EMQX Cloud cổng `8883` → nhận lỗi `Connection Refused: bad user name or password` | ✅ **An toàn** |
| HTTPS cho Web & Backend công khai | Render (`https://...onrender.com`) & Vercel (`https://...vercel.app`) mặc định HTTPS + kiểm soát `CORS_ALLOWED_ORIGINS` | ✅ **An toàn** |

---

## 4. Kết luận nghiệm thu

- **10/10 tính năng 🟢 MUST:** ✅ **ĐẠT**
- **7/7 hạng mục bảo mật:** ✅ **ĐẠT**
- **Hệ thống sẵn sàng nộp hồ sơ và trình diễn bảo vệ đồ án.**
