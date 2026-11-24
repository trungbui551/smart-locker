# Hướng dẫn Triển khai Demo Công khai (M8 — Miễn phí 100%)

Tài liệu này hướng dẫn từng bước đưa toàn bộ hệ thống **Smart Locker** lên Internet có **HTTPS** miễn phí để giảng viên hoặc bất kỳ ai có thể mở trực tiếp trên điện thoại (4G/Wi-Fi bất kỳ) và điều khiển tủ ESP32 mô phỏng trên Wokwi.

> **Lưu ý quan trọng:** Cách chạy local trên máy bằng `docker compose up -d` vẫn giữ nguyên 100%, không bị ảnh hưởng gì.

---

## Kiến trúc triển khai miễn phí

| Thành phần | Dịch vụ miễn phí | Vai trò |
|---|---|---|
| **MQTT Broker (TLS 8883)** | **EMQX Cloud Serverless Free** (bạn đã cấu hình xong ở M5) | Cầu nối thời gian thực giữa Backend và tủ ESP32 trên Wokwi (bắt buộc mật khẩu + TLS, tắt `allow_anonymous`) |
| **Backend Spring Boot + PostgreSQL 16** | **Render** (`render.yaml` + `backend/Dockerfile`) | API xử lý nghiệp vụ + lưu CSDL PostgreSQL miễn phí, tự có HTTPS |
| **Web (PWA)** | **Vercel** (`web/vercel.json`) | Giao diện React 15 màn hình có HTTPS, cài được PWA lên màn hình chính điện thoại |

---

## Bước 1 — Đẩy code lên GitHub

Đảm bảo nhánh mới nhất (đã có `render.yaml`, `backend/Dockerfile`, `web/vercel.json`) đã được đẩy lên GitHub (hoặc gộp về nhánh `main`).

---

## Bước 2 — Triển khai Backend + PostgreSQL lên Render

1. Truy cập `https://render.com` → đăng nhập bằng tài khoản **GitHub** (miễn phí, không cần thẻ tín dụng cho gói Free).
2. Bấm **New +** → chọn **Blueprint**.
3. Chọn kho mã nguồn **`smart-locker`** (chọn đúng nhánh chứa `render.yaml`).
4. Render sẽ tự đọc file `render.yaml` và tạo sẵn 2 dịch vụ ở khu vực **Singapore**:
   - Database: `smart-locker-db` (PostgreSQL Free)
   - Web Service: `smart-locker-api` (Docker Free)
5. Điền các biến môi trường bí mật (lấy từ file `.env` trên máy bạn — **không ghi vào code**):
   - `MQTT_BROKER_URL`: `ssl://<ten-cluster-cua-ban>.ala.asia-southeast1.emqxsl.com:8883`
   - `MQTT_USERNAME`: tài khoản EMQX Cloud của bạn
   - `MQTT_PASSWORD`: mật khẩu EMQX Cloud của bạn
   - `MQTT_TOPIC_PREFIX`: tiền tố topic có dấu `/` ở cuối (trùng 100% với `config.h` trên Wokwi)
   - *(Tùy chọn gửi Gmail thật)*: đổi `MAIL_MODE` thành `smtp`, điền `MAIL_USERNAME` và `MAIL_PASSWORD` (App Password 16 ký tự của Gmail).
6. Bấm **Apply** và chờ khoảng 3–5 phút để Render build Docker image lần đầu.
7. Khi trạng thái chuyển xanh **Live**, mở thử đường dẫn:
   ```
   https://<ten-service-cua-ban>.onrender.com/actuator/health
   ```
   Thấy `{"status":"UP"}` là Backend đã sống trên Internet!

> **Mẹo cho buổi bảo vệ:** Gói Render Free tự ngủ sau 15 phút không có người truy cập (lần mở đầu mất ~30–50 giây để thức dậy). Trước khi vào phòng bảo vệ 5 phút, bạn chỉ cần mở link `/actuator/health` 1 lần là hệ thống nóng máy sẵn sàng.

---

## Bước 3 — Triển khai Web (PWA) lên Vercel

1. Truy cập `https://vercel.com` → đăng nhập bằng **GitHub**.
2. Bấm **Add New…** → **Project** → chọn kho **`smart-locker`**.
3. Ở phần cấu hình:
   - **Root Directory:** bấm Edit → chọn thư mục **`web`** *(rất quan trọng!)*.
   - **Framework Preset:** chọn **Vite** (Vercel thường tự nhận diện).
   - **Environment Variables:** thêm 1 biến:
     - Name: `VITE_API_BASE_URL`
     - Value: `https://<ten-service-cua-ban>.onrender.com` *(không có dấu `/` ở cuối)*
4. Bấm **Deploy** (chỉ mất ~30 giây).
5. Lấy đường dẫn HTTPS Vercel cấp, ví dụ: `https://smart-locker-xxx.vercel.app`.

---

## Bước 4 — Cập nhật CORS trên Render (cho phép Vercel gọi API)

1. Quay lại **Render Dashboard** → chọn `smart-locker-api` → mục **Environment**.
2. Sửa biến `CORS_ALLOWED_ORIGINS` thành:
   ```
   https://smart-locker-xxx.vercel.app,http://localhost:5173
   ```
   *(Thay bằng đúng đường dẫn Vercel thật của bạn, không có dấu `/` ở cuối.)*
3. Bấm **Save Changes** → Render tự khởi động lại trong ~30 giây.

---

## Bước 5 — Kiểm thử bảo mật MQTT & luồng End-to-End trên điện thoại 4G

### 5.1. Xác nhận EMQX Cloud từ chối kết nối không có mật khẩu
Bạn có thể chạy lệnh PowerShell sau (thay `<HOST>` bằng địa chỉ EMQX Cloud thật) để chứng minh broker từ chối kết nối ẩn danh:
```powershell
docker compose exec mosquitto mosquitto_pub -h <HOST> -p 8883 --capath /etc/ssl/certs -t "test/anon" -m "hello"
```
Kết quả mong đợi: broker trả về lỗi **`Connection Refused: not authorised`** (từ chối thành công!).

### 5.2. Chạy trọn luồng trên điện thoại 4G + Wokwi
1. Mở Wokwi trên máy tính, bấm **Play** tủ `L01` (vẫn dùng đúng `config.h` EMQX Cloud TLS — **không cần sửa gì trên Wokwi!**).
2. Dùng điện thoại bật **4G** (tắt Wi-Fi cùng mạng máy tính để chứng minh chạy qua Internet thật), mở link `https://smart-locker-xxx.vercel.app`.
3. Cài thành PWA lên màn hình chính (Android Chrome: menu `⋮` → **Cài đặt ứng dụng**; iPhone Safari: nút Chia sẻ → **Thêm vào MH chính**).
4. Đăng nhập `courier` → tạo đơn trên `L01` → thấy đèn LED & Servo trên Wokwi mở ngay → bấm nút xanh đóng cửa → đăng nhập `recipient` lấy OTP → bấm OTP trên bàn phím 4×4 Wokwi + `#` → mở cửa lấy hàng hoàn tất!
