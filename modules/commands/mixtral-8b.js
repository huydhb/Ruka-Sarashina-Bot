const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: "mixtral",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "TatsuYTB",
    description: "Chat với AI (Mixtral)",
    commandCategory: "AI",
    usages: "mixtral nội dung",
    cooldowns: 10,
};

const getApiUrl = () => {
    try {
        const filePath = path.join(__dirname, 'data', 'api.json');
        const data = fs.readFileSync(filePath, 'utf-8');
        const jsonData = JSON.parse(data);

        if (!jsonData.mixtral8b || jsonData.mixtral8b.trim() === '') {}

        return jsonData.mixtral8b;
    } catch (error) {}
};

const getChatResponse = async (text, api, event) => {
    const apiUrl = getApiUrl();
    if (!apiUrl) {
        return api.sendMessage("Đang cập nhật!!!", event.threadID, event.messageID);
    }
    try {
        const response = await axios.get(`${apiUrl}?q=${encodeURIComponent(text)}`);
        if (response.data && response.data.result) {
            return response.data.result;
        } else {}
    } catch (error) {}
}

const chatSessions = {};

module.exports.run = async ({ api, event, args }) => {
    try {
        const text = args.join(' ');
        if (!text) {
            return api.sendMessage('Vui lòng cung cấp nội dung để chat với AI.', event.threadID, event.messageID);
        }

        const response = await getChatResponse(text, api, event);

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
    } catch (error) {}
};

module.exports.handleReply = async ({ api, event }) => {
    try {
        const sessionThreadID = chatSessions[event.messageReply?.messageID];

        if (sessionThreadID && sessionThreadID === event.threadID) {
            const text = event.body;

            if (!text || text.trim() === '') {
                return api.sendMessage('Vui lòng cung cấp nội dung để tiếp tục trò chuyện.', event.threadID, event.messageID);
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

            chatSessions[messageID] = event.threadID;
            delete chatSessions[event.messageReply.messageID];
        }
    } catch (error) {}
};

module.exports.handleEvent = async function({ api, event }) {
    if (
        event.type === "message_reply" && 
        event.messageReply &&
        chatSessions[event.messageReply.messageID]
    ) {
        await this.handleReply({ api, event });
    }
};

module.exports.languages = {
    "vi": {
        "description": "Chat với AI Mixtral thông qua API"
    }
};
