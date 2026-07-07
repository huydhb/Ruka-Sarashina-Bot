const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: "llama3",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "TatsuYTB",
    description: "Chat với AI(llama3-70b)",
    commandCategory: "AI",
    usages: "llama3 nội dung",
    cooldowns: 10,
};

const getApiUrl = () => {
    try {
        const filePath = path.join(__dirname, 'data', 'api.json');
        const data = fs.readFileSync(filePath, 'utf-8');
        const jsonData = JSON.parse(data);

        if (!jsonData.llama370b || jsonData.llama370b.trim() === '') {
            return null;
        }

        return jsonData.llama370b;
    } catch {
        return null;
    }
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
        } else {
            return "Không có kết quả từ API.";
        }
    } catch {
        return "Đã xảy ra lỗi khi kết nối tới API.";
    }
};

const chatSessions = new Map();

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
    } catch {
    }
};

module.exports.handleReply = async ({ api, event }) => {
    try {
        const sessionThreadID = chatSessions[event.messageReply?.messageID];

        if (sessionThreadID && sessionThreadID === event.threadID) {
            const text = event.body;

            if (!text || text.trim() === '') {
                return api.sendMessage('Vui lòng cung cấp nội dung để tiếp tục trò chuyện.', event.threadID, event.messageID);
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
            delete chatSessions[event.messageReply.messageID];
        }
    } catch {
    }
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
        "description": "Chat với AI thông qua API"
    }
};
