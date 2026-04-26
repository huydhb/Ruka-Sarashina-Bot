const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Groq API Key - đọc từ config.json
const GROQ_API_KEY = (() => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, '../../config.json'), 'utf8')).GROQ_API_KEY || ''; } catch(e) { return ''; } })();

module.exports.config = {
    name: "autorep",
    version: "2.0.0",
    hasPermssion: 1,
    credits: "TDF-2803",
    description: "Tự động trả lời AI khi có dấu ? hoặc 'tại sao'",
    commandCategory: "Tiện ích",
    usages: "/autorep [on/off]",
    cooldowns: 3
};

const dataDir = path.join(__dirname, 'data');
const settingsPath = path.join(dataDir, 'autorep_settings.json');

function getSettings() {
    if (fs.existsSync(settingsPath)) {
        try { return JSON.parse(fs.readFileSync(settingsPath, 'utf8')); }
        catch (e) { return {}; }
    }
    return {};
}

function saveSettings(data) {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2));
}

// Kiểm tra tin nhắn có phải là câu hỏi không
function isQuestion(text) {
    if (!text) return false;
    const lowerText = text.toLowerCase().trim();

    // Có dấu ? ở cuối
    if (/\?\s*$/.test(text)) return true;

    // Bắt đầu bằng "tại sao"
    if (lowerText.startsWith("tại sao") || lowerText.startsWith("tai sao")) return true;

    // Có chứa "tại sao" ở đâu đó
    if (lowerText.includes("tại sao") || lowerText.includes("tai sao")) return true;

    return false;
}

// Chat với AI
async function chat(prompt) {
    try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            messages: [
                {
                    role: "system",
                    content: "Bạn là TDF-Bot. Trả lời ngắn gọn, tự nhiên bằng tiếng Việt như một người bạn, thêm một số câu hài hước tùy trường hợp, phong cách nhi nhảnh vui vẻ."
                },
                {
                    role: "user",
                    content: prompt
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
        return response.data.choices[0]?.message?.content;
    } catch (error) {
        console.error("Lỗi Groq:", error.message);
        return null;
    }
}

// Lắng nghe tin nhắn
module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body } = event;

    if (!body || body.trim() === '') return;
    if (senderID === api.getCurrentUserID()) return;

    // Kiểm tra xem nhóm có bật autorep không
    const settings = getSettings();
    if (!settings[threadID]) return;

    // Bỏ qua lệnh (bắt đầu bằng prefix)
    const prefix = global.config.PREFIX || '/';
    if (body.trim().startsWith(prefix)) return;

    // Kiểm tra có phải câu hỏi không
    if (!isQuestion(body)) return;

    // Tin nhắn quá ngắn (< 3 ký tự không tính khoảng trắng)
    if (body.replace(/\s/g, '').length < 3) return;

    try {
        const answer = await chat(body.trim());
        if (answer) {
            return api.sendMessage(answer, threadID, messageID);
        }
    } catch (error) {
        // Im lặng khi lỗi
    }
};

// Lệnh bật/tắt
module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const settings = getSettings();

    if (!args[0]) {
        const status = settings[threadID] ? "BẬT" : "TẮT";
        return api.sendMessage(
            `Trạng thái autorep: ${status}\n` +
            `Dùng: /autorep on hoặc /autorep off\n\n` +
            `Khi bật, bot sẽ tự động trả lời khi:\n` +
            `- Tin nhắn có dấu ?\n` +
            `- Tin nhắn có "tại sao"`,
            threadID, messageID
        );
    }

    const action = args[0].toLowerCase();

    if (action === 'on') {
        settings[threadID] = true;
        saveSettings(settings);
        return api.sendMessage(
            "Đã bật autorep!\n" +
            "Bot sẽ tự động trả lời tin nhắn có dấu ? hoặc 'tại sao'.",
            threadID, messageID
        );
    } else if (action === 'off') {
        settings[threadID] = false;
        saveSettings(settings);
        return api.sendMessage("Đã tắt autorep!", threadID, messageID);
    } else {
        return api.sendMessage("Dùng: /autorep on hoặc /autorep off", threadID, messageID);
    }
};
