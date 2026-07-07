const imgur = require("imgur");
const fs = require("fs");
const axios = require("axios");
const { downloadFile } = require("../../utils/index");
const { join } = require("path");

module.exports.config = {
  name: "geminiv1",
  version: "1.2.0",
  hasPermssion: 0,
  credits: "TatsuYTB",
  description: "Phân tích hình ảnh bằng AI",
  commandCategory: "AI",
  usages: "geminiv1 [reply]",
  cooldowns: 10
};

const getApiUrl = () => {
  try {
    const filePath = join(__dirname, 'data', 'api.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    const jsonData = JSON.parse(data);

    if (!jsonData.geminiv1 || jsonData.geminiv1.trim() === '') {
      console.error("API URL không có trong file api.json.");
      return null;
    }

    return jsonData.geminiv1;
  } catch (error) {
    console.error('Lỗi khi đọc API URL:', error);
    return null;
  }
};

const translateToVietnamese = async (text) => {
  const lang = "vi";
  const translateThis = encodeURIComponent(text);

  try {
    const response = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${translateThis}`);
    
    if (response.data && Array.isArray(response.data[0])) {
      return response.data[0][0][0];
    } else {
      throw new Error("Phản hồi dịch không hợp lệ.");
    }
  } catch (error) {
    throw new Error("Lỗi khi dịch văn bản: " + error.message);
  }
};

module.exports.run = async ({ api, event }) => {
  const { threadID, type, messageReply, messageID } = event;
  const ClientID = "f20bdcf02b2f89e";
  if (type !== "message_reply" || messageReply.attachments.length == 0) 
    return api.sendMessage("Bạn phải reply một ảnh nào đó", threadID, messageID);

  imgur.setClientId(ClientID);
  const attachmentSend = [];

  // Lấy các file đính kèm
  async function getAttachments(attachments) {
    let startFile = 0;
    for (const data of attachments) {
      const ext = data.type == "photo" ? "jpg" : "txt";
      const pathSave = __dirname + `/cache/${startFile}.${ext}`;
      ++startFile;
      const url = data.url;
      await downloadFile(url, pathSave);
      attachmentSend.push(pathSave);
    }
  }

  await getAttachments(messageReply.attachments);
  let Success = 0, Error = [];

  const getChatResponse = async (imageUrl) => {
    try {
      const apiUrl = getApiUrl();
      if (!apiUrl) {
        throw new Error("Không thể lấy URL API, vui lòng kiểm tra file api.json.");
      }
      
      const response = await axios.get(`${apiUrl}&url=${encodeURIComponent(imageUrl)}`);
      
      if (response.data && response.data.gemini) {
        return response.data.gemini;
      } else {
        throw new Error("Không tìm thấy kết quả phân tích từ API.");
      }
    } catch (error) {
      console.error('Lỗi khi lấy phản hồi từ AI:', error);
      throw error;
    }
  };

  // Xử lý ảnh và trả kết quả
  for (const getImage of attachmentSend) {
    try {
      const getLink = await imgur.uploadFile(getImage);  // Tải ảnh lên imgur
      const imgLink = getLink.link; 
      fs.unlinkSync(getImage);

      // Lấy mô tả từ API
      const description = await getChatResponse(imgLink);
      
      // Dịch mô tả sang tiếng Việt
      const translatedText = await translateToVietnamese(description);
      
      await api.sendMessage(translatedText, threadID, messageID);
      Success++;
    } catch (error) {
      Error.push(getImage);
      fs.unlinkSync(getImage);
      api.sendMessage(`Lỗi khi xử lý ảnh: ${error.message}`, threadID, messageID);
    }
  }
};
