const axios = require('axios');
const path = require('path');
const fs = require('fs');
const limit = 6

function streamURL(url, type) {
  return axios.get(url, {
    responseType: 'arraybuffer'
  }).then(res => {
    const filePath = path.join(__dirname, `/cache/${Date.now()}.${type}`);
    fs.writeFileSync(filePath, res.data);
    setTimeout(() => fs.unlinkSync(filePath), 1000 * 60);
    return fs.createReadStream(filePath);
  });
}

module.exports = {
  config: {
    name: "tiksearch",
    aliases: ["tsearch"],
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Hà Mạnh Hùng",
    description: "Tìm kiếm video TikTok theo từ khóa và chọn video theo số thứ tự",
    commandCategory: "Tiện ích",
    usages: "Sử dụng: /tiksearch <từ khóa>",
    cooldowns: 5,
    images: [],
  },

  run: async ({ event, api, args }) => {
    try {
      if (!args[0]) {
        return api.sendMessage("Vui lòng nhập từ khóa để tìm kiếm video TikTok!", event.threadID, event.messageID);
      }

      const keyword = args.join(" ");
      const response = await axios.get(`https://api.hamanhhung.site/other/tiktoksearch?keyword=${keyword}&limit=${limit}`);
      const data = response.data.result;

      if (!data || !data.length) {
        return api.sendMessage("Không tìm thấy kết quả nào cho từ khóa.", event.threadID, event.messageID);
      }

      let message = `Kết quả tìm kiếm cho từ khóa "${keyword}":\n\n`;
      data.slice(0, limit).forEach((video, index) => {
        message += `${index + 1}. Tiêu đề: ${video.desc}\n`;
        message += `Lượt xem: ${video.stats.playCount}\n`;
        message += `Người đăng: ${video.author.nickname} (@${video.author.uniqueId})\n\n`;
      });
      message += "Vui lòng trả lời bằng số thứ tự của video bạn muốn chọn.";

      api.sendMessage(message, event.threadID, (err, info) => {
        if (err) return console.error(err);

        global.client.handleReply.push({
          name: module.exports.config.name,
          messageID: info.messageID,
          author: event.senderID,
          videos: data.slice(0, limit),
          originalMessageID: event.messageID
        });
      }, event.messageID);

    } catch (error) {
      console.error(error);
      api.sendMessage("Đã có lỗi xảy ra khi tìm kiếm video TikTok.", event.threadID, event.messageID);
    }
  },

  handleReply: async ({ event, api, handleReply }) => {
    try {
      const choice = parseInt(event.body);
      const selectedVideo = handleReply.videos[choice - 1];

      if (!selectedVideo) {
        return api.sendMessage("Số thứ tự không hợp lệ, vui lòng chọn lại!", event.threadID, event.messageID);
      }
      if (event.senderID !== handleReply.author) {
      api.sendMessage("Mày là thằng nào???", event.threadID, event.messageID); 
      return api.setMessageReaction("😕", event.messageID, () => {}, true);
  }

      const json = await infoPostTT(`https://www.tiktok.com/video/${selectedVideo.id}`);
      api.unsendMessage(handleReply.messageID);
      return api.sendMessage({
        body: `•👤 𝐓𝐞̂𝐧 𝐊𝐞̂𝐧𝐡: ${json.author.nickname}\n` +
              `•😽 𝐈𝐃 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐝𝐮̀𝐧𝐠: ${json.author.unique_id}\n` +
              `•🌐 𝐐𝐮𝐨̂́𝐜 𝐠𝐢𝐚: ${json.region}\n` +
              `•💬 𝐓𝐢𝐞̂𝐮 Đ𝐞̂̀: ${json.title}\n` +
              `•❤️ 𝗟𝘂̛𝗼̛̣𝘁 𝘁𝗶𝗺: ${json.digg_count}\n` +
              `•👁‍🗨 𝐋𝐮̛𝐨̛̣𝐭 𝐱𝐞𝐦: ${json.play_count}\n` +
              `•💭 𝐋𝐮̛𝐨̛̣𝐭 𝗯𝗶̀𝗻𝗵 𝗹𝘂𝗮̣̂𝗻: ${json.comment_count}\n` +
              `•🔗 𝗟𝘂̛𝗼̛̣𝘁 𝗰𝗵𝗶𝗮 𝘀𝗲̉: ${json.share_count}\n` +
              `•⏰ Thời gian: ${json.duration}s\n` +
              `•📥 𝗟𝘂̛𝗼̛̣𝘁 𝘁𝗮̉𝗶: ${json.download_count}\n` +
              `•𝗧𝗵ả "❤"𝗻𝗲̂́𝘂 𝗺𝘂𝗼̂́𝗻 𝘁𝗮̉𝗶 𝗻𝗵𝗮̣𝗰`,
        attachment: await streamURL(json.play, 'mp4')
      }, event.threadID, (error, info) => {
        global.client.handleReaction.push({
          name: module.exports.config.name,
          messageID: info.messageID,
          author: event.senderID,
          data: json
        });
      }, event.messageID);
    } catch (error) {
      console.error(error);
      api.sendMessage("Đã có lỗi xảy ra khi xử lý lựa chọn của bạn.", event.threadID, event.messageID);
    }
  },

  handleReaction: async function (o) {
    const { threadID: t, messageID: m, reaction: r } = o.event;
    const h = global.client.handleReaction.find(e => e.messageID == m);

    if (!h || r !== "❤") return;

    o.api.sendMessage({
      body: `
====『 MUSIC TIKTOK 』====
▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱
👤 𝐈𝐃: ${h.data.music_info.id}
💬 𝐓𝐢𝐞̂𝐮 Đ𝐞̂̀: ${h.data.music_info.title}
🔗 𝐋𝐢𝐧𝐤: ${h.data.music_info.play}
⏱️ 𝐓𝐡𝐨̛̀𝐢 𝐠𝐢𝐚𝐧: ${h.data.music_info.duration}
▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱`,
      attachment: await streamURL(h.data.music, "mp3")
    }, t, m);
  }
};

async function infoPostTT(url) {
  return axios({
    method: 'post',
    url: `https://tikwm.com/api/`,
    data: {
      url
    },
    headers: {
      'content-type': 'application/json'
    }
  }).then(res => res.data.data);
}