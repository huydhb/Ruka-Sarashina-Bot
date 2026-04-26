const axios = require('axios');
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data', 'statusAutoTrans.json');
const translateAPI = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=';

// Tạo file nếu chưa có
if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, '{}');

function getSettings() {
    try { return JSON.parse(fs.readFileSync(dataPath, 'utf8')); }
    catch (e) { return {}; }
}

function saveSettings(data) {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

module.exports.config = {
    name: 'autotrans',
    version: '2.0.0',
    hasPermssion: 1,
    credits: 'DC-Nam',
    description: 'Tự động dịch tin nhắn tiếng nước ngoài sang tiếng Việt',
    commandCategory: 'Tiện ích',
    usages: '/autotrans [on/off]',
    cooldowns: 3
};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, body, senderID, messageID } = event;

    if (!body) return;
    if (body.startsWith(global.config.PREFIX)) return;
    if (api.getCurrentUserID() === senderID) return;

    const settings = getSettings();
    if (!settings[threadID]) return;

    try {
        const response = await axios.get(translateAPI + encodeURI(body));
        const detectedLang = response.data[2];

        if (detectedLang !== 'vi') {
            const translated = response.data[0].map(el => el[0]).join('');
            api.sendMessage(translated, threadID, messageID);
        }
    } catch (error) {
        console.log('Autotrans error:', error.message);
    }
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const settings = getSettings();

    // Nếu không có tham số - hiển thị trạng thái
    if (!args[0]) {
        const status = settings[threadID] ? "BẬT" : "TẮT";
        return api.sendMessage(
            `Trạng thái: ${status}\nDùng: /autotrans on hoặc /autotrans off`,
            threadID, messageID
        );
    }

    const action = args[0].toLowerCase();

    if (action === 'on') {
        settings[threadID] = true;
        saveSettings(settings);
        return api.sendMessage("Đã bật autotrans! Bot sẽ tự động dịch tin nhắn tiếng nước ngoài.", threadID, messageID);
    } else if (action === 'off') {
        settings[threadID] = false;
        saveSettings(settings);
        return api.sendMessage("Đã tắt autotrans!", threadID, messageID);
    } else {
        return api.sendMessage("Dùng: /autotrans on hoặc /autotrans off", threadID, messageID);
    }
};