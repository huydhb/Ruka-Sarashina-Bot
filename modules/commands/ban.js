const fs = require('fs');
const path = require('path');
const databanuserFolderPath = path.join(__dirname, '../../modules/commands/data/ban');

if (!fs.existsSync(databanuserFolderPath)) {
  fs.mkdirSync(databanuserFolderPath, { recursive: true });
}

async function createIfNotExist(filePath) {
  if (!fs.existsSync(filePath)) {
    const defaultData = { bannedUsers: [] };
    await fs.promises.writeFile(filePath, JSON.stringify(defaultData, null, 2), 'utf8');
  }
}

module.exports.config = {
  name: "ban",
  version: "1.1.0",
  hasPermssion: 1,
  credits: "fbd (mod by ChatGPT)",
  description: "Quản lý danh sách cấm trong nhóm (thêm bằng UID hoặc reply)",
  commandCategory: "Quản Lí Box",
  usages: "[add/remove/list] [ID người dùng] hoặc reply tin nhắn người muốn ban với 'ban add'",
  cooldowns: 5,
  dependencies: {}
};

module.exports.run = async ({ event, api, args }) => {
  const threadID = event.threadID;

  if (!args[0]) {
    return api.sendMessage(
      "[cách sử dụng]\n"+
      "- Thêm ID vào danh sách cấm: #ban add ID1 | ID2 | ...\n"+
      "Ví dụ: #ban add 123456789\n\n"+
      "- Có thể cách nhau bằng dấu | mỗi uid để cấm nhiều người\n"+
      "Ví dụ: #ban add 123456789 | 987654321\n\n"+
      "- Reply vào tin nhắn người muốn ban và gõ: ban add\n\n"+
      "- Xóa ID khỏi danh sách cấm: #ban remove ID1 | ID2 | ...\n"+
      "- Liệt kê danh sách cấm: #ban list\n",
      threadID
    );
  }

  const action = args[0].toLowerCase();
  const threadFilePath = path.join(databanuserFolderPath, `${threadID}.json`);

  await createIfNotExist(threadFilePath);

  let data = JSON.parse(await fs.promises.readFile(threadFilePath, 'utf8'));

  switch (action) {
    case "add": {
      args.shift();
      let userIDsToAdd = [];

      // Trường hợp reply tin nhắn -> lấy UID từ event.messageReply
      if (event.type === "message_reply") {
        userIDsToAdd.push(event.messageReply.senderID);
      }

      // Trường hợp nhập UID thủ công
      if (args.length > 0) {
        userIDsToAdd = userIDsToAdd.concat(
          args.join(" ").split('|').map(id => id.trim()).filter(Boolean)
        );
      }

      if (userIDsToAdd.length === 0) {
        return api.sendMessage("❌ Bạn cần nhập UID hoặc reply tin nhắn của người cần ban.", threadID);
      }

      const addedIDs = [];

      for (const id of userIDsToAdd) {
        if (!data.bannedUsers.includes(id)) {
          data.bannedUsers.push(id);
          addedIDs.push(id);

          try {
            const threadInfo = await api.getThreadInfo(threadID);
            const isMember = threadInfo.participantIDs.includes(id);
            if (isMember) {
              await api.removeUserFromGroup(id, threadID);
              api.sendMessage(
                `🚫 Người dùng có UID ${id} đã bị ban và kick khỏi nhóm.`,
                threadID
              );
            }
          } catch (error) {}
        }
      }

      if (addedIDs.length > 0) {
        await fs.promises.writeFile(threadFilePath, JSON.stringify(data, null, 2));
        api.sendMessage(`✅ Đã thêm vào danh sách cấm: ${addedIDs.join(', ')}`, threadID);
      } else {
        api.sendMessage("⚠️ Không có ID nào mới để thêm vào danh sách cấm.", threadID);
      }
      break;
    }

    case "remove": {
      args.shift();
      const userIDsToRemove = args.join(" ").split('|').map(id => id.trim());
      const removedIDs = [];

      data.bannedUsers = data.bannedUsers.filter(id => {
        if (userIDsToRemove.includes(id)) {
          removedIDs.push(id);
          return false;
        }
        return true;
      });

      if (removedIDs.length > 0) {
        await fs.promises.writeFile(threadFilePath, JSON.stringify(data, null, 2));
        api.sendMessage(`✅ Đã xóa khỏi danh sách cấm: ${removedIDs.join(', ')}`, threadID);
      } else {
        api.sendMessage("⚠️ Không có ID nào để xóa khỏi danh sách cấm.", threadID);
      }
      break;
    }

    case "list": {
      if (data.bannedUsers.length === 0) {
        return api.sendMessage("📭 Danh sách cấm hiện đang trống.", threadID);
      }
      api.sendMessage(`📌 Danh sách cấm:\n${data.bannedUsers.join('\n')}`, threadID);
      break;
    }

    default: {
      api.sendMessage("❓ Hành động không hợp lệ. Sử dụng add, remove hoặc list.", threadID);
      break;
    }
  }
};
