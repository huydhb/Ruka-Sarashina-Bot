const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: "kiemtrachitiet",
    version: "2.0.0",
    hasPermssion: 1,
    credits: "Bot",
    description: "Xem chi tiết người chưa xác nhận theo lớp",
    commandCategory: "Hỗ trợ nhóm",
    usages: "/kiemtrachitiet",
    cooldowns: 5
};

const dataDir = path.join(__dirname, 'data', 'member_database');

function readDraft(threadID) {
    const draftPath = path.join(dataDir, `${threadID}_draft.json`);
    if (fs.existsSync(draftPath)) {
        try { return JSON.parse(fs.readFileSync(draftPath, 'utf8')); }
        catch (e) { return null; }
    }
    return null;
}

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

    // Ưu tiên bản nháp
    let draft = readDraft(threadID);

    if (draft) {
        let message =
            `BẢN NHÁP\n` +
            `Lưu: ${draft.savedAt}\n` +
            `Tổng: ${draft.total} người\n---\n`;

        for (const [lop, members] of Object.entries(draft.byClass || {})) {
            message += `${lop}: ${members.length}\n`;
            members.slice(0, 10).forEach((name, i) => {
                message += `  ${i + 1}. ${name}\n`;
            });
            if (members.length > 10) message += `  ... còn ${members.length - 10}\n`;
        }

        if (message.length > 4000) message = message.substring(0, 4000) + "\n...";
        return api.sendMessage(message, threadID);
    }

    // Đọc từ database
    const database = readDatabase(threadID);
    if (!database) {
        return api.sendMessage("Chưa có database!", threadID, messageID);
    }

    // Duyệt classes - nhanh
    const byClass = {};
    for (const [className, classInfo] of Object.entries(database.classes)) {
        if (classInfo.total > 0) {
            const notConfirmed = [];
            for (const [uid, member] of Object.entries(classInfo.members)) {
                if (member.status === 0) {
                    notConfirmed.push(member.name);
                }
            }
            if (notConfirmed.length > 0) {
                byClass[className] = notConfirmed;
            }
        }
    }

    if (Object.keys(byClass).length === 0) {
        return api.sendMessage("Tất cả đã xác nhận!", threadID);
    }

    let total = 0;
    let message = `CHƯA XÁC NHẬN\n---\n`;

    for (const [lop, members] of Object.entries(byClass)) {
        total += members.length;
        message += `${lop}: ${members.length}\n`;
        members.slice(0, 10).forEach((name, i) => {
            message += `  ${i + 1}. ${name}\n`;
        });
        if (members.length > 10) message += `  ... còn ${members.length - 10}\n`;
    }

    message = `Tổng: ${total} người\n` + message;

    if (message.length > 4000) message = message.substring(0, 4000) + "\n...";
    return api.sendMessage(message, threadID);
};
