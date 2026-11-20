# PRD — Smart Locker

> Mô tả ngắn: Hệ thống tủ khóa thông minh quản lý giao nhận hàng hóa đặt tại sảnh chung cư, trường học hoặc tòa nhà văn phòng: shipper chọn kích cỡ hàng để gửi vào ngăn tủ phù hợp, người nhận nhận mã OTP qua Web/App, Email và SMS để mở ngăn lấy hàng, nhân viên vận hành theo dõi tình trạng tủ và quản trị viên quản lý toàn hệ thống.

> **Trạng thái:** v2 — Đã cập nhật theo kết quả phỏng vấn yêu cầu ngày 2026-11-20. Chưa có file đề bài/SRS gốc từ giảng viên trong repo nên chưa gắn mã FR/NFR/UC chính thức (sẽ bổ sung nếu có).

---

## ① Overview

- **App name:** Smart Locker
- **Tagline:** Gửi hàng và nhận hàng tự động bằng mã OTP, không cần gặp mặt trực tiếp.
- **Problem:** Giao nhận hàng trực tiếp tại chung cư, trường học, tòa nhà văn phòng phụ thuộc giờ giấc của cả hai bên; người nhận bận học/làm việc khiến shipper phải chờ lâu, gọi không nghe máy hoặc phải giao lại nhiều lần, dễ thất lạc hàng.
- **Solution:** Đặt các tủ khóa điện gồm nhiều ngăn với 3 kích thước (Nhỏ, Vừa, Lớn). Shipper chọn tủ và kích cỡ hàng để hệ thống tự cấp ngăn trống phù hợp. Khi gửi xong, hệ thống tạo mã OTP gửi tới người nhận qua Web/App, Email (Gmail) và SMS. Người nhận nhập OTP để mở đúng ngăn lấy hàng. Tủ giao tiếp với backend qua MQTT; phần cứng tủ được mô phỏng bằng ESP32 trên Wokwi (từ 2 tủ trở lên, mỗi tủ 6–9 ngăn).
- **Platform (tất cả đều BẮT BUỘC — dùng chung 1 bộ mã nguồn React `web/` để đồng bộ giao diện 100%):**
  - **Web (React PWA):** Dùng được trên cả máy tính và điện thoại (iPhone/Android), hỗ trợ đủ 4 vai trò và có trang quản lý trạng thái hệ thống.
  - **Android (Capacitor — đóng gói từ React):** Ứng dụng di động `.apk` dành cho Người nhận và Shipper.
  - **Desktop (Electron — đóng gói từ React):** Ứng dụng máy tính Windows dành cho Nhân viên vận hành và Quản trị viên.
  - **Backend API & MQTT:** Spring Boot 3 (Java 21), chạy được cả **local (Docker)** và **demo công khai trên Internet**.

---

## ② Target User (4 vai trò)

**Persona 1 — Người nhận (`RECIPIENT`)**
- **Bối cảnh:** Sinh viên, cư dân chung cư, nhân viên văn phòng; thường bận vào giờ hành chính.
- **Nỗi đau:** Lỡ giờ giao hàng, phải hẹn lại shipper hoặc nhờ người lạ nhận hộ dễ thất lạc.
- **Nhu cầu:** Tự đăng ký tài khoản, nhận thông báo và mã OTP nhanh (trên app, email, SMS), ra tủ lấy hàng bất cứ lúc nào trong vòng 72 giờ.

**Persona 2 — Shipper (`COURIER`)**
- **Bối cảnh:** Giao hàng số lượng lớn mỗi ngày, cần thao tác nhanh trên điện thoại.
- **Nỗi đau:** Mất thời gian gọi điện chờ người nhận xuống lấy hàng.
- **Nhu cầu:** Mở app/web, chọn tủ và kích cỡ gói hàng (Nhỏ / Vừa / Lớn) để tủ tự mở đúng ngăn trống, bỏ hàng rồi đóng cửa đi ngay.

**Persona 3 — Nhân viên vận hành (`OPERATOR`)**
- **Bối cảnh:** Người trực vận hành hệ thống tủ tại tòa nhà/khu vực, dùng máy tính (Desktop JavaFX) hoặc Web.
- **Nỗi đau:** Không biết kịp khi tủ mất mạng, ngăn bị kẹt cửa, hàng quá hạn 72 giờ hoặc khách gặp sự cố OTP.
- **Nhu cầu:** Xem trạng thái trực tiếp của các tủ và từng ngăn, nhận cảnh báo lỗi, mở ngăn thủ công khi sự cố, hỗ trợ cấp lại OTP và xem nhật ký thao tác.

**Persona 4 — Quản trị viên (`ADMIN`)**
- **Bối cảnh:** Người quản trị toàn bộ hệ thống trên Desktop JavaFX hoặc Web.
- **Nỗi đau:** Cần kiểm soát chặt tài khoản nhân sự và cấu hình tủ/ngăn mà không để người ngoài can thiệp.
- **Nhu cầu:** Quản lý tài khoản (tạo/sửa/khóa tài khoản Shipper, Nhân viên vận hành, Người nhận), thêm/sửa thông tin tủ và cấu hình kích cỡ từng ngăn, theo dõi trạng thái sức khỏe toàn hệ thống.

---

## ③ Features & User Stories

> Mỗi feature gồm: Tên · Story · Done khi.

---

### 🟢 MUST (bắt buộc có khi nộp đồ án)

#### Feature 1: Tài khoản, đăng nhập, tự đăng ký, quên mật khẩu và phân quyền (4 vai trò)
**Story:** Là người dùng thuộc 1 trong 4 vai trò (`RECIPIENT`, `COURIER`, `OPERATOR`, `ADMIN`), tôi muốn đăng ký (với người nhận), đăng nhập, khôi phục mật khẩu qua email và chỉ truy cập đúng chức năng thuộc quyền của mình.

**Done khi:**
- ✅ Người nhận tự đăng ký được tài khoản mới (email, số điện thoại, mật khẩu); tài khoản tự đăng ký luôn mặc định là `RECIPIENT` (không tự chọn được quyền cao hơn)
- ✅ Chức năng "Quên mật khẩu" gửi liên kết hoặc mã đặt lại mật khẩu qua Email thật (Gmail), có thời hạn và dùng một lần
- ✅ Đăng nhập thành công vào đúng giao diện vai trò; sai thông tin báo lỗi rõ ràng
- ✅ Phân quyền kiểm tra ở phía backend: vai trò thấp không gọi được API của vai trò khác (kể cả khi tự gửi yêu cầu API trực tiếp)
- ✅ Người nhận A không xem được đơn hàng hay mã OTP của người nhận B
- ❌ Đăng nhập bằng mạng xã hội Google/Facebook (ngoài scope)

---

#### Feature 2: Shipper gửi hàng và tự động cấp ngăn theo kích thước
**Story:** Là shipper, tôi muốn chọn tủ đang hoạt động và chọn kích cỡ hàng (Nhỏ / Vừa / Lớn) để hệ thống tự động cấp một ngăn trống phù hợp và mở ngăn cho tôi bỏ hàng.

**Done khi:**
- ✅ Shipper chọn tủ, nhập thông tin người nhận (tài khoản/email/SĐT) và chọn kích cỡ hàng: **Nhỏ (`SMALL`)**, **Vừa (`MEDIUM`)**, **Lớn (`LARGE`)**
- ✅ Hệ thống tự tìm 1 ngăn trống (`FREE`) có kích cỡ phù hợp và chuyển ngăn sang trạng thái đang chứa hàng (`OCCUPIED`)
- ✅ Hệ thống gửi lệnh mở ngăn cho shipper bỏ hàng; khi tủ báo `door_closed`, đơn chuyển sang trạng thái "chờ nhận" (`READY`) và bắt đầu tính thời gian lưu hàng tối đa **72 giờ**
- ✅ Hai shipper gửi cùng lúc không bao giờ bị cấp trùng một ngăn (có khóa đồng thời ở cơ sở dữ liệu)
- ✅ Hết ngăn trống đúng kích cỡ thì báo rõ "Tủ hết ngăn cỡ [Nhỏ/Vừa/Lớn]" (hoặc "Tủ đã đầy"), không cấp bừa
- ❌ Shipper tự chỉ định số ngăn cụ thể (ngoài scope — hệ thống tự cấp để tối ưu)

---

#### Feature 3: Mã OTP đa kênh (Web/App + Email + SMS) và quy tắc bảo mật
**Story:** Là người nhận, tôi muốn nhận mã OTP qua Web/App, Email (Gmail) và SMS để mở đúng ngăn chứa hàng của mình, và có thể xin cấp lại mã mới nếu mã hết hạn hoặc bị khóa.

**Done khi:**
- ✅ Khi đơn chuyển sang "chờ nhận" (`READY`), hệ thống tạo mã OTP gắn với đúng đơn và đúng ngăn, có thời hạn **24 giờ**
- ✅ Mã OTP được gửi qua 3 kênh:
  1. Hiển thị trong Web/App của người nhận (chỉ chủ đơn mới thấy)
  2. Gửi Email thật qua Gmail tới email người nhận
  3. Gửi SMS thật qua dịch vụ bản dùng thử miễn phí (như Twilio/eSMS — khóa cấu hình trong `.env`); nếu dịch vụ SMS hết hạn mức dùng thử thì hệ thống ghi log lỗi và vẫn đảm bảo Web/App + Email hoạt động bình thường
- ✅ OTP đúng thì gửi lệnh mở ngăn; OTP sai thì báo lỗi và tăng bộ đếm
- ✅ Nhập sai OTP quá **3 lần** thì tạm khóa đơn đó
- ✅ Khi OTP hết hạn (quá 24 giờ) hoặc đơn bị khóa do nhập sai 3 lần: người nhận có thể bấm **"Xin cấp lại mã mới"** (có giới hạn tần suất chống spam) hoặc nhờ Nhân viên vận hành mở hỗ trợ / cấp lại mã
- ✅ OTP dùng một lần (đã mở thành công thì không dùng lại được) và **không lưu dạng chữ thường** trong cơ sở dữ liệu hay nhật ký

---

#### Feature 4: Mở ngăn qua MQTT và xác nhận bằng cảm biến cửa
**Story:** Là hệ thống, tôi muốn gửi lệnh mở ngăn xuống tủ qua MQTT và nhận sự kiện cửa, để đảm bảo trạng thái đơn hàng và ngăn tủ khớp với thực tế.

**Done khi:**
- ✅ Backend gửi lệnh vào `locker/{lockerId}/cmd/open` đúng định dạng trong `docs/mqtt-contract.md` (có tiền tố ngẫu nhiên khi chạy demo công khai)
- ✅ Tủ trả sự kiện `door_opened` rồi `door_closed` kèm đúng `correlationId`
- ✅ Sau `door_closed` của lần lấy hàng, đơn chuyển sang "đã nhận" (`PICKED_UP`) và ngăn trở về "trống" (`FREE`)
- ✅ Sau **10 giây** gửi lệnh mà không nhận được `door_opened`, hệ thống báo lỗi cho người dùng, không đổi trạng thái đơn và ghi nhật ký
- ✅ Đơn quá **72 giờ** chưa lấy tự động chuyển sang trạng thái "quá hạn" (`EXPIRED`) để nhân viên vận hành xử lý
- ❌ Mở nhiều ngăn cùng một lệnh (ngoài scope)

---

#### Feature 5: Mô phỏng từ 2 tủ trở lên bằng ESP32 trên Wokwi
**Story:** Là người làm đồ án, tôi muốn mô phỏng ít nhất 2 tủ khóa (mỗi tủ 6–9 ngăn đủ 3 cỡ Nhỏ/Vừa/Lớn) trên Wokwi, để demo sát thực tế hệ thống nhiều tủ.

**Done khi:**
- ✅ Có mã nguồn Arduino C++ và sơ đồ mạch `diagram.json` trong `firmware/` chạy được trên Wokwi cho tối thiểu **2 tủ** (ví dụ `L01`, `L02`), mỗi tủ **6–9 ngăn**
- ✅ Mỗi tủ nhận lệnh `cmd/open` đúng `lockerId` của mình, mở khóa (đèn LED/servo mô phỏng) và gửi lại `door_opened`, `door_closed` với đúng `correlationId`
- ✅ Gửi `heartbeat` định kỳ lên `locker/{lockerId}/heartbeat`
- ✅ Gửi sự kiện `fault` khi mô phỏng lỗi (ví dụ cửa mở lâu không đóng hoặc kẹt khóa)
- ❌ Chạy trên mạch ESP32 phần cứng thật (ngoài scope)

---

#### Feature 6: Theo dõi trạng thái tủ, quản lý trạng thái hệ thống và nhật ký thao tác
**Story:** Là nhân viên vận hành hoặc quản trị viên, tôi muốn xem trực quan trạng thái toàn hệ thống (tủ online/offline, từng ngăn, đơn quá hạn, kết nối MQTT/DB, nhật ký thao tác) để xử lý sự cố nhanh chóng.

**Done khi:**
- ✅ Mất 3 heartbeat liên tiếp thì tủ tự động chuyển sang trạng thái "ngoại tuyến" (`OFFLINE`); có heartbeat lại thì tự trở về "hoạt động" (`ONLINE`)
- ✅ Không cấp ngăn mới cho tủ đang ngoại tuyến
- ✅ Có trang **Quản lý trạng thái hệ thống** trên Web hiển thị tổng quan: tình trạng kết nối Backend/Database/MQTT, số tủ online/offline, tỷ lệ ngăn đang dùng, cảnh báo lỗi (`fault`) và danh sách đơn quá hạn 72 giờ
- ✅ Nhân viên vận hành mở ngăn thủ công được khi có sự cố, và hành động này bắt buộc được ghi vào nhật ký
- ✅ Nhật ký thao tác (audit log) ghi lại đầy đủ: đăng nhập, đăng ký, đặt lại mật khẩu, cấp ngăn, gửi/cấp lại OTP, nhập OTP (đúng/sai), mở ngăn, mở thủ công, thay đổi cấu hình tủ/tài khoản
- ✅ Tuyệt đối không ghi OTP hay mật khẩu vào nhật ký
- ❌ Xuất báo cáo PDF (ngoài scope)

---

#### Feature 7: Quản trị hệ thống dành cho Admin
**Story:** Là quản trị viên (`ADMIN`), tôi muốn quản lý tài khoản người dùng và cấu hình tủ/ngăn để vận hành hệ thống linh hoạt mà không cần sửa trực tiếp cơ sở dữ liệu.

**Done khi:**
- ✅ Xem danh sách, tạo mới, cập nhật vai trò và khóa/mở khóa tài khoản (`RECIPIENT`, `COURIER`, `OPERATOR`, `ADMIN`)
- ✅ Thêm mới tủ khóa (`lockerId`, tên, vị trí), chỉnh sửa và cấu hình danh sách ngăn cùng kích cỡ từng ngăn (`SMALL` / `MEDIUM` / `LARGE`)
- ✅ Xem toàn bộ trạng thái hệ thống và nhật ký thao tác
- ✅ Mọi thao tác của Admin đều được ghi vào nhật ký thao tác
- ❌ Chỉnh sửa firmware/mã phần cứng tủ từ xa (ngoài scope)

---

#### Feature 8: Giao diện Web (PWA) cho đủ 4 vai trò + Trạng thái hệ thống
**Story:** Là người dùng bất kỳ (Người nhận, Shipper, Nhân viên vận hành, Admin), tôi muốn dùng toàn bộ chức năng trên trình duyệt điện thoại và máy tính, cài được lên màn hình chính (PWA).

**Done khi:**
- ✅ Hoàn thành trọn vẹn luồng của cả 4 vai trò trên Web (đăng ký/đăng nhập, gửi hàng theo cỡ, nhận hàng bằng OTP, vận hành tủ, quản trị Admin, xem trạng thái hệ thống)
- ✅ Cài được lên màn hình chính trên iPhone và Android (PWA)
- ✅ Hiển thị rõ ràng, dễ dùng trên cả màn hình điện thoại và máy tính
- ❌ Thông báo đẩy (push notification) trên iOS (ngoài scope)

---

#### Feature 9: Ứng dụng Android (Capacitor — Người nhận và Shipper)
**Story:** Là người nhận hoặc shipper dùng điện thoại Android, tôi muốn cài ứng dụng Android riêng (`.apk`) để gửi hàng và nhận hàng nhanh chóng, thuận tiện.

**Done khi:**
- ✅ Đóng gói từ giao diện React (`web/`) bằng Capacitor, chạy mượt trên máy ảo Android hoặc điện thoại Android thật
- ✅ Hỗ trợ đầy đủ luồng Người nhận (đăng ký, đăng nhập, quên mật khẩu, xem đơn & OTP, nhập OTP mở ngăn, xin cấp lại OTP)
- ✅ Hỗ trợ đầy đủ luồng Shipper (đăng nhập, chọn tủ & kích cỡ hàng Nhỏ/Vừa/Lớn, gửi hàng và theo dõi xác nhận đóng cửa)
- ✅ Dùng chung REST API với Web, không tạo API riêng
- ❌ Đưa ứng dụng lên Google Play Store (ngoài scope)

---

#### Feature 10: Ứng dụng Desktop Windows (Electron — Nhân viên vận hành và Admin)
**Story:** Là nhân viên vận hành hoặc quản trị viên, tôi muốn mở ứng dụng máy tính riêng để quản lý tủ, đơn hàng, tài khoản và theo dõi sự cố.

**Done khi:**
- ✅ Đóng gói từ giao diện React (`web/`) bằng Electron, chạy như ứng dụng máy tính độc lập trên Windows
- ✅ Hỗ trợ đầy đủ chức năng Nhân viên vận hành: xem danh sách tủ (online/offline), trạng thái từng ngăn theo kích cỡ, lịch sử đơn, đơn quá hạn 72 giờ, cảnh báo lỗi, mở ngăn thủ công, hỗ trợ cấp lại OTP, xem nhật ký thao tác
- ✅ Hỗ trợ đầy đủ chức năng Quản trị viên: quản lý tài khoản (tạo/sửa/khóa/phân quyền) và cấu hình tủ/ngăn
- ✅ Dùng chung REST API với Backend
- ❌ Chỉnh sửa cấu hình phần cứng ESP32 (ngoài scope)

---

### 🟠 NICE TO HAVE (làm thêm nếu còn dư thời gian)

- [ ] Thông báo đẩy (Push notification) khi hàng vừa được bỏ vào tủ
- [ ] Gửi email/SMS nhắc người nhận khi hàng sắp quá hạn 72 giờ (ví dụ sau 48 giờ)
- [ ] Biểu đồ thống kê số đơn theo ngày/tuần và tỷ lệ sử dụng theo kích cỡ ngăn
- [ ] Xuất báo cáo lịch sử đơn / nhật ký ra file CSV hoặc PDF

---

## ④ Tech Stack

> Chi tiết kỹ thuật và lý do chọn sẽ được đồng bộ tại `docs/tech-spec.md`.

| Layer | Tech | Lý do chọn |
|---|---|---|
| Frontend Web | React (Vite + Tailwind CSS) + PWA, chạy trong `web/` | Giao diện Navy & Cam 3D hiện đại, dùng chung mã nguồn cho cả 3 nền tảng |
| Frontend Mobile | Android đóng gói bằng Capacitor (từ `web/`) | Xuất file `.apk` cài thật trên Android, đồng bộ 100% giao diện, tiết kiệm thời gian cho 1 người làm |
| Frontend Desktop | Desktop Windows đóng gói bằng Electron (từ `web/`) | Chạy thành ứng dụng Windows độc lập cho Vận hành & Admin, không phải viết lại giao diện |
| Backend | Spring Boot 3, Java 21 (REST API, MQTT, Email, SMS) | Nền tảng người làm đã quen thuộc |
| Database | PostgreSQL 16 (qua Docker khi local) | Ổn định, hỗ trợ khóa giao dịch chống cấp trùng ngăn |
| Auth & OTP | JWT cho đăng nhập; OTP băm (hash) + Gmail SMTP + SMS trial (Twilio/eSMS) | Tách biệt xác thực tài khoản và xác thực mở ngăn |
| Thiết bị | ESP32 mô phỏng trên Wokwi (≥ 2 tủ, 6–9 ngăn/tủ), giao tiếp MQTT (Mosquitto) | Phù hợp môn hệ thống nhúng, không cần mua phần cứng thật |
| Hosting | Local bằng Docker **VÀ** Demo công khai trên Internet (dịch vụ miễn phí/sinh viên có HTTPS & MQTT bảo mật) | Đáp ứng cả phát triển hằng ngày lẫn demo trực tiếp bằng điện thoại |

---

## ⑤ Integration Points

### 1. Tủ khóa (ESP32 mô phỏng trên Wokwi) qua MQTT
1. Backend gửi lệnh mở ngăn tới `locker/{lockerId}/cmd/open` kèm `correlationId`
2. Tủ mở khóa và gửi `door_opened`, sau đó `door_closed` vào `locker/{lockerId}/event`, trả lại đúng `correlationId`
3. Tủ gửi `heartbeat` định kỳ; mất 3 nhịp liên tiếp backend đánh dấu `OFFLINE`
4. Tủ gửi `fault` khi có lỗi cửa/khóa
❌ Không xử lý: tự gửi lại lệnh nhiều lần khi mất mạng kéo dài; bỏ qua sự kiện cho ngăn không tồn tại và ghi nhật ký cảnh báo.

> Định dạng chính xác từng topic và payload: xem `docs/mqtt-contract.md`.

### 2. Dịch vụ Email (Gmail SMTP)
- Dùng để gửi mã OTP mở ngăn và gửi mã/liên kết đặt lại mật khẩu ("Quên mật khẩu").
- Cấu hình thông tin đăng nhập (App Password) qua biến môi trường trong `.env`.

### 3. Dịch vụ SMS (bản dùng thử miễn phí: Twilio / eSMS)
- Dùng để gửi mã OTP tới số điện thoại người nhận khi có đơn `READY` hoặc khi cấp lại OTP.
- Khóa API lưu trong `.env`. Nếu gặp giới hạn tài khoản dùng thử (ví dụ số chưa xác minh hoặc hết quota), hệ thống ghi nhận lỗi gửi SMS nhưng **không làm gián đoạn** việc tạo đơn hay gửi OTP qua Web/App và Email.

---

## ⑥ Non-Functional Requirements

- **Performance:** Từ lúc nhập OTP đúng đến lúc tủ mô phỏng nhận lệnh mở khóa dưới **3 giây** trong môi trường local (và dưới **5 giây** khi demo công khai).
- **Security:**
  - Mật khẩu và mã OTP luôn được băm (hash), không lưu dạng chữ thường, không ghi ra log.
  - JWT cho đăng nhập; phân quyền 4 vai trò kiểm tra chặt ở phía backend.
  - Không lưu mật khẩu, JWT secret, Gmail App Password, khóa SMS trong mã nguồn (chỉ dùng `.env`).
  - Môi trường demo công khai: bắt buộc HTTPS, Mosquitto tắt `allow_anonymous` (có username/password), thêm tiền tố ngẫu nhiên vào topic MQTT theo `docs/mqtt-contract.md`.
- **Responsive:** Giao diện Web hiển thị tốt trên cả điện thoại và máy tính; cài được PWA.
- **Concurrency:** Hỗ trợ nhiều tủ (≥ 2 tủ) và nhiều người dùng thao tác đồng thời ở mức demo (dưới 20 người dùng cùng lúc); đảm bảo không bao giờ cấp trùng ngăn.
- **Uptime:** Chạy ổn định suốt quá trình demo và bảo vệ đồ án.
- **Kiểm thử:** Có unit test cho các logic nghiệp vụ cốt lõi (phân quyền 4 vai trò, cấp ngăn theo kích thước & chống trùng, vòng đời OTP, hết hạn 24h / lưu hàng 72h, xử lý sự kiện MQTT).

---

## ⑦ Edge Cases & Error States

| Tình huống | Hành vi mong muốn |
|---|---|
| Nhập sai OTP | Báo "Mã OTP không đúng", tăng số lần sai; sai quá **3 lần** thì tạm khóa đơn |
| OTP hết hạn (quá 24 giờ) hoặc bị khóa | Báo rõ lý do; cho phép người nhận bấm "Xin cấp lại mã mới" (có giới hạn chống spam) hoặc liên hệ Nhân viên vận hành hỗ trợ |
| Đơn hàng quá hạn lưu trữ (quá 72 giờ) | Chuyển đơn sang `EXPIRED`, hiển thị cảnh báo trên màn hình vận hành & trạng thái hệ thống để nhân viên xử lý |
| Tủ hết ngăn trống đúng kích cỡ | Báo rõ "Tủ hết ngăn cỡ [Nhỏ/Vừa/Lớn]", không cấp nhầm ngăn nhỏ hơn |
| Tủ đang ngoại tuyến (`OFFLINE`) | Không cho phép cấp ngăn mới; hiển thị rõ "Tủ đang ngoại tuyến" |
| Gửi lệnh mở nhưng quá **10 giây** không nhận `door_opened` | Báo lỗi kết nối tủ cho người dùng, không đổi trạng thái đơn, ghi nhật ký |
| Cửa mở mà không đóng lại | Tủ gửi sự kiện `fault`; hiển thị cảnh báo cho Nhân viên vận hành và trang trạng thái hệ thống |
| Hai shipper cùng lúc xin ngăn | Chỉ một người được cấp ngăn đó; người còn lại được cấp ngăn trống khác cùng cỡ hoặc báo hết ngăn |
| Dịch vụ Email hoặc SMS lỗi / hết quota dùng thử | Ghi nhật ký lỗi gửi tin; đơn hàng và OTP vẫn tạo thành công và xem được ngay trên Web/App |
| Mất kết nối MQTT phía backend | Tự động kết nối lại; hiển thị cảnh báo trên trang trạng thái hệ thống; lệnh đang gửi báo lỗi rõ ràng |
| Phiên đăng nhập (JWT) hết hạn | Chuyển về màn hình đăng nhập với thông báo rõ ràng |
| Người dùng gọi API sai quyền hoặc tự đăng ký quyền Admin | Trả lỗi từ chối truy cập (403), ghi nhật ký |
| Lệnh hoặc sự kiện MQTT bị gửi trùng `correlationId` | Chỉ xử lý một lần, bỏ qua bản trùng |

---

## ⑧ Success Metrics

- **Trước hạn nộp 2 tuần:** Backend + Web (PWA) + trang trạng thái hệ thống + Wokwi (≥ 2 tủ) chạy trọn vẹn end-to-end cả local và demo công khai (đăng ký → shipper gửi theo cỡ → OTP qua Web/Email/SMS → mở tủ → hoàn tất).
- **Trước hạn nộp 1 tuần:** Hoàn thành App Android (Người nhận & Shipper) và App Desktop JavaFX (Vận hành & Admin) kết nối chung API.
- **Ngày nộp:** Mọi feature 🟢 MUST đạt "Done khi"; unit test chạy xanh trên CI; có báo cáo kiểm thử chấp nhận và kiểm thử an toàn.
- **Khi bảo vệ:** Giải thích được kiến trúc, từng phần code chính và trình bày đầy đủ nhật ký dùng AI (`docs/ai-log.md`).

---

## ⑨ Constraints & Assumptions

**Giới hạn:**
- **Ngân sách:** 0 đồng (dùng công cụ miễn phí, Gmail cá nhân, bản dùng thử SMS miễn phí, hosting miễn phí cho sinh viên/demo).
- **Thời gian:** Còn khoảng **1–2 tháng** đến hạn nộp.
- **Nhân lực:** **1 người** thực hiện toàn bộ (lưu ý: `docs/TEAM.md` hiện ghi 3 người, cần cập nhật lại cho khớp).
- **Cảnh báo phạm vi:** Yêu cầu hiện tại rất đầy đủ (Backend + Web PWA + Android + Desktop JavaFX + ≥ 2 tủ Wokwi + Email + SMS + Demo online) cho 1 người làm trong 1–2 tháng. Cần làm cuốn chiếu thật gọn: hoàn chỉnh lõi Backend + Web + Wokwi trước để chắc chắn có bản demo chạy được, sau đó mới làm Android và Desktop.
- **Ràng buộc môn học:** Phần cứng chỉ cần mô phỏng trên Wokwi; được phép dùng AI nhưng phải ghi nhật ký (`docs/ai-log.md`) và hiểu để bảo vệ code.

**Giả định (Assumptions):**
- Phần cứng tủ chỉ cần mô phỏng trên Wokwi, không yêu cầu mạch ESP32 thật.
- Bạn tự đăng ký tài khoản Gmail (App Password) và tài khoản dùng thử dịch vụ SMS (Twilio/eSMS) khi tới mốc tích hợp.
- Dịch vụ demo công khai (hosting web + broker MQTT có xác thực) dùng gói miễn phí.

---

## ⑩ Câu hỏi còn mở

- [ ] Ngày nộp chính xác là ngày nào? (hiện ước lượng 1–2 tháng)
- [ ] Có file đề bài hoặc yêu cầu chi tiết từ giảng viên cần đối chiếu thêm mã FR/NFR/UC không?

---

## Changelog

| Ngày | Thay đổi | Người cập nhật |
|---|---|---|
| 2026-11-20 | v1 — draft đầu tiên do AI soạn từ repo, chờ xác nhận | AI |
| 2026-11-20 | v2 — cập nhật đầy đủ theo phỏng vấn 3 vòng: đủ 3 nền tảng MUST, 4 vai trò (thêm Admin), tự đăng ký & quên mật khẩu qua email, cấp ngăn theo kích cỡ Nhỏ/Vừa/Lớn, OTP đa kênh (Web/App + Gmail + SMS trial), ≥ 2 tủ 6–9 ngăn, OTP 24h / lưu hàng 72h, trang quản lý trạng thái hệ thống, hỗ trợ cả local và demo công khai | AI + Chủ dự án |
