const axios = require("axios"); // Thư viện HTTP
const fs = require("fs"); // Quản lý file
const path = require("path"); // Quản lý đường dẫn file

module.exports.config = {
  name: "infobaihat",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "RukaChan",
  description: "Lấy thông tin bài hát từ iTunes",
  commandCategory: "Công cụ",
  usages: "[Tên bài hát]",
  cooldowns: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  if (args.length === 0) {
    return api.sendMessage(
      "Vui lòng nhập tên bài hát.\nVí dụ: #infobaihat Anh Mệt Rồi",
      threadID,
      messageID
    );
  }

  const query = args.join(" ");
  const apiURL = `https://api.popcat.xyz/itunes?q=${encodeURIComponent(query)}`;

  try {
    const response = await axios.get(apiURL);
    const data = response.data;

    if (!data || !data.name) {
      return api.sendMessage(
        `Không tìm thấy thông tin bài hát nào phù hợp với từ khóa: "${query}".`,
        threadID,
        messageID
      );
    }

    const thumbnailPath = path.resolve(__dirname, `./cache/${Date.now()}_thumbnail.jpg`);
    const thumbnailResponse = await axios.get(data.thumbnail, { responseType: "arraybuffer" });
    fs.writeFileSync(thumbnailPath, Buffer.from(thumbnailResponse.data, "binary"));

    const message = `
🎵 Thông tin bài hát:
-Tên bài hát: ${data.name}
-Ca sĩ: ${data.artist}
-Album: ${data.album}
-Ngày tải lên Album: ${data.release_date}
-Thời lượng: ${data.length}
-Thể loại: ${data.genre}
-Nghe tại đây: ${data.url}
`;

    api.sendMessage(
      {
        body: message,
        attachment: fs.createReadStream(thumbnailPath),
      },
      threadID,
      () => {
        fs.unlinkSync(thumbnailPath);
      },
      messageID
    );
  } catch (error) {}
};
