-- Migration M4: Bảng locker_commands theo dõi lệnh mở ngăn qua MQTT và correlationId
-- Tương thích cả PostgreSQL 16 và H2 (cho CI test).

CREATE TABLE locker_commands (
    correlation_id VARCHAR(64) PRIMARY KEY,
    locker_id VARCHAR(20) NOT NULL,
    compartment_number INTEGER NOT NULL,
    delivery_id BIGINT,
    purpose VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    requested_by_user_id BIGINT,
    reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    opened_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_cmd_locker FOREIGN KEY (locker_id) REFERENCES lockers (id) ON DELETE CASCADE,
    CONSTRAINT fk_cmd_delivery FOREIGN KEY (delivery_id) REFERENCES deliveries (id) ON DELETE SET NULL
);

CREATE INDEX idx_locker_commands_status_created ON locker_commands (status, created_at);
