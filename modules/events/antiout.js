module.exports.config = {
    name: "antiout",
    eventType: ["log:unsubscribe"],
    version: "1.0.7",
    credits: "ProCoderMew",
    description: "Listen events",
    dependencies: {
        "path": ""
    }
};

module.exports.run = async function ({ api, event, Users }) {
    const { resolve } = require("path");
    const path = resolve(__dirname, '../commands', 'data', 'antiout.json');
    const { antiout } = require(path);
    const { logMessageData, author, threadID } = event;
    const id = logMessageData.leftParticipantFbId;
  const moment = require("moment-timezone");
     var timeNow = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss")
  var fullYear = global.client.getTime("fullYear");
    if (author == id && id != api.getCurrentUserID()) {
        const name = await Users.getNameUser(id) || "Người dùng Facebook";
        if (antiout.hasOwnProperty(threadID) && antiout[threadID] == true) {
    try {
    await api.addUserToGroup(id, threadID);
 return api.sendMessage(`[ ANTIOUT ]\n────────────────────\n⚠️ Kích hoạt chế độ tự động thêm người dùng khi tự động rời nhóm\n🔰 Trạng thái: Thành công\n👤 Người dùng: ${name}\n⏰ Thời gian: ${timeNow} - ${fullYear}\n────────────────────\n⛔ Nếu bot thêm thất bại có thể người dùng đã chặn bot`, event.threadID, async (err, info) => {
   await new Promise(resolve => setTimeout(resolve, 60 * 1000));
 return api.unsendMessage(info.messageID);
          }, event.messageID);
      } catch (e) {
 return api.sendMessage(`[ ANTIOUT ]\n────────────────────\n⚠️ Kích hoạt chế độ tự động thêm người dùng khi tự động rời nhóm\n🔰 Trạng thái: Thất bại\n👤 Người dùng: ${name}\n⏰ Thời gian: ${timeNow} - ${fullYear}\n────────────────────\n⛔ Nếu bot thêm thất bại có thể người dùng đã chặn bot`, event.threadID, async (err, info) => {
   await new Promise(resolve => setTimeout(resolve, 60 * 1000));
 return api.unsendMessage(info.messageID);
               }, event.messageID); 
            }
        }
    }
    return;
}