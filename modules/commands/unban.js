const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: "unban",
    version: "1.0.0",
    hasPermssion: 1,
    credits: "Bot",
    description: "Gỡ ban thành viên",
    commandCategory: "Quản trị",
    usages: "/unban [ID]",
    cooldowns: 3
};

const dataDir = path.join(__dirname, 'data');
const banListPath = path.join(dataDir, 'autokick_banlist.json');

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

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, mentions } = event;

    let targetID = null;

    // Lấy ID từ tag hoặc args
    if (Object.keys(mentions).length > 0) {
        targetID = Object.keys(mentions)[0];
    } else if (args[0] && !isNaN(args[0])) {
        targetID = args[0];
    }

    if (!targetID) {
        const banList = getBanList();
        const banned = banList[threadID] || [];

        if (banned.length === 0) {
            return api.sendMessage("Không có ai bị ban trong nhóm này.", threadID, messageID);
        }

        let msg = "Danh sách ban:\n";
        banned.forEach((id, i) => {
            msg += `${i + 1}. ${id}\n`;
        });
        msg += "\nDùng: /unban [ID] để gỡ ban";
        return api.sendMessage(msg, threadID, messageID);
    }

    const banList = getBanList();
    if (!banList[threadID]) banList[threadID] = [];

    const index = banList[threadID].indexOf(targetID);
    if (index === -1) {
        return api.sendMessage(`ID ${targetID} không có trong danh sách ban.`, threadID, messageID);
    }

    banList[threadID].splice(index, 1);
    saveBanList(banList);

    return api.sendMessage(`Đã gỡ ban ID: ${targetID}\nNgười này có thể vào lại nhóm.`, threadID, messageID);
};
