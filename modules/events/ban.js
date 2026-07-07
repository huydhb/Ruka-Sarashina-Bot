const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "ban",
  eventType: ["log:subscribe"],
  version: "1.0.0",
  credits: "TatsuYTB",
  description: "Tự động kick thành viên bị cấm khi tham gia nhóm"
};

module.exports.run = async function({ api, event }) {
  const threadID = event.threadID;
  const memJoin = event.logMessageData.addedParticipants.map(info => info.userFbId);
  const pathData = path.join(__dirname, "../../modules/commands/data/ban", `${threadID}.json`);
  if (!fs.existsSync(pathData)) {
    await fs.writeJSON(pathData, { bannedUsers: [] });
  }
  const dataJson = await fs.readJSON(pathData);
  const bannedUsers = dataJson.bannedUsers || [];
  for (let idUser of memJoin) {
    if (bannedUsers.includes(idUser)) {
      try {
        await api.removeUserFromGroup(idUser, threadID);
        api.sendMessage(`𝐍𝐠𝐮̛𝐨̛̀𝐢 𝐝𝐮̀𝐧𝐠 𝐜𝐨́ 𝐔𝐈𝐃 ${idUser} 𝐝𝐚̃ 𝐛𝐢̣ 𝐤𝐢𝐜𝐤 𝐯𝐢̀ 𝐧𝐚̆̀𝐦 𝐭𝐫𝐨𝐧𝐠 𝐝𝐚𝐧𝐡 𝐬𝐚́𝐜𝐡 𝐜𝐚̂́𝐦 𝐜𝐮̉𝐚 𝐧𝐡𝐨́𝐦`, threadID);
      } catch (error) {}
    }
  }
};
