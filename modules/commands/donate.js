const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: "donate",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "TatsuYTB",
  description: "Donate cho thằng admin nghèo khổ",
  commandCategory: "Tiện ích",
  usages: "donate",
  cooldowns: 5,
};

module.exports.handleEvent = async ({ event, api, Threads }) => {
  var { threadID, messageID, body } = event;

  function out(data, attachment = null) {
    api.sendMessage({ body: data, attachment: attachment }, threadID, messageID);
  }

  var dataThread = await Threads.getData(threadID);
  var data = dataThread.data;
  const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};

  var arr = ["donate"];
  arr.forEach(i => {
    let str = i[0].toUpperCase() + i.slice(1);
    if (body === i.toUpperCase() || body === i || str === body) {
      const imagePath = './modules/commands/donate';

      if (!fs.existsSync(imagePath)) {
        return out("Thư mục chứa ảnh không tồn tại.");
      }

      let attachments = [];
      try {
        fs.readdirSync(imagePath).forEach(file => {
          if (file.endsWith('.jpg') || file.endsWith('.png')) { // Chỉ lấy các tệp có định dạng .jpg hoặc .png
            attachments.push(fs.createReadStream(path.join(imagePath, file)));
          }
        });
      } catch (error) {
        return out("Đã xảy ra lỗi khi đọc thư mục chứa ảnh.");
      }

      if (attachments.length === 0) {
        return out("Không tìm thấy ảnh trong thư mục.");
      }

      let message = `---------------------\nBIDV: 8864922580\nNguyễn Tuấn Ninh\n---------------------\n𝐕𝐢𝐞𝐭𝐂𝐨𝐦𝐁𝐚𝐧𝐤: 1041959515\nNguyễn Tuấn Ninh\n---------------------`;

      if (data.PREFIX == null) {
        message = `𝐃𝐨𝐧𝐚𝐭𝐞 𝐜𝐡𝐨 𝐭𝐡𝐚̆̀𝐧𝐠 𝐚𝐝𝐦𝐢𝐧 𝐧𝐠𝐡𝐞̀𝐨 𝐤𝐡𝐨̂̉\n---------------------\n${message}`;
      } else {
        message += data.PREFIX;
      }

      return out(message, attachments);
    }
  });
};

module.exports.run = async ({ event, api }) => {};