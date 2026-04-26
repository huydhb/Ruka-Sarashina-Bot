const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: "timhieu",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "Bot",
    description: "Xem hướng dẫn chi tiết cách sử dụng lệnh",
    commandCategory: "Tiện ích",
    usages: "/timhieu (tên lệnh) - VD: /timhieu kiemtra",
    cooldowns: 3
};

// Hướng dẫn chi tiết cho tất cả lệnh
const guides = {
    // ====== HỖ TRỢ NHÓM ======
    "cratedatabase": {
        name: "cratedatabase",
        desc: "Tạo database thành viên nhóm theo lớp",
        steps: [
            "Bước 1: Vào nhóm cần tạo database",
            "Bước 2: Gõ /cratedatabase",
            "Bước 3: Bot tự động lấy danh sách thành viên",
            "Bước 4: Database lưu 21 lớp (10A-12H, không có F)",
            "Lưu ý: Chạy lệnh này TRƯỚC các lệnh khác"
        ]
    },
    "themdatalop": {
        name: "themdatalop",
        desc: "Thu thập thông tin lớp của thành viên",
        steps: [
            "Bước 1: Chạy /cratedatabase trước",
            "Bước 2: Gõ /themdatalop",
            "Bước 3: Bot gửi tin nhắn riêng cho tất cả",
            "Bước 4: Thành viên reply /lop 12A",
            "Bước 5: Dùng /tatthemdatalop để tắt"
        ]
    },
    "tatthemdatalop": {
        name: "tatthemdatalop",
        desc: "Tắt lắng nghe tin nhắn riêng",
        steps: [
            "Bước 1: Sau khi chạy /themdatalop",
            "Bước 2: Gõ /tatthemdatalop",
            "Bước 3: Thành viên dùng /lop trong nhóm"
        ]
    },
    "lop": {
        name: "lop",
        desc: "Cập nhật lớp của bản thân",
        steps: [
            "Cách dùng: /lop (tên lớp)",
            "Ví dụ: /lop 12A hoặc /lop 11B",
            "Lớp hợp lệ: 10-12 + ABCDEGH (không có F)"
        ]
    },
    "batdau": {
        name: "batdau",
        desc: "Gửi tin nhắn hàng loạt",
        steps: [
            "Bước 1: Chạy /cratedatabase",
            "Bước 2: Chạy /themdatalop",
            "Bước 3: Gõ /batdau:\"nội dung\"",
            "Bước 4: Thành viên reply /12A 1",
            "Bước 5: Dùng /kiemtra để xem"
        ]
    },
    "kiemtra": {
        name: "kiemtra",
        desc: "Xem trạng thái xác nhận theo lớp",
        steps: [
            "Bước 1: Sau khi chạy /batdau",
            "Bước 2: Gõ /kiemtra",
            "Hiển thị: Tổng, lớp nhất, lớp còn thiếu"
        ]
    },
    "kiemtrachitiet": {
        name: "kiemtrachitiet",
        desc: "Xem chi tiết người chưa xác nhận",
        steps: [
            "Gõ /kiemtrachitiet",
            "Hiển thị danh sách theo lớp",
            "Sau /ketthuc đọc từ bản nháp"
        ]
    },
    "ketthuc": {
        name: "ketthuc",
        desc: "Kết thúc phiên gửi tin nhắn",
        steps: [
            "Bước 1: Sau khi /batdau",
            "Bước 2: Gõ /ketthuc",
            "Bước 3: Bot gửi tin cho tất cả",
            "Bước 4: Lưu bản nháp người chưa xác nhận"
        ]
    },
    "gui": {
        name: "gui",
        desc: "Gửi tin nhắn riêng",
        steps: [
            "Gửi 1 người: /gui@TênNgười:nội dung",
            "Gửi tất cả: /gui@All:nội dung (admin)",
            "Ví dụ: /gui@AnhDuong:Xin chào"
        ]
    },

    // ====== AI & CHAT ======
    "ai": {
        name: "ai",
        desc: "Trò chuyện với AI",
        steps: ["Gõ: /ai (câu hỏi)", "Ví dụ: /ai thủ đô Việt Nam là gì"]
    },
    "ask": {
        name: "ask",
        desc: "Hỏi đáp với AI",
        steps: ["Gõ: /ask (câu hỏi)", "Bot trả lời dựa trên AI"]
    },

    // ====== QUẢN TRỊ NHÓM ======
    "kick": {
        name: "kick",
        desc: "Kick thành viên khỏi nhóm",
        steps: ["Gõ: /kick @người", "Hoặc reply tin nhắn + /kick", "Yêu cầu: Bot phải là admin nhóm"]
    },
    "adduser": {
        name: "adduser",
        desc: "Thêm thành viên vào nhóm",
        steps: ["Gõ: /adduser (uid)", "Hoặc: /adduser (link facebook)"]
    },
    "admin": {
        name: "admin",
        desc: "Quản lý admin nhóm",
        steps: ["Xem admin: /admin", "Thêm: /admin add @người", "Xóa: /admin remove @người"]
    },
    "anti": {
        name: "anti",
        desc: "Bật/tắt tính năng bảo vệ nhóm",
        steps: ["Xem trạng thái: /anti", "Bật: /anti on (tên)", "Tắt: /anti off (tên)"]
    },
    "antispam": {
        name: "antispam",
        desc: "Chống spam trong nhóm",
        steps: ["Bật: /antispam on", "Tắt: /antispam off"]
    },
    "rule": {
        name: "rule",
        desc: "Quản lý nội quy nhóm",
        steps: ["Xem: /rule", "Thêm: /rule add (nội dung)", "Xóa: /rule del (số)"]
    },
    "setname": {
        name: "setname",
        desc: "Đặt biệt danh thành viên",
        steps: ["Gõ: /setname @người (tên mới)", "Yêu cầu: Bot phải là admin nhóm"]
    },

    // ====== THÔNG TIN ======
    "info": {
        name: "info",
        desc: "Xem thông tin user/nhóm",
        steps: ["Xem mình: /info", "Xem người khác: /info @người", "Xem nhóm: /info box"]
    },
    "uid": {
        name: "uid",
        desc: "Lấy UID Facebook",
        steps: ["Lấy UID mình: uid", "Lấy UID người khác: uid @người", "Lấy UID từ link: uid (link)"]
    },
    "boxid": {
        name: "boxid",
        desc: "Lấy ID nhóm chat",
        steps: ["Gõ: /boxid"]
    },
    "uptime": {
        name: "uptime",
        desc: "Xem thời gian bot đã chạy",
        steps: ["Gõ: /uptime"]
    },
    "ping": {
        name: "ping",
        desc: "Kiểm tra độ trễ bot",
        steps: ["Gõ: /ping"]
    },

    // ====== TIỆN ÍCH ======
    "menu": {
        name: "menu",
        desc: "Xem danh sách lệnh",
        steps: ["Xem tất cả: /menu", "Xem nhóm: /menu (số)", "Xem chi tiết: /menu (tên lệnh)"]
    },
    "help": {
        name: "help",
        desc: "Xem hướng dẫn lệnh",
        steps: ["Gõ: /help (tên lệnh)"]
    },
    "dịch": {
        name: "dịch",
        desc: "Dịch văn bản",
        steps: ["Gõ: /dịch (ngôn ngữ) (nội dung)", "Ví dụ: /dịch en xin chào"]
    },
    "note": {
        name: "note",
        desc: "Ghi chú nhóm",
        steps: ["Xem: /note", "Thêm: /note add (nội dung)", "Xóa: /note del (số)"]
    },

    // ====== TẢI XUỐNG ======
    "tiktok": {
        name: "tiktok",
        desc: "Tải video TikTok",
        steps: ["Gõ: /tiktok (link)", "Bot tải và gửi video không watermark"]
    },
    "ytb": {
        name: "ytb",
        desc: "Tải nhạc/video YouTube",
        steps: ["Tải nhạc: /ytb (tên bài)", "Tải video: /ytb -v (tên)"]
    },
    "scl": {
        name: "scl",
        desc: "Tải nhạc SoundCloud",
        steps: ["Gõ: /scl (tên bài hoặc link)"]
    },

    // ====== HÌNH ẢNH ======
    "ảnh": {
        name: "ảnh",
        desc: "Lấy ảnh ngẫu nhiên",
        steps: ["Gõ: /ảnh (thể loại)", "Ví dụ: /ảnh gái"]
    },
    "tachnen": {
        name: "tachnen",
        desc: "Tách nền ảnh",
        steps: ["Reply ảnh + /tachnen", "Bot trả về ảnh đã xóa nền"]
    },
    "4k": {
        name: "4k",
        desc: "Nâng cấp chất lượng ảnh",
        steps: ["Reply ảnh + /4k", "Bot tăng độ phân giải"]
    },

    // ====== ADMIN BOT ======
    "addadmin": {
        name: "addadmin",
        desc: "Thêm admin bot",
        steps: ["Gõ: /addadmin @người", "Yêu cầu: Phải là admin bot"]
    },
    "deleteadmin": {
        name: "deleteadmin",
        desc: "Xóa admin bot",
        steps: ["Gõ: /deleteadmin @người"]
    },
    "restart": {
        name: "restart",
        desc: "Khởi động lại bot",
        steps: ["Gõ: /restart"]
    },
    "cleardata": {
        name: "cleardata",
        desc: "Xóa dữ liệu cache",
        steps: ["Gõ: /cleardata", "Xóa cache, log cũ"]
    },
    "sendnoti": {
        name: "sendnoti",
        desc: "Gửi thông báo tất cả nhóm",
        steps: ["Gõ: /send (nội dung)", "Yêu cầu: Admin bot"]
    }
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;

    const cmdName = args[0]?.toLowerCase();

    if (!cmdName) {
        const cmdList = Object.keys(guides).join(", ");
        return api.sendMessage(
            `Cách dùng: /timhieu (tên lệnh)\n` +
            `Tổng: ${Object.keys(guides).length} lệnh có hướng dẫn`,
            threadID, messageID
        );
    }

    const guide = guides[cmdName];

    if (!guide) {
        return api.sendMessage(
            `Không tìm thấy hướng dẫn cho lệnh "${cmdName}"`,
            threadID, messageID
        );
    }

    let message =
        `HƯỚNG DẪN: /${guide.name}\n` +
        `Chức năng: ${guide.desc}\n` +
        `---\n`;

    guide.steps.forEach((step) => {
        message += `${step}\n`;
    });

    return api.sendMessage(message, threadID);
};
