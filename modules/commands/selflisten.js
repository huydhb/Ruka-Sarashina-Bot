const fs = require("fs-extra");

module.exports.config = {
    name: "sl",
    version: "1.0.0",
    hasPermssion: 3,
    credits: "TatsuYTB",
    description: "Bật tắt chế độ selfListen",
    commandCategory: "Hệ Thống",
    usages: "sl on/off",
    cooldowns: 5,
};

module.exports.run = async function({ api, event, args, client }) {
    const configPath = './config.json';

    try {
        const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        let tf, onoff;

        if (args[0] === "on") {
            tf = true;
            onoff = "bật";
        } else if (args[0] === "off") {
            tf = false;
            onoff = "tắt";
        } else {
            return api.sendMessage("Vui lòng sử dụng: #sl on/off", event.threadID, event.messageID);
        }

        config.FCAOption.selfListen = tf;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");

        api.setOptions({ selfListen: tf });

        return api.sendMessage(`Đã ${onoff} chế độ selfListen`, event.threadID, event.messageID);
    } catch (error) {
        console.error("Lỗi khi cập nhật cấu hình:", error);
        return api.sendMessage("Đã xảy ra lỗi khi cập nhật cấu hình.", event.threadID, event.messageID);
    }
};
