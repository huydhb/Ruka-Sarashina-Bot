const fs = require("fs");
const path = require("path");

module.exports.config = {
    name: "chuanip",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "TatsuYTB",
    description: "Tra cứu chuẩn kháng nước và bụi IP",
    commandCategory: "Tiện ích",
    usages: "chuanip IPxx",
    cooldowns: 3
};

const ipRatings = {
    "0": "Không bảo vệ",
    "1": "Bảo vệ khỏi vật thể lớn hơn 50mm",
    "2": "Bảo vệ khỏi vật thể lớn hơn 12.5mm",
    "3": "Bảo vệ khỏi vật thể lớn hơn 2.5mm",
    "4": "Bảo vệ khỏi vật thể lớn hơn 1mm",
    "5": "Bảo vệ chống bụi một phần",
    "6": "Bảo vệ hoàn toàn khỏi bụi",
    "X": "Không xác định"
};

const waterRatings = {
    "0": "Không bảo vệ",
    "1": "Chống nhỏ giọt theo chiều dọc",
    "2": "Chống nhỏ giọt khi nghiêng 15°",
    "3": "Chống phun nước (spray)",
    "4": "Chống tia nước (splash)",
    "5": "Chống vòi nước áp suất thấp",
    "6": "Chống vòi nước áp suất mạnh",
    "7": "Chống ngâm nước trong tối đa 30 phút ở độ sâu 1m",
    "8": "Chống ngâm lâu dài dưới nước (sản xuất đặc biệt)",
    "9": "Chống tia nước áp suất cao, nhiệt độ cao"
};

module.exports.run = async function({ api, event, args }) {
    if (args.length === 0) {
        return api.sendMessage("Vui lòng nhập mã chuẩn IP, ví dụ: chuanip IP67", event.threadID, event.messageID);
    }

    const input = args[0].toUpperCase();
    const match = input.match(/^IP(\d|X)(\d)$/);

    if (!match) {
        return api.sendMessage("Mã IP không hợp lệ. Vui lòng nhập đúng định dạng, ví dụ: IP68", event.threadID, event.messageID);
    }

    const solid = match[1];
    const liquid = match[2];

    const solidDesc = ipRatings[solid] || "Không xác định";
    const liquidDesc = waterRatings[liquid] || "Không xác định";

    const msg = `📌 Chuẩn ${input}\n\n` +
        `🧱 Bảo vệ bụi (chữ số đầu tiên - ${solid}): ${solidDesc}\n` +
        `💧 Bảo vệ nước (chữ số thứ hai - ${liquid}): ${liquidDesc}`;

    const imagePath = path.join(__dirname, "anh", "ip.jpg");

    // Kiểm tra file ảnh có tồn tại không
    if (fs.existsSync(imagePath)) {
        return api.sendMessage({
            body: msg,
            attachment: fs.createReadStream(imagePath)
        }, event.threadID, event.messageID);
    } else {
        return api.sendMessage(msg + "\n⚠️ Không tìm thấy ảnh tại: " + imagePath, event.threadID, event.messageID);
    }
};