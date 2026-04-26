const FormData = require('form-data');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: "4k",
    version: "1.2.9",
    hasPermssion: 0,
    credits: "Trịnh Đình Phát",
    description: "Làm nét hình ảnh",
    commandCategory: "Người dùng",
    usages: "[reply một hình ảnh]",
    usePrefix: true,
    cooldowns: 5,
    dependencies: {
        "form-data": "",
        "axios": "",
        "fs": "",
        "path": ""
    }
};

module.exports.run = async function ({ api, event }) {
    if (!event.messageReply || !event.messageReply.attachments) {
        return api.sendMessage("⚠️ Hình ảnh không hợp lệ, vui lòng phản hồi một ảnh nào đó", event.threadID, event.messageID);
    }

    const attachments = event.messageReply.attachments;
    if (attachments.length === 0) {
        return api.sendMessage("⚠️ Không có hình ảnh được phản hồi", event.threadID, event.messageID);
    }

    const imageAttachment = attachments[0];
    if (!imageAttachment.url) {
        return api.sendMessage("⚠️ Không tìm thấy đường dẫn hình ảnh", event.threadID, event.messageID);
    }

    try {
        const response = await axios.get(imageAttachment.url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');
        const filename = path.join(__dirname, 'cache', 'abc.jpg');
        fs.writeFileSync(filename, buffer);

        const form = new FormData();
        form.append('file', fs.createReadStream(filename));

        const headers = {
            ...form.getHeaders(),
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
            'Origin': 'https://taoanhdep.com',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36'
        };

        const response2 = await axios.post('https://taoanhdep.com/public/net-anh-nguoi-2.php', form, { headers });
        const imageUrl = response2.data;
        if (!imageUrl) {
            return api.sendMessage("⚠️ Không thể làm nét ảnh", event.threadID, event.messageID);
        }

        const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const outputFilename = path.join(__dirname, 'cache', 'xyz.jpg');
        fs.writeFileSync(outputFilename, imageResponse.data);

        api.sendMessage({
            body: 'Làm Nét Thành Công!',
            attachment: fs.createReadStream(outputFilename)
        }, event.threadID, () => {
            fs.unlinkSync(filename);
            fs.unlinkSync(outputFilename);
        }, event.messageID);
    } catch (error) {
        console.error(error);
        api.sendMessage("⚠️ Có lỗi xảy ra", event.threadID, event.messageID);
    }
};