const axios = require('axios');
const fs = require('fs');

module.exports.config = {
  name: "bangtuanhoan",
  version: "1.2.0",
  hasPermssion: 0,
  credits: "TatsuYTB",
  description: "Thông tin nguyên tố hóa học ngẫu nhiên",
  commandCategory: "Kiến Thức",
  cooldowns: 5
};

const downloadImage = async (url, path) => {
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });
  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(path);
    response.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
};

const translateText = async (text, targetLang = "vi") => {
  const translateAPI = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
  const response = await axios.get(translateAPI);
  if (response.data && response.data[0] && response.data[0][0]) {
    return response.data[0][0][0];
  }
};

module.exports.run = async function({ api, event, messageID }) {
  try {
    const response = await axios.get('https://api.popcat.xyz/periodic-table/random');
    const data = response.data;

    const name = data.name;
    const symbol = data.symbol;
    const atomicNumber = data.atomic_number;
    const atomicMass = data.atomic_mass;
    const period = data.period;
    const discoveredBy = data.discovered_by || "Không rõ";
    const image = data.image;
    let phase = data.phase || "Không xác định";
    let summary = data.summary || "Không có mô tả";

    const translatedPhase = await translateText(phase);
    const translatedSummary = await translateText(summary);
    const imagePath = `./tempImage_${Date.now()}.jpg`;
    await downloadImage(image, imagePath);
    const message = `
𝐓𝐡𝐨̂𝐧𝐠 𝐭𝐢𝐧 𝐧𝐠𝐮𝐲𝐞̂𝐧 𝐭𝐨̂́ 𝐡𝐨́𝐚 𝐡𝐨̣𝐜 𝐧𝐠𝐚̂̃𝐮 𝐧𝐡𝐢𝐞̂𝐧
-Tên: ${name}
-Ký hiệu: ${symbol}
-Số nguyên tử: ${atomicNumber}
-Khối lượng nguyên tử: ${atomicMass}
-Chu kỳ: ${period}
-Trạng thái: ${translatedPhase}
-Phát hiện bởi: ${discoveredBy}
-Mô tả: ${translatedSummary}
`;

    api.sendMessage(
      {
        body: message,
        attachment: fs.createReadStream(imagePath)
      },
      event.threadID,
      (error, info) => {
        if (error) {} else {}
        fs.unlink(imagePath, (err) => {});
      }
    );

  } catch (error) {}
};
