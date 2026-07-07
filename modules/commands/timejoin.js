module.exports.config = {
  name: "timejoin",
  version: "1.0.2",
  hasPermssion: 0,
  credits: "Judas - Fixed by ChatGPT",
  description: "Theo dõi thời gian join, gửi tin nhắn text",
  commandCategory: "Quản Lí Box",
  usages: "",
  cooldowns: 3,
  dependencies: {
    "fs-extra": "",
    moment: "",
    axios: ""
  },
};

const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");

module.exports.handleEvent = async function({ event, Users }) {
  const get = moment.tz("Asia/Ho_Chi_Minh");
  const gio = get.format("HH:mm:ss");
  const ngay = get.format("YYYY-MM-D");
  const burh = get.format("D/MM/YYYY");

  const { threadID, senderID } = event;
  const pathxData = path.join(__dirname, "cache/timejoin", threadID + ".json");
  if (!fs.existsSync(pathxData)) fs.writeFileSync(pathxData, "[]", "utf-8");

  let dataJson = JSON.parse(fs.readFileSync(pathxData, "utf-8"));
  if (!dataJson.find(i => i.senderID === senderID)) {
    const resname = (await Users.getData(senderID)).name;
    dataJson.push({
      senderID,
      opt: { name: resname, gio, ngay, burh }
    });
    fs.writeFileSync(pathxData, JSON.stringify(dataJson, null, 4), "utf-8");
  }
};

module.exports.run = async function({ api, event, args, Users }) {
  const { threadID, senderID, messageID, mentions, messageReply, type } = event;
  const get = moment.tz("Asia/Ho_Chi_Minh");
  const gio = get.format("HH:mm:ss");
  const ngay = get.format("YYYY-MM-D");
  const burh = get.format("D/MM/YYYY");

  const pathxData = path.join(__dirname, "cache/timejoin", threadID + ".json");
  if (!fs.existsSync(pathxData)) fs.writeFileSync(pathxData, "[]", "utf-8");
  let dataJson = JSON.parse(fs.readFileSync(pathxData, "utf-8"));

  // Xác định target
  let targetID = senderID;
  if (!args[0]) {
    if (type === "message_reply") targetID = messageReply.senderID;
    else if (Object.keys(mentions).length === 1) targetID = Object.keys(mentions)[0];
  }

  // Lưu dữ liệu join nếu chưa có
  if (!dataJson.find(i => i.senderID === targetID)) {
    const resname = (await Users.getData(targetID)).name;
    dataJson.push({
      senderID: targetID,
      opt: { name: resname, gio, ngay, burh }
    });
    fs.writeFileSync(pathxData, JSON.stringify(dataJson, null, 4), "utf-8");
  }

  const user = dataJson.find(i => i.senderID === targetID);
  if (!user) return api.sendMessage("Không tìm thấy thông tin user.", threadID, messageID);

  // Tính số ngày
  const gn1 = new Date(`${user.opt.ngay} ${user.opt.gio}`);
  const gn2 = new Date();
  const get_Ngay = Math.ceil((gn2 - gn1) / (24 * 60 * 60 * 1000));

  // Chuẩn bị tin nhắn text
  const msg = `📌 Thông tin join box:\n` +
              `» Name: ${user.opt.name}\n` +
              `» UID: ${user.senderID}\n` +
              `» Time Join: ${user.opt.gio}\n` +
              `» Ngày Join: ${user.opt.burh}\n` +
              `» Số ngày tham gia: ${get_Ngay}\n` +
              `» Profile: https://www.facebook.com/profile.php?id=${user.senderID}`;

  return api.sendMessage(msg, threadID, messageID);
};
