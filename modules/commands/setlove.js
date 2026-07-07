module.exports.config = {
    name: "setlove",
    version: "1.1.0",
    hasPermssion: 0,
    credits: "RukaChan",
    description: "Set love with someone",
    commandCategory: "Trò Chơi",
    usages: "#setlove set @tag | #setlove check | #setlove huy | #setlove suaanh | #setlove list",
    cooldowns: 5,
    dependencies: {
        "fs-extra": "",
        "axios": ""
    }
};

const fs = global.nodemodule["fs-extra"];
const axios = global.nodemodule["axios"];
const path = require("path");
const dataPath = path.resolve(__dirname, 'data', 'setlove.json');
const imagesPath = path.resolve(__dirname, 'data', 'setlove');

module.exports.onLoad = () => {
    if (!fs.existsSync(dataPath)) {
        fs.ensureFileSync(dataPath);
        fs.writeJsonSync(dataPath, []);
    }
    if (!fs.existsSync(imagesPath)) {
        fs.mkdirSync(imagesPath);
    }
};

module.exports.run = async function ({ event, api, args }) {
    const { threadID, messageID, senderID, mentions } = event;
    const loveData = fs.readJsonSync(dataPath);

    const command = args[0];
    const checkAdmin = () => global.config.ADMINBOT.includes(senderID);
    if (command === "list") {
        (async () => {
            if (!checkAdmin()) {
                return api.sendMessage("𝐁𝐚̣𝐧 𝐤𝐡𝐨̂𝐧𝐠 𝐜𝐨́ 𝐪𝐮𝐲𝐞̂̀𝐧!!!", threadID, messageID);
            }
    
            if (loveData.length === 0) {
                return api.sendMessage("𝐇𝐞̣̂ 𝐭𝐡𝐨̂𝐧𝐠 𝐜𝐡𝐮̛𝐚 𝐜𝐨́ 𝐜𝐚̣̆𝐩 𝐒𝐞𝐭𝐋𝐨𝐯𝐞 𝐧𝐚̀𝐨.💔", threadID, messageID);
            }
    
            let response = "💖 𝐃𝐚𝐧𝐡 𝐬𝐚́𝐜𝐡 𝐒𝐞𝐭𝐋𝐨𝐯𝐞 💖\n";
            const now = new Date();
    
            for (let i = 0; i < loveData.length; i++) {
                const rel = loveData[i];
    
                const userInfo1 = await api.getUserInfo(rel.person1);
                const userInfo2 = await api.getUserInfo(rel.person2);
    
                const name1 = userInfo1[rel.person1]?.name || "Không rõ";
                const name2 = userInfo2[rel.person2]?.name || "Không rõ";
    
                const date = new Date(rel.date);
                const duration = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
                response += `\n${i + 1}. ${name1} ❤️ ${name2}\n- UID 1: ${rel.person1}\n- UID 2: ${rel.person2}\n- Ngày SetLove: ${date.toLocaleDateString()}\n- Đã được: ${duration} ngày.`;
            }
    
            response += "\n\n👉 Hãy reply số thứ tự cặp SetLove để xóa.";
            return api.sendMessage(response, threadID, (error, info) => {
                global.client.handleReply.push({
                    name: this.config.name,
                    messageID: info.messageID,
                    author: senderID,
                    type: "deleteSetLove"
                });
            }, messageID);
        })();
    }    
    else if (command === "set") {
        if (Object.keys(mentions).length === 0) {
            return api.sendMessage("𝐕𝐮𝐢 𝐥𝐨̀𝐧𝐠 𝐭𝐚𝐠 𝐦𝐨̣̂𝐭 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐝𝐞̂̉ 𝐬𝐞𝐭𝐥𝐨𝐯𝐞😽", threadID, messageID);
        }

        const taggedUserID = Object.keys(mentions)[0];
        const taggedUserName = mentions[taggedUserID];

        const existingRelationship = loveData.find(relationship =>
            relationship.person1 === senderID || relationship.person2 === senderID ||
            relationship.person1 === taggedUserID || relationship.person2 === taggedUserID
        );

        if (existingRelationship) {
            const existingPartnerID = existingRelationship.person1 === senderID ? existingRelationship.person2 : existingRelationship.person1;
            const existingPartnerName = (await api.getUserInfo(existingPartnerID))[existingPartnerID].name;

            if (existingRelationship.person1 === senderID || existingRelationship.person2 === senderID) {
                return api.sendMessage(`𝐓𝐫𝐨𝐧𝐠 𝐦𝐨̣̂𝐭 𝐦𝐨̂́𝐢 𝐭𝐢̀𝐧𝐡 𝐤𝐡𝐨̂𝐧𝐠 𝐝𝐮̛𝐨̛̣𝐜 𝐜𝐨́ 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐭𝐡𝐮̛́ 𝟑😾`, threadID, messageID);
            } else {
                return api.sendMessage(`𝐁𝐚̣𝐧 𝐤𝐡𝐨̂𝐧𝐠 𝐭𝐡𝐞̂̉ 𝐜𝐮̛𝐨̛́𝐩 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐭𝐡𝐮̛𝐨̛𝐧𝐠 𝐜𝐮̉𝐚 ${existingPartnerName}😾`, threadID, messageID);
            }
        }

        api.sendMessage({
            body: `${taggedUserName}, 𝐛𝐚̣𝐧 𝐜𝐨́ 𝐜𝐡𝐚̂́𝐩 𝐧𝐡𝐚̣̂𝐧 𝐲𝐞̂𝐮 𝐜𝐚̂̀𝐮 𝐬𝐞𝐭 𝐥𝐨𝐯𝐞 𝐤𝐡𝐨̂𝐧𝐠?😻\n𝐇𝐚̃𝐲 𝐭𝐡𝐚̉ 𝐜𝐚̉𝐦 𝐱𝐮́𝐜 𝐯𝐚̀𝐨 𝐭𝐢𝐧 𝐧𝐡𝐚̆́𝐧 𝐧𝐚̀𝐲 𝐝𝐞̂̉ 𝐜𝐡𝐚̂́𝐩 𝐧𝐡𝐚̣̂𝐧!❤️`,
            mentions: [{
                tag: taggedUserName,
                id: taggedUserID
            }]
        }, threadID, (error, info) => {
            global.client.handleReaction.push({
                name: this.config.name,
                messageID: info.messageID,
                author: senderID,
                taggedUserID: taggedUserID,
                taggedUserName: taggedUserName,
                type: "accept"
            });
        }, messageID);
    } else if (command === "check") {
        const relationship = loveData.find(rel =>
            rel.person1 === senderID || rel.person2 === senderID
        );

        if (relationship) {
            const partnerID = relationship.person1 === senderID ? relationship.person2 : relationship.person1;
            const partnerName = (await api.getUserInfo(partnerID))[partnerID].name;
            const setloveDate = new Date(relationship.date);
            const now = new Date();
            const duration = Math.floor((now - setloveDate) / (1000 * 60 * 60 * 24));
            const person1ImagePath = path.resolve(imagesPath, `${relationship.person1}.jpg`);
            const person2ImagePath = path.resolve(imagesPath, `${relationship.person2}.jpg`);
            const attachments = [];

            if (fs.existsSync(person1ImagePath)) {
                attachments.push(fs.createReadStream(person1ImagePath));
            }
            if (fs.existsSync(person2ImagePath)) {
                attachments.push(fs.createReadStream(person2ImagePath));
            }

            api.sendMessage({
                body: `💕-𝐁𝐚̣𝐧 𝐝𝐚̃ 𝐬𝐞𝐭𝐥𝐨𝐯𝐞 𝐯𝐨̛́𝐢: ${partnerName}\n📅-𝐕𝐚̀𝐨 𝐧𝐠𝐚̀𝐲: ${setloveDate.toLocaleDateString()}\n🕐-𝐋𝐮́𝐜: ${setloveDate.toLocaleTimeString()}.\n💝-𝐃𝐚̃ 𝐝𝐮̛𝐨̛̣𝐜 ${duration} 𝐧𝐠𝐚̀𝐲.`,
                attachment: attachments
            }, threadID, messageID);
        } else {
            api.sendMessage("𝐁𝐚̣𝐧 𝐥𝐚̀𝐦 𝐠𝐢̀ 𝐜𝐨́ 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐲𝐞̂𝐮 𝐦𝐚̀ 𝐜𝐡𝐞𝐜𝐤😼", threadID, messageID);
        }
    } else if (command === "huy") {
        const relationship = loveData.find(rel =>
            rel.person1 === senderID || rel.person2 === senderID
        );

        if (!relationship) {
            return api.sendMessage("𝐁𝐚̣𝐧 𝐥𝐚̀𝐦 𝐠𝐢̀ 𝐜𝐨́ 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐲𝐞̂𝐮 𝐦𝐚̀ 𝐡𝐮̉𝐲😼", threadID, messageID);
        }

        const partnerID = relationship.person1 === senderID ? relationship.person2 : relationship.person1;
        const partnerName = (await api.getUserInfo(partnerID))[partnerID].name;

        api.sendMessage({
            body: `${partnerName}, 𝐛𝐚̣𝐧 𝐜𝐨́ 𝐝𝐨̂̀𝐧𝐠 𝐲́ 𝐡𝐮̉𝐲 𝐬𝐞𝐭 𝐥𝐨𝐯𝐞 𝐤𝐡𝐨̂𝐧𝐠?😿\n𝐇𝐚̃𝐲 𝐭𝐡𝐚̉ 𝐜𝐚̉𝐦 𝐱𝐮́𝐜 𝐯𝐚̀𝐨 𝐭𝐢𝐧 𝐧𝐡𝐚̆́𝐧 𝐧𝐚̀𝐲 𝐝𝐞̂̉ 𝐝𝐨̂̀𝐧𝐠 𝐲́.❤️‍🩹`,
            mentions: [{
                tag: partnerName,
                id: partnerID
            }]
        }, threadID, (error, info) => {
            global.client.handleReaction.push({
                name: this.config.name,
                messageID: info.messageID,
                author: senderID,
                partnerID: partnerID,
                partnerName: partnerName,
                type: "cancel"
            });
        }, messageID);
    } else if (command === "suaanh") {
        const relationship = loveData.find(rel =>
            rel.person1 === senderID || rel.person2 === senderID
        );

        if (!relationship) {
            return api.sendMessage("𝐁𝐚̣𝐧 𝐥𝐚̀𝐦 𝐠𝐢̀ 𝐜𝐨́ 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐲𝐞̂𝐮 𝐝𝐚̂𝐮 𝐦𝐚̀ 𝐝𝐨̀𝐢 𝐬𝐮̛̉𝐚 𝐚̉𝐧𝐡😼", threadID, messageID);
        }

        api.sendMessage("𝐇𝐚̃𝐲 𝐫𝐞𝐩𝐥𝐲 𝐭𝐢𝐧 𝐧𝐡𝐚̆́𝐧 𝐧𝐚̀𝐲 𝐯𝐨̛́𝐢 𝐡𝐢̀𝐧𝐡 𝐚̉𝐧𝐡 𝐛𝐚̣𝐧 𝐦𝐮𝐨̂́𝐧 𝐭𝐡𝐚𝐲 𝐝𝐨̂̉𝐢.💌", threadID, (error, info) => {
            global.client.handleReply.push({
                name: this.config.name,
                messageID: info.messageID,
                author: senderID,
                type: "updateImage"
            });
        }, messageID);
    } else {
        api.sendMessage(">>>𝐒𝐄𝐓𝐋𝐎𝐕𝐄<<<\n𝐇𝐮̛𝐨̛́𝐧𝐠 𝐝𝐚̂̃𝐧 𝐬𝐮̛̉ 𝐝𝐮̣𝐧𝐠!\n-> #𝐬𝐞𝐭𝐥𝐨𝐯𝐞 𝐬𝐞𝐭 @𝐭𝐚𝐠 𝐝𝐞̂̉ 𝐬𝐞𝐭 𝐥𝐨𝐯𝐞\n-> #𝐬𝐞𝐭𝐥𝐨𝐯𝐞 𝐜𝐡𝐞𝐜𝐤 𝐝𝐞̂̉ 𝐤𝐢𝐞̂̉𝐦 𝐭𝐫𝐚 𝐬𝐞𝐭𝐥𝐨𝐯𝐞\n-> #𝐬𝐞𝐭𝐥𝐨𝐯𝐞 𝐡𝐮𝐲 𝐝𝐞̂̉ 𝐡𝐮̉𝐲 𝐬𝐞𝐭𝐥𝐨𝐯𝐞\n-> #𝐬𝐞𝐭𝐥𝐨𝐯𝐞 𝐬𝐮𝐚𝐚𝐧𝐡 𝐝𝐞̂̉ 𝐬𝐮̛̉𝐚 𝐚̉𝐧𝐡.", threadID, messageID);
    }
};

module.exports.handleReaction = async ({ api, event, handleReaction }) => {
    const { threadID, messageID } = event;

    if (handleReaction.type === "accept") {
        if (event.userID !== handleReaction.taggedUserID) return;

        const loveData = fs.readJsonSync(dataPath);
        loveData.push({
            person1: handleReaction.author,
            person2: handleReaction.taggedUserID,
            date: new Date().toISOString()
        });
        fs.writeJsonSync(dataPath, loveData);

        api.sendMessage({
            body: `𝐂𝐡𝐮́𝐜 𝐦𝐮̛̀𝐧𝐠 ${handleReaction.taggedUserName} 𝐯𝐚̀ 𝐛𝐚̣𝐧 𝐝𝐚̃ 𝐬𝐞𝐭𝐥𝐨𝐯𝐞 𝐭𝐡𝐚̀𝐧𝐡 𝐜𝐨̂𝐧𝐠!😻\n𝐂𝐡𝐮́𝐜 𝐡𝐚𝐢 𝐛𝐚̣𝐧 𝐡𝐚̣𝐧𝐡 𝐩𝐡𝐮́𝐜 𝐯𝐚̀ 𝐜𝐨́ 𝐧𝐡𝐮̛̃𝐧𝐠 𝐩𝐡𝐮́𝐭 𝐠𝐢𝐚̂𝐲 𝐭𝐮𝐲𝐞̣̂𝐭 𝐯𝐨̛̀𝐢 𝐤𝐡𝐢 𝐨̛̉ 𝐛𝐞̂𝐧 𝐧𝐡𝐚𝐮.❤️\n𝐇𝐚̃𝐲 𝐫𝐞𝐩𝐥𝐲 𝐭𝐢𝐧 𝐧𝐡𝐚̆́𝐧 𝐧𝐚̀𝐲 𝐯𝐨̛́𝐢 𝐡𝐢̀𝐧𝐡 𝐚̉𝐧𝐡 𝐜𝐮̉𝐚 𝐦𝐨̂̃𝐢 𝐧𝐠𝐮̛𝐨̛̀𝐢.💭`,
            mentions: [{
                tag: handleReaction.taggedUserName,
                id: handleReaction.taggedUserID
            }]
        }, threadID, (error, info) => {
            global.client.handleReply.push({
                name: this.config.name,
                messageID: info.messageID,
                author: handleReaction.author,
                partnerID: handleReaction.taggedUserID,
                type: "imageRequest"
            });
        }, messageID);
    } else if (handleReaction.type === "cancel") {
        if (event.userID !== handleReaction.partnerID) return;

        const loveData = fs.readJsonSync(dataPath);
        const newLoveData = loveData.filter(rel =>
            !(rel.person1 === handleReaction.author && rel.person2 === handleReaction.partnerID) &&
            !(rel.person1 === handleReaction.partnerID && rel.person2 === handleReaction.author)
        );
        fs.writeJsonSync(dataPath, newLoveData);

        const imagePaths = [
            path.resolve(imagesPath, `${handleReaction.author}.jpg`),
            path.resolve(imagesPath, `${handleReaction.partnerID}.jpg`)
        ];
        imagePaths.forEach(imagePath => {
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        });

        api.sendMessage({
            body: `𝐁𝐚̣𝐧 𝐯𝐚̀ ${handleReaction.partnerName} 𝐝𝐚̃ 𝐡𝐮̉𝐲 𝐬𝐞𝐭𝐥𝐨𝐯𝐞.😿 𝐂𝐡𝐮́𝐜 𝐡𝐚𝐢 𝐛𝐚̣𝐧 𝐬𝐨̛́𝐦 𝐭𝐢̀𝐦 𝐝𝐮̛𝐨̛̣𝐜 𝐡𝐚̣𝐧𝐡 𝐩𝐡𝐮́𝐜 𝐦𝐨̛́𝐢!❤️‍🩹`,
            mentions: [{
                tag: handleReaction.partnerName,
                id: handleReaction.partnerID
            }]
        }, threadID, messageID);
    }
};

module.exports.handleReply = async ({ api, event, handleReply }) => {
    const { threadID, messageID, senderID, body, attachments } = event;

    // Xử lý yêu cầu gửi ảnh (imageRequest, updateImage)
    if (handleReply.type === "imageRequest" || handleReply.type === "updateImage") {
        if (attachments.length === 0 || attachments[0].type !== 'photo') {
            return api.sendMessage("𝐕𝐮𝐢 𝐥𝐨̀𝐧𝐠 𝐠𝐮̛̉𝐢 𝐦𝐨̣̂𝐭 𝐡𝐢̀𝐧𝐡 𝐚̉𝐧𝐡.💌", threadID, messageID);
        }

        const imageStream = await axios({
            url: attachments[0].url,
            responseType: 'stream'
        });

        const imagePath = path.resolve(imagesPath, `${senderID}.jpg`);
        const writer = fs.createWriteStream(imagePath);
        imageStream.data.pipe(writer);

        writer.on('finish', () => {
            api.sendMessage("𝐋𝐮̛𝐮 𝐚̉𝐧𝐡 𝐭𝐡𝐚̀𝐧𝐡 𝐜𝐨̂𝐧𝐠!💌", threadID, messageID);

            if (handleReply.type === "imageRequest") {
                const otherPersonID = senderID === handleReply.author ? handleReply.partnerID : handleReply.author;
                const otherPersonImagePath = path.resolve(imagesPath, `${otherPersonID}.jpg`);
                if (!fs.existsSync(otherPersonImagePath)) {
                    return api.sendMessage("𝐃𝐚̃ 𝐥𝐮̛𝐮 𝐚̉𝐧𝐡 𝐜𝐮̉𝐚 𝐛𝐚̣𝐧, 𝐯𝐮𝐢 𝐥𝐨̀𝐧𝐠 𝐜𝐡𝐨̛̀ 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐤𝐢𝐚 𝐠𝐮̛̉𝐢 𝐚̉𝐧𝐡 𝐜𝐮̉𝐚 𝐡𝐨̣!💌", threadID, messageID);
                } else {
                    api.sendMessage("𝐀̉𝐧𝐡 𝐜𝐮̉𝐚 𝟐 𝐛𝐚̣𝐧 𝐝𝐚̃ 𝐝𝐮̛𝐨̛̣𝐜 𝐥𝐮̛𝐮!💌", threadID, messageID);
                }
            }
        });

        writer.on('error', error => {
            console.error(error);
            api.sendMessage("𝐃𝐚̃ 𝐱𝐚̉𝐲 𝐫𝐚 𝐥𝐨̂̃𝐢 𝐤𝐡𝐢 𝐥𝐮̛𝐮 𝐚̉𝐧𝐡 𝐜𝐮̉𝐚 𝐛𝐚̣𝐧. 𝐕𝐮𝐢 𝐥𝐨̀𝐧𝐠 𝐭𝐡𝐮̛̉ 𝐥𝐚̣𝐢.💌", threadID, messageID);
        });
    }

    // Xử lý xóa cặp SetLove
    if (handleReply.type === "deleteSetLove") {
        if (handleReply.author !== senderID) {
            return api.sendMessage("𝐁𝐚̣𝐧 𝐤𝐡𝐨̂𝐧𝐠 𝐜𝐨́ 𝐪𝐮𝐲𝐞̂̀𝐧.💔", threadID, messageID);
        }

        const loveData = fs.readJsonSync(dataPath);

        const indexesToDelete = body
            .split(',')
            .map(num => parseInt(num.trim()))
            .filter(num => !isNaN(num) && num > 0 && num <= loveData.length);

        if (indexesToDelete.length === 0) {
            return api.sendMessage("𝐇𝐚̃𝐲 𝐧𝐡𝐚̣̂𝐩 𝐬𝐨̂́ 𝐭𝐡𝐮̛́ 𝐭𝐮̛̣ 𝐡𝐨̛̣𝐩 𝐥𝐞̣̂ đ𝐞̂̉ 𝐱𝐨́𝐚.💔", threadID, messageID);
        }

        const deletedPairs = [];
        const imagePathsToDelete = [];

        indexesToDelete
            .sort((a, b) => b - a)
            .forEach(index => {
                const pair = loveData[index - 1];
                if (pair) {
                    deletedPairs.push(pair);
                    loveData.splice(index - 1, 1);
                    imagePathsToDelete.push(
                        path.resolve(imagesPath, `${pair.person1}.jpg`),
                        path.resolve(imagesPath, `${pair.person2}.jpg`)
                    );
                }
            });

        imagePathsToDelete.forEach(imagePath => {
            if (fs.existsSync(imagePath)) {
                try {
                    fs.unlinkSync(imagePath);
                } catch (error) {
                    console.error(`Không thể xóa file: ${imagePath}`, error);
                }
            }
        });

        fs.writeJsonSync(dataPath, loveData);

        if (deletedPairs.length === 0) {
            return api.sendMessage("❌ Không có cặp nào được xóa. Vui lòng kiểm tra lại số thứ tự.", threadID, messageID);
        }

        const deletedMessage = deletedPairs
            .map((pair, index) => {
                const name1 = pair.person1 || "Không rõ";
                const name2 = pair.person2 || "Không rõ";

                return `💔 ${index + 1}. ${name1} ❤️ ${name2}`;
            })
            .join("\n");

        return api.sendMessage(`✅ 𝐂𝐚́𝐜 𝐜𝐚̣̆𝐩 𝐒𝐞𝐭𝐋𝐨𝐯𝐞 𝐬𝐚𝐮 đ𝐚̃ 𝐛𝐢̣ 𝐱𝐨́𝐚:\n\n${deletedMessage}`, threadID, messageID);
    }
};
