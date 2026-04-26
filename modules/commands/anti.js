module.exports.config = {
  name: "anti",
  version: "4.1.5",
  hasPermssion: 1,
  credits: "BraSL",
  description: "Anti change Box chat vip pro",
  commandCategory: "Quản trị viên",
  usages: "anti dùng để bật tắt",
  cooldowns: 5,
  images: [],
  dependencies: {
    "fs-extra": "",
  },
};
const { readdirSync, readFileSync, writeFileSync, existsSync, unlinkSync } = require("fs-extra");
const path = require('path');
const fs = require('fs');
const axios = require('axios');
module.exports.handleReply = async function ({ api, event, args, handleReply, Threads }) {
  const { senderID, threadID, messageID, messageReply } = event;
  const { author, permssion } = handleReply;
  const Tm = (require('moment-timezone')).tz('Asia/Ho_Chi_Minh').format('HH:mm:ss || DD/MM/YYYY');
  const pathData = global.anti;
  const dataAnti = JSON.parse(readFileSync(pathData, "utf8"));

  if (author !== senderID) return api.sendMessage(`❎ Bạn không phải người dùng lệnh`, threadID);

  var number = event.args.filter(i => !isNaN(i))
  for (const num of number) {
    switch (num) {
      case "1": {
        if (permssion < 1)
          return api.sendMessage(
            "⚠️ Bạn không đủ quyền hạn để sử dụng lệnh này",
            threadID,
            messageID
          );
        var NameBox = dataAnti.boxname;
        const antiImage = NameBox.find(
          (item) => item.threadID === threadID
        );
        if (antiImage) {
          dataAnti.boxname = dataAnti.boxname.filter((item) => item.threadID !== threadID);
          api.sendMessage(
            "☑️ Tắt thành công chế độ anti đổi tên box ",
            threadID,
            messageID
          );
        } else {
          var threadName = (await api.getThreadInfo(event.threadID)).threadName;
          dataAnti.boxname.push({
            threadID,
            name: threadName
          })
          api.sendMessage(
            "☑️ Bật thành công chế độ anti đổi tên box",
            threadID,
            messageID
          );
        }
        writeFileSync(pathData, JSON.stringify(dataAnti, null, 4));
        break;
      }
      case "2": {
        if (permssion < 1)
          return api.sendMessage(
            "⚠️ Bạn không đủ quyền hạn để sử dụng lệnh này",
            threadID,
            messageID
          );
        const antiImage = dataAnti.boximage.find(
          (item) => item.threadID === threadID
        );
        if (antiImage) {
          dataAnti.boximage = dataAnti.boximage.filter((item) => item.threadID !== threadID);
          api.sendMessage(
            "☑️ Tắt thành công chế độ anti đổi ảnh box",
            threadID,
            messageID
          );
        } else {
          var threadInfo = await api.getThreadInfo(event.threadID);
          let url = threadInfo.imageSrc;
          let response = await global.utils.imgur(url);
          let img = response.link;
          dataAnti.boximage.push({
            threadID,
            url: img,
          });
          api.sendMessage("☑️ Bật thành công chế độ anti đổi ảnh box", threadID, messageID);
        }
        writeFileSync(pathData, JSON.stringify(dataAnti, null, 4));
        break;
      }
      case "3": {
        if (permssion < 1)
          return api.sendMessage(
            "⚠️ Bạn không đủ quyền hạn để sử dụng lệnh này",
            threadID,
            messageID
          );
        const NickName = dataAnti.antiNickname.find(
          (item) => item.threadID === threadID
        );

        if (NickName) {
          dataAnti.antiNickname = dataAnti.antiNickname.filter((item) => item.threadID !== threadID);
          api.sendMessage(
            "☑️ Tắt thành công chế độ anti đổi biệt danh",
            threadID,
            messageID
          );
        } else {
          const nickName = (await api.getThreadInfo(event.threadID)).nicknames
          dataAnti.antiNickname.push({
            threadID,
            data: nickName
          });
          api.sendMessage(
            "☑️ Bật thành công chế độ anti đổi biệt danh",
            threadID,
            messageID
          );
        }
        writeFileSync(pathData, JSON.stringify(dataAnti, null, 4));
        break;
      }
      case "4": {
        if (permssion < 1)
          return api.sendMessage(
            "⚠️ Bạn không đủ quyền hạn để sử dụng lệnh này",
            threadID,
            messageID
          );
        const antiout = dataAnti.antiout;
        if (antiout[threadID] == true) {
          antiout[threadID] = false;
          api.sendMessage(
            "☑️ Tắt thành công chế độ anti out",
            threadID,
            messageID
          );
        } else {
          antiout[threadID] = true;
          api.sendMessage(
            "☑️ Bật thành công chế độ anti out",
            threadID,
            messageID
          );
        }
        writeFileSync(pathData, JSON.stringify(dataAnti, null, 4));
        break;
      }
      case "5": {
        const filepath = path.join(process.cwd(), 'systemdata', 'data', 'antiemoji.json');
        let data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        let emoji = "";
        try {
          let threadInfo = await api.getThreadInfo(threadID);
          emoji = threadInfo.emoji;
        } catch (error) {
          console.error("Error fetching thread emoji status:", error);
        }
        if (!data.hasOwnProperty(threadID)) {
          data[threadID] = {
            emoji: emoji,
            emojiEnabled: true
          };
          fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
        } else {
          data[threadID].emojiEnabled = !data[threadID].emojiEnabled;
          if (data[threadID].emojiEnabled) {
            data[threadID].emoji = emoji;
          }
          fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
        }
        const statusMessage = data[threadID].emojiEnabled ? "Bật" : "Tắt";
        api.sendMessage(`☑️ ${statusMessage} thành công chế độ anti emoji`, threadID, messageID);
        break;
      }
      case "6": {
        const filepath = path.join(process.cwd(), 'systemdata', 'data', 'antitheme.json');
        let data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        let theme = "";
        try {
          const threadInfo = await Threads.getInfo(threadID);
          theme = threadInfo.threadTheme.id;
        } catch (error) {
          console.error("Error fetching thread theme:", error);
        }
        if (!data.hasOwnProperty(threadID)) {
          data[threadID] = {
            themeid: theme || "",
            themeEnabled: true
          };
          fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
        } else {
          data[threadID].themeEnabled = !data[threadID].themeEnabled;
          if (data[threadID].themeEnabled) {
            data[threadID].themeid = theme || "";
          }
          fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
        }
        const statusMessage = data[threadID].themeEnabled ? "Bật" : "Tắt";
        api.sendMessage(`☑️ ${statusMessage} thành công chế độ anti theme`, threadID, messageID);
        break;
      }
      case "7": {
        const dataAnti = __dirname + '/data/antiqtv.json';
        const info = await api.getThreadInfo(event.threadID);
        if (!info.adminIDs.some(item => item.id == api.getCurrentUserID()))
          return api.sendMessage('❎ Bot cần quyền quản trị viên để có thể thực thi lệnh', event.threadID, event.messageID);
        let data = JSON.parse(fs.readFileSync(dataAnti));
        const { threadID, messageID } = event;
        if (!data[threadID]) {
          data[threadID] = true;
          api.sendMessage(`☑️ Bật thành công chế độ anti qtv`, threadID, messageID);
        } else {
          data[threadID] = false;
          api.sendMessage(`☑️ Tắt thành công chế độ anti qtv`, threadID, messageID);
        }
        fs.writeFileSync(dataAnti, JSON.stringify(data, null, 4));
        break;
      }
      case "8": {
        const antiJoinPath = path.join(__dirname, 'data', 'threadData.json ');
        let antiJoinData = JSON.parse(fs.readFileSync(antiJoinPath, 'utf8'));
        const { threadID, messageID } = event;

        if (!antiJoinData.hasOwnProperty(threadID)) {
          antiJoinData[threadID] = true;
          fs.writeFileSync(antiJoinPath, JSON.stringify(antiJoinData, null, 2), 'utf8');
          api.sendMessage(`☑️ Bật thành công chế độ anti thêm thành viên vào nhóm`, threadID, messageID);
        } else {
          antiJoinData[threadID] = false;
          fs.writeFileSync(antiJoinPath, JSON.stringify(antiJoinData, null, 2), 'utf8');
          api.sendMessage(`☑️ Tắt thành công chế độ anti thêm thành viên vào nhóm`, threadID, messageID);
        }
        break;
      };
      case "9": {
        const antiImage = dataAnti.boximage.find(
          (item) => item.threadID === threadID
        );
        const antiBoxname = dataAnti.boxname.find(
          (item) => item.threadID === threadID
        );
        const antiNickname = dataAnti.antiNickname.find(
          (item) => item.threadID === threadID
        );
        return api.sendMessage(`[ CHECK ANTI BOX ]\n────────────────────\n|› 1. anti namebox: ${antiBoxname ? "bật" : "tắt"}\n|› 2. anti imagebox: ${antiImage ? "bật" : "tắt"}\n|› 3. anti nickname: ${antiNickname ? "bật" : "tắt"}\n|› 4. anti out: ${dataAnti.antiout[threadID] ? "bật" : "tắt"}\n────────────────────\n|› Trên kia là các trạng thái của từng anti`, threadID);
        break;
      }
      default: {
        return api.sendMessage(`❎ Số bạn chọn không có trong lệnh`, threadID);
      }
    }
  }
};

module.exports.run = async ({ api, event, args, permssion, Threads }) => {
  const { threadID, messageID, senderID } = event;
  const threadSetting = (await Threads.getData(String(threadID))).data || {};
  const prefix = threadSetting.hasOwnProperty("PREFIX") ? threadSetting.PREFIX : global.config.PREFIX;
  return api.sendMessage(`╭─────────────⭓\n│ Anti Change Info Group\n├─────⭔\n│ 1. anti namebox: cấm đổi tên nhóm\n│ 2. anti boximage: cấm đổi ảnh nhóm\n│ 3. anti nickname: cấm đổi biệt danh người dùng\n│ 4. anti out: cấm thành viên out chùa\n│ 5. anti emoji: cấm thay đổi emoji nhóm\n│ 6. anti theme: cấm thay đổi chủ đề nhóm\n│ 7. anti qtv: cấm thay qtv nhóm (tránh bị cướp box)\n│ 8. anti join: cấm thêm thành viên mới vào nhóm\n│ 9. check trạng thái anti của nhóm\n├────────⭔\n│ 📌 Reply (phản hồi) theo stt để chọn chế độ mà bạn muốn thay đổi trạng thái\n╰─────────────⭓`,
    threadID, (error, info) => {
      if (error) {
        return api.sendMessage("❎ Đã xảy ra lỗi!", threadID);
      } else {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID,
          permssion
        });
      }
    }, messageID);
};