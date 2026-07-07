module.exports.config = {
  name: "6mui",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Vtuan (modified by ChatGPT)",
  description: "Xem ảnh",
  commandCategory: "Random-img",
  usages: "",
  cooldowns: 20
};

module.exports.run = async ({ api, event }) => {
  const axios = require('axios');
  const fs = require("fs");
  const path = require("path");
  const girl = require('./../../img/mui.json');

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  let imagesToDownload = [];

  for (let i = 0; i < 4; i++) {
    let image = girl[Math.floor(Math.random() * girl.length)].trim();
    imagesToDownload.push(image);
  }

  async function downloadImages() {
    for (let i = 0; i < imagesToDownload.length; i++) {
      const url = imagesToDownload[i];
      const fileName = path.join(__dirname, `${i + 1}.png`);
      try {
        const response = await axios({
          method: 'get',
          url: url,
          responseType: 'stream',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
          }
        });

        await new Promise((resolve, reject) => {
          const writer = fs.createWriteStream(fileName);
          response.data.pipe(writer);
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        await delay(3000); // Tạm dừng 3 giây giữa mỗi lần tải

      } catch (error) {
        console.error(`Error downloading image ${i + 1}:`, error.message || error);
      }
    }

    sendImages();
  }

  function sendImages() {
    const attachments = [];
    for (let i = 1; i <= 4; i++) {
      const filePath = path.join(__dirname, `${i}.png`);
      if (fs.existsSync(filePath)) {
        attachments.push(fs.createReadStream(filePath));
      }
    }

    api.sendMessage({
      body: 'Six múi của bé đây:3',
      attachment: attachments
    }, event.threadID, () => {
      for (let i = 1; i <= 4; i++) {
        const filePath = path.join(__dirname, `${i}.png`);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }, event.messageID);
  }

  await downloadImages();
};
