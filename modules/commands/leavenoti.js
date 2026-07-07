const { existsSync, writeFileSync, mkdirSync, readFileSync } = require("fs-extra");
const { join } = require("path");

module.exports.config = {
    name: "leavenoti",
    version: "1.0.0",
    hasPermssion: 1,
    credits: "TatsuYTB",
    description: "Quản lý tin nhắn rời nhóm tùy biến cho từng nhóm",
    commandCategory: "Quản Lí Box",
    usages: "[add <message> /remove /on /off]",
    cooldowns: 0
};

const pathCache = join(__dirname, "data");
const pathData = join(pathCache, "leaveNoti.json");

module.exports.onLoad = () => {
    if (!existsSync(pathCache)) mkdirSync(pathCache, { recursive: true });
    if (!existsSync(pathData)) writeFileSync(pathData, "[]", "utf-8");
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID } = event;

    let dataJson;
    try { dataJson = JSON.parse(readFileSync(pathData, "utf-8")); } 
    catch { dataJson = []; writeFileSync(pathData, JSON.stringify([]), "utf-8"); }

    let thisThread = dataJson.find(i => i.threadID == threadID) || { threadID, message: null, enable: true };

    const content = args.slice(1).join(" ");

    switch (args[0]) {
        case "add":
            if (!content) return api.sendMessage("→ Bạn chưa nhập tin nhắn rời!", threadID, messageID);
            thisThread.message = content;
            if (!dataJson.some(i => i.threadID == threadID)) dataJson.push(thisThread);
            writeFileSync(pathData, JSON.stringify(dataJson, null, 4), "utf-8");
            return api.sendMessage(`→ Cấu hình tin nhắn rời thành công!\n→ Hỗ trợ các biến:\n{name}: Tên thành viên rời\n{iduser}: ID thành viên rời\n{type}: Loại rời (rời/kick)\n{session}: Buổi trong ngày\n{fullYear}: Năm hiện tại\n{time}: Thời gian hiện tại`, threadID, messageID);

        case "remove":
            thisThread.message = null;
            const index = dataJson.findIndex(i => i.threadID == threadID);
            if (index !== -1) dataJson.splice(index, 1);
            writeFileSync(pathData, JSON.stringify(dataJson, null, 4), "utf-8");
            return api.sendMessage("→ Xóa cấu hình tin nhắn rời thành công!", threadID, messageID);

        case "on":
            thisThread.enable = true;
            if (!dataJson.some(i => i.threadID == threadID)) dataJson.push(thisThread);
            writeFileSync(pathData, JSON.stringify(dataJson, null, 4), "utf-8");
            return api.sendMessage("→ Đã bật leaveNoti cho nhóm này!", threadID, messageID);

        case "off":
            thisThread.enable = false;
            if (!dataJson.some(i => i.threadID == threadID)) dataJson.push(thisThread);
            writeFileSync(pathData, JSON.stringify(dataJson, null, 4), "utf-8");
            return api.sendMessage("→ Đã tắt leaveNoti cho nhóm này!", threadID, messageID);

        default:
            return api.sendMessage(
`Hướng dẫn sử dụng chi tiết:
#leaveNoti add <message>: Thêm tin nhắn rời tùy chỉnh
   → Có thể sử dụng các biến:
      {name}      : Tên thành viên rời
      {iduser}    : ID thành viên rời
      {type}      : Loại rời (rời/kick)
      {session}   : Buổi trong ngày (Sáng/Trưa/Chiều/Tối)
      {fullYear}  : Năm hiện tại
      {time}      : Thời gian hiện tại (DD/MM/YYYY || HH:mm:ss)
      Ví dụ: {name} đã rời khỏi nhóm vào lúc {time}
#leaveNoti remove: Xóa tin nhắn rời
#leaveNoti on: Bật leaveNoti cho nhóm
#leaveNoti off: Tắt leaveNoti cho nhóm`, threadID, messageID
            );
    }
};
