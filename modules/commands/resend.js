module.exports.config = {
    name: "resend",
    version: "2.0.0",
    hasPermssion: 1,
    credits: "Thọ, ManhG Fix Ver > 1.2.13",
    description: "Gửi lại tin nhắn bị gỡ",
    commandCategory: "Tiện ích",
    usages: "",
    cooldowns: 0,
    hide: true,
    dependencies: {
      "request": "",
      "fs-extra": "",
      "axios": ""
    }
  };
  
  module.exports.handleEvent = async function ({ event, api, client, Users }) {
    const request = global.nodemodule["request"];
    const axios = global.nodemodule["axios"]
    const { writeFileSync, createReadStream } = global.nodemodule["fs-extra"];
  
    let { messageID, senderID, threadID, body: content } = event;
    if (!global.logMessage) global.logMessage = new Map();
    if (!global.data.botID) global.data.botID = global.data.botID;
  
    const thread = global.data.threadData.get(threadID) || {};
  
    if (typeof thread["resend"] != "undefined" && thread["resend"] == true) return;
    if (senderID == global.data.botID) return;
  
    if (event.type != "message_unsend") global.logMessage.set(messageID, {
      msgBody: content,
      attachment: event.attachments
    })
    if (typeof thread["resend"] != "undefined" && thread["resend"] == true | event.type == "message_unsend") {
      var getMsg = global.logMessage.get(messageID);
      if (!getMsg) return;
      let name = await Users.getNameUser(senderID);
      if (getMsg.attachment[0] == undefined) return api.sendMessage(`>>>𝐆𝐎̛̃ 𝐓𝐈𝐍 𝐍𝐇𝐀̆́𝐍<<<\n\n𝐍𝐠𝐮̛𝐨̛̀𝐢 𝐝𝐮̀𝐧𝐠: ${name} \n𝐍𝐨̣̂𝐢 𝐃𝐮𝐧𝐠: ${getMsg.msgBody}\n\n𝐒𝐮̛̉ 𝐝𝐮̣𝐧𝐠 𝐥𝐞̣̂𝐧𝐡 #𝐫𝐞𝐬𝐞𝐧𝐝 𝐨𝐟𝐟 𝐝𝐞̂̉ 𝐭𝐚̆́𝐭 𝐭𝐢́𝐧𝐡 𝐧𝐚̆𝐧𝐠 𝐧𝐚̀𝐲`, threadID)
      else {
        let num = 0
        let msg = {
          body: `>>>𝐆𝐎̛̃ 𝐓𝐈𝐍 𝐍𝐇𝐀̆́𝐍<<<\n\n𝐍𝐠𝐮̛𝐨̛̀𝐢 𝐝𝐮̀𝐧𝐠: ${name}\n𝐕𝐮̛̀𝐚 𝐠𝐨̛̃ ${getMsg.attachment.length} 𝐭𝐞̣̂𝐩 𝐝𝐢́𝐧𝐡 𝐤𝐞̀𝐦\n${(getMsg.msgBody != "") ? `\n𝐍𝐨̣̂𝐢 𝐃𝐮𝐧𝐠: ${getMsg.msgBody}` : ""}\n𝐒𝐮̛̉ 𝐝𝐮̣𝐧𝐠 𝐥𝐞̣̂𝐧𝐡 #𝐫𝐞𝐬𝐞𝐧𝐝 𝐨𝐟𝐟 𝐝𝐞̂̉ 𝐭𝐚̆́𝐭 𝐭𝐢́𝐧𝐡 𝐧𝐚̆𝐧𝐠 𝐧𝐚̀𝐲`,
          attachment: [],
          mentions: { tag: name, id: senderID }
        }
        for (var i of getMsg.attachment) {
          num += 1;
          var getURL = await request.get(i.url);
          var pathname = getURL.uri.pathname;
          var ext = pathname.substring(pathname.lastIndexOf(".") + 1);
          var path = __dirname + `/cache/${num}.${ext}`;
          var data = (await axios.get(i.url, { responseType: 'arraybuffer' })).data;
          writeFileSync(path, Buffer.from(data, "utf-8"));
          msg.attachment.push(createReadStream(path));
        }
        api.sendMessage(msg, threadID);
      }
    }
  }
  
  module.exports.languages = {
    "vi": {
      "on": "[ 𝐑𝐄𝐒𝐄𝐍𝐃 ] - 𝐁𝐚̣̂𝐭",
      "off": "[ 𝐑𝐄𝐒𝐄𝐍𝐃 ] - 𝐓𝐚̆́𝐭",
      "successText": "𝐑𝐞𝐬𝐞𝐧𝐝 𝐭𝐡𝐚̀𝐧𝐡 𝐜𝐨̂𝐧𝐠😽",
    },
    "en": {
      "on": "on",
      "off": "off",
      "successText": "resend success!",
    }
  }
  
  module.exports.run = async function ({ api, event, Threads, getText }) {
    const { threadID, messageID } = event;
    let data = (await Threads.getData(threadID)).data;
  
    if (typeof data["resend"] == "undefined" || data["resend"] == false) data["resend"] = true;
    else data["resend"] = false;
  
    await Threads.setData(threadID, { data });
    global.data.threadData.set(threadID, data);
    return api.sendMessage(`${(data["resend"] == true) ? getText("off") : getText("on")} ${getText("successText")}`, threadID, messageID);
  }