const screenshot = require("screenshot-desktop");
const fs = require("fs");
const path = require("path");

module.exports.config = {
    name: "sc",
    version: "1.0.1",
    hasPermssion: 3, 
    credits: "TatsuYTB",
    description: "Chụp ảnh màn hình thiết bị",
    commandCategory: "Hệ Thống",
    usages: "screenshot",
    cooldowns: 10,
};

module.exports.run = async ({ api, event }) => {
    try {
        const savePath = path.join(__dirname, "screenshot.jpg");

        await screenshot({ filename: savePath });
        console.log("✅ Ảnh màn hình đã được chụp.");

        if (fs.existsSync(savePath)) {
            await api.sendMessage(
                { body: "Ảnh chụp màn hình của thiết bị:", attachment: fs.createReadStream(savePath) },
                event.threadID,
                () => {
                    fs.unlinkSync(savePath);
                    console.log("Ảnh chụp màn hình đã được xóa.");
                },
                event.messageID
            );
        } else {
            api.sendMessage("❌ Không tìm thấy ảnh chụp màn hình.", event.threadID, event.messageID);
        }
    } catch (error) {
        console.error("❌ Lỗi khi chụp ảnh màn hình: ", error);
        api.sendMessage(`❌ Lỗi khi chụp ảnh màn hình: ${error.message}`, event.threadID, event.messageID);
    }
};
