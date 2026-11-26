# AGENTS.md — Luật làm việc cho AI trong dự án Smart Locker

> AI đọc file này ĐẦU TIÊN ở mỗi phiên làm việc. Giữ ngắn gọn, ghi những điều AI hay làm sai.
> (Claude Code đọc tên `CLAUDE.md`; công cụ khác đọc `AGENTS.md`. Có thể giữ một nội dung và đặt tên theo công cụ đang dùng.)

---

## ① Dự án là gì

- **Mô tả 2 câu:** Smart Locker là hệ thống tủ khóa thông minh quản lý giao nhận hàng hóa: shipper bỏ hàng vào ngăn, người nhận dùng mã OTP để mở ngăn lấy hàng. Đây là đồ án môn Phát triển hệ thống nhúng; phần cứng tủ được mô phỏng bằng ESP32 trên Wokwi, giao tiếp với backend qua MQTT.
- **Người viết app không rành code:** giải thích ngắn gọn, bằng lời thường, trước khi làm việc lớn; không dùng thuật ngữ mà không giải nghĩa.
- **Đây là đồ án, người làm phải hiểu và bảo vệ được code:** viết code đơn giản, dễ đọc, có chú thích tiếng Việt ở chỗ khó; không dùng kỹ thuật cầu kỳ nếu cách đơn giản đủ dùng.

---

## ② Tài liệu gốc (đọc theo thứ tự)

1. `docs/prd.md` — yêu cầu, là nguồn sự thật
2. `docs/tech-spec.md` — công nghệ và dữ liệu
3. `docs/build-plan.md` — đang làm mốc nào
4. `docs/mqtt-contract.md` — hợp đồng MQTT giữa backend và tủ (backend và firmware cùng tuân theo)
5. `docs/design-spec.md` — màn hình và luồng (khi làm giao diện; file này chưa có thì hỏi tôi)

> Nếu code và tài liệu mâu thuẫn: DỪNG và hỏi, không tự chọn.

---

## ③ Quy tắc làm việc

- ✅ Đọc mốc hiện tại trong `docs/build-plan.md` trước khi làm
- ✅ Trước khi code: tóm tắt kế hoạch tối đa 5 dòng, nêu câu hỏi, chờ tôi đồng ý
- ✅ Chỉ làm đúng 1 mốc mỗi lần
- ✅ Viết test cho logic nghiệp vụ mới (OTP, cấp ngăn, phân quyền) cùng lúc với code, không để sau
- ✅ Sau khi code: chạy app và chạy test, báo kết quả THẬT (không nói "chắc là chạy được")
- ✅ Gặp chỗ PRD không rõ → HỎI, không tự đoán
- ✅ Đổi topic hoặc định dạng JSON của MQTT → sửa `docs/mqtt-contract.md` trong cùng thay đổi và báo tôi
- ✅ Mỗi lần sinh hoặc sửa code đáng kể → thêm một dòng vào `docs/ai-log.md` (ngày, việc, prompt chính tóm tắt, tôi đã sửa gì)
- ❌ Không thêm tính năng ngoài PRD, kể cả khi thấy "hay"
- ❌ Không đổi công nghệ đã chốt trong `docs/tech-spec.md` khi chưa hỏi
- ❌ Không xóa file, xóa dữ liệu hoặc chạy lệnh nguy hiểm khi chưa hỏi
- ❌ Không ghi mật khẩu, khóa, token vào code hay vào chat; chỉ dùng `.env` (đã nằm trong `.gitignore`)
- ❌ Không bật `allow_anonymous` của Mosquitto cho môi trường demo công khai (file cấu hình hiện tại CHỈ cho local)
- ❌ Không đẩy thẳng lên `main`

---

## ④ Lệnh thường dùng

| Việc | Lệnh |
|---|---|
| Tạo file cấu hình lần đầu | `cp .env.example .env` (PowerShell: `Copy-Item .env.example .env`) |
| Bật PostgreSQL và Mosquitto | `docker compose up -d` |
| Kiểm tra hai dịch vụ đang chạy | `docker compose ps` |
| Chạy backend | `cd backend` rồi `./mvnw spring-boot:run` (Windows: `mvnw.cmd spring-boot:run`) |
| Kiểm tra backend sống | mở `http://localhost:8080/actuator/health`, thấy `{"status":"UP"}` |
| Build và chạy test backend | `cd backend` rồi `./mvnw -B verify` |
| Chạy Android | `cd web; $env:VITE_APP_MODE="mobile"; npm run build; npx cap sync android` rồi `cd ..\android; .\gradlew.bat assembleDebug` |
| Chạy desktop JavaFX | [điền khi khởi tạo `desktop/`] |
| Chạy mô phỏng tủ | Mở `firmware/` trong Wokwi (`diagram.json`); AI không chạy được Wokwi, tôi sẽ chạy tay |

---

## ⑤ Quy ước code

- **Ngôn ngữ / framework:** theo `docs/tech-spec.md` (backend: Spring Boot 3, Java 21)
- **Thư mục:** `backend/`, `android/`, `desktop/`, `firmware/`, `docs/`, `mosquitto/`
- **Chú thích:** viết tiếng Việt ở chỗ khó hiểu
- **File và hàm ngắn, mỗi cái làm một việc**
- **Tên mã (class, hàm, biến, bảng):** tiếng Anh; chữ hiển thị cho người dùng: tiếng Việt

---

## ⑥ Cách báo cáo sau mỗi mốc

1. **Đã làm gì** (lời thường)
2. **Cách tôi tự thử** (từng bước bấm / từng lệnh)
3. **Chưa làm / còn lỗi**
4. **Gợi ý bước tiếp theo**

---

## ⑦ Git

- Mỗi việc một nhánh `feature/<viec>` hoặc `fix/<viec>`, tách từ `main`
- Commit theo dạng `loai(pham-vi): mo ta ngan` với loại là `feat`, `fix`, `test`, `docs`, `refactor`, `chore`
- Mốc xong, chạy được và tôi xác nhận → mới commit
- Không commit file `.env`
- Điền mẫu pull request (`.github/pull_request_template.md`) khi mở PR

---

## Changelog

| Ngày | Thay đổi | Lý do |
|---|---|---|
| 2026-11-20 | v1 — draft đầu tiên | Áp dụng quy trình dựa trên tài liệu vào repo hiện có |