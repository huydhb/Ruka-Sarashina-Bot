const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: "kiemtra",
    version: "3.0.0",
    hasPermssion: 1,
    credits: "Bot",
    description: "Kiểm tra trạng thái theo lớp",
    commandCategory: "Hỗ trợ nhóm",
    usages: "/kiemtra - Xem trạng thái theo lớp",
    cooldowns: 5
};

const dataDir = path.join(__dirname, 'data', 'member_database');

function readDatabase(threadID) {
    const dbPath = path.join(dataDir, `${threadID}.json`);
    if (fs.existsSync(dbPath)) {
        try { return JSON.parse(fs.readFileSync(dbPath, 'utf8')); }
        catch (e) { return null; }
    }
    return null;
}

module.exports.run = async function ({ api, event }) {
    const { threadID, messageID } = event;
    const moment = require("moment-timezone");
    const time = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY");

    const database = readDatabase(threadID);
    if (!database) {
        return api.sendMessage("Chưa có database!", threadID, messageID);
    }

    let totalConfirmed = 0;
    let totalMembers = 0;
    const missingClasses = [];

    // Duyệt classes - nhanh vì đã tính sẵn
    for (const [className, classInfo] of Object.entries(database.classes)) {
        if (classInfo.total > 0) {
            totalMembers += classInfo.total;
            totalConfirmed += classInfo.confirmed;

            if (classInfo.confirmed < classInfo.total) {
                const missing = classInfo.total - classInfo.confirmed;
                missingClasses.push(`${className}: ${missing}/${classInfo.total}`);
            }
        }
    }

    let message =
        `TRẠNG THÁI\n` +
        `Thời gian: ${time}\n` +
        `Tổng: ${totalConfirmed}/${totalMembers}\n`;

    if (database.firstWinner) {
        message += `🏆 Nhất: ${database.firstWinner}\n`;
    }

    message += `---\n`;

    if (missingClasses.length > 0) {
        message += `Còn thiếu:\n` + missingClasses.join('\n');
    } else {
        message += `Tất cả đã hoàn thành!`;
    }

    return api.sendMessage(message, threadID);
};
