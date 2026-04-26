const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "deleteadmin",
    version: "1.0.0",
    hasPermssion: 2,
    credits: "Trịnh Đình Phát",
    description: "Xoa nguoi dung khoi danh sach admin bot",
    commandCategory: "Admin",
    usages: "deleteadmin @tag hoac reply",
    cooldowns: 3
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID, mentions, messageReply } = event;
    const configPath = path.join(__dirname, "../../config.json");

    // Doc config hien tai
    var config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    var adminList = config.ADMINBOT || [];
    var botID = api.getCurrentUserID();

    // Chi bot ID (quyen cao nhat) moi duoc xoa admin khac
    // Hoac admin dau tien trong danh sach (owner)
    var ownerID = adminList[0];

    if (senderID !== botID && senderID !== ownerID) {
        return api.sendMessage("Chi chu bot moi co quyen xoa admin!", threadID, messageID);
    }

    // Lay ID nguoi can xoa
    var targetID = null;
    var targetName = null;

    if (messageReply) {
        targetID = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
        targetID = Object.keys(mentions)[0];
        targetName = mentions[targetID].replace("@", "");
    } else {
        return api.sendMessage("Vui long tag hoac reply nguoi can xoa admin!", threadID, messageID);
    }

    // Khong the xoa bot ID
    if (targetID === botID) {
        return api.sendMessage("Khong the xoa quyen cua bot!", threadID, messageID);
    }

    // Khong the xoa owner (admin dau tien)
    if (targetID === ownerID && senderID !== botID) {
        return api.sendMessage("Khong the xoa chu bot!", threadID, messageID);
    }

    // Kiem tra co phai admin khong
    if (!adminList.includes(targetID)) {
        return api.sendMessage("Nguoi nay khong phai la admin bot!", threadID, messageID);
    }

    // Xoa khoi danh sach
    var index = adminList.indexOf(targetID);
    adminList.splice(index, 1);
    config.ADMINBOT = adminList;

    // Luu vao file
    fs.writeFileSync(configPath, JSON.stringify(config, null, 4), "utf8");

    // Cap nhat global
    global.config.ADMINBOT = adminList;

    // Lay ten nguoi bi xoa
    try {
        var userInfo = await api.getUserInfo(targetID);
        targetName = userInfo[targetID].name;
    } catch (e) { }

    return api.sendMessage("Da xoa " + (targetName || targetID) + " khoi danh sach admin bot!\nID: " + targetID, threadID, messageID);
};
