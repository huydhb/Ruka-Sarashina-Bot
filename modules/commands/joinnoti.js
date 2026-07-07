const { existsSync, writeFileSync, mkdirSync, readFileSync } = require("fs-extra");
const { join } = require("path");

module.exports.config = {
    name: "joinnoti",
    version: "1.1.0",
    hasPermssion: 1,
    credits: "TatsuYTB",
    description: "Quản lý tin nhắn chào tùy biến cho từng nhóm với biến {name}, {author}...",
    commandCategory: "Quản Lí Box",
    usages: "[add <message> /remove /on /off]",
    cooldowns: 0
};

const pathCache = join(__dirname, "data");
const pathData = join(pathCache, "joinNoti.json");

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
            if (!content) return api.sendMessage("→ Bạn chưa nhập tin nhắn chào!", threadID, messageID);
            thisThread.message = content;
            if (!dataJson.some(i => i.threadID == threadID)) dataJson.push(thisThread);
            writeFileSync(pathData, JSON.stringify(dataJson, null, 4), "utf-8");
            return api.sendMessage(`→ Cấu hình tin nhắn chào thành công!`, threadID, messageID);

        case "remove":
            thisThread.message = null;
            const index = dataJson.findIndex(i => i.threadID == threadID);
            if (index !== -1) dataJson.splice(index, 1);
            writeFileSync(pathData, JSON.stringify(dataJson, null, 4), "utf-8");
            return api.sendMessage("→ Xóa cấu hình tin nhắn chào thành công!", threadID, messageID);

        case "on":
            thisThread.enable = true;
            if (!dataJson.some(i => i.threadID == threadID)) dataJson.push(thisThread);
            writeFileSync(pathData, JSON.stringify(dataJson, null, 4), "utf-8");
            return api.sendMessage("→ Đã bật joinNoti cho nhóm này!", threadID, messageID);

        case "off":
            thisThread.enable = false;
            if (!dataJson.some(i => i.threadID == threadID)) dataJson.push(thisThread);
            writeFileSync(pathData, JSON.stringify(dataJson, null, 4), "utf-8");
            return api.sendMessage("→ Đã tắt joinNoti cho nhóm này!", threadID, messageID);

        default:
            return api.sendMessage(
`Hướng dẫn sử dụng chi tiết:
#joinNoti add <message>: Thêm tin nhắn chào tùy chỉnh
   → Có thể sử dụng các biến:
      {name}        : Tên thành viên mới
      {author}      : Tên người thêm
      {threadName}  : Tên nhóm
      {soThanhVien} : Số lượng thành viên hiện tại
      {get}         : Buổi trong ngày
      {bok}         : Ngày tháng hiện tại
      Ví dụ: {name} đã tham gia vào buổi {get} ngày {bok} là thành viên số {soThanhVien}
#joinNoti remove: Xóa tin nhắn chào
#joinNoti on: Bật joinNoti cho nhóm
#joinNoti off: Tắt joinNoti cho nhóm`, threadID, messageID
            );
    }
};
