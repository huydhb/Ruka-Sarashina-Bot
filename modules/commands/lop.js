const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: "lop",
    version: "3.0.0",
    hasPermssion: 0,
    credits: "Bot",
    description: "Thêm thông tin lớp của bạn",
    commandCategory: "Hỗ trợ nhóm",
    usages: "/lop (tên lớp) - Ví dụ: /lop 12A",
    cooldowns: 3
};

const dataDir = path.join(__dirname, 'data', 'member_database');
const sessionPath = path.join(dataDir, 'lop_sessions.json');

const validClasses = [];
const grades = ["10", "11", "12"];
const letters = ["A", "B", "C", "D", "E", "G", "H"]; // 7 lớp, không có F
for (const g of grades) {
    for (const l of letters) {
        validClasses.push(`${g}${l}`);
    }
}

function getLopSessions() {
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

module.exports.run = async function ({ api, event, args }) {
    const { threadID, senderID, messageID } = event;
    const moment = require("moment-timezone");
    const time = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY");

    const lopInput = args.join("").trim().toUpperCase();

    if (!lopInput) {
        return api.sendMessage("Vui lòng nhập tên lớp!\nVí dụ: /lop 12A", threadID, messageID);
    }

    if (!validClasses.includes(lopInput)) {
        return api.sendMessage("Lớp không hợp lệ!\nCác lớp: 10A-10H, 11A-11H, 12A-12H", threadID, messageID);
    }

    const sessions = getLopSessions();
    let targetThreadID = null;

    for (const [groupID, session] of Object.entries(sessions)) {
        if (!session.isActive) continue;

        if (event.isGroup && groupID === threadID && session.listenMode === "group") {
            targetThreadID = groupID;
            break;
        }

        if (!event.isGroup && session.listenMode === "private") {
            const database = readDatabase(groupID);
            if (database && database.memberIndex && database.memberIndex[senderID]) {
                targetThreadID = groupID;
                break;
            }
        }
    }

    if (!targetThreadID) {
        return api.sendMessage("Không có phiên thu thập lớp!", threadID, messageID);
    }

    const database = readDatabase(targetThreadID);
    if (!database || !database.memberIndex || !database.memberIndex[senderID]) {
        return api.sendMessage("Không tìm thấy bạn trong database!", threadID, messageID);
    }

    const oldLop = database.memberIndex[senderID].lop;
    const userName = database.memberIndex[senderID].name;

    // Xóa khỏi lớp cũ
    if (oldLop && database.classes[oldLop]) {
        database.classes[oldLop].total--;
        delete database.classes[oldLop].members[senderID];
    }

    // Thêm vào lớp mới
    database.memberIndex[senderID].lop = lopInput;
    database.classes[lopInput].total++;
    database.classes[lopInput].members[senderID] = {
        name: userName,
        status: 0
    };

    database.updatedAt = time;
    writeDatabase(targetThreadID, database);

    api.sendMessage(`Đã cập nhật lớp: ${lopInput}`, threadID);

    if (!event.isGroup) {
        api.sendMessage(`${userName} đã cập nhật lớp: ${lopInput}`, targetThreadID);
    }
};
