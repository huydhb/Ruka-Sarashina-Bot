const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: "batdau",
    version: "2.0.0",
    hasPermssion: 1,
    credits: "Bot",
    description: "Gửi tin nhắn hàng loạt đến tất cả thành viên",
    commandCategory: "Hỗ trợ nhóm",
    usages: '/batdau:"nội dung tin nhắn"',
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

const activeSessionPath = path.join(dataDir, 'active_sessions.json');

function getActiveSessions() {
    if (fs.existsSync(activeSessionPath)) {
        try {
            return JSON.parse(fs.readFileSync(activeSessionPath, 'utf8'));
        } catch (e) {
            return {};
        }
    }
    return {};
}

function saveActiveSessions(sessions) {
    fs.writeFileSync(activeSessionPath, JSON.stringify(sessions, null, 2), 'utf8');
}

module.exports.run = async function ({ api, event, Users }) {
    const { threadID, messageID, senderID } = event;
    const moment = require("moment-timezone");
    const time = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY");
    const body = event.body || '';

    const match = body.match(/^\/batdau:"(.+)"$/i);

    if (!match) {
        return api.sendMessage(
            `Sai cú pháp!\nCách dùng: /batdau:"nội dung tin nhắn"\nVí dụ: /batdau:"Xin chào mọi người"`,
            threadID, messageID
        );
    }

    const messageContent = match[1].trim();

    if (!messageContent) {
        return api.sendMessage("Vui lòng nhập nội dung tin nhắn!", threadID, messageID);
    }

    let database = readDatabase(threadID);
    if (!database) {
        return api.sendMessage("Chưa có database! Dùng /cratedatabase trước.", threadID, messageID);
    }

    const senderName = await Users.getNameUser(senderID);
    const botID = api.getCurrentUserID();

    // Reset trạng thái và firstWinner
    for (const id of Object.keys(database.members)) {
        database.members[id].status = 0;
    }
    // Reset confirmed count cho tất cả lớp
    for (const className of Object.keys(database.classes)) {
        database.classes[className].confirmed = 0;
    }
    database.firstWinner = null;

    // Lưu session
    const sessions = getActiveSessions();
    sessions[threadID] = {
        startedAt: time,
        startedBy: senderID,
        startedByName: senderName,
        messageContent: messageContent,
        isActive: true
    };
    saveActiveSessions(sessions);

    const totalMembers = Object.keys(database.members).length;
    let successCount = 0;

    // Gửi tin nhắn đến từng thành viên
    for (const [id, member] of Object.entries(database.members)) {
        if (id === botID || id === senderID) continue;

        const lop = member.lop || "chưa có";
        const privateMessage =
            `Tin nhắn từ nhóm: ${database.threadName}\n` +
            `Người gửi: ${senderName}\n` +
            `Lớp của bạn: ${lop}\n` +
            `---\n` +
            `${messageContent}\n` +
            `---\n` +
            `Để xác nhận vui lòng gửi ảnh và reply: /[lớp] 1\n` +
            `Ví dụ: /12A 1 (nếu bạn lớp 12A)`;

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

    // Cập nhật database
    database.updatedAt = time;
    writeDatabase(threadID, database);

    return api.sendMessage(
        `HOÀN THÀNH GỬI TIN NHẮN\n` +
        `Gửi thành công: ${successCount}/${totalMembers}\n` +
        `Chế độ lắng nghe đã bật.\n` +
        `Xác nhận bằng: /[lớp] 1 (VD: /12A 1)`,
        threadID
    );
};
