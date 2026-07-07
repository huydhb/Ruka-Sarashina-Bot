const moment = require('moment-timezone');

module.exports.config = {
    name: "doanso",
    version: "1.0.0",
    hasPermission: 0,
    credits: "RukaChan",
    description: "Trò chơi đoán số",
    commandCategory: "Trò Chơi",
    usages: "",
    cooldowns: 5
};

const levels = [
    { level: 1, max: 20, reward: 1000 },
    { level: 2, max: 50, reward: 2000 },
    { level: 3, max: 100, reward: 3000 },
    { level: 4, max: 500, reward: 5000 },
    { level: 5, max: 1000, reward: 10000 }
];

const maxGuesses = 10;

module.exports.run = async ({ api, event, args }) => {
    const threadID = event.threadID;
    const senderID = event.senderID;
    const level = parseInt(args[0], 10);

    if (isNaN(level) || level < 1 || level > 5) {
        return api.sendMessage('𝐕𝐮𝐢 𝐥𝐨̀𝐧𝐠 𝐜𝐡𝐨̣̂𝐧 𝐜𝐚̂́𝐩 𝐝𝐨̣̂ 𝐭𝐮̛̀ 𝟏 𝐝𝐞̂́𝐧 𝟓.', threadID);
    }

    const selectedLevel = levels.find(l => l.level === level);
    const targetNumber = Math.floor(Math.random() * selectedLevel.max) + 1;
    const startMsg = `
𝐓𝐫𝐨̀ 𝐜𝐡𝐨̛𝐢 𝐝𝐨𝐚́𝐧 𝐬𝐨̂́ 𝐛𝐚̆́𝐭 𝐝𝐚̂̀𝐮!
𝐁𝐨𝐭 𝐝𝐚̃ 𝐜𝐡𝐨̣𝐧 𝐦𝐨̣̂𝐭 𝐬𝐨̂́ 𝐭𝐫𝐨𝐧𝐠 𝐤𝐡𝐨𝐚̉𝐧𝐠 𝐭𝐮̛̀ 1 𝐝𝐞̂́𝐧 ${selectedLevel.max}.
𝐁𝐚̣𝐧 𝐜𝐨́ ${maxGuesses} 𝐥𝐚̂̀𝐧 𝐝𝐨𝐚́𝐧. 𝐇𝐚̃𝐲 𝐜𝐨̂́ 𝐠𝐚̆́𝐧𝐠 𝐝𝐨𝐚́𝐧 𝐱𝐞𝐦 𝐝𝐨́ 𝐥𝐚̀ 𝐬𝐨̂́ 𝐧𝐚̀𝐨.
𝐂𝐚̂́𝐩 𝐝𝐨̣̂: ${level} (𝐭𝐡𝐮̛𝐨̛̉𝐧𝐠: ${selectedLevel.reward} 𝐭𝐢𝐞̂̀𝐧)
𝐑𝐞𝐩𝐥𝐲 𝐭𝐢𝐧 𝐧𝐡𝐚̆́𝐧 𝐧𝐚̀𝐲 𝐝𝐞̂̉ 𝐝𝐨𝐚́𝐧!
    `.trim();

    api.sendMessage(startMsg, threadID, (err, info) => {
        global.client.handleReply.push({
            type: 'guessnumber',
            name: module.exports.config.name,
            targetNumber,
            threadID,
            senderID,
            messageID: info.messageID,
            level,
            guesses: 0 
        });
    });
};

module.exports.handleReply = async ({ api, event, handleReply, Currencies }) => {
    if (handleReply.type === 'guessnumber') {
        const { targetNumber, threadID, senderID, messageID, level } = handleReply;
        let { guesses } = handleReply;

        if (event.senderID !== senderID || event.threadID !== threadID) return;

        const guess = parseInt(event.body, 10);

        if (isNaN(guess)) {
            return api.sendMessage('𝐕𝐮𝐢 𝐥𝐨̀𝐧𝐠 𝐧𝐡𝐚̣̂𝐩 𝐦𝐨̣̂𝐭 𝐬𝐨̂́ 𝐡𝐨̛̣𝐩 𝐥𝐞̣̂.', threadID);
        }

        guesses++;

        handleReply.guesses = guesses;

        if (guess < targetNumber) {
            api.sendMessage(`𝐒𝐨̂́ 𝐛𝐚̣𝐧 𝐝𝐨𝐚́𝐧 𝐧𝐡𝐨̉ 𝐡𝐨̛𝐧 𝐬𝐨̂́ 𝐦𝐮̣𝐜 𝐭𝐢𝐞̂𝐮. (${guesses}/${maxGuesses} 𝐥𝐚̂̀𝐧 𝐝𝐨𝐚́𝐧)`, threadID, messageID);
        } else if (guess > targetNumber) {
            api.sendMessage(`𝐒𝐨̂́ 𝐛𝐚̣𝐧 𝐝𝐨𝐚́𝐧 𝐥𝐨̛́𝐧 𝐡𝐨̛𝐧 𝐬𝐨̂́ 𝐦𝐮̣𝐜 𝐭𝐢𝐞̂𝐮. (${guesses}/${maxGuesses} 𝐥𝐚̂̀𝐧 𝐝𝐨𝐚́𝐧)`, threadID, messageID);
        } else {
            await Currencies.increaseMoney(senderID, levels[level - 1].reward);
            api.sendMessage(`𝐂𝐡𝐮́𝐜 𝐦𝐮̛̀𝐧𝐠! 𝐁𝐚̣𝐧 𝐝𝐚̃ 𝐝𝐨𝐚́𝐧 𝐝𝐮́𝐧𝐠 𝐬𝐨̂́ ${targetNumber}!\n𝐁𝐚̣𝐧 𝐝𝐮̛𝐨̛̣𝐜 𝐭𝐡𝐮̛𝐨̛̉𝐧𝐠 ${levels[level - 1].reward} 𝐭𝐢𝐞̂̀𝐧.`, threadID);
            return global.client.handleReply = global.client.handleReply.filter(item => item.messageID !== messageID);
        }

        if (guesses >= maxGuesses) {
            setTimeout(() => {
                api.sendMessage(`𝐁𝐚̣𝐧 𝐝𝐚̃ 𝐡𝐞̂́𝐭 𝐥𝐮̛𝐨̛̣𝐭 𝐝𝐨𝐚́𝐧. 𝐒𝐨̂́ 𝐝𝐮́𝐧𝐠 𝐥𝐚̀ ${targetNumber}.`, threadID);
            }, 500);
            return global.client.handleReply = global.client.handleReply.filter(item => item.messageID !== messageID);
        }

        const index = global.client.handleReply.findIndex(item => item.messageID === messageID);
        if (index !== -1) {
            global.client.handleReply[index] = handleReply;
        }
    }
};
