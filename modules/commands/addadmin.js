const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "addadmin",
    version: "1.0.0",
    hasPermssion: 2,
    credits: "Trịnh Đình Phát",
    description: "Them nguoi dung vao danh sach admin bot",
    commandCategory: "Admin",
    usages: "addadmin @tag hoac reply",
    cooldowns: 3
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID, mentions, messageReply } = event;
    const configPath = path.join(__dirname, "../../config.json");

    // Doc config hien tai
    var config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    var adminList = config.ADMINBOT || [];
    var botID = api.getCurrentUserID();

    // Chi admin hien tai hoac bot moi duoc dung lenh nay
    if (!adminList.includes(senderID) && senderID !== botID) {
        return api.sendMessage("Ban khong co quyen su dung lenh nay!", threadID, messageID);
    }

    // Lay ID nguoi can them
    var targetID = null;
    var targetName = null;

    if (messageReply) {
        targetID = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
        targetID = Object.keys(mentions)[0];
        targetName = mentions[targetID].replace("@", "");
    } else {
        return api.sendMessage("Vui long tag hoac reply nguoi can them admin!", threadID, messageID);
    }

    // Kiem tra da la admin chua
    if (adminList.includes(targetID)) {
        return api.sendMessage("Nguoi nay da la admin bot roi!", threadID, messageID);
    }

    // Them vao danh sach
    adminList.push(targetID);
    config.ADMINBOT = adminList;

    // Luu vao file
    fs.writeFileSync(configPath, JSON.stringify(config, null, 4), "utf8");

    // Cap nhat global
    global.config.ADMINBOT = adminList;

    // Lay ten nguoi duoc them
    try {
        var userInfo = await api.getUserInfo(targetID);
        targetName = userInfo[targetID].name;
    } catch (e) { }

    return api.sendMessage("Da them " + (targetName || targetID) + " vao danh sach admin bot!\nID: " + targetID, threadID, messageID);
};
