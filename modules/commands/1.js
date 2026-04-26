module.exports.config = {
  name: "busy",
  version: "1.0.0",
  permissions: 3,
  credits: "Henry",
  description: "Bật hoặc tắt chế độ busy",
  usages: "[lí do]",
  commandCategory: "Admin",
  cooldowns: 5,
  // Danh sách ID của các admin được chỉ định trong config
  admins: ['100085073240621', 'admin_id_2'] // Thay đổi admin_id_1, admin_id_2 bằng ID thực tế của admin
};

const busyPath = __dirname + '/cache/busy.json';
const fs = require('fs');

// Kiểm tra xem sender có phải là admin không
function isAdmin(senderID) {
  return module.exports.config.admins.includes(senderID);
}

module.exports.onLoad = () => {
  if (!fs.existsSync(busyPath)) fs.writeFileSync(busyPath, JSON.stringify({}));
};

module.exports.handleEvent = async function({ api, event, Users }) {
  let busyData = JSON.parse(fs.readFileSync(busyPath));
  const { senderID, threadID, messageID, mentions } = event;

  // Kiểm tra nếu có ai tag người bận
  if (mentions && Object.keys(mentions).length > 0) {
    for (const [ID, name] of Object.entries(mentions)) {
      if (ID in busyData) {
        var infoBusy = busyData[ID];
        var mentioner = await Users.getNameUser(senderID); // Lấy tên người tag
        var taggedUserName = await Users.getNameUser(ID); // Lấy tên người bị tag (người bận)

        // Gửi thông báo lý do bận và tên người bận cho người tag
        api.sendMessage(`${mentioner},\ntag địt mẹ mày à ${infoBusy.lido ? ` đang ${infoBusy.lido}` : "."}`, threadID, async (error, messageInfo) => {
          if (!error) {
            console.log(`Tin nhắn đã được gửi với messageID: ${messageInfo.messageID}`);
            // Sau 5 giây, thu hồi tin nhắn
            setTimeout(() => {
              api.unsendMessage(messageInfo.messageID, (err) => {
                if (err) {
                  console.error('Không thể thu hồi tin nhắn:', err);
                } else {
                  console.log('Đã thu hồi tin nhắn');
                }
              });
            }, 5000); // 5000 ms = 5s
          } else {
            console.error("Lỗi khi gửi tin nhắn:", error);
          }
        });
      }
    }
  }
};

module.exports.run = async function({ api, event, args, Users }) {
  const { threadID, senderID, messageID, body } = event;

  // Kiểm tra nếu sender là admin
  if (!isAdmin(senderID)) {
    return api.sendMessage("[𝐁𝐎𝐓 𝐂𝐔𝐓𝐄] - Bạn không có quyền sử dụng lệnh này. Chỉ admin mới có thể bật chế độ bận.", threadID, messageID);
  }

  await new Promise(resolve => setTimeout(resolve, 1000));
  let busyData = JSON.parse(fs.readFileSync(busyPath));
  var content = args.join(" ") || "";

  // Bật chế độ bận cho admin
  if (!(senderID in busyData)) {
    busyData[senderID] = {
      lido: content,
      tag: []
    };
    fs.writeFileSync(busyPath, JSON.stringify(busyData, null, 4));
    var msg = (content.length == 0) ? '[𝐁𝐎𝐓 𝐂𝐔𝐓𝐄] - 𝐂𝐜𝐮𝐧𝐠 𝐜𝐡𝐮̉ 𝐯𝐮̛̀𝐚 𝐛𝐚̣̂𝐭 𝐦𝐨𝐝𝐞 𝐛𝐚̣̂𝐧 𝐦𝐚̀ 𝐤𝐡𝐨̂𝐧𝐠 𝐜𝐨́ 𝐥𝐢́ 𝐝𝐨 🐧' : `[𝐁𝐎𝐓 𝐂𝐔𝐓𝐄] - 𝐂𝐜𝐮𝐧𝐠 𝐜𝐡𝐮̉ 𝐯𝐮̛̀𝐚 𝐛𝐚̣̂𝐭 𝐦𝐨𝐝𝐞 𝐛𝐚̣̂𝐧 𝐯𝐨̛́𝐢 𝐥𝐢́ 𝐝𝐨 🐧: ${content}`;
    return api.sendMessage(msg, threadID, messageID);
  }
};
