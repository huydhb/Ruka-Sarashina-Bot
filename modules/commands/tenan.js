const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: "tenan",
    version: "1.0.0",
    hasPermssion: 2, // Chỉ admin mới được dùng
    credits: "Bot",
    description: "Bật/tắt khóa các lệnh lo, locheo và tai on (chỉ admin)",
    commandCategory: "Quản trị",
    usages: "/tenan [on/off/status]",
    cooldowns: 3
};

const dataDir = path.join(__dirname, 'data');
const dataPath = path.join(dataDir, 'tenanoff_settings.json');

function getSettings() {
    if (fs.existsSync(dataPath)) {
        try { return JSON.parse(fs.readFileSync(dataPath, 'utf8')); }
        catch (e) { return { locked: false }; }
    }
    return { locked: false };
}

function saveSettings(data) {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

// Hàm kiểm tra xem có bị khóa không (export để các module khác dùng)
module.exports.isLocked = function () {
    const settings = getSettings();
    return settings.locked === true;
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;

    // Kiểm tra quyền admin
    const { ADMINBOT, NDH } = global.config;
    const isAdmin = ADMINBOT.includes(senderID.toString()) ||
        ADMINBOT.includes(senderID) ||
        NDH.includes(senderID.toString()) ||
        NDH.includes(senderID);

    if (!isAdmin) {
        return api.sendMessage("⚠️ Chỉ Admin mới có quyền sử dụng lệnh này!", threadID, messageID);
    }

    const settings = getSettings();

    if (!args[0] || args[0].toLowerCase() === 'status') {
        const status = settings.locked ? "🔒 ĐANG KHÓA" : "🔓 ĐANG MỞ";
        return api.sendMessage(
            `📍 Trạng thái các lệnh (lo, locheo, tai on): ${status}\n` +
            `💡 Dùng: /tenan on (để khóa) hoặc /tenan off (để mở)`,
            threadID, messageID
        );
    }

    const action = args[0].toLowerCase();

    if (action === 'on') {
        settings.locked = true;
        saveSettings(settings);
        return api.sendMessage(
            "🔒 Đã KHÓA các lệnh:\n" +
            "• /lo\n" +
            "• /locheo (và các biến thể)\n" +
            "• /tai on\n\n" +
            "⚠️ Chỉ Admin mới có thể mở lại bằng lệnh /tenan off",
            threadID, messageID
        );
    } else if (action === 'off') {
        settings.locked = false;
        saveSettings(settings);
        return api.sendMessage(
            "🔓 Đã MỞ KHÓA các lệnh:\n" +
            "• /lo\n" +
            "• /locheo (và các biến thể)\n" +
            "• /tai on\n\n" +
            "✅ Mọi người có thể sử dụng bình thường!",
            threadID, messageID
        );
    } else {
        return api.sendMessage(
            "⚠️ Cú pháp không hợp lệ!\n" +
            "💡 Dùng: /tenan on hoặc /tenan off",
            threadID, messageID
        );
    }
};
