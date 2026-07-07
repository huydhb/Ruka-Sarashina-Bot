module.exports.config = {
  name: "timejoin",
  eventType: ["log:unsubscribe"],
  version: "1.0.2",
  credits: "TatsuYTB",
  description: "Tự xóa data time join user khi out (hỗ trợ nhiều người)"
};

const fs = require("fs-extra");
const path = require("path");
const dir = path.join(__dirname, "../commands/cache/timejoin");

module.exports.run = async function({ event }) {
  const { threadID, logMessageData } = event;
  let usersLeft = [];

  if (logMessageData.leftParticipantFbId) {
    usersLeft.push(logMessageData.leftParticipantFbId);
  }
  if (logMessageData.leftParticipantFbIds && Array.isArray(logMessageData.leftParticipantFbIds)) {
    usersLeft = usersLeft.concat(logMessageData.leftParticipantFbIds);
  }

  if (usersLeft.length === 0) return; 

  const pathFile = path.join(dir, threadID + ".json");
  if (!fs.existsSync(pathFile)) return; 

  let data = JSON.parse(fs.readFileSync(pathFile, "utf-8"));

  data = data.filter(u => !usersLeft.includes(u.senderID));

  fs.writeFileSync(pathFile, JSON.stringify(data, null, 4), "utf-8");
};
