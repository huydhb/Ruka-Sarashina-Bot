const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: "autokick",
    version: "1.0.0",
    hasPermssion: 1,
    credits: "Bot",
    description: "Tự động cảnh báo và kick thành viên chửi bậy",
    commandCategory: "Quản trị",
    usages: "/autokick [on/off]",
    cooldowns: 3
};

const dataDir = path.join(__dirname, 'data');
const settingsPath = path.join(dataDir, 'autokick_settings.json');
const violationsPath = path.join(dataDir, 'autokick_violations.json');
const banListPath = path.join(dataDir, 'autokick_banlist.json');

// Danh sách từ ngữ chửi bậy
const badWords = [
    "địt", "địt mẹ", "địt mẹ mày", "đm", "đmm", "dmm",
    "con cặc", "cặc", "buồi", "đầu buồi", "đầu bòi",
    "lồn", "con lồn", "đéo", "vãi lồn", "vl", "vcl",
    "cc", "clgt", "đkm", "dkm", "dit me", "dit", "cu", "cac"
];

function getSettings() {
    if (fs.existsSync(settingsPath)) {
        try { return JSON.parse(fs.readFileSync(settingsPath, 'utf8')); }
        catch (e) { return {}; }
    }
    return {};
}

function saveSettings(data) {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2));
}

function getViolations() {
    if (fs.existsSync(violationsPath)) {
        try { return JSON.parse(fs.readFileSync(violationsPath, 'utf8')); }
        catch (e) { return {}; }
    }
    return {};
}

function saveViolations(data) {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(violationsPath, JSON.stringify(data, null, 2));
}

function getBanList() {
    if (fs.existsSync(banListPath)) {
        try { return JSON.parse(fs.readFileSync(banListPath, 'utf8')); }
        catch (e) { return {}; }
    }
    return {};
}

function saveBanList(data) {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(banListPath, JSON.stringify(data, null, 2));
}

function containsBadWord(text) {
    const lowerText = text.toLowerCase();
    for (const word of badWords) {
        if (lowerText.includes(word)) {
            return true;
        }
    }
    return false;
}

// Lắng nghe tin nhắn
module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, senderID, body, messageID } = event;

    if (!body) return;
    if (api.getCurrentUserID() === senderID) return;

    const settings = getSettings();
    if (!settings[threadID]) return;

    // Kiểm tra từ ngữ chửi bậy
    if (containsBadWord(body)) {
        const violations = getViolations();
        const key = `${threadID}_${senderID}`;

        if (!violations[key]) {
            violations[key] = { count: 0, name: "" };
        }

        violations[key].count++;
        const count = violations[key].count;

        if (count < 3) {
            saveViolations(violations);
            api.sendMessage(
                `⚠️ CẢNH BÁO: Bạn đã vi phạm chửi bậy (${count}/3)!\n` +
                `Nếu vi phạm đủ 3 lần, bạn sẽ bị BAN khỏi nhóm!`,
                threadID, messageID
            );
        } else {
            // Đạt 3 lần - BAN và KICK
            const banList = getBanList();
            if (!banList[threadID]) banList[threadID] = [];

            if (!banList[threadID].includes(senderID)) {
                banList[threadID].push(senderID);
                saveBanList(banList);
            }

            // Reset violations
            delete violations[key];
            saveViolations(violations);

            api.sendMessage(
                `🚫 ĐÃ BAN: Bạn đã vi phạm chửi bậy 3/3 lần!\n` +
                `Bạn sẽ bị kick và không thể vào lại nhóm này.`,
                threadID, () => {
                    api.removeUserFromGroup(senderID, threadID, (err) => {
                        if (!err) {
                            api.sendMessage(`Đã kick thành viên vi phạm ra khỏi nhóm!`, threadID);
                        }
                    });
                }
            );
        }
    }
};

// Lệnh bật/tắt
module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const settings = getSettings();

    if (!args[0]) {
        const status = settings[threadID] ? "BẬT" : "TẮT";
        return api.sendMessage(
            `Trạng thái autokick: ${status}\n` +
            `Dùng: /autokick on hoặc /autokick off`,
            threadID, messageID
        );
    }

    const action = args[0].toLowerCase();

    if (action === 'on') {
        settings[threadID] = true;
        saveSettings(settings);
        return api.sendMessage(
            "Đã bật autokick!\n" +
            "Bot sẽ cảnh báo và kick thành viên chửi bậy sau 3 lần vi phạm.",
            threadID, messageID
        );
    } else if (action === 'off') {
        settings[threadID] = false;
        saveSettings(settings);
        return api.sendMessage("Đã tắt autokick!", threadID, messageID);
    } else {
        return api.sendMessage("Dùng: /autokick on hoặc /autokick off", threadID, messageID);
    }
};
