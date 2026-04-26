const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: "listenconfirm",
    version: "3.0.0",
    hasPermssion: 0,
    credits: "Bot",
    description: "Lắng nghe xác nhận /[lớp] 1",
    commandCategory: "Hỗ trợ nhóm",
    usages: "Tự động",
    cooldowns: 0
};

const dataDir = path.join(__dirname, '../commands/data', 'member_database');

function getActiveSessions() {
    const sessionPath = path.join(dataDir, 'active_sessions.json');
    if (fs.existsSync(sessionPath)) {
        try { return JSON.parse(fs.readFileSync(sessionPath, 'utf8')); }
        catch (e) { return {}; }
    }
    return {};
}

function readDatabase(threadID) {
    const dbPath = path.join(dataDir, `${threadID}.json`);
    if (fs.existsSync(dbPath)) {
        try { return JSON.parse(fs.readFileSync(dbPath, 'utf8')); }
        catch (e) { return null; }
    }
    return null;
}

function writeDatabase(threadID, data) {
    const dbPath = path.join(dataDir, `${threadID}.json`);
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
}

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, senderID, body } = event;

    if (event.isGroup) return;
    if (!body) return;

    // Parse: /12A 1
    const match = body.trim().match(/^\/(\d{2}[A-Ha-h])\s+1$/i);
    if (!match) return;

    const classInput = match[1].toUpperCase();
    const moment = require("moment-timezone");
    const time = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY");

    const sessions = getActiveSessions();

    for (const [groupID, session] of Object.entries(sessions)) {
        if (!session.isActive) continue;

        const database = readDatabase(groupID);
        if (!database || !database.memberIndex) continue;

        // Tra cứu nhanh O(1) từ memberIndex
        const userInfo = database.memberIndex[senderID];
        if (!userInfo) continue;

        const userClass = userInfo.lop;

        if (userClass.toUpperCase() !== classInput) {
            api.sendMessage(`Lớp không khớp! Lớp của bạn: ${userClass || "chưa cập nhật"}`, senderID);
            return;
        }

        if (userInfo.status === 1) {
            api.sendMessage(`Bạn đã xác nhận rồi!`, senderID);
            return;
        }

        // Cập nhật memberIndex
        database.memberIndex[senderID].status = 1;
        database.memberIndex[senderID].confirmedAt = time;

        // Cập nhật classes
        if (database.classes[classInput]) {
            database.classes[classInput].confirmed++;
            if (database.classes[classInput].members[senderID]) {
                database.classes[classInput].members[senderID].status = 1;
            }

            const classInfo = database.classes[classInput];
            const isComplete = classInfo.confirmed >= classInfo.total && classInfo.total > 0;

            if (isComplete) {
                if (!database.firstWinner) {
                    database.firstWinner = classInput;
                    api.sendMessage(`🎉 CHÚC MỪNG LỚP ${classInput} ĐÃ LÀ LỚP ĐẦU TIÊN HOÀN THÀNH!`, groupID);
                } else {
                    api.sendMessage(`Yeah lớp ${classInput} đã hoàn thành rồi!`, groupID);
                }
            }
        }

        database.updatedAt = time;
        writeDatabase(groupID, database);

        api.sendMessage(`Đã nhận được xác nhận của bạn xin cảm ơn`, senderID);

        const classInfo = database.classes[classInput];
        api.sendMessage(`${userInfo.name} (${classInput}) xác nhận. (${classInfo.confirmed}/${classInfo.total})`, groupID);

        break;
    }
};

module.exports.run = async function ({ api, event }) {
    return api.sendMessage("Lệnh này tự động.", event.threadID, event.messageID);
};
