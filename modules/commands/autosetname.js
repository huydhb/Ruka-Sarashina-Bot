const { existsSync, writeFileSync, mkdirSync } = global.nodemodule["fs-extra"];
const { join } = global.nodemodule["path"];
const moment = require("moment-timezone");

module.exports.config = {
    name: "autosetname",
    version: "1.0.1",
    hasPermssion: 1,
    credits: "Vtuan (Modified by AI)",
    description: "Tự động setname cho thành viên mới",
    commandCategory: "Quản Lí Box",
    usages: "[add <name> /remove]",
    cooldowns: 0
};

module.exports.onLoad = () => {
    const pathCache = join(__dirname, "data");
    const pathData = join(pathCache, "autosetname.json");

    if (!existsSync(pathCache)) mkdirSync(pathCache, { recursive: true });
    if (!existsSync(pathData)) writeFileSync(pathData, "[]", "utf-8");
};

module.exports.run = async function ({ event, api, args }) {
    const { threadID, messageID } = event;
    const { readFileSync, writeFileSync } = global.nodemodule["fs-extra"];
    const pathData = join(__dirname, "data","autosetname.json");

    let dataJson;
    try {
        dataJson = JSON.parse(readFileSync(pathData, "utf-8"));
    } catch (error) {
        dataJson = [];
        writeFileSync(pathData, JSON.stringify([]), "utf-8");
    }

    const thisThread = dataJson.find(item => item.threadID == threadID) || { threadID, nameUser: [] };

    const content = args.slice(1).join(" ");
    switch (args[0]) {
        case "add":
            if (!content) return api.sendMessage("→ Bạn chưa nhập cấu hình tên!", threadID, messageID);
            if (thisThread.nameUser.length > 0) return api.sendMessage("→ Cấu hình cũ tồn tại! Vui lòng xóa cấu hình trước.", threadID, messageID);

            thisThread.nameUser.push(content);
            if (!dataJson.some(item => item.threadID == threadID)) dataJson.push(thisThread);
            writeFileSync(pathData, JSON.stringify(dataJson, null, 4), "utf-8");
            return api.sendMessage(`→ Đặt cấu hình tên thành viên mới thành công: ${content}`, threadID, messageID);

        case "remove":
            if (thisThread.nameUser.length === 0) return api.sendMessage("→ Không có cấu hình để xóa!", threadID, messageID);

            thisThread.nameUser = [];
            const index = dataJson.findIndex(item => item.threadID == threadID);
            if (index !== -1) dataJson.splice(index, 1);
            writeFileSync(pathData, JSON.stringify(dataJson, null, 4), "utf-8");
            return api.sendMessage("→ Xóa cấu hình thành công!", threadID, messageID);

        default:
            return api.sendMessage(
                `hướng dẫn sử dụng:
#autosetname add biệt danh: biệt danh tạm thời cho thành viên mới
#autosetname remove: bỏ tự đặt biệt danh cho thành viên mới
`,
                threadID,
                messageID
            );
    }
};
