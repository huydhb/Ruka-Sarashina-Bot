const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: "ban",
    version: "1.0.0",
    hasPermssion: 1,
    credits: "Bot",
    description: "Ban thành viên khỏi nhóm (không thể vào lại)",
    commandCategory: "Quản trị",
    usages: "/ban @tag hoặc reply tin nhắn",
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
    const { threadID, messageID, mentions, messageReply } = event;

    let targetID = null;
    let targetName = "Thành viên";

    // Lấy ID từ tag hoặc reply
    if (Object.keys(mentions).length > 0) {
        targetID = Object.keys(mentions)[0];
        targetName = mentions[targetID].replace("@", "");
    } else if (messageReply) {
        targetID = messageReply.senderID;
    } else if (args[0] && !isNaN(args[0])) {
        targetID = args[0];
    }

    if (!targetID) {
        return api.sendMessage(
            "Cách dùng:\n" +
            "/ban @tag - Ban người được tag\n" +
            "/ban (reply tin nhắn) - Ban người gửi tin nhắn\n" +
            "/ban [ID] - Ban theo ID",
            threadID, messageID
        );
    }

    const banList = getBanList();
    if (!banList[threadID]) banList[threadID] = [];

    if (banList[threadID].includes(targetID)) {
        return api.sendMessage(`Người này đã bị ban rồi!`, threadID, messageID);
    }

    banList[threadID].push(targetID);
    saveBanList(banList);

    // Kick khỏi nhóm
    api.removeUserFromGroup(targetID, threadID, (err) => {
        if (err) {
            api.sendMessage(`Đã ban ${targetName} nhưng không thể kick (có thể là admin nhóm).`, threadID, messageID);
        } else {
            api.sendMessage(`Đã ban và kick ${targetName} khỏi nhóm!\nNgười này sẽ không thể vào lại.`, threadID, messageID);
        }
    });
};
