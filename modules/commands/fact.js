module.exports.config = {
	name: "fact",
	version: "1.0.0",
	hasPermssion: 0,
	credits: "TatsuYTB",
	description: "random facts",
	commandCategory: "Tiện ích",
	cooldowns: 10
};

module.exports.run = async ({ api, event, args }) => {
	const axios = require('axios');
	const request = require('request');
	
	try {
		const res = await axios.get('https://api.popcat.xyz/fact');
		let fact = res.data.fact;

		const translateUrl = encodeURI(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=${fact}`);
		request(translateUrl, (err, response, body) => {
			if (err) return api.sendMessage("Đã có lỗi xảy ra!", event.threadID, event.messageID);
			
			var retrieve = JSON.parse(body);
			var translatedText = '';
			retrieve[0].forEach(item => {
				if (item[0]) translatedText += item[0];
			});
			
			api.sendMessage(`[ Bạn có biết? ]\n ${translatedText}`, event.threadID, event.messageID);
		});
	} catch (error) {
		api.sendMessage("Đã có lỗi xảy ra khi lấy dữ liệu từ API!", event.threadID, event.messageID);
	}
};
