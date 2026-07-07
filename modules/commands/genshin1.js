const axios = require('axios');
const cheerio = require('cheerio');

module.exports.config = {
    name: "genshin1",
    version: "1.0.0",
    hasPermssion: 3,
    credits: "TatsuYTB",
    description: "Fetch information about a Genshin Impact player by UID",
    commandCategory: "Hệ Thống",
    usages: "[UID]",
    cooldowns: 5,
};

module.exports.languages = {
    "vi": {
        "fetching": "Đang lấy thông tin về người chơi UID %1...",
        "playerNotFound": "Không tìm thấy thông tin về người chơi UID %1.",
        "characterHidden": "Tài khoản này đã ẩn thông tin chi tiết của nhân vật.",
        "playerInfo": "Tên: %1\nCấp độ: %2\nChữ ký: %3\nCấp thế giới: %4\nSố lượng thành tựu: %5\nLa Hoàn Thâm Cảnh: Tầng: %6 - %7\n\nDanh sách nhân vật công khai:\n%8\nPhản hồi theo số thứ tự nhân vật để xem thông tin chi tiết của nhân vật đó."
    },
    "en": {
        "fetching": "Fetching information about player UID %1...",
        "playerNotFound": "Player UID %1 not found.",
        "characterHidden": "This account has hidden character details.",
        "playerInfo": "Name: %1\nLevel: %2\nSignature: %3\nWorld Level: %4\nAchievement Count: %5\nSpiral Abyss - Floor: %6\nSpiral Abyss - Level: %7\n\nPublic Character List:\n%8\nReply with the character number to see detailed information."
    }
};

const fetchPlayerInfo = async (uid) => {
    const url = `https://enka.network/api/uid/${uid}?info`;

    try {
        const { data } = await axios.get(url);

        if (data.playerInfo) {
            const playerInfo = data.playerInfo;
            const nickname = playerInfo.nickname || "N/A";
            const level = playerInfo.level || "N/A";
            const signature = playerInfo.signature || "N/A";
            const worldLevel = playerInfo.worldLevel || "N/A";
            const finishAchievementNum = playerInfo.finishAchievementNum || "N/A";
            const towerFloorIndex = playerInfo.towerFloorIndex || "N/A";
            const towerLevelIndex = playerInfo.towerLevelIndex || "N/A";

            return { nickname, level, signature, worldLevel, finishAchievementNum, towerFloorIndex, towerLevelIndex };
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching player info:", error);
        return null;
    }
};

const fetchCharacterInfo = async (uid) => {
    const url = `https://genshin.aspirine.su/#uid${uid}`;

    try {
        const { data } = await axios.get(url);
        console.log("HTML loaded successfully");

        const $ = cheerio.load(data);

        const hiddenInfo = $("p:contains('There is no character in Showcase or details are hidden.')").text();
        if (hiddenInfo) {
            console.log("Character information is hidden");
            return { hidden: true };
        }

        console.log("Parsing character list...");
        const characters = [];
        $('.char-list .item').each((i, element) => {
            console.log(`Processing character ${i + 1}...`);
            const name = $(element).find('.name-title .title').text().trim();
            const level = $(element).find('.name-title .level').text().trim().split(' ')[0];
            console.log(`Found character: ${name}, Level: ${level}`);
            characters.push({ name, level });
        });

        console.log("Characters found:", characters);

        return { hidden: false, characters };
    } catch (error) {
        console.error("Error fetching character info:", error);
        return null;
    }
};

module.exports.run = async ({ api, event, args, getText }) => {
    const uid = args[0];
    if (!uid) {
        return api.sendMessage("Please provide a UID.", event.threadID, event.messageID);
    }

    api.sendMessage(getText("fetching", uid), event.threadID, event.messageID);

    const playerInfo = await fetchPlayerInfo(uid);
    if (!playerInfo) {
        return api.sendMessage(getText("playerNotFound", uid), event.threadID, event.messageID);
    }

    const characterInfo = await fetchCharacterInfo(uid);

    const { nickname, level, signature, worldLevel, finishAchievementNum, towerFloorIndex, towerLevelIndex } = playerInfo;
    let characterList = "";

    if (characterInfo.hidden) {
        characterList = getText("characterHidden");
    } else if (characterInfo.characters.length > 0) {
        characterInfo.characters.forEach((char, index) => {
            characterList += `${index + 1}: ${char.name} | Level ${char.level}\n`;
        });
    }

    console.log("Final character list:", characterList);

    const message = getText("playerInfo", nickname, level, signature, worldLevel, finishAchievementNum, towerFloorIndex, towerLevelIndex, characterList);

    api.sendMessage(message, event.threadID, (err, info) => {
        if (err) return console.error(err);

        if (characterInfo && !characterInfo.hidden && characterInfo.characters.length > 0) {
            global.client.handleReply.push({
                type: 'characterDetail',
                name: this.config.name,
                messageID: info.messageID,
                author: event.senderID,
                uid,
                characters: characterInfo.characters
            });
        }
    }, event.messageID);
};

module.exports.handleReply = async ({ api, event, handleReply, getText }) => {
    if (handleReply.author !== event.senderID) return;

    const characterIndex = parseInt(event.body) - 1;
    if (isNaN(characterIndex) || characterIndex < 0 || characterIndex >= handleReply.characters.length) {
        return api.sendMessage("Invalid character number.", event.threadID, event.messageID);
    }

    const character = handleReply.characters[characterIndex];
    const characterName = character.name.split(' ').slice(-1)[0];  // Get the last word of the character name (to handle cases like "Kamisato Ayaka")

    const characterDetail = await fetchCharacterDetail(handleReply.uid, characterName);
    if (!characterDetail) {
        return api.sendMessage("Failed to fetch character details.", event.threadID, event.messageID);
    }

    api.sendMessage({
        body: `Character Details for ${character.name}:`,
        attachment: characterDetail.imageUrl
    }, event.threadID, event.messageID);
};
