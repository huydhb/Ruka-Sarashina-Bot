const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: "themdatalop",
    version: "1.0.0",
    hasPermssion: 1,
    credits: "Bot",
    description: "Gửi yêu cầu thu thập dữ liệu lớp từ thành viên",
    commandCategory: "Hỗ trợ nhóm",
    usages: "/themdatalop - Bắt đầu thu thập dữ liệu lớp",
    cooldowns: 30
};

const dataDir = path.join(__dirname, 'data', 'member_database');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

function getDbPath(threadID) {
    return path.join(dataDir, `${threadID}.json`);
}

function readDatabase(threadID) {
    const dbPath = getDbPath(threadID);
    if (fs.existsSync(dbPath)) {
        try {
            return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        } catch (e) {
            return null;
        }
    }
    return null;
}

function writeDatabase(threadID, data) {
    const dbPath = getDbPath(threadID);
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
}

const sessionPath = path.join(dataDir, 'lop_sessions.json');

function getLopSessions() {
    if (fs.existsSync(sessionPath)) {
        try {
            return JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
        } catch (e) {
            return {};
        }
    }
    return {};
}

function saveLopSessions(sessions) {
    fs.writeFileSync(sessionPath, JSON.stringify(sessions, null, 2), 'utf8');
}

module.exports.run = async function ({ api, event }) {
    const { threadID, messageID, senderID } = event;
    const moment = require("moment-timezone");
    const time = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY");

    let database = readDatabase(threadID);
    if (!database) {
        return api.sendMessage("Chưa có database! Dùng /cratedatabase trước.", threadID, messageID);
    }

    const botID = api.getCurrentUserID();
    const totalMembers = Object.keys(database.members).length;

    // Bật session lắng nghe 1-1
    const sessions = getLopSessions();
    sessions[threadID] = {
        startedAt: time,
        startedBy: senderID,
        isActive: true,
        listenMode: "private"  // Lắng nghe tin nhắn riêng
    };
    saveLopSessions(sessions);

    const privateMessage =
        `Xin chào đây là bot tự động thu thập dữ liệu tên lớp của bạn vui lòng điền vào chat nội dung /lop "lớp của bạn" ví dụ /lop 12A tôi sẽ thêm bạn vào mục 12A`;

    let successCount = 0;

    // Gửi tin nhắn cho tất cả thành viên
    for (const [id, member] of Object.entries(database.members)) {
        if (id === botID || id === senderID) continue;

        try {
            await new Promise((resolve, reject) => {
                api.sendMessage(privateMessage, id, (err) => {
                    if (err) reject(err);
                    else { successCount++; resolve(); }
                });
            });
        } catch (e) { }

        await new Promise(resolve => setTimeout(resolve, 300));
    }

    return api.sendMessage(
        `ĐÃ GỬI YÊU CẦU THU THẬP LỚP\n` +
        `Gửi thành công: ${successCount}/${totalMembers}\n` +
        `Chế độ lắng nghe tin nhắn riêng đã bật.`,
        threadID
    );
};
