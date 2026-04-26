module.exports.config = {
  name: "gui",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "Bot",
  description: "Gửi tin nhắn riêng cho người dùng khác thông qua bot. Dùng /gui@All để gửi cho tất cả (chỉ admin)",
  commandCategory: "Người dùng",
  usages: "/gui@TênNgười:Nội dung hoặc /gui@All:Nội dung (admin only)",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args, Users }) {
  const { threadID, messageID, senderID } = event;
  const moment = require("moment-timezone");
  const time = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY");
  const { ADMINBOT } = global.config;

  // Lấy nội dung tin nhắn gốc (bao gồm cả phần @user:message)
  const body = event.body || '';

  // Parse lệnh: /gui@TênNgười:Nội dung
  // Regex để match: /gui@TênNgười:Nội dung
  const match = body.match(/^\/gui@([^:]+):(.+)$/i);

  if (!match) {
    return api.sendMessage(
      `❌ Cú pháp không đúng!\n` +
      `📝 Cách dùng:\n` +
      `• /gui@TênNgười:Nội dung tin nhắn\n` +
      `• /gui@All:Nội dung (chỉ admin)\n` +
      `📌 Ví dụ: /gui@AnhDuong:Xin chào bạn khỏe không`,
      threadID, messageID
    );
  }

  const targetName = match[1].trim(); // Tên người nhận hoặc "All"
  const messageContent = match[2].trim(); // Nội dung tin nhắn

  if (!messageContent) {
    return api.sendMessage("❌ Vui lòng nhập nội dung tin nhắn!", threadID, messageID);
  }

  // Lấy tên người gửi (tên Facebook, không phải biệt danh nhóm)
  const senderName = await Users.getNameUser(senderID);

  // ============ XỬ LÝ /gui@All ============
  if (targetName.toLowerCase() === 'all') {
    // Kiểm tra quyền admin
    if (!ADMINBOT.includes(senderID.toString())) {
      return api.sendMessage(
        `❌ Chỉ ADMIN BOT mới được sử dụng lệnh /gui@All!`,
        threadID, messageID
      );
    }

    try {
      // Lấy thông tin nhóm
      const threadInfo = await api.getThreadInfo(threadID);

      if (!threadInfo || !threadInfo.participantIDs) {
        return api.sendMessage("❌ Không thể lấy thông tin nhóm!", threadID, messageID);
      }

      const memberInfos = threadInfo.userInfo || [];
      const botID = api.getCurrentUserID();
      let successCount = 0;
      let failCount = 0;

      // Gửi tin nhắn đến từng thành viên
      for (const member of memberInfos) {
        // Bỏ qua bot và người gửi
        if (member.id === botID || member.id === senderID) continue;

        const memberName = member.name || 'Bạn';

        const privateMessage =
          `📬 THÔNG BÁO TỪ ADMIN\n` +
          `────────────────────\n` +
          `Xin chào @${memberName}!\n` +
          `Bạn có tin nhắn mới từ Admin @${senderName}:\n\n` +
          `💬 "${messageContent}"\n` +
          `────────────────────\n` +
          `⏰ Thời gian: ${time}`;

        try {
          await new Promise((resolve, reject) => {
            api.sendMessage(privateMessage, member.id, (err) => {
              if (err) {
                failCount++;
                reject(err);
              } else {
                successCount++;
                resolve();
              }
            });
          });
        } catch (e) {
          // Tiếp tục gửi cho người khác nếu 1 người lỗi
        }

        // Delay để tránh spam
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      return api.sendMessage(
        `✅ Đã gửi tin nhắn đến ${successCount} thành viên!\n` +
        `${failCount > 0 ? `⚠️ Không thể gửi đến ${failCount} thành viên.` : ''}`,
        threadID, messageID
      );

    } catch (error) {
      console.log('Lỗi lệnh /gui@All:', error);
      return api.sendMessage("❌ Đã xảy ra lỗi khi gửi tin nhắn!", threadID, messageID);
    }
  }

  // ============ XỬ LÝ /gui@User ============

  // Tìm người nhận trong nhóm
  let targetUserID = null;
  let targetUserName = null;

  try {
    // Lấy thông tin nhóm
    const threadInfo = await api.getThreadInfo(threadID);

    if (!threadInfo || !threadInfo.participantIDs) {
      return api.sendMessage("❌ Không thể lấy thông tin nhóm!", threadID, messageID);
    }

    // Lấy thông tin tất cả thành viên trong nhóm
    const memberInfos = threadInfo.userInfo || [];

    // Tìm người dùng theo tên (không phân biệt hoa thường, tìm kiếm gần đúng)
    const targetNameLower = targetName.toLowerCase().replace(/\s+/g, '');

    for (const member of memberInfos) {
      const memberName = member.name || '';
      const memberNameLower = memberName.toLowerCase().replace(/\s+/g, '');

      // Kiểm tra nếu tên chứa chuỗi tìm kiếm hoặc khớp
      if (memberNameLower.includes(targetNameLower) || targetNameLower.includes(memberNameLower)) {
        targetUserID = member.id;
        targetUserName = memberName;
        break;
      }
    }

    // Nếu không tìm thấy, thử tìm trong global.data.userName
    if (!targetUserID) {
      for (const uid of threadInfo.participantIDs) {
        const userName = global.data.userName.get(uid) || '';
        const userNameLower = userName.toLowerCase().replace(/\s+/g, '');

        if (userNameLower.includes(targetNameLower) || targetNameLower.includes(userNameLower)) {
          targetUserID = uid;
          targetUserName = userName;
          break;
        }
      }
    }

    if (!targetUserID) {
      return api.sendMessage(
        `❌ Không tìm thấy người dùng "${targetName}" trong nhóm!\n` +
        `💡 Hãy kiểm tra lại tên (tên Facebook, không phải biệt danh nhóm).`,
        threadID, messageID
      );
    }

    // Không cho phép gửi cho chính mình
    if (targetUserID === senderID) {
      return api.sendMessage("❌ Bạn không thể gửi tin nhắn riêng cho chính mình!", threadID, messageID);
    }

    // Gửi tin nhắn riêng cho người nhận
    const privateMessage =
      `📬 TIN NHẮN MỚI\n` +
      `────────────────────\n` +
      `Xin chào bạn @${targetUserName}!\n` +
      `Bạn có tin nhắn mới từ @${senderName}:\n\n` +
      `💬 "${messageContent}"\n` +
      `────────────────────\n` +
      `⏰ Thời gian: ${time}`;

    // Gửi tin nhắn riêng (chat 1-1)
    api.sendMessage(privateMessage, targetUserID, (err, info) => {
      if (err) {
        console.log('Lỗi gửi tin nhắn riêng:', err);
        return api.sendMessage(
          `❌ Không thể gửi tin nhắn riêng cho ${targetUserName}!\n` +
          `💡 Có thể người này đã chặn tin nhắn từ người lạ.`,
          threadID, messageID
        );
      }

      // Thông báo thành công trong nhóm
      api.sendMessage(
        `✅ Đã gửi tin nhắn riêng cho @${targetUserName} thành công!`,
        threadID, messageID
      );
    });

  } catch (error) {
    console.log('Lỗi lệnh /gui:', error);
    return api.sendMessage("❌ Đã xảy ra lỗi khi xử lý lệnh!", threadID, messageID);
  }
};
