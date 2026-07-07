# Ruka-Sarashina-Bot

Dự án bot Facebook Messenger được thiết kế theo cấu trúc mô-đun (modular) bằng Node.js.

## Hướng dẫn cài đặt và sử dụng

1. **Cài đặt các gói phụ thuộc:**
   ```bash
   npm install
   ```

2. **Cấu hình:**
   - Cập nhật tệp `config.json` để cấu hình PREFIX, ADMINBOT, và các thông tin cài đặt khác.
   - Thêm cookie Facebook của bạn vào tệp `appstate.json` (tệp này được bỏ qua trong git để đảm bảo bảo mật).

3. **Chạy bot:**
   ```bash
   npm start
   ```

Xem chi tiết cấu trúc tại [Tài liệu Kiến trúc](docs/architecture.md).
