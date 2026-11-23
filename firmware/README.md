# Mô phỏng tủ khóa ESP32 trên Wokwi (`firmware/`)

Thư mục này chứa sẵn **2 tủ mô phỏng độc lập** (`locker-L01/` và `locker-L02/`), mỗi tủ có **6 ngăn** (2 Nhỏ, 2 Vừa, 2 Lớn) tuân thủ đúng hợp đồng [mqtt-contract.md](../docs/mqtt-contract.md).

## Phần cứng mô phỏng trên mạch (`diagram.json`)
- **Bàn phím số 4×4 (`keypad`):** Bấm trực tiếp 6 chữ số OTP + phím **`#`** để gửi xác thực lên Backend mở ngăn; bấm **`*`** để xóa nhập lại.
- **Màn hình LCD 16×2 I2C (`lcd`):** Hiển thị trạng thái kết nối, dấu `******` khi bấm OTP, số ngăn đang mở (`MO NGAN #3!`) hoặc báo lỗi (`SAI MA OTP!`).
- **Động cơ Servo (`servo` — GPIO 23):** Xoay góc `0° → 90°` mô phỏng chốt khóa cơ bật mở, xoay về `0°` khi đóng cửa.
- **6 đèn LED (khóa điện 6 ngăn):**
  - `N1`, `N2` (xanh dương): Ngăn cỡ **Nhỏ** (`SMALL`) — GPIO 13, 12
  - `N3`, `N4` (cam): Ngăn cỡ **Vừa** (`MEDIUM`) — GPIO 14, 27
  - `N5`, `N6` (xanh lá): Ngăn cỡ **Lớn** (`LARGE`) — GPIO 26, 25
- **Nút bấm xanh lá (`Dong cua` — GPIO 32):** Bấm sau khi bỏ/lấy hàng để đóng chốt Servo, tắt LED và gửi `door_closed`.
- **Nút bấm đỏ (`Loi Fault` — GPIO 33):** Bấm để giả lập lỗi cửa (`fault`).

---

## Cách kết nối Wokwi với Backend an toàn (Cách 1 — EMQX Cloud Serverless Free)

### Bước 1: Tạo tài khoản EMQX Cloud miễn phí (chỉ mất 2 phút, miễn phí 1 triệu phút kết nối/tháng)
1. Vào https://cloud.emqx.com/ đăng ký tài khoản miễn phí → tạo 1 deployment **Serverless (Free)** (chọn khu vực gần Việt Nam như `Asia-Southeast1 / Singapore` cho nhanh).
2. Trong mục **Access Control → Authentication**, bấm **Add** để tạo 1 cặp `Username` và `Password` (EMQX Serverless bắt buộc xác thực, không cho ẩn danh).
3. Vào tab **Overview**, copy địa chỉ **Address** (dạng `xxxxx.ala.asia-southeast1.emqxsl.com`, cổng TLS **`8883`**).

### Bước 2: Cập nhật file `.env` ở máy tính cho Backend
Mở file `.env` (file này không đẩy lên GitHub) và điền:
```env
MQTT_BROKER_URL=ssl://xxxxx.ala.asia-southeast1.emqxsl.com:8883
MQTT_USERNAME=locker_user
MQTT_PASSWORD=mat-khau-cua-ban
MQTT_TOPIC_PREFIX=sl-trung-9f2a/
```
*(Đổi `sl-trung-9f2a/` thành chuỗi ngẫu nhiên của riêng bạn).* Sau đó khởi động lại Backend (`cd backend` → `.\mvnw.cmd spring-boot:run`).

### Bước 3: Mở 2 tủ `L01` và `L02` trên Wokwi
1. Vào https://wokwi.com/projects/new/esp32 (mở 2 tab trình duyệt cho 2 tủ `L01` và `L02`).
2. Copy nội dung các file trong `firmware/locker-L01/` (`sketch.ino`, `config.h`, `diagram.json`, `libraries.txt`) vào tab 1 — và làm tương tự với `firmware/locker-L02/` cho tab 2.
3. Trong tab `config.h` trên Wokwi, điền đúng `MQTT_HOST`, `MQTT_USER`, `MQTT_PASS`, `MQTT_TOPIC_PREFIX` giống hệt file `.env` ở Bước 2.
4. Bấm **Play (▶)** trên cả 2 tab Wokwi:
   - Thấy Serial Monitor báo `Ket noi MQTT THANH CONG!` và `Gui heartbeat -> OK` mỗi 10 giây.
   - Từ Backend, tạo đơn gửi hàng vào `L01` hoặc `L02` → đèn LED đúng ngăn trên Wokwi sáng ngay lập tức → bấm nút **Xanh lá (Đóng cửa)** → đơn tự chuyển `READY` và sinh mã OTP!
   - Thử bấm nút **Stop (■)** trên Wokwi → sau 30 giây (mất 3 nhịp heartbeat), Backend tự chuyển tủ đó sang `OFFLINE`!
