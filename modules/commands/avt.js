const fs = require('fs');
const axios = require('axios');

module.exports.config = {
    name: "avt",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Jukie",
    description: "Lấy ảnh đại diện",
    commandCategory: "Công cụ",
    usages: "[user|box|tid]",
    cooldowns: 3
};

module.exports.run = async ({ api, event, args, Users }) => {
    const { threadID, messageID, senderID, type, messageReply, mentions } = event;

    const sendImage = async (url, message) => {
        try {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            if (response.status !== 200) {
                return api.sendMessage("⚠️ Không thể tải ảnh đại diện. Vui lòng thử lại sau.", threadID, messageID);
            }
            const imagePath = __dirname + '/cache/avt.png';
            fs.writeFileSync(imagePath, response.data);
            api.sendMessage({ body: message, attachment: fs.createReadStream(imagePath) }, threadID, () => {
                fs.unlinkSync(imagePath);
            }, messageID);
        } catch (error) {
            console.error(error);
            api.sendMessage("⚠️ Đã có lỗi xảy ra, vui lòng thử lại sau.", threadID, messageID);
        }
    };

    if (args.length === 0) {
        return api.sendMessage(`⚡️Bạn có thể dùng:\n\n${this.config.name} user => nó sẽ lấy ảnh đại diện của chính bạn.\n\n${this.config.name} user @[Tag] => nó sẽ lấy ảnh đại diện của người bạn tag.\n\n${this.config.name} box => nó sẽ lấy ảnh đại diện của box của bạn\n\n${this.config.name} user box tid => nó sẽ lấy ảnh đại diện của tid`, threadID, messageID);
    }

    if (args[0] === "box") {
        let targetThreadID = threadID;
        if (args[1]) targetThreadID = args[1];

        try {
            const threadInfo = await api.getThreadInfo(targetThreadID);
            if (!threadInfo.imageSrc) {
                return api.sendMessage(`⚡️Box này không có ảnh đại diện`, threadID, messageID);
            }
            return sendImage(threadInfo.imageSrc, `⚡️Ảnh đại diện của box ${threadInfo.threadName} đây`);
        } catch (error) {
            console.error(error);
            return api.sendMessage("⚠️ Không thể lấy thông tin của box. Vui lòng thử lại sau.", threadID, messageID);
        }
    }

    if (args[0] === "user") {
        let targetID = senderID;

        if (args[1]) {
            if (Object.keys(mentions).length > 0) {
                targetID = Object.keys(mentions)[0];
            } else if (args[1] === "tid") {
                if (args[2]) {
                    targetID = args[2];
                } else {
                    return api.sendMessage(`⚡️Bạn chưa nhập ID của người dùng`, threadID, messageID);
                }
            }
        } else if (type === "message_reply") {
            targetID = messageReply.senderID;
        }

        try {
            const userInfo = await Users.getData(targetID);
            const userName = userInfo.name || "người dùng";
            const imageUrl = `https://graph.facebook.com/${targetID}/picture?height=720&width=720&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
            return sendImage(imageUrl, `⚡️Ảnh đại diện của ${userName} đây`);
        } catch (error) {
            console.error(error);
            return api.sendMessage(`⚠️ Không thể lấy thông tin người dùng. Vui lòng thử lại sau.`, threadID, messageID);
        }
    }
};
