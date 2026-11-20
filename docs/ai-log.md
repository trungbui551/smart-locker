# Nhật ký dùng AI

Mỗi người ghi khi dùng AI để sinh hoặc sửa code. Dùng để nộp kèm hồ sơ và để tự ôn khi bảo vệ.

| Ngày | Người | Việc | Prompt chính (tóm tắt) | Kết quả, đã sửa gì |
| --- | --- | --- | --- | --- |
| 2026-11-20 | Chủ dự án | Thiết kế & dựng bản demo React cho 4 màn hình S6–S9 bằng skill `ui-ux-pro-max` | Dùng skill `ui-ux-pro-max-skill` và React để thiết kế bản demo ban đầu cho S6–S9; đổi Frontend Web chính thức sang React | Đã sinh Design System (`design-system/smart-locker/MASTER.md`), đồng bộ `prd.md`/`tech-spec.md`/`build-plan.md`, tạo ứng dụng React trong `web/` với đủ 4 màn hình S6–S9 tương tác nối liền nhau |

| 2026-11-20 | Chủ dự án | Hoàn thiện đủ 15 màn hình (S1–S15) theo phong cách Navy & Cam 3D, gắn logo trong suốt và đồng bộ tài liệu React + Capacitor + Electron | Chốt bản 3 Navy & Cam 3D, tách nền logo, sửa lỗi mobile và dựng tiếp các màn hình còn lại | Đã tách nền `web/public/logo.png`, sửa responsive `@container`, chốt `docs/design-spec.md`, đồng bộ `prd.md`/`tech-spec.md`/`build-plan.md`, hoàn thiện đủ 15 màn hình S1–S15 có dữ liệu liên thông và Audit Log trực tiếp |

| 2026-11-20 | Chủ dự án | Hoàn thành M0: Khung dự án Backend Spring Boot 3 + Docker + Flyway + CI | Bắt đầu M0 trên nhánh `feature/m0-backend-skeleton` | Khởi tạo `backend/` (Spring Boot 3.4.3, Java 21, `mvnw`, Actuator, Flyway `V1__init.sql`, unit test H2), sửa cổng Docker PostgreSQL `5433` tránh đụng PostgreSQL cài sẵn trên Windows, chuẩn hóa múi giờ `Asia/Ho_Chi_Minh`, kiểm chứng `/actuator/health` trả `{"status":"UP"}` và `mvnw -B verify` xanh |

| 2026-11-20 | Chủ dự án | Hoàn thành M1: Đăng ký, Đăng nhập JWT, Quên mật khẩu (Gmail SMTP + Google OAuth 2) & Phân quyền 4 vai trò | Bắt đầu M1 trên nhánh `feature/m1-auth-rbac`, hỗ trợ cả Gmail SMTP và Google OAuth 2 | Tạo migration `V2__auth_and_audit.sql`, Spring Security + JWT + BCrypt, `EmailService` (3 chế độ `log`/`smtp`/`oauth2`), `AuthService`/`AuthController`/`UserController`/`DemoUserSeeder`, viết `AuthAndRbacTests` (4/4 test xanh) và kiểm thử thực tế trên PostgreSQL 16 |

| 2026-11-20 | Chủ dự án | Hoàn thành M2: Tủ, ngăn theo cỡ (Nhỏ/Vừa/Lớn), quản trị Admin & cấp ngăn chống trùng | Bắt đầu M2 trên nhánh `feature/m2-locker-allocation` | Tạo migration `V3__lockers_and_deliveries.sql`, `DemoLockerSeeder` (2 tủ `L01`/`L02`, mỗi tủ 6 ngăn), API Admin (`/api/admin/users/**`, `/api/admin/lockers/**`), API cấp ngăn có khóa `PESSIMISTIC_WRITE` (`/api/deliveries`), viết `LockerAndAllocationTests` (8/8 test xanh gồm test đồng thời 2 luồng) và kiểm chứng thật trên PostgreSQL 16 |

| 2026-11-20 | Chủ dự án | Hoàn thành M3: Mã OTP đa kênh (Web/App + Gmail + SMS Twilio/eSMS), cấp lại mã & quá hạn 72h | Tách nhánh `feature/m3-otp-and-expiry` và thực hiện M3 | Tạo migration `V4__otp_codes.sql`, `OtpCryptoHelper` (SHA-256 + AES-256-GCM), `SmsService` (Twilio/eSMS có dự phòng log), `OtpService`/`OtpController`, `DeliveryExpiryScheduler` (72h → `EXPIRED`), viết `OtpAndExpiryTests` (11/11 test xanh) và kiểm chứng thực tế trên PostgreSQL 16 |