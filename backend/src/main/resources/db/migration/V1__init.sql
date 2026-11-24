-- Migration khởi tạo M0: xác nhận Flyway kết nối và chạy thành công trên PostgreSQL.
-- Các bảng nghiệp vụ (users, lockers, compartments, deliveries, otp_codes, audit_events)
-- sẽ được thêm lần lượt từ mốc M1 trở đi theo docs/build-plan.md.

CREATE TABLE IF NOT EXISTS system_info (
    info_key VARCHAR(64) PRIMARY KEY,
    info_value VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO system_info (info_key, info_value)
SELECT 'schema_version', 'M0-skeleton'
WHERE NOT EXISTS (
    SELECT 1 FROM system_info WHERE info_key = 'schema_version'
);
