const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: "taoreply",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Bot",
    description: "Tự động gửi hình táo khi nhắc đến táo/tài",
    commandCategory: "Khác",
    usages: "Tự động",
    cooldowns: 0
};

const imagePath = path.join(__dirname, '../commands/data', 'tao.png');

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, body, messageID } = event;

    if (!body) return;

    // Kiểm tra từ khóa (không phân biệt hoa thường)
    const text = body.toLowerCase();

    if (text.includes("táo") || text.includes("tài") || text.includes("tai")) {
        // Kiểm tra file ảnh tồn tại
        if (fs.existsSync(imagePath)) {
            return api.sendMessage({
                attachment: fs.createReadStream(imagePath)
            }, threadID, messageID);
        }
    }
};

module.exports.run = async function ({ api, event }) {
    return api.sendMessage("Event tự động phản hồi khi nhắc táo/tài.", event.threadID, event.messageID);
};
