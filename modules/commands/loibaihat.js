const axios = require('axios');
const fs = require('fs');
const path = require('path');
const request = require('request');

module.exports.config = {
    name: "loibaihat",
    version: "1.1.0",
    hasPermssion: 0,
    credits: "RukaChan",
    description: "Tìm lời bài hát kèm thông tin đầy đủ",
    commandCategory: "Tiện ích",
    usages: "[tên bài hát]",
    cooldowns: 5,
};

module.exports.run = async ({ api, event, args }) => {
    try {
        const songName = args.join(' ');
        if (!songName) {
            return api.sendMessage('Vui lòng nhập tên bài hát để tìm lời.', event.threadID, event.messageID);
        }

        const response = await axios.get(`https://api.popcat.xyz/v2/lyrics?song=${encodeURIComponent(songName)}`);
        const data = response.data;

        if (data.error || !data.message) {
            return api.sendMessage('Không tìm thấy thông tin bài hát.', event.threadID, event.messageID);
        }

        const { title, artist, lyrics, image, url } = data.message;

        const message = `🎵 Tên bài hát: ${title}\n👤 Ca sĩ: ${artist}\n🔗 Link nghe nhạc: ${url}\n\n📝 Lời bài hát:\n${lyrics}`;

        if (image) {
            const imagePath = path.resolve(__dirname, 'cache', 'loibaihat.jpg');
            await new Promise((resolve, reject) => {
                request(image)
                    .pipe(fs.createWriteStream(imagePath))
                    .on('close', resolve)
                    .on('error', reject);
            });

            const attachment = fs.createReadStream(imagePath);
            api.sendMessage({ body: message, attachment }, event.threadID, () => {
                fs.unlinkSync(imagePath);
            }, event.messageID);
        } else {
            api.sendMessage(message, event.threadID, event.messageID);
        }

    } catch (error) {
        console.error(error);
        api.sendMessage('Đã xảy ra lỗi khi tìm lời bài hát.', event.threadID, event.messageID);
    }
};
