module.exports.config = {
    name: "checktt_remove",
    eventType: ["log:unsubscribe", "log:thread-removed"],
    version: "1.0.0",
    credits: "ChatGPT",
    description: "Xóa dữ liệu checktt khi bot rời nhóm hoặc người rời nhóm"
};

const fs = require("fs-extra");
const path = require("path");
const dataPath = path.join(__dirname, "../commands/tuongtac/checktt/"); // theo cấu trúc checktt

module.exports.run = async function({ event, api }) {
    const { threadID, logMessageData } = event;

    // Nếu bot rời nhóm
    if (logMessageData.leftParticipantFbId === api.getCurrentUserID() || logMessageData.leftParticipantFbIds?.includes(api.getCurrentUserID())) {
        const file = path.join(dataPath, threadID + ".json");
        if (fs.existsSync(file)) {
            fs.removeSync(file);
            console.log(`[checktt_remove] Đã xóa dữ liệu nhóm ${threadID} vì bot rời nhóm.`);
        }
        return;
    }

    // Người rời nhóm
    let usersLeft = [];
    if (logMessageData.leftParticipantFbId) usersLeft.push(logMessageData.leftParticipantFbId);
    if (logMessageData.leftParticipantFbIds && Array.isArray(logMessageData.leftParticipantFbIds)) usersLeft = usersLeft.concat(logMessageData.leftParticipantFbIds);

    if (usersLeft.length === 0) return;

    const file = path.join(dataPath, threadID + ".json");
    if (!fs.existsSync(file)) return;

    let threadData = JSON.parse(fs.readFileSync(file, "utf-8"));

    ["total", "week", "day"].forEach(key => {
        if (Array.isArray(threadData[key])) {
            threadData[key] = threadData[key].filter(u => !usersLeft.includes(u.id));
        }
    });

    fs.writeFileSync(file, JSON.stringify(threadData, null, 4));
    console.log(`[checktt_remove] Đã xóa dữ liệu của ${usersLeft.length} người rời nhóm trong thread ${threadID}.`);
};
