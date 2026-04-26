const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    name: 'setname',
    version: '4.0.0',
    hasPermssion: 0,
    Rent: 1,
    credits: 'Vtuan | Cthinh',
    description: 'Đổi biệt danh trong nhóm của bạn hoặc của người bạn tag',
    commandCategory: 'Người dùng',
    usages: '[trống/reply/tag] + [name]',
    usePrefix: false,
    cooldowns: 0
};

module.exports.run = async ({ api, event, args, Users }) => {
    const filePath = path.join(__dirname, './../../modules/commands/data/setname.json');
    const mention = Object.keys(event.mentions)[0];
    let { threadID, messageReply, senderID, mentions, type } = event;
  
    if (!fs.existsSync(filePath)) {
        fs.writeJsonSync(filePath, []);
        api.sendMessage('Đã tạo dữ liệu. vui lòng sử dụng lại lệnh!', threadID);
        return;
    }

    const jsonData = fs.readJsonSync(filePath);
    const existingData = jsonData.find(data => data.id_Nhóm === threadID);

    if (args.length > 0 && args[0].toLowerCase() === 'add') {
        if (args.length < 2) {
            api.sendMessage('Vui lòng nhập kí tự.', threadID);
            return;
        }
        const newData = { id_Nhóm: threadID, kí_tự: args.slice(1).join(' ') || '' };
        if (existingData) {
            existingData.kí_tự = newData.kí_tự;
        } else {
            jsonData.push(newData);
        }
        fs.writeJsonSync(filePath, jsonData);
        api.sendMessage('Đã cập nhật kí tự setname.', threadID);
        return;
    }

    if (args.length > 0 && args[0].toLowerCase() === 'help') {
        api.sendMessage('📑Cách sử dụng:\n- setname add [kí_tự]: Thêm kí tự setname\n- setname + tên: Đổi biệt danh\n- setname check: để xem những người chưa có biệt danh trong nhóm', threadID);
        return;
    }

  if (args.length > 0 && args[0].toLowerCase() === 'check') {
    try {
      let threadInfo = await api.getThreadInfo(event.threadID);
      let u = threadInfo.nicknames || {};
      let participantIDs = threadInfo.participantIDs;
      let listbd = participantIDs.filter(userID => !u[userID]);

      if (listbd.length > 0) {
        let listNames = [];
        let listMentions = [];

        for (let [index, userID] of listbd.entries()) {
          try {
            let userInfo = await Users.getInfo(userID);
            let name = userInfo.name || "Người dùng không có tên";
            listNames.push(`${index + 1}. ${name}`);
            listMentions.push({ tag: `@${name}`, id: userID });
          } catch (error) {
            console.error(`Lỗi khi lấy thông tin người dùng có ID: ${userID}`);
          }
        }
        if (listNames.length > 0) {
          let message = `😌- Danh sách người chưa có biệt danh:\n${listNames.join("\n")}`;
          if (event.body.includes("call")) {
            message += "\n\nHãy đặt biệt danh cho mình nhé!";
            api.sendMessage({ body: `dậy đặt biệt danh đi :<`, mentions: listMentions }, event.threadID);
          } else if (event.body.includes("del")) {
            let isAdmin = threadInfo.adminIDs.some(item => item.id == event.senderID);
            if (isAdmin) {
              for (let userID of listbd) {
                api.removeUserFromGroup(userID, event.threadID);
              }
              message += "\n\nĐã xóa những người chưa có biệt danh ra khỏi nhóm.";
              api.sendMessage(message, event.threadID);
            } else {
              message += "\n\nBạn không có quyền xóa người khác ra khỏi nhóm.";
              api.sendMessage(message, event.threadID);
            }
          } else if (event.body.includes("help")) {
            message = `📔~ Lệnh check dùng để kiểm tra các thành viên trong nhóm chưa có biệt danh.\nCách sử dụng: check [call | del | help]\n\n- checksn: chỉ hiển thị danh sách người chưa có biệt danh.\n- check call: tag tất cả người chưa có biệt danh và gửi kèm tin nhắn hãy đặt biệt danh.\n- check del: xóa tất cả người chưa có biệt danh ra khỏi nhóm (chỉ dành cho quản trị viên).\n- checksn help: hiển thị hướng dẫn sử dụng lệnh này.`;
            api.sendMessage(message, event.threadID);
          } else {
            message += "\n\n- dùng check help để xem cách sử dụng toàn bộ chức năng của lệnh.";
            api.sendMessage(message, event.threadID);
          }
        } else {
          api.sendMessage(`✅Không có người nào chưa có biệt danh.`, event.threadID);
        }
      } else {
        api.sendMessage(`✅Tất cả thành viên đã có biệt danh.`, event.threadID);
      }
    } catch (error) {
      console.error(error);
      api.sendMessage('❌Đã xảy ra lỗi khi thực hiện chức năng kiểm tra biệt danh.', event.threadID);
    }
      return;
  }
  if (args.length > 0 && args[0].toLowerCase() === 'all') {
      const threadInfo = await api.getThreadInfo(event.threadID);
      const idtv = threadInfo.participantIDs;
      const nameToChange = args.slice(1).join(" ");

      function delay(ms) {
          return new Promise(resolve => setTimeout(resolve, ms));
      };

      for (let setname of idtv) {
          let newName = nameToChange;

          if (existingData) {
              const senderName = await Users.getNameUser(event.senderID);
              const kt = existingData.kí_tự;
              newName = kt + ' ' + senderName;
          }

          await delay(100);
          await api.changeNickname(newName, event.threadID, setname);
      }

      api.sendMessage('✅Đã thay đổi biệt danh cho tất cả thành viên trong nhóm.', event.threadID);
      return;
  }
  
  if (existingData) {
      const kt = existingData.kí_tự;
      let name = await Users.getNameUser(event.senderID);
      const names = args.length > 0 ? args.join(' ') : `${name}`;
      if (names.indexOf('@') !== -1) {
          api.changeNickname(`${kt} ${names.replace(mentions[mention], "")}`, threadID, mention, e => !e ? api.sendMessage(`${!args[0] ? 'Gỡ' : 'Thay đổi'} biệt danh hoàn tất!\nDùng setname help để xem tất cả các chức năng của lệnh`, event.threadID) : api.sendMessage(`[ ! ] - Hiện tại nhóm đang bật liên kết tham gia nên bot không thể set được biệt danh cho người dùng, hãy tắt liên kết mời để có thể xử dụng tính năng này!`, event.threadID));
      } else {
          api.changeNickname(`${kt} ${names}`, threadID, event.type == 'message_reply' ? event.messageReply.senderID : event.senderID, e => !e ? api.sendMessage(`${!args[0] ? 'Gỡ' : 'Thay đổi'} biệt danh hoàn tất!\nDùng setname help để xem tất cả các chức năng của lệnh`, event.threadID) : api.sendMessage(`[ ❌ ] - Hiện tại nhóm đang bật liên kết tham gia nên bot không thể set được biệt danh cho người dùng, hãy tắt liên kết mời để có thể xử dụng tính năng này!`, event.threadID));
      }
  } else {
        if (args.join().indexOf('@') !== -1) {
            const name = args.join(' ');
            api.changeNickname(`${name.replace(mentions[mention], "")}`, threadID, mention, e => !e ? api.sendMessage(`${!args[0] ? 'Gỡ' : 'Thay đổi'} biệt danh hoàn tất!\nDùng setname help để xem tất cả các chức năng của lệnh`, event.threadID) : api.sendMessage(`[ ! ] - Hiện tại nhóm đang bật liên kết tham gia nên bot không thể set được biệt danh cho người dùng,hãy tắt liên kết mời để có thể xử dụng tính năng này!`, event.threadID));
        } else {
            api.changeNickname(args.join(' '), event.threadID, event.type == 'message_reply' ? event.messageReply.senderID : event.senderID, e => !e ? api.sendMessage(`${!args[0] ? 'Gỡ' : 'Thay đổi'} biệt danh hoàn tất!\nDùng setname help để xem tất cả các chức năng của lệnh`, event.threadID) : api.sendMessage(`[ ! ] - Hiện tại nhóm đang bật liên kết tham gia nên bot không thể set được biệt danh cho người dùng,hãy tắt liên kết mời để có thể xử dụng tính năng này!`, event.threadID));
        }
    }
};