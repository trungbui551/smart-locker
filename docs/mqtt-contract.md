# Hợp đồng MQTT

Mọi thay đổi ở file này phải báo cả nhóm. Backend và firmware cùng tuân theo.

| Topic | Hướng | Payload (JSON) | Ý nghĩa |
| --- | --- | --- | --- |
| `locker/{lockerId}/cmd/open` | Backend → tủ | `{"compartment": 3, "correlationId": "<uuid>"}` | Lệnh mở khóa một ngăn |
| `locker/{lockerId}/event` | Tủ → backend | `{"type": "door_opened"\|"door_closed"\|"fault", "compartment": 3, "correlationId": "<uuid>", "ts": "<ISO-8601>"}` | Sự kiện cửa, lỗi |
| `locker/{lockerId}/heartbeat` | Tủ → backend | `{"ts": "<ISO-8601>"}` | Nhịp sống, gửi định kỳ |

Quy ước:
- `lockerId` dạng `L01`, `L02`...
- Tủ trả lại đúng `correlationId` của lệnh đã nhận.
- Mất 3 heartbeat liên tiếp: backend đánh dấu tủ ngoại tuyến.
- Trên môi trường demo công khai, thêm tiền tố ngẫu nhiên vào topic (xem mục an toàn trong tài liệu).
