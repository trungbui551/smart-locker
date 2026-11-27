# Cẩm nang Ôn tập & Hỏi–Đáp Bảo vệ Đồ án Smart Locker

Tài liệu này tóm tắt bằng lời thường các điểm quan trọng nhất trong code để bạn tự tin trả lời câu hỏi của giảng viên khi bảo vệ.

---

## 1. Luồng tổng thể của hệ thống (nói trong 30 giây)

1. **Shipper** mở Web hoặc App Android → chọn tủ đang `ONLINE` (VD `L01`), chọn kích cỡ gói hàng (`Nhỏ / Vừa / Lớn`) và nhập tài khoản Người nhận.
2. **Backend (Spring Boot)** khóa hàng trong PostgreSQL (`SELECT ... FOR UPDATE`) để cấp đúng 1 ngăn trống phù hợp, chuyển ngăn sang `OCCUPIED` và gửi lệnh **MQTT** `cmd/open` (kèm mã duy nhất `correlationId`) qua **EMQX Cloud (TLS 8883)**.
3. **Tủ ESP32 trên Wokwi** nhận lệnh → bật đèn ngăn tương ứng, xoay động cơ **Servo 90°** mở chốt khóa, hiển thị lên **LCD 16×2** và gửi ngược sự kiện `door_opened` về Backend.
4. Shipper bỏ hàng vào và bấm **nút xanh** đóng cửa → ESP32 khóa chốt Servo về 0°, gửi `door_closed` → Backend đổi đơn sang `READY`, tự sinh **mã OTP 6 số** (hiệu lực 24h) gửi cho Người nhận.
5. **Người nhận** đến tủ có thể **nhập 6 số OTP + `#` trực tiếp trên bàn phím 4×4 của tủ** (hoặc bấm mở từ Web/App Android) → Backend kiểm tra OTP → gửi lệnh mở đúng ngăn → Người nhận lấy hàng, đóng cửa → đơn chuyển `PICKED_UP`, ngăn trở về `FREE`.

---

## 2. Những câu hỏi giảng viên hay hỏi nhất & Cách trả lời gọn

### Câu 1: Làm sao tránh 2 Shipper bấm gửi hàng cùng 1 giây mà bị cấp trùng 1 ngăn?
- **Trả lời:** Trong `backend/src/main/java/com/smartlocker/locker/CompartmentRepository.java`, em dùng khóa bi quan ở tầng CSDL **`@Lock(LockModeType.PESSIMISTIC_WRITE)`** (tương đương câu SQL `SELECT ... FOR UPDATE`). Giao dịch thứ 2 buộc phải chờ giao dịch thứ 1 lưu xong trạng thái `OCCUPIED` rồi mới chọn ngăn trống tiếp theo. Em đã viết bài test đa luồng (`LockerAndAllocationTests`) chứng minh 2 shipper gửi đồng thời luôn nhận 2 ngăn khác nhau.

### Câu 2: Mã OTP được bảo mật như thế nào? Có lộ trong Database hay Log không?
- **Trả lời:** Trong `OtpCryptoHelper.java`, mã OTP không bao giờ lưu dạng chữ thường và không bao giờ in ra log/nhật ký (`audit_events`):
  - Cột `code_hash` lưu mã băm **SHA-256** để đối chiếu khi người dùng nhập.
  - Cột `code_encrypted` mã hóa bằng **AES-256-GCM** với khóa bí mật `OTP_SECRET` (chỉ giải mã khi đúng chính chủ Người nhận gọi API xem mã).
  - OTP chỉ có hiệu lực **24 giờ**, dùng đúng **1 lần**, nhập sai **3 lần** sẽ tự khóa (phải xin cấp lại mã mới, có chống spam 30 giây).

### Câu 3: Nếu mất mạng hoặc tủ bị treo / kẹt cửa thì hệ thống xử lý thế nào?
- **Trả lời:** Có 3 cơ chế an toàn trong `LockerCommandService.java` và `MqttEventHandler.java`:
  1. **Mất kết nối tủ (Heartbeat):** Tủ ESP32 gửi nhịp sống định kỳ; nếu mất 3 nhịp liên tiếp (> 30 giây), Backend tự đánh dấu tủ `OFFLINE` và chặn không cho Shipper cấp ngăn vào tủ đó.
  2. **Quá hạn mở cửa (Timeout 10s):** Sau khi gửi `cmd/open`, nếu quá 10 giây không nhận được `door_opened`, lệnh chuyển `TIMED_OUT` và không đổi trạng thái đơn hàng.
  3. **Bỏ qua tin nhắn lặp (Idempotent) & Báo lỗi cửa (`fault`):** Mỗi lệnh có `correlationId` duy nhất nên tin nhắn MQTT đến lặp sẽ bị bỏ qua; khi bấm nút đỏ lỗi cửa trên Wokwi, tủ gửi sự kiện `fault`, ngăn bị khóa trạng thái `FAULT` và hiện cảnh báo ngay trên màn hình Vận hành `S10/S11`.

### Câu 4: Tại sao dùng 1 bộ code React cho cả Web, Android và Desktop Windows?
- **Trả lời:** Vì cả 3 nền tảng dùng chung 1 bộ REST API của Spring Boot và cùng Design System *Navy & Cam 3D*. Dùng biến môi trường `VITE_APP_MODE` (`web` / `mobile` / `desktop`) để tách gọn giao diện và phân quyền theo từng nền tảng:
  - **Web (PWA):** đủ 15 màn hình, cài được trên mọi điện thoại kể cả iPhone.
  - **Android (Capacitor `.apk`):** chỉ hiện luồng Người nhận & Shipper (`S1–S9`).
  - **Desktop Windows (Electron `.exe`):** khóa đăng nhập chỉ cho Vận hành & Admin (`S10–S15`).

### Câu 5: Hệ thống bảo mật MQTT khi đưa lên Internet như thế nào?
- **Trả lời:** Em dùng **EMQX Cloud Serverless** mã hóa **TLS cổng 8883**, bắt buộc đăng nhập username/password (tắt hoàn toàn `allow_anonymous`) và gắn tiền tố ngẫu nhiên `MQTT_TOPIC_PREFIX` cho mọi topic. Có thể chạy ngay lệnh `mosquitto_pub` không mật khẩu để chứng minh broker trả về `Connection Refused: bad user name or password`.

---

## 3. Kịch bản trình diễn (Demo) 3 phút trước hội đồng

1. **Chuẩn bị trước 5 phút:** Mở link `https://smart-locker-api-hy55.onrender.com/actuator/health` để đánh thức Render Free; mở sẵn **Wokwi `L01`** bấm **Play**; mở sẵn **Smart-Locker-Desktop.exe** đăng nhập `admin` ở màn hình `S10` (Trạng thái hệ thống).
2. **Phút 1 (Shipper gửi hàng bằng điện thoại 4G / App Android):** Đăng nhập `courier` → chọn tủ `L01`, cỡ `Vừa`, người nhận `recipient` → bấm gửi → hội đồng thấy đèn ngăn + chốt Servo trên Wokwi mở ngay → bấm nút xanh đóng cửa.
3. **Phút 2 (Người nhận mở tủ bằng bàn phím 4×4 trên Wokwi):** Đăng nhập `recipient` trên điện thoại lấy mã OTP 6 số → bấm thẳng 6 số + `#` trên bàn phím Wokwi → LCD báo `OTP HOP LE!`, đèn + chốt Servo mở khóa → bấm nút xanh đóng cửa hoàn tất.
4. **Phút 3 (Vận hành & Admin trên Desktop `.exe`):** Trên `Smart-Locker-Desktop.exe`, mở `S11` bấm **Mở ngăn thủ công** (kèm lý do) → Wokwi mở ngay; sang `S13` cho hội đồng thấy toàn bộ nhật ký thao tác được ghi tự động và **không hề lộ mật khẩu hay OTP**.
