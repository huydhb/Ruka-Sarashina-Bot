const fs = require('fs');
const axios = require('axios');

module.exports.config = {
    name: "finduser",
    version: "1.1.0",
    hasPermssion: 0,
    credits: "TatsuYTB",
    description: "Tìm thông tin người dùng trong các nhóm bot tham gia",
    commandCategory: "Tiện ích",
    usages: "finduser <uid|name>",
    cooldowns: 10
};

module.exports.run = async ({ api, event, args, Users }) => {
    const { threadID, messageID } = event;
    if (args.length === 0) {
        return api.sendMessage("⚠️ Vui lòng nhập UID hoặc tên để tìm kiếm.", threadID, messageID);
    }

    const query = args.join(" ").toLowerCase();
    const isUID = /^\d+$/.test(query);

    const userResults = {};
    const allThreads = await api.getThreadList(100, null, ["INBOX"]);

    for (const thread of allThreads) {
        const threadInfo = await api.getThreadInfo(thread.threadID);
        const members = threadInfo.participantIDs || [];
        
        for (const memberID of members) {
            try {
                const userInfo = await Users.getData(memberID);
                const userName = userInfo.name || "Không rõ";
                
                if ((isUID && memberID === query) || (!isUID && userName.toLowerCase().includes(query))) {
                    if (!userResults[memberID]) {
                        userResults[memberID] = {
                            name: userName,
                            threads: []
                        };
                    }
                    userResults[memberID].threads.push(threadInfo.threadName || "Không rõ");
                }
            } catch (error) {
                console.error(`Không thể lấy thông tin cho UID: ${memberID}`, error);
            }
        }
    }

    if (Object.keys(userResults).length === 0) {
        return api.sendMessage(`❎ Không tìm thấy người dùng nào khớp với "${query}".`, threadID, messageID);
    }

    let responseMessage = `🔎 Đã tìm thấy ${Object.keys(userResults).length} kết quả:\n`;
    const imagePaths = [];
    for (const [uid, result] of Object.entries(userResults)) {
        const imageUrl = `https://graph.facebook.com/${uid}/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const imagePath = __dirname + `/cache/${uid}.png`;

        try {
            const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
            fs.writeFileSync(imagePath, response.data);
            imagePaths.push(imagePath);
        } catch (error) {
            console.error(`Không thể tải ảnh đại diện của UID: ${uid}`, error);
        }

        const threadNames = result.threads.join(", ");
        responseMessage += `\n👤 Tên: ${result.name}\n🔰 UID: ${uid}\n📝 Nhóm: ${threadNames}\n🌐 Link FB: https://www.facebook.com/${uid}\n`;
    }

    const attachments = imagePaths.map(path => fs.createReadStream(path));
    api.sendMessage({ body: responseMessage, attachment: attachments }, threadID, () => {
        imagePaths.forEach(path => fs.unlinkSync(path));
    }, messageID);
};
