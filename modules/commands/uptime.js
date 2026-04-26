module.exports.config = {
  name: "uptime",
  version: "2.0.0",
  hasPermission: 0,
  credits: "Vtuan",
  Rent: 2,
  description: "Hiển thị thời gian hoạt động của bot",
  commandCategory: "Admin",
  usages: "",
  cooldowns: 5
};

module.exports.run = ({ event, api }) => {
  const uptime = process.uptime(); // Lấy thời gian hoạt động của bot (tính bằng giây)
  const uptimeHours = Math.floor(uptime / (60 * 60));
  const uptimeMinutes = Math.floor((uptime % (60 * 60)) / 60);
  const uptimeSeconds = Math.floor(uptime % 60);

  // Định dạng chuỗi thời gian hoạt động thành "HH:MM:SS"
  const uptimeString = `${uptimeHours.toString().padStart(2, '0')}:${uptimeMinutes.toString().padStart(2, '0')}:${uptimeSeconds.toString().padStart(2, '0')}`;

  const replyMsg = `Bot đã hoạt động được ${uptimeString}.`;

  // Gửi tin nhắn với đính kèm từ global.gaudev
  return api.sendMessage({
    body: replyMsg,
    attachment: global.gaudev.splice(0, 1)
  }, event.threadID, event.messageID);
};