# Quy tắc làm việc nhóm

## Nhánh

- `main`: bản ổn định, luôn chạy được, dùng để nộp và demo.
- `feature/<viec>`: mỗi việc một nhánh, tách ra từ `main`. Ví dụ `feature/otp-verify`, `fix/door-sensor-debounce`.

Không đẩy thẳng lên `main`. Mọi thay đổi đi qua pull request (PR).

## Một vòng làm việc

```bash
git checkout main && git pull
git checkout -b feature/ten-viec
# ... code, chạy test ...
git add . && git commit -m "feat(otp): thêm kiểm tra OTP hết hạn"
git push -u origin feature/ten-viec
# Mở Pull Request vào main trên GitHub
```

## Quy ước commit

Dạng `loai(pham-vi): mo ta ngan`. Loại: `feat`, `fix`, `test`, `docs`, `refactor`, `chore`.

## Pull request

- Một PR chỉ làm một việc, đủ nhỏ để người khác đọc trong 15 phút.
- Điền mẫu PR: việc gì, đã test thế nào, liên quan yêu cầu nào (FR/NFR/UC).
- Cần ít nhất 1 người trong nhóm duyệt; CI (build và test) phải xanh trước khi gộp.
- Người viết không tự gộp PR của mình khi chưa có người duyệt.

## Quy tắc bắt buộc

1. **Không commit bí mật:** mật khẩu, khóa, token. Dùng `.env` (đã nằm trong `.gitignore`).
2. **Có test cho logic nghiệp vụ** mới (OTP, cấp ngăn, phân quyền).
3. **Dùng AI thì ghi nhật ký** trong `docs/ai-log.md` (prompt chính, bạn sửa gì). Mỗi người phải hiểu code mình nộp để bảo vệ.
4. **Giao thức MQTT là hợp đồng chung:** muốn đổi topic hoặc định dạng JSON thì sửa `docs/mqtt-contract.md` trong cùng PR và báo cả nhóm.

## Công việc

Mỗi việc là một Issue (dùng mẫu có sẵn), gắn người nhận và mốc theo tuần, theo dõi bằng bảng GitHub Projects (Todo, Doing, Review, Done).
