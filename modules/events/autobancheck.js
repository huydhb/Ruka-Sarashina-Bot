const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: "autobancheck",
    eventType: ["log:subscribe"],
    version: "1.0.0",
    credits: "Bot",
    description: "Tự động kick người bị ban khi vào nhóm"
};

const banListPath = path.join(__dirname, '../commands/data', 'autokick_banlist.json');

function getBanList() {
    if (fs.existsSync(banListPath)) {
        try { return JSON.parse(fs.readFileSync(banListPath, 'utf8')); }
        catch (e) { return {}; }
    }
    return {};
}

module.exports.run = async function ({ api, event }) {
    const { threadID, logMessageData } = event;
    const botID = api.getCurrentUserID();

    try {
        // Nếu bot được thêm vào, không làm gì
        if (logMessageData.addedParticipants.some(i => i.userFbId == botID)) {
            return;
        }

        const banList = getBanList();
        const bannedInThread = banList[threadID] || [];

        if (bannedInThread.length === 0) return;

        // Kiểm tra từng người mới vào
        for (const participant of logMessageData.addedParticipants) {
            const userID = participant.userFbId;
            const userName = participant.fullName;

            if (bannedInThread.includes(userID)) {
                // Người này bị ban - kick ngay
                api.sendMessage(
                    `${userName} đang trong danh sách BAN!\nTự động kick...`,
                    threadID, () => {
                        api.removeUserFromGroup(userID, threadID, (err) => {
                            if (!err) {
                                api.sendMessage(`Đã kick ${userName} (đang bị ban).`, threadID);
                            }
                        });
                    }
                );
            }
        }
    } catch (e) {
        console.log("Lỗi autobancheck:", e.message);
    }
};
