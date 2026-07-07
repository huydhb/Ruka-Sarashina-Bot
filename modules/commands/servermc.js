const axios = require('axios');

module.exports.config = {
  name: "servermc",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "RukaChan",
  description: "Kiểm tra trạng thái máy chủ Minecraft",
  commandCategory: "Tiện ích",
  usages: "[ip hoặc domain]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const ip = args[0];
  if (!ip) return api.sendMessage("❌ Vui lòng nhập IP hoặc domain của máy chủ Minecraft.", event.threadID, event.messageID);

  try {
    const res = await axios.get(`https://api.mcstatus.io/v2/status/java/${ip}`);
    const data = res.data;

    if (!data.online) return api.sendMessage(`⚠️ Máy chủ ${ip} hiện đang offline.`, event.threadID, event.messageID);

    const {
      host,
      port,
      ip_address,
      version,
      players,
      motd
    } = data;

    const playerNames = players.list?.map(p => p.name_clean) || [];
    let playerDisplay = "";
    if (playerNames.length > 50) {
      playerDisplay = playerNames.slice(0, 50).join(", ") + `\n...và ${playerNames.length - 50} người chơi khác.`;
    } else if (playerNames.length > 0) {
      playerDisplay = playerNames.join(", ");
    } else {
      playerDisplay = "Không có người chơi nào đang online.";
    }

    const message = 
`🌐 Trạng thái máy chủ Minecraft:
━━━━━━━━━━━━━━━
🟢 Trực tuyến: ${data.online ? "Có" : "Không"}
📌 Host: ${host}
📡 IP: ${ip_address}:${port}
🛠️ Phiên bản: ${version.name_clean}
💬 MOTD: ${motd.clean}
👥 Người chơi: ${players.online}/${players.max}
${players.online > 0 ? `🧍 Danh sách: ${playerDisplay}` : ""}
━━━━━━━━━━━━━━━`;

    return api.sendMessage(message, event.threadID, event.messageID);
  } catch (err) {
    console.error(err);
    return api.sendMessage("❌ Đã xảy ra lỗi khi lấy dữ liệu máy chủ. Hãy chắc chắn địa chỉ IP hợp lệ.", event.threadID, event.messageID);
  }
};