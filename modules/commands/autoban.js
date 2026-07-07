const exemptIDs = ["100040472494187"];

module.exports.config = {
  name: "autoban",
  version: "1.1.0",
  hasPermssion: 3,
  credits: "TatsuYTB",
  description: "Tự động ban người dùng khi họ chửi bot, ngoại trừ những người có ID được chỉ định",
  commandCategory: "Hệ Thống",
  usages: "",
  cooldowns: 0,
  dependencies: {}
};

const userWarnings = {}; // Lưu số lần cảnh báo của người dùng

module.exports.handleEvent = async function ({ event, api, Users, Threads }) {
  const { threadID, messageID, body, senderID } = event;

  if (senderID == global.data.botID || exemptIDs.includes(senderID.toString())) return;

  let keywords = ["botngu", "bot ngu", "bot gà", "con bot lol", "bot ngu lol", "bot chó", "dm bot", "đm bot", "dmm bot", "dmm bot", "đmm bot", "đb bot", "bot điên", "bot dở", "bot khùng", "đĩ bot", "bot paylac rồi", "con bot lòn", "cmm bot", "clap bot", "bot ncc", "bot oc", "bot óc", "bot óc chó", "cc bot", "bot tiki", "lozz bottt", "lol bot", "loz bot", "lồn bot", "bot lồn", "bot lon", "bot cac", "bot như lon", "bot nhu lon", "bot như cc", "bot như bìu", "Bot sida", "bot sida", "bot fake", "bằng ngu", "bot shoppee", "bot đểu", "bot dỡm"];

  for (let keyword of keywords) {
    if (body.toLowerCase().includes(keyword.toLowerCase())) {
      let name = await Users.getNameUser(senderID);
      let threadInfo = await Threads.getData(threadID);
      let threadName = threadInfo.threadInfo.threadName || "Tên nhóm không xác định";
      const moment = require("moment-timezone");
      const time = moment.tz("Asia/Ho_Chi_minh").format("HH:mm:ss D/MM/YYYY");

      // Kiểm tra và cập nhật số lần cảnh báo
      if (!userWarnings[senderID]) {
        userWarnings[senderID] = 1;
        api.sendMessage(`⚠️ Cảnh báo lần 1: ${name}, nếu tiếp tục chửi bot, bạn sẽ bị cấm.`, threadID);
      } else if (userWarnings[senderID] === 1) {
        userWarnings[senderID] = 2;
        api.sendMessage(`⚠️ Cảnh báo lần 2: ${name}, nếu còn tiếp tục, bạn sẽ bị cấm.`, threadID);
      } else if (userWarnings[senderID] === 2) {
        userWarnings[senderID] = 3;
        let userData = (await Users.getData(senderID)).data || {};
        userData.banned = 1;
        userData.reason = keyword;
        userData.dateAdded = time;

        await Users.setData(senderID, { data: userData });
        global.data.userBanned.set(senderID, { reason: keyword, dateAdded: time });

        // Gửi thông báo đến admin
        let adminIDs = global.config.ADMINBOT;
        for (let adminID of adminIDs) {
          api.sendMessage(`🔴 Người dùng: ${name}
🔴 UID: ${senderID}
🔴 Nhóm: ${threadName}
🔴 Thời gian: ${time}
🔴 Đã chửi bot 3 lần và bị cấm.`, adminID);
        }
      }

      break;
    }
  }
};

module.exports.run = async function ({ api, event, Threads }) {
  const { threadID, messageID } = event;
  let data = (await Threads.getData(threadID)).data;

  data["autoban"] = true;

  await Threads.setData(threadID, { data });
  global.data.threadData.set(threadID, data);
};
