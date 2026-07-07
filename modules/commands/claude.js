const axios = require('axios'); 
const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: "claude",
    version: "1.1.0",
    hasPermssion: 0,
    credits: "TatsuYTB",
    description: "Chat với AI",
    commandCategory: "AI",
    usages: "claude nội dung",
    cooldowns: 10,
};

const getApiUrl = () => {
    try {
        const filePath = path.join(__dirname, 'data', 'api.json');
        const data = fs.readFileSync(filePath, 'utf-8');
        const jsonData = JSON.parse(data);

        if (!jsonData.claude || jsonData.claude.trim() === '') {
            return null;
        }

        return jsonData.claude;
    } catch {
        return null;
    }
};

const getChatResponse = async (text) => {
    const apiUrl = getApiUrl();
    if (!apiUrl) {
        throw new Error("Đang cập nhật!!!");
    }

    for (let uid = 1; uid <= 9; uid++) {
        try {
            const response = await axios.get(`${apiUrl}?prompt=${encodeURIComponent(text)}&uid=${uid}`);
            if (response.data && response.data.result) {
                return response.data.result;
            }
        } catch {
        }
    }

    throw new Error("Tất cả các UID đều không phản hồi, vui lòng thử lại sau.");
};

const botMessages = new Map();

module.exports.run = async ({ api, event, args }) => {
    try {
        const text = args.join(' ');
        if (!text) {
            return api.sendMessage('Vui lòng cung cấp nội dung để chat với AI.', event.threadID, event.messageID);
        }

        const response = await getChatResponse(text);

        const messageID = await new Promise((resolve, reject) => {
            api.sendMessage(response, event.threadID, (error, info) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(info.messageID);
                }
            }, event.messageID);
        });

        botMessages.set(messageID, event.threadID);
    } catch (error) {
        api.sendMessage(`${error.message}`, event.threadID, event.messageID);
    }
};

module.exports.handleReply = async ({ api, event }) => {
    try {
        if (!event.messageReply || !botMessages.has(event.messageReply.messageID)) {
            return;
        }

        const text = event.body;
        const response = await getChatResponse(text);

        const messageID = await new Promise((resolve, reject) => {
            api.sendMessage(response, event.threadID, (error, info) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(info.messageID);
                }
            }, event.messageID);
        });

        botMessages.set(messageID, event.threadID);
        botMessages.delete(event.messageReply.messageID);
    } catch (error) {
        api.sendMessage(`${error.message}`, event.threadID, event.messageID);
    }
};

module.exports.handleEvent = async function({ api, event }) {
    if (event.type === "message_reply") {
        await this.handleReply({ api, event });
    }
};

module.exports.languages = {
    "vi": {
        "description": "Chat với AI thông qua API"
    }
};
