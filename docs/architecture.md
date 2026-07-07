# Tài liệu Kiến trúc: Bot_Messager_JS (TatsuYTB / Ruka-Sarashina)

Tài liệu này cung cấp một cái nhìn tổng quan toàn diện về kiến trúc, các thành phần cốt lõi và luồng dữ liệu của dự án bot Facebook Messenger viết bằng Node.js.

## 1. Kiến trúc Tổng thể (High-Level Architecture)

Dự án này là một bot Facebook Messenger được thiết kế theo dạng mô-đun (modular) chạy trên nền tảng Node.js. Bot sử dụng một thư viện API Facebook Chat (FCA) không chính thức để lắng nghe và gửi tin nhắn. Cấu trúc của bot được xây dựng theo dạng plugin cho các lệnh (commands) và sự kiện (events), giúp dễ dàng mở rộng tính năng. Hệ thống sử dụng cơ sở dữ liệu SQLite thông qua Sequelize ORM để quản lý dữ liệu người dùng, nhóm chat (threads) và hệ thống tiền tệ/kinh tế (currencies).

**Các công nghệ chính:**
- **Môi trường chạy:** Node.js
- **API Facebook:** Thư viện FCA tùy chỉnh (nằm trong thư mục `lib/`, ví dụ: `fca-auto`, `Fca-Horizon-Remastered`)
- **Cơ sở dữ liệu:** SQLite (quản lý qua `sequelize`)
- **Web Server:** `express` (cung cấp một trang web/endpoint đơn giản để giữ cho bot hoạt động liên tục - keep-alive)

## 2. Thành phần Cốt lõi & Cấu trúc Thư mục

### `index.js`
Điểm khởi đầu (entry point) của ứng dụng. File này thực hiện hai nhiệm vụ chính:
1. Khởi chạy một máy chủ Express đơn giản trên cổng được chỉ định.
2. Tạo một tiến trình con (child process) chạy `main.js` để xử lý logic thực tế của bot. Nó cũng quản lý việc tự động khởi động lại bot nếu tiến trình bot bị lỗi hoặc thoát đột ngột.

### `main.js`
Bộ não cốt lõi của bot. Nhiệm vụ của nó bao gồm:
- **Khởi tạo:** Thiết lập các biến toàn cục (`global.client`, `global.data`, `global.config`).
- **Tải Cấu hình:** Đọc các cài đặt từ file `config.json` và quản lý các file ngôn ngữ/dịch thuật (`languages/`).
- **Tải Mô-đun:** Đọc và đăng ký động toàn bộ các lệnh từ `modules/commands/` và các sự kiện từ `modules/events/`. Các gói phụ thuộc (dependencies) bị thiếu cho từng mô-đun sẽ tự động được cài đặt thông qua `npm`.
- **Kết nối Cơ sở Dữ liệu:** Khởi tạo Sequelize và kết nối tới database `includes/data.sqlite`.
- **Xác thực:** Sử dụng file `appstate.json` để đăng nhập vào Facebook thông qua thư viện FCA.
- **Thiết lập Bộ lắng nghe:** Cấu hình bộ lắng nghe `mqtt` để bắt các sự kiện tin nhắn đến và chuyển chúng sang `includes/listen.js` xử lý.

### `includes/`
Chứa các thành phần cốt lõi để định tuyến sự kiện và quản lý dữ liệu.
- **`listen.js`:** Bộ định tuyến sự kiện chính. Nó tiếp nhận các sự kiện thô từ Facebook (tin nhắn, gỡ tin nhắn, cảm xúc, v.v.) và chuyển hướng chúng đến các trình xử lý phù hợp. Nó cũng quản lý các tác vụ định kỳ (cron tasks) như kiểm tra tương tác hoặc đặt lịch.
- **`handle/`:** Chứa logic cụ thể để xử lý các loại dữ liệu đầu vào:
  - `handleCommand.js`: Phân tích tin nhắn của người dùng, kiểm tra quyền hạn/thời gian chờ (cooldown) và thực thi lệnh được yêu cầu.
  - `handleEvent.js`: Thực thi các mô-đun được thiết kế để lắng nghe sự kiện nhóm (như khi có thành viên tham gia hoặc rời nhóm).
  - `handleReaction.js` & `handleReply.js`: Quản lý các lệnh tương tác yêu cầu lắng nghe phản hồi tiếp theo hoặc cảm xúc emoji từ người dùng.
  - `handleCreateDatabase.js`: Tự động đăng ký người dùng hoặc nhóm mới vào cơ sở dữ liệu khi họ tương tác lần đầu tiên.
- **`database/`:** Chứa tệp khởi tạo Sequelize ORM và các mô hình dữ liệu (`users.js`, `threads.js`, `currencies.js`).

### `modules/`
Hệ sinh thái plugin của bot.
- **`commands/`:** Chứa toàn bộ các lệnh của bot (ví dụ: `help.js`, `admin.js`, minigames, các lệnh gọi API lấy dữ liệu). Mỗi lệnh xuất ra (export) một đối tượng `config` (chứa siêu dữ liệu, quyền hạn, mô tả) và một hàm `run` (chứa logic thực thi).
- **`events/`:** Chứa các kịch bản tự động kích hoạt dựa trên sự kiện trong cuộc trò chuyện thay vì lệnh rõ ràng từ người dùng (ví dụ: `joinnoti.js` để chào mừng thành viên mới, `antiout.js` để ngăn chặn thành viên tự ý rời nhóm).

### `utils/`
Chứa các hàm tiện ích và công cụ được sử dụng rộng rãi trong dự án.
- **`log.js`:** Tiện ích ghi log tùy chỉnh với đầu ra bảng điều khiển có màu sắc dễ nhìn.
- **`index.js`:** Tập hợp các hàm tiện ích dùng chung (như tải file, tạo chuỗi ngẫu nhiên, mã hóa AES).

### `lib/`
Chứa các thư viện API cốt lõi dùng để giao tiếp với máy chủ MQTT của Facebook. Đây thường là các phiên bản (fork) được tùy biến sâu của thư viện `facebook-chat-api` nhằm vượt qua các hạn chế và chính sách bảo mật của Facebook.

## 3. Luồng Dữ liệu khi Thực thi

1. **Khởi động:** `index.js` chạy server Express và gọi tiến trình con chạy `main.js`.
2. **Khởi tạo hệ thống:** `main.js` tải cấu hình, kết nối cơ sở dữ liệu SQLite và nạp toàn bộ các mô-đun từ thư mục `modules/commands` và `modules/events` vào biến toàn cục `global.client`.
3. **Xác thực:** Thư viện FCA đăng nhập vào Facebook bằng thông tin cookies từ `appstate.json` và mở kết nối MQTT để chờ sự kiện.
4. **Nhận Sự kiện:** Facebook gửi sự kiện (ví dụ: tin nhắn mới) qua MQTT. Thư viện FCA phân tích dữ liệu này và kích hoạt hàm callback lắng nghe trong `main.js`, sau đó chuyển tiếp đến `includes/listen.js`.
5. **Đồng bộ Database:** `handleCreateDatabase.js` kiểm tra xem người gửi và nhóm chat đã tồn tại trong SQLite chưa. Nếu chưa, nó sẽ tiến hành tạo mới.
6. **Định tuyến:** `listen.js` phân loại sự kiện nhận được:
   - Nếu là tin nhắn thông thường bắt đầu bằng ký tự lệnh (`PREFIX`), sự kiện được chuyển cho `handleCommand.js`.
   - Nếu là phản hồi (reply) cho một tin nhắn trước đó của bot, sự kiện được chuyển cho `handleReply.js`.
   - Nếu là cảm xúc (reaction) trên tin nhắn của bot, sự kiện được chuyển cho `handleReaction.js`.
   - Nếu là các sự kiện hệ thống (như người dùng tham gia/rời nhóm), sự kiện được chuyển cho `handleEvent.js`.
7. **Thực thi:** Trình xử lý tương ứng kiểm tra các điều kiện an toàn (quyền hạn, lệnh bị cấm, thời gian chờ) và chạy hàm `run` của mô-đun đích trong thư mục `modules/`.
8. **Phản hồi:** Mô-đun thực hiện các tác vụ của mình (gọi API, xử lý dữ liệu) và sử dụng phương thức `api.sendMessage` để gửi kết quả phản hồi lại cuộc trò chuyện trên Facebook.

## 4. Lộ trình Phát triển & Các Quy tắc Tốt nhất (Best Practices)

Để duy trì và nâng cấp dự án hiệu quả, bạn nên chú ý một số điểm sau:

- **Bảo mật & Ổn định:** Đảm bảo file `appstate.json` được bảo mật tốt và được làm mới (refresh) định kỳ để tránh tình trạng bị khóa tài khoản (checkpoint). Hãy di chuyển các API key nhạy cảm ra khỏi file lệnh và lưu trữ chúng trong một file cấu hình bảo mật hoặc file `.env`.
- **Hiệu năng:** Đối với các lệnh tải và gửi file lớn (như video/audio), đảm bảo có cơ chế tự động dọn dẹp thư mục tạm `cache/` sau khi gửi để tránh đầy dung lượng đĩa.
- **Xử lý Lỗi (Error Handling):** Cải thiện các khối lệnh `try/catch` trong các lệnh riêng lẻ để ngăn chặn việc một plugin viết lỗi làm sập toàn bộ tiến trình hoạt động của bot.
- **Mở rộng Database:** Nếu bot phục vụ số lượng nhóm cực kỳ lớn, hãy cân nhắc chuyển từ SQLite sang các hệ quản trị cơ sở dữ liệu mạnh mẽ hơn như MongoDB hoặc PostgreSQL. Nhờ có Sequelize ORM, việc chuyển đổi cấu trúc này sẽ tương đối dễ dàng.
