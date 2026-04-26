const axios = require('axios');
const fs = require('fs'), path = require('path');

// Groq API Key - đọc từ config.json
const GROQ_API_KEY = (() => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, '../../config.json'), 'utf8')).GROQ_API_KEY || ''; } catch(e) { return ''; } })();

module.exports.config = {
    name: "autoask",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "TDF-2803 | zL: 0878139888",
    description: "Tự động trả lời AI khi có dấu ?",
    commandCategory: "Tiện ích",
    usages: "Tự động trả lời khi câu hỏi kết thúc bằng ?",
    cooldowns: 0
};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body } = event;
    // console.log(`[AUTOASK] Checking: ${body}`);

    if (!body || body.trim() === '') return;
    if (senderID === api.getCurrentUserID()) return;

    const message = body.trim();

    // Kích hoạt khi có dấu ? ở cuối (kể cả có cách ' ?') và độ dài > 1
    // Regex: tìm dấu ? ở cuối, có thể có khoảng trắng
    if (!/\?\s*$/.test(body) || body.replace(/\s/g, '').length < 2) return;

    // Bỏ qua nếu bắt đầu bằng prefix (để nó không chạy trùng với lệnh /ask)
    const prefix = global.config.PREFIX || '/';
    if (message.startsWith(prefix)) return;

    try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            messages: [
                {
                    role: "system",
                    content: "Bạn là TDF-Bot. Trả lời ngắn gọn, tự nhiên bằng tiếng Việt như một người bạn, thêm một số câu hài hước tùy trường hợp, phong cách nhi nhảnh vui vẻ."
                },
                {
                    role: "user",
                    content: message
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 1024
        }, {
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        const answer = response.data.choices[0]?.message?.content;

        if (answer) {
            return api.sendMessage(answer, threadID, messageID);
        }

    } catch (error) {
        // Im lặng khi lỗi
    }
};

module.exports.run = async function ({ api, event, args }) {
    // Command này không cần chạy trực tiếp, nó chạy qua handleEvent
    return api.sendMessage("Tính năng tự động trả lời câu hỏi (?) đang hoạt động ngầm!", event.threadID, event.messageID);
};
