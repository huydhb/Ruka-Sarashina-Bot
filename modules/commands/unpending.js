const fs = require('fs-extra');
const path = __dirname + '/disabledGroups.json';

module.exports.config = {
  name: "unpending",
  version: "1.0.0",
  credits: "Niiozic",
  hasPermssion: 2,
  description: "Hủy tạo database của box và ngừng bot nhận lệnh từ box đó",
  commandCategory: "Hệ Thống",
  usages: "",
  cooldowns: 5
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  const { body, threadID, messageID, senderID } = event;

  if (String(senderID) !== String(handleReply.author)) return;

  const index = parseInt(body);
  if (isNaN(index) || index <= 0 || index > handleReply.boxes.length) {
    return api.sendMessage(`→ ${body} không phải là một số hợp lệ`, threadID, messageID);
  }

  const box = handleReply.boxes[index - 1];

  let disabledGroups = [];
  if (fs.existsSync(path)) {
    disabledGroups = JSON.parse(fs.readFileSync(path));
  }

  if (!disabledGroups.includes(box.threadID)) {
    disabledGroups.push(box.threadID);
    fs.writeFileSync(path, JSON.stringify(disabledGroups, null, 2));
  }

  return api.sendMessage(`[ DISABLE BOX ] - Đã ngừng bot nhận lệnh từ box: ${box.name} (${box.threadID})`, threadID, messageID);
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;
  const commandName = this.config.name;

  // Tìm tất cả các box đang được khởi tạo database
  const listFiles = fs.readdirSync(__dirname + '/checktt/');
  const boxes = listFiles.map(file => {
    const data = JSON.parse(fs.readFileSync(__dirname + '/checktt/' + file));
    return {
      name: data.name || "Box không tên",
      threadID: file.replace('.json', '')
    };
  });

  if (boxes.length === 0) {
    return api.sendMessage("[ DISABLE BOX ] - Không có box nào đang được khởi tạo database", threadID, messageID);
  }

  let msg = "→ Danh sách các box đang được khởi tạo database:\n";
  boxes.forEach((box, index) => {
    msg += `${index + 1}. ${box.name} (${box.threadID})\n`;
  });

  api.sendMessage(`${msg}\nReply (phản hồi) với số thứ tự của box muốn ngừng bot nhận lệnh`, threadID, (error, info) => {
    if (error) return api.sendMessage("[ DISABLE BOX ] - Lỗi khi gửi danh sách box", threadID, messageID);
    global.client.handleReply.push({
      name: commandName,
      messageID: info.messageID,
      author: senderID,
      boxes: boxes
    });
  }, messageID);
};
