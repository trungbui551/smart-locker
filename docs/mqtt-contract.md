# Hợp đồng MQTT

Mọi thay đổi ở file này phải báo cả nhóm. Backend và firmware cùng tuân theo.

| Topic | Hướng | Payload (JSON) | Ý nghĩa |
| --- | --- | --- | --- |
| `locker/{lockerId}/cmd/open` | Backend → tủ | `{"compartment": 3, "correlationId": "<uuid>"}` | Lệnh mở khóa một ngăn (bật LED + xoay Servo) |
| `locker/{lockerId}/event` | Tủ → backend | `{"type": "door_opened"\|"door_closed"\|"fault", "compartment": 3, "correlationId": "<uuid>", "ts": "<ISO-8601>"}` | Sự kiện cửa, lỗi |
| `locker/{lockerId}/heartbeat` | Tủ → backend | `{"ts": "<ISO-8601>"}` | Nhịp sống, gửi định kỳ |
| `locker/{lockerId}/otp/submit` | Tủ → backend | `{"otp": "482916", "ts": "<ISO-8601>"}` | Người nhận bấm 6 số OTP + `#` trên bàn phím 4×4 của tủ |
| `locker/{lockerId}/display` | Backend → tủ | `{"line1": "SAI MA OTP!", "line2": "Vui long thu lai"}` | Phản hồi hiển thị lên màn hình LCD 16×2 của tủ |

Quy ước:
- `lockerId` dạng `L01`, `L02`...
- Tủ trả lại đúng `correlationId` của lệnh đã nhận.
- Mất 3 heartbeat liên tiếp: backend đánh dấu tủ ngoại tuyến.
- Trên môi trường demo công khai (hoặc EMQX Cloud), thêm tiền tố ngẫu nhiên `MQTT_TOPIC_PREFIX` vào trước mọi topic.
