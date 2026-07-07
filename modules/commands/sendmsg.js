module.exports.config = {
	name: "sendmsg",
	version: "1.0.7",
	hasPermssion: 3,
	credits: "TatsuYTB", 
	description: "Gửi tin nhắn đến nhóm bằng ID!",
	commandCategory: "Hệ Thống",
	usages: "ID [Text]",
	cooldowns: 5
};

	module.exports.run = async ({ api, event, args, getText, utils, Users }) => {
    const moment = require("moment-timezone");
      var gio = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:s || DD/MM/YYYY");
		var idbox = args[0];
		var reason = args.slice(1);
    let name = await Users.getNameUser(event.senderID)
		if (args.length == 0) api.sendMessage("𝐒𝐮̛̉ 𝐝𝐮̣𝐧𝐠 #𝐬𝐞𝐧𝐝𝐦𝐬𝐠 𝐈𝐃_𝐁𝐎𝐗 𝐍𝐨̣̂𝐢 𝐃𝐮𝐧𝐠", event.threadID, event.messageID);
	else 
	    if(reason == "")api.sendMessage("𝐒𝐮̛̉ 𝐝𝐮̣𝐧𝐠 #𝐬𝐞𝐧𝐝𝐦𝐬𝐠 𝐈𝐃_𝐁𝐎𝐗 𝐍𝐨̣̂𝐢 𝐃𝐮𝐧𝐠", event.threadID, event.messageID);
		if (event.type == "message_reply") {
			const request = global.nodemodule["request"];
			const fs = require('fs')
			const axios = require('axios')  
			var getURL = await request.get(event.messageReply.attachments[0].url);
			
					var pathname = getURL.uri.pathname;
			
					var ext = pathname.substring(pathname.lastIndexOf(".") + 1);
			
					var path = __dirname + `/cache/snoti`+`.${ext}`;
			
			
			var abc = event.messageReply.attachments[0].url;
				let getdata = (await axios.get(`${abc}`, { responseType: 'arraybuffer' })).data;
			
			  fs.writeFileSync(path, Buffer.from(getdata, 'utf-8'));	
	await api.sendMessage({body: `「 𝐀𝐃𝐌𝐈𝐍 𝐒𝐄𝐍𝐃 𝐍𝐎𝐓𝐈 𝐓𝐎 𝐘𝐎𝐔𝐑 𝐆𝐑𝐎𝐔𝐏 」\n➝ 𝐕𝐚̀𝐨 𝐋𝐮́𝐜: ${gio}\n➝ 𝐀𝐃𝐌𝐈𝐍: ${name}\n--------------- 𝐍𝐨̣̂𝐢 𝐃𝐮̀𝐧𝐠 ---------------\n` + reason.join(" "), attachment: fs.createReadStream(path) }, idbox, () =>
			api.sendMessage(`${api.getCurrentUserID()}`, () =>
				api.sendMessage("𝐃𝐚̃ 𝐠𝐮̛̉𝐢 𝐥𝐨̛̀𝐢 𝐧𝐡𝐚̆́𝐧!: " + reason.join(" "), event.threadID)));
} 
else {
		await api.sendMessage(`「 𝐀𝐃𝐌𝐈𝐍 𝐒𝐄𝐍𝐃 𝐍𝐎𝐓𝐈 𝐓𝐎 𝐘𝐎𝐔𝐑 𝐆𝐑𝐎𝐔𝐏 」\n➝ 𝐕𝐚̀𝐨 𝐋𝐮́𝐜: ${gio}\n➝ 𝐀𝐃𝐌𝐈𝐍: ${name}\n--------------- 𝐍𝐨̣̂𝐢 𝐃𝐮̀𝐧𝐠 ---------------\n` + reason.join(" "), idbox, () =>
			api.sendMessage(`${api.getCurrentUserID()}`, () =>
				api.sendMessage("𝐃𝐚̃ 𝐠𝐮̛̉𝐢 𝐥𝐨̛̀𝐢 𝐧𝐡𝐚̆́𝐧!: " + reason.join(" "), event.threadID)));

	}
}