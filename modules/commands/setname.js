module.exports.config = {
    name: 'setname',
    version: '3.0.0',
    hasPermssion: 0,
    credits: 'Vtuan',
    description: 'Đổi biệt danh trong nhóm của bạn hoặc của người bạn tag',
    commandCategory: 'Quản Lí Box',
    usages: '[trống/reply/tag] + [name]',
    cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
    let { threadID, messageReply, senderID, mentions } = event;

    console.log("Đang thực hiện lệnh setname...");
    
    const mention = Object.keys(mentions)[0];
    let targetID = event.type === 'message_reply' ? messageReply.senderID : (mention || senderID);
    
    const nickname = args.join(' ').replace(mentions?.[mention] || '', '').trim();
    
    if (!nickname && mention) {
        return api.sendMessage('Bạn chưa nhập biệt danh mới.', threadID);
    }

    try {
        // Thực hiện việc đổi biệt danh
        await new Promise((resolve, reject) => {
            api.changeNickname(nickname, threadID, targetID, (err) => {
                if (err) {
                    reject(err); // Gọi reject để xử lý lỗi
                } else {
                    resolve(); // Gọi resolve khi thành công
                }
            });
        });

        // Nếu thành công, gửi tin nhắn xác nhận
        api.sendMessage(`${nickname ? 'Thay đổi' : 'Gỡ'} biệt danh thành công!`, threadID);
    } catch (err) {
        console.log("Lỗi khi thay đổi biệt danh:", err);

        // Gửi thông báo lỗi chung cho người dùng
        api.sendMessage('Không để đặt biệt danh vui lòng tắt liên kết nhóm hoặc có thể do bot bị chặn tính năng!!!', threadID);
    }
};
