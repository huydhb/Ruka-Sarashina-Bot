const axios = require("axios");

module.exports.config = {
    name: "factcat",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "TatsuYTB",
    description: "Gửi một fact ngẫu nhiên về mèo và dịch sang tiếng Việt",
    commandCategory: "Tiện ích",
    usages: "!catfact",
    cooldowns: 5,
};

// Hàm dịch văn bản
const translateText = async (text, targetLang = 'vi') => {
    try {
        const response = await axios.get('https://translate.googleapis.com/translate_a/single', {
            params: {
                client: 'gtx',
                sl: 'auto',
                tl: targetLang,
                dt: 't',
                q: text,
            },
        });
        return response.data[0][0][0]; // Trích xuất văn bản dịch từ phản hồi
    } catch (error) {
        throw new Error("Không thể dịch văn bản");
    }
};

module.exports.run = async function ({ api, event }) {
    try {
        // Lấy fact về mèo từ API
        const response = await axios.get('https://random-api-pcoe.onrender.com/api/catfact');
        
        if (!response.data || !response.data.text) {
            throw new Error("Không thể lấy fact về mèo từ API.");
        }

        const fact = response.data.text;

        // Dịch fact sang tiếng Việt
        const translatedFact = await translateText(fact, 'vi');

        // Gửi fact đã dịch đến người dùng
        api.sendMessage(`Fact về mèo:\n${translatedFact}`, event.threadID, event.messageID);
    } catch (error) {
        // Thông báo lỗi nếu có
        api.sendMessage(`Có lỗi xảy ra: ${error.message}`, event.threadID, event.messageID);
    }
};
