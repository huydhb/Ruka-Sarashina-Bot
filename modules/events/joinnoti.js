module.exports.config = {
    name: "joinNoti",
    eventType: ["log:subscribe"],
    version: "1.0.1",
    credits: "TatsuYTB",
    description: "Thông báo bot hoặc người vào nhóm"
};

module.exports.run = async function({ api, event, Users }) {
    const { threadID, logMessageData } = event;
    const pathData = require("path").join(__dirname, "../commands/data/joinNoti.json");
    const { readFileSync } = require("fs-extra");

    const botID = api.getCurrentUserID();
    const botAdded = logMessageData.addedParticipants.some(p => p.userFbId == botID);

    if (botAdded) {
        await api.changeNickname(
            `[ ${global.config.PREFIX} ] • ${global.config.BOTNAME || "Bot"}`,
            threadID,
            botID
        );
        return api.sendMessage(`[𝐊𝐞̂́𝐭 𝐍𝐨̂́𝐢 𝐓𝐡𝐚̀𝐧𝐡 𝐂𝐨̂𝐧𝐠]`, threadID);
    }

    let dataJson = [];
    try { dataJson = JSON.parse(readFileSync(pathData, "utf-8")); } 
    catch { dataJson = []; }

    const thisThread = dataJson.find(i => i.threadID == threadID) || { message: null, enable: true };
    if (!thisThread.enable) return; 

    let msg = thisThread.message || `✿——————————————✿
𝐗𝐢𝐧 𝐜𝐡𝐚̀𝐨: [ {name} ]
𝐂𝐡𝐚̀𝐨 𝐦𝐮̛̀𝐧𝐠 𝐛𝐚̣𝐧 đ𝐞̂́n 𝐯𝐨̛́𝐢: [ {threadName} ]
𝐁𝐚̣𝐧 𝐥𝐚̀ 𝐭𝐡𝐚̀𝐧𝐡 𝐯𝐢𝐞̂𝐧 𝐬𝐨̂́: [ {soThanhVien} ]
𝐃̄𝐮̛𝐨̛̣𝐜 𝐭𝐡𝐞̂𝐦 𝐛𝐨̛̉𝐢: [ {author} ]
𝐂𝐡𝐮́𝐜 𝐛𝐚̣𝐧 𝐜𝐨́ 𝐦𝐨̣̂𝐭 𝐧𝐠𝐚̀𝐲 𝐯𝐮𝐢 𝐯𝐞̉ 💝
✿——————————————✿`;

    const nameArray = [];
    const mentions = [];

    for (const p of logMessageData.addedParticipants) {
        if (p.userFbId == botID) continue; 
        const userName = p.fullName;
        nameArray.push(userName);
        mentions.push({ tag: userName, id: p.userFbId });

        if (!global.data.allUserID.includes(p.userFbId)) {
            await Users.createData(p.userFbId, { name: userName, data: {} });
            global.data.userName.set(p.userFbId, userName);
            global.data.allUserID.push(p.userFbId);
        }
    }

    if (nameArray.length == 0) return; 

    const threadInfo = await api.getThreadInfo(threadID);
    const authorData = await Users.getData(event.author);
    const authorName = authorData?.name || "link join";

    const moment = require("moment-timezone");
    const time = moment.tz("Asia/Ho_Chi_Minh");
    const gio = parseInt(time.format("HH"));
    const bok = time.format("DD/MM/YYYY");

    let buoi = "𝐁𝐮𝐨̂̉𝐢 𝐒𝐚́𝐧𝐠";
    if (gio >= 11) buoi = "𝐁𝐮𝐨̂̉𝐢 𝐓𝐫𝐮̛𝐚";
    if (gio >= 14) buoi = "𝐁𝐮𝐨̂̉𝐢 𝐂𝐡𝐢Ề𝐮";
    if (gio >= 19) buoi = "𝐁𝐮𝐨̂̉𝐢 𝐓𝐨̂́𝐢";

    msg = msg
        .replace(/\{name}/g, nameArray.join(", "))
        .replace(/\{type}/g, nameArray.length > 1 ? "𝐜𝐚́𝐜 𝐛𝐚̣𝐧" : "𝐛𝐚̣𝐧")
        .replace(/\{soThanhVien}/g, threadInfo.participantIDs.length)
        .replace(/\{threadName}/g, threadInfo.threadName)
        .replace(/\{author}/g, authorName)
        .replace(/\{get}/g, buoi)
        .replace(/\{bok}/g, bok);

    return api.sendMessage({ body: msg, mentions }, threadID);
};
