# Tech Spec — Smart Locker

> Phần này AI ĐỀ XUẤT, bạn DUYỆT. Chỗ nào lấy từ repo hiện có thì ghi "Có sẵn"; chỗ nào bổ sung theo PRD v2 thì ghi "ĐỀ XUẤT". Nếu không hiểu chỗ nào, cứ hỏi mình giải thích bằng lời thường.

---

## ① Lựa chọn công nghệ

> Nguyên tắc: giữ nguyên nền tảng Java/Spring Boot đã chốt; chỉ thêm các thư viện tối thiểu để đáp ứng đủ yêu cầu trong `docs/prd.md` (v2).

| Layer | Chọn | Lý do (lời thường) | Chi phí / tháng | Phương án thay thế |
|---|---|---|---|---|
| Frontend web (trình duyệt & PWA) | React (Vite + Tailwind CSS) + PWA, nằm trong `web/` — **Đã chốt** | Một bộ mã nguồn giao diện duy nhất (phong cách Navy & Cam 3D), chạy web và cài PWA lên iPhone/Android | 0 | Thymeleaf (render phía server) |
| Frontend mobile | Android đóng gói bằng **Capacitor** (từ `web/`) — **Đã chốt** | Bọc nguyên giao diện React thành app Android `.apk` thật (mở được bằng Android Studio), tiết kiệm >60% công sức cho 1 người | 0 | Android Native (Java — phải vẽ lại toàn bộ giao diện) |
| Frontend desktop | Desktop Windows đóng gói bằng **Electron** (từ `web/`) — **Đã chốt** | Bọc nguyên giao diện React thành app Windows độc lập cho Vận hành & Admin, đồng nhất 100% giao diện | 0 | JavaFX (phải viết lại toàn bộ màn hình) |
| Backend (xử lý trung tâm) | Spring Boot 3, Java 21 — **Có sẵn** | Nền tảng bạn đã quen; cung cấp REST API, Web, MQTT, Email, SMS | 0 | — |
| Database (cơ sở dữ liệu) | PostgreSQL 16 qua Docker — **Có sẵn** | Ổn định, miễn phí, hỗ trợ khóa dòng (`SELECT ... FOR UPDATE`) để chống cấp trùng ngăn | 0 | MySQL |
| Auth (đăng nhập & xác thực) | JWT cho đăng nhập (API) + Session/JWT cho Web; OTP băm cho mở ngăn — **Có sẵn** `JWT_SECRET`, `OTP_SECRET` | Tách biệt đăng nhập tài khoản và mã mở tủ; kiểm tra phân quyền 4 vai trò ở backend | 0 | — |
| Giao tiếp với tủ | MQTT, Mosquitto 2 qua Docker (local) — **Có sẵn** | Nhẹ, chuẩn cho thiết bị nhúng (IoT) | 0 | HTTP (không phù hợp thiết bị nhúng) |
| Thiết bị (tủ mô phỏng) | ESP32, Arduino C++, mô phỏng trên Wokwi (≥ 2 tủ, 6–9 ngăn/tủ) — **Có sẵn** | Đạt yêu cầu môn hệ thống nhúng mà không cần mua phần cứng thật | 0 | Phần cứng ESP32 thật |
| Gửi Email | Spring Mail + Gmail SMTP (App Password) — **ĐỀ XUẤT** | Miễn phí, gửi Email thật cho OTP và Quên mật khẩu | 0 | Mailtrap (chỉ để test, không tới hộp thư thật) |
| Gửi SMS | Twilio hoặc eSMS (bản dùng thử miễn phí) — **ĐỀ XUẤT** | Gửi SMS thật tới số điện thoại khi demo; nếu hết hạn mức dùng thử thì ghi log lỗi, không làm gián đoạn Web/App & Email | 0 (dùng thử) | Mô phỏng hộp thư SMS |
| Quản lý cấu trúc CSDL | Flyway — **ĐỀ XUẤT** | Mỗi thay đổi bảng là 1 file SQL có thứ tự, chạy lại dễ dàng trên mọi máy và khi deploy | 0 | Hibernate `ddl-auto` (khó kiểm soát khi sửa bảng) |
| Thư viện MQTT cho backend | Eclipse Paho hoặc Spring Integration MQTT — **ĐỀ XUẤT** (chốt 1 thư viện ở M4) | Giúp Spring Boot gửi lệnh và lắng nghe sự kiện/heartbeat từ nhiều tủ | 0 | — |
| Kiểm thử tự động | JUnit 5, `./mvnw -B verify`, GitHub Actions — **Có sẵn** | Tự động kiểm tra logic nghiệp vụ mỗi khi đẩy code | 0 | — |
| Hosting (2 môi trường) | Local bằng Docker **VÀ** Demo công khai (gói miễn phí có HTTPS + MQTT broker có mật khẩu, vd Render/Railway + HiveMQ Cloud) — **ĐỀ XUẤT** | Vừa phát triển nhanh trên máy cá nhân, vừa demo được trên điện thoại thật qua Internet | 0 (gói miễn phí) | VPS trả phí |

**Tổng chi phí ước tính / tháng:** 0 đồng (dùng công cụ miễn phí, Gmail cá nhân, bản dùng thử SMS và gói miễn phí cho demo công khai).

---

## ② Dữ liệu app cần lưu

> ĐỀ XUẤT (cập nhật theo PRD v2). Tên bảng và cột để tiếng Anh theo quy ước `AGENTS.md`.

### Bảng: `users` (người dùng)

**Dùng để lưu:** tài khoản của cả 4 vai trò.

| Trường | Kiểu | Bắt buộc? | Ví dụ | Ghi chú |
|---|---|---|---|---|
| id | BIGSERIAL / UUID | Có | 1 | Khóa chính |
| username | chữ | Có | `nguyenvana` | Không trùng |
| email | chữ | Có | `a@gmail.com` | Không trùng; dùng để gửi OTP & quên mật khẩu |
| phone | chữ | Có | `0912345678` | Không trùng; dùng để gửi SMS OTP |
| password_hash | chữ | Có | (đã băm BCrypt) | KHÔNG lưu mật khẩu chữ thường |
| full_name | chữ | Có | Nguyễn Văn A | |
| role | chữ | Có | `RECIPIENT` / `COURIER` / `OPERATOR` / `ADMIN` | Tài khoản tự đăng ký luôn là `RECIPIENT` |
| active | boolean | Có | `true` | Admin có thể khóa (`false`) hoặc mở khóa tài khoản |
| created_at | ngày giờ | Có | | |

- **Liên kết:** 1 người dùng có nhiều đơn hàng (vai trò người nhận hoặc shipper) và nhiều nhật ký thao tác.
- **Ai được xem / sửa:** chính chủ xem hồ sơ của mình; `ADMIN` quản lý (tạo/sửa/khóa/gán vai trò); `OPERATOR` xem danh sách để hỗ trợ.

### Bảng: `password_reset_tokens` (mã đặt lại mật khẩu)

**Dùng để lưu:** mã xác nhận cho chức năng "Quên mật khẩu" qua Email.

| Trường | Kiểu | Bắt buộc? | Ví dụ | Ghi chú |
|---|---|---|---|---|
| id | BIGSERIAL | Có | 1 | Khóa chính |
| user_id | khóa ngoại | Có | 1 | Liên kết `users.id` |
| token_hash | chữ | Có | (đã băm) | KHÔNG lưu token chữ thường |
| expires_at | ngày giờ | Có | | Hạn dùng ngắn (ví dụ 15 phút) |
| used_at | ngày giờ | Không | | Dùng 1 lần duy nhất |

### Bảng: `lockers` (tủ khóa)

| Trường | Kiểu | Bắt buộc? | Ví dụ | Ghi chú |
|---|---|---|---|---|
| id | chữ | Có | `L01`, `L02` | Trùng với `lockerId` trong MQTT |
| name | chữ | Có | Tủ sảnh A | |
| location | chữ | Không | Tầng 1 - Chung cư A | Vị trí đặt tủ |
| status | chữ | Có | `ONLINE` / `OFFLINE` | Cập nhật tự động theo heartbeat |
| last_heartbeat_at | ngày giờ | Không | | Mất 3 heartbeat liên tiếp → `OFFLINE` |
| created_at | ngày giờ | Có | | |

### Bảng: `compartments` (ngăn tủ)

| Trường | Kiểu | Bắt buộc? | Ví dụ | Ghi chú |
|---|---|---|---|---|
| id | BIGSERIAL | Có | 1 | Khóa chính |
| locker_id | chữ | Có | `L01` | Thuộc tủ nào (`lockers.id`) |
| number | số | Có | 3 | Số ngăn (1..9), trùng `compartment` trong MQTT |
| size | chữ | Có | `SMALL` / `MEDIUM` / `LARGE` | Kích cỡ ngăn (Nhỏ / Vừa / Lớn) |
| status | chữ | Có | `FREE` / `OCCUPIED` / `FAULT` | Trạng thái ngăn |

- **Quy tắc:** Mỗi cặp `(locker_id, number)` là duy nhất; khi cấp ngăn theo kích cỡ phải khóa bản ghi ở CSDL để 2 shipper cùng lúc không nhận trùng ngăn.

### Bảng: `deliveries` (đơn giao nhận)

| Trường | Kiểu | Bắt buộc? | Ví dụ | Ghi chú |
|---|---|---|---|---|
| id | BIGSERIAL / UUID | Có | | Khóa chính |
| courier_id | khóa ngoại | Có | | Shipper gửi (`users.id`) |
| recipient_id | khóa ngoại | Có | | Người nhận (`users.id`) |
| compartment_id | khóa ngoại | Có | | Ngăn chứa hàng (`compartments.id`) |
| package_size | chữ | Có | `SMALL` / `MEDIUM` / `LARGE` | Cỡ hàng shipper chọn |
| status | chữ | Có | `STORING` / `READY` / `PICKED_UP` / `EXPIRED` | `READY` quá 72h → `EXPIRED` |
| created_at | ngày giờ | Có | | Thời điểm tạo đơn |
| expires_at | ngày giờ | Không | | Thời hạn lưu hàng (`READY` + 72 giờ) |
| picked_up_at | ngày giờ | Không | | Thời điểm người nhận đóng cửa hoàn tất |

### Bảng: `otp_codes` (mã OTP)

| Trường | Kiểu | Bắt buộc? | Ví dụ | Ghi chú |
|---|---|---|---|---|
| id | BIGSERIAL | Có | | Khóa chính |
| delivery_id | khóa ngoại | Có | | Gắn với 1 đơn (`deliveries.id`) |
| code_hash | chữ | Có | (đã băm) | KHÔNG lưu mã OTP chữ thường |
| expires_at | ngày giờ | Có | | Hiệu lực **24 giờ** |
| failed_attempts | số | Có | 0 | Đạt **3 lần** → `locked = true` |
| locked | boolean | Có | `false` | Khóa khi sai quá 3 lần |
| resend_count | số | Có | 0 | Đếm số lần cấp lại để chống spam |
| last_sent_at | ngày giờ | Không | | Thời điểm gửi gần nhất (giới hạn giãn cách) |
| used_at | ngày giờ | Không | | Đã mở thành công thì không dùng lại |

### Bảng: `audit_events` (nhật ký thao tác)

| Trường | Kiểu | Bắt buộc? | Ví dụ | Ghi chú |
|---|---|---|---|---|
| id | BIGSERIAL | Có | | Khóa chính |
| actor_id | khóa ngoại | Không | | Ai thực hiện (trống nếu là hệ thống/tủ) |
| action | chữ | Có | `REGISTER`, `LOGIN`, `PASSWORD_RESET`, `ALLOCATE_COMPARTMENT`, `OTP_SENT`, `OTP_RESEND`, `OTP_FAILED`, `OPEN_COMPARTMENT`, `MANUAL_OPEN`, `ADMIN_USER_UPDATE`, `ADMIN_LOCKER_UPDATE` | Loại hành động |
| detail | chữ | Không | | Mô tả ngắn; **tuyệt đối không ghi OTP hay mật khẩu** |
| created_at | ngày giờ | Có | | |

---

## ③ Phân quyền (4 vai trò)

> Kiểm tra quyền bắt buộc ở phía backend cho mọi REST API và trang Web (không chỉ ẩn nút trên giao diện).

| Vai trò | Xem | Tạo / Thao tác | Sửa | Khóa / Xóa |
|---|---|---|---|---|
| Khách (chưa đăng nhập) | Trang đăng nhập/đăng ký | Tự đăng ký (`RECIPIENT`), yêu cầu quên mật khẩu | Đặt lại mật khẩu bằng token hợp lệ | Không |
| Người nhận (`RECIPIENT`) | Đơn và OTP của chính mình | Nhập OTP mở ngăn, bấm xin cấp lại OTP cho đơn của mình | Hồ sơ cá nhân | Không |
| Shipper (`COURIER`) | Tủ `ONLINE`, số ngăn trống theo cỡ, đơn do mình gửi | Tạo đơn gửi hàng theo cỡ (`SMALL`/`MEDIUM`/`LARGE`) | Không | Không |
| Nhân viên vận hành (`OPERATOR`) | Mọi tủ, ngăn, đơn, đơn quá hạn, trạng thái hệ thống, nhật ký | Mở ngăn thủ công (có log), hỗ trợ cấp lại OTP / mở khóa đơn | Đánh dấu ngăn `FAULT` / `FREE` | Không |
| Quản trị viên (`ADMIN`) | Toàn bộ như `OPERATOR` + danh sách tài khoản | Tạo tài khoản (mọi vai trò), thêm tủ & cấu hình ngăn | Sửa vai trò/thông tin tài khoản, sửa tủ & kích cỡ ngăn | Khóa/mở khóa tài khoản |

---

## ④ Tích hợp bên ngoài & thiết bị

### 1. MQTT với tủ khóa (ESP32 mô phỏng trên Wokwi)
1. Backend kết nối Mosquitto (local) hoặc MQTT broker có xác thực (demo công khai), subscribe `locker/+/event` và `locker/+/heartbeat` (có thêm tiền tố `MQTT_TOPIC_PREFIX` khi demo công khai).
2. Khi mở ngăn: gửi vào `locker/{lockerId}/cmd/open` payload `{"compartment": 3, "correlationId": "<uuid>"}`.
3. Chờ tối đa **10 giây** cho sự kiện `door_opened`; sau `door_closed` cập nhật trạng thái đơn và ngăn; nhận `fault` thì ghi nhận cảnh báo; mất 3 heartbeat liên tiếp thì đánh dấu tủ `OFFLINE`.
4. Chi tiết định dạng: xem `docs/mqtt-contract.md`.

### 2. Email thật (Gmail SMTP)
- Gửi mã OTP khi đơn chuyển sang `READY` hoặc khi cấp lại OTP.
- Gửi mã/liên kết đặt lại mật khẩu cho chức năng "Quên mật khẩu".
- Nếu gửi email bị lỗi mạng/SMTP: ghi log lỗi, không làm sập API tạo đơn.

### 3. SMS thật (Twilio / eSMS bản dùng thử)
- Gửi mã OTP tới số điện thoại (`users.phone`) của người nhận.
- Thiết kế dạng interface (`SmsSender`) để dễ đổi nhà cung cấp (Twilio hoặc eSMS). Nếu hết hạn mức bản dùng thử hoặc số chưa xác minh: ghi nhận lỗi trong nhật ký, đơn hàng vẫn hoàn tất và OTP vẫn hiển thị trên Web/App + gửi qua Email.

---

## ⑤ Bí mật và cấu hình (`.env`)

> ⚠️ Tuyệt đối không dán khóa/mật khẩu vào chat với AI hay ghi cứng vào mã nguồn. Lưu trong `.env` (đã nằm trong `.gitignore`) khi chạy local, và trong biến môi trường của hosting khi demo công khai.

| Nhóm / Tên biến | Dùng để làm gì | Nguồn lấy |
|---|---|---|
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | Kết nối PostgreSQL | Tự đặt (local) hoặc lấy từ hosting |
| `JWT_SECRET`, `OTP_SECRET` | Ký phiên đăng nhập JWT và băm/tạo OTP | Tự sinh chuỗi dài ngẫu nhiên |
| `MQTT_BROKER_URL`, `MQTT_USERNAME`, `MQTT_PASSWORD`, `MQTT_TOPIC_PREFIX` | Kết nối Mosquitto / MQTT broker | Local: `tcp://localhost:1883`; Demo công khai: thông tin từ broker có xác thực + tiền tố ngẫu nhiên |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` | Gửi Email qua Gmail SMTP | `smtp.gmail.com`, cổng `587`, email và App Password của Gmail |
| `SMS_ENABLED`, `SMS_PROVIDER`, `SMS_API_KEY`, `SMS_API_SECRET`, `SMS_FROM` | Gửi SMS qua Twilio hoặc eSMS | Tài khoản dùng thử do bạn đăng ký |

---

## ⑥ Bảo mật tối thiểu

- ✅ Mật khẩu, mã OTP và token đặt lại mật khẩu luôn được băm (hash), không lưu dạng chữ thường, không in ra log.
- ✅ Tự đăng ký luôn ép cứng vai trò `RECIPIENT` ở backend (chống giả mạo yêu cầu tạo tài khoản `ADMIN`).
- ✅ OTP hiệu lực 24 giờ, dùng 1 lần, khóa sau 3 lần sai; xin cấp lại OTP có giới hạn tần suất chống spam.
- ✅ Phân quyền 4 vai trò kiểm tra chặt ở backend; người dùng A không xem được dữ liệu người dùng B.
- ✅ Kiểm tra hợp lệ toàn bộ dữ liệu đầu vào (validation).
- ✅ Không chứa bí mật trong code; `.env` không đẩy lên GitHub.
- ✅ Demo công khai: bắt buộc HTTPS, Mosquitto/MQTT tắt `allow_anonymous`, dùng username/password và tiền tố ngẫu nhiên cho topic.

---

## ⑦ Môi trường

| Môi trường | Dùng để | Ghi chú |
|---|---|---|
| **Local (máy bạn)** | Phát triển và kiểm thử hằng ngày | Backend/Web `http://localhost:8080`, PostgreSQL cổng `5432`, Mosquitto cổng `1883` (chạy bằng Docker) |
| **Demo công khai (Internet)** | Báo cáo đồ án, cho giảng viên mở trực tiếp trên điện thoại | Dùng gói miễn phí có HTTPS + DB PostgreSQL + MQTT broker có xác thực; cấu hình toàn bộ bí mật qua biến môi trường của hosting |

---

## Changelog

| Ngày | Thay đổi | Người cập nhật |
|---|---|---|
| 2026-11-20 | v1 — draft đầu tiên | AI |
| 2026-11-20 | v2 — đồng bộ theo PRD v2: 4 vai trò (thêm Admin), tự đăng ký & bảng `password_reset_tokens`, thêm cỡ ngăn (`size`), hạn lưu hàng 72h, Email (Gmail) + SMS (Twilio/eSMS), đủ 3 nền tảng MUST, hỗ trợ cả local và demo công khai | AI |
