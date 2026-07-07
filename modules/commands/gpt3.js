const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: "gpt3",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "TatsuYTB",
    description: "Chat với AI",
    commandCategory: "AI",
    usages: "gpt3 nội dung",
    cooldowns: 10,
};

const getApiUrl = () => {
    try {
        const filePath = path.join(__dirname, '/data/api.json');
        const data = fs.readFileSync(filePath, 'utf-8');
        const jsonData = JSON.parse(data);

        if (!jsonData.gpt3) {}

        return jsonData.gpt3;
    } catch (error) {}
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
            continue;
        }
    }

    throw new Error("Tất cả các UID đều không phản hồi, vui lòng thử lại sau.");
};

const chatSessions = {};

module.exports.run = async ({ api, event, args }) => {
    try {
        const text = args.join(' ');
        if (!text) {
            return api.sendMessage('Vui lòng cung cấp nội dung để chat với AI.', event.threadID, event.messageID);
        }

        const response = await getChatResponse(text);

        const messageID = await new Promise((resolve, reject) => {
            api.sendMessage(response, event.threadID, (error, info) => {
                if (error) return reject(error);
                resolve(info.messageID);
            }, event.messageID);
        });

        chatSessions[messageID] = event.threadID;
    } catch (error) {
        api.sendMessage(error.message, event.threadID, event.messageID);
    }
};

module.exports.handleReply = async ({ api, event }) => {
    try {
        const sessionThreadID = chatSessions[event.messageReply.messageID];

        if (sessionThreadID && sessionThreadID === event.threadID) {
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

            chatSessions[messageID] = event.threadID;
        }
    } catch (error) {}
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
