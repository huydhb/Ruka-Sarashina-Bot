const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: "ketthuc",
    version: "3.0.0",
    hasPermssion: 1,
    credits: "Bot",
    description: "Kết thúc phiên",
    commandCategory: "Hỗ trợ nhóm",
    usages: "/ketthuc",
    cooldowns: 30
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

function clearSession(threadID) {
    const sessionPath = path.join(dataDir, 'active_sessions.json');
    if (fs.existsSync(sessionPath)) {
        try {
            const sessions = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
            if (sessions[threadID]) {
                sessions[threadID].isActive = false;
                fs.writeFileSync(sessionPath, JSON.stringify(sessions, null, 2), 'utf8');
            }
        } catch (e) { }
    }
}

function saveDraft(threadID, data) {
    const draftPath = path.join(dataDir, `${threadID}_draft.json`);
    fs.writeFileSync(draftPath, JSON.stringify(data, null, 2), 'utf8');
}

function clearDraft(threadID) {
    const draftPath = path.join(dataDir, `${threadID}_draft.json`);
    if (fs.existsSync(draftPath)) fs.unlinkSync(draftPath);
}

module.exports.run = async function ({ api, event }) {
    const { threadID, messageID } = event;
    const moment = require("moment-timezone");
    const time = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY");

    const database = readDatabase(threadID);
    if (!database) {
        return api.sendMessage("Chưa có database!", threadID, messageID);
    }

    clearDraft(threadID);

    // Duyệt classes để lấy danh sách
    const confirmed = [];
    const notConfirmed = [];
    const byClass = {};

    for (const [className, classInfo] of Object.entries(database.classes)) {
        for (const [uid, member] of Object.entries(classInfo.members)) {
            if (member.status === 1) {
                confirmed.push({ id: uid, name: member.name, lop: className });
            } else {
                notConfirmed.push({ id: uid, name: member.name, lop: className });
                if (!byClass[className]) byClass[className] = [];
                byClass[className].push(member.name);
            }
        }
    }

    // Lưu bản nháp
    saveDraft(threadID, {
        savedAt: time,
        total: notConfirmed.length,
        byClass: byClass
    });

    const successMsg = `Cảm ơn buổi chia sẻ đã kết thúc đã xác nhận bạn đã thành công`;
    const failMsg = `Xin lỗi chúng tôi chưa nhận được phản hồi xác minh của bạn bạn sẽ không được tính nếu có khiếu nại vui lòng liên hệ qua zl:0878139888`;

    let sentOK = 0;

    // Gửi cho người đã xác nhận
    for (const member of confirmed) {
        try {
            await new Promise((resolve, reject) => {
                api.sendMessage(successMsg, member.id, (err) => {
                    if (err) reject(err);
                    else { sentOK++; resolve(); }
                });
            });
        } catch (e) { }
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Gửi cho người chưa xác nhận
    for (const member of notConfirmed) {
        try {
            await new Promise((resolve, reject) => {
                api.sendMessage(failMsg, member.id, (err) => {
                    if (err) reject(err);
                    else { sentOK++; resolve(); }
                });
            });
        } catch (e) { }
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    clearSession(threadID);

    const total = confirmed.length + notConfirmed.length;

    return api.sendMessage(
        `KẾT THÚC\n` +
        `Đã xác nhận: ${confirmed.length}\n` +
        `Chưa xác nhận: ${notConfirmed.length}\n` +
        `Đã gửi: ${sentOK}/${total}\n` +
        `Dùng /kiemtrachitiet xem bản nháp.`,
        threadID
    );
};
