const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: "atstk",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "TatsuYTB",
    description: "auto sticker",
    commandCategory: "Hệ Thống",
    usages: "atstk on/off",
    cooldowns: 5,
};

const messageCount = {};
const stickerList = [
    "8298114373607613",
    "607944812984452",
    "369239263222822",
    "184571475493841",
    "155887105126297",
    "551710554864076",
    "788171717923679",
    "8298124896939894",
    "1458999184131858",
    "369239383222810",
    "1598371140426188",
    "1598410647088904",
    "1649890685274233",
    "1598405803756055",
    "1598406790422623",
    "1458993787465731",
    "2041015329459274",
    "1458994000799043",
    "1458994024132374",
    "2041011726126301",
    "2041011836126290",
    "041011389459668",
    "2041021119458695",
    "2041021119458695",
    "1747085962269322",
    "295920800855997",
    "1747083702269548",
    "369239263222822",
    "184571475493841",
    "155887105126297",
    "551710554864076",
    "788171717923679",
    "1458999184131858",
    "369239383222810",
    "1598371140426188",
    "1598410647088904",
    "1330354587154466",
    "1390600217908126", 
    "1390506597917488", 
    "785424208295600",
    "629265523856431",
    "1330354290487829",
    "181834558976193", 
    "157616594731323", 
    "334220426780978",
    "334196663450021",
    "1598357893760846",
    "1578941069102354",
    "1330353857154539",
    "1649890685274233",
    "1598405803756055",
    "1598406790422623",
    "1458993787465731",
    "2041015329459274",
    "1458994000799043",
    "1458994024132374",
    "2041011726126301",
    "2041011836126290",
    "041011389459668",
    "2041021119458695",
    "1747085962269322",
    "1747083702269548",
    "483272161088794",
    "1017524943189355",
    "1138381244129430",
    "1652591134767287"
    ];

const threadSettingsPath = path.join(__dirname, 'data', 'threadSettings.json');

const getThreadSettings = () => {
    if (!fs.existsSync(threadSettingsPath)) {
        fs.writeFileSync(threadSettingsPath, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(threadSettingsPath, 'utf-8'));
};

const saveThreadSettings = (settings) => {
    fs.writeFileSync(threadSettingsPath, JSON.stringify(settings, null, 4));
};

const getRandomSticker = () => {
    const randomIndex = Math.floor(Math.random() * stickerList.length);
    return stickerList[randomIndex];
};

module.exports.handleEvent = async function ({ api, event }) {
    if (event.type !== "message") return;

    const threadID = event.threadID;
    const threadSettings = getThreadSettings();

    if (!threadSettings[threadID] || threadSettings[threadID] !== "on") return;

    if (!messageCount[threadID]) {
        messageCount[threadID] = 0;
    }

    messageCount[threadID] += 1;

    if (messageCount[threadID] >= 10) {
        const stickerID = getRandomSticker();

        api.sendMessage({ sticker: stickerID }, threadID, (error) => {
            if (error) console.error(error);
        });
        messageCount[threadID] = 0;
    }
};

module.exports.run = async function ({ api, event, args }) {
    const threadID = event.threadID;
    const threadSettings = getThreadSettings();

    if (args[0] === "on") {
        threadSettings[threadID] = "on";
        saveThreadSettings(threadSettings);
        return api.sendMessage("Đã bật tính năng gửi sticker ngẫu nhiên cho nhóm này.", threadID);
    } else if (args[0] === "off") {
        threadSettings[threadID] = "off";
        saveThreadSettings(threadSettings);
        return api.sendMessage("Đã tắt tính năng gửi sticker ngẫu nhiên cho nhóm này.", threadID);
    } else {
        return api.sendMessage("Sử dụng lệnh: atstk on/off để bật hoặc tắt tính năng.", threadID);
    }
};
