const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: "tatthemdatalop",
    version: "1.0.0",
    hasPermssion: 1,
    credits: "Bot",
    description: "Tắt chế độ thu thập lớp qua tin nhắn riêng, chuyển sang nhóm",
    commandCategory: "Hỗ trợ nhóm",
    usages: "/tatthemdatalop - Tắt lắng nghe riêng, bật lắng nghe nhóm",
    cooldowns: 5
};

const dataDir = path.join(__dirname, 'data', 'member_database');

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
    const { threadID, messageID } = event;

    const sessions = getLopSessions();

    if (!sessions[threadID] || !sessions[threadID].isActive) {
        return api.sendMessage("Không có phiên thu thập lớp nào đang chạy!", threadID, messageID);
    }

    // Chuyển sang chế độ lắng nghe nhóm
    sessions[threadID].listenMode = "group";
    saveLopSessions(sessions);

    return api.sendMessage(
        `Đã tắt thêm tên lớp của bản thân nếu muốn thêm thì hãy gửi tin nhắn lên nhóm chính nhé off tính năng nghe 1-1 rồi`,
        threadID
    );
};
