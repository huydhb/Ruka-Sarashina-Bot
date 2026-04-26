const { join } = require("path");
const { readFileSync, writeFileSync } = require("fs-extra");
const moment = require('moment-timezone');

module.exports.config = {
    name: "autosetname",
    eventType: ["log:subscribe"],
    version: "1.0.3",
    credits: "D-Jukie",
    description: "Tự động set biệt danh thành viên mới"
};

module.exports.run = async function({ api, event }) {
    const { threadID } = event;
    const memJoin = event.logMessageData.addedParticipants.map(info => info.userFbId);
    const pathData = join("./modules/commands", "data", "autosetname.json");
    
    // Đọc dữ liệu từ file JSON
    var dataJson = JSON.parse(readFileSync(pathData, "utf-8"));
    var thisThread = dataJson.find(item => item.threadID == threadID) || { threadID, nameUser: [] };

    // Nếu không có cấu hình tên thì thoát
    if (thisThread.nameUser.length == 0) return;

    for (let idUser of memJoin) {
        const nameData = await api.getUserInfo(idUser);
        const userName = nameData[idUser].name;
        
        // Thay thế {name} và {time} trong tên
        const setName = thisThread.nameUser[0]
            .replace(/{name}/g, userName) // Thay thế {name} bằng tên người dùng
            .replace(/{time}/g, moment().tz('Asia/Ho_Chi_Minh').format('HH:mm:ss | DD/MM/YYYY')); // Thay thế {time} bằng thời gian hiện tại

        // Thiết lập biệt danh cho thành viên
        await new Promise(resolve => setTimeout(resolve, 100));
        api.changeNickname(setName, threadID, idUser);
    }

    return api.sendMessage(`Đã tự động đặt biệt danh cho thành viên mới!`, threadID, event.messageID);
}