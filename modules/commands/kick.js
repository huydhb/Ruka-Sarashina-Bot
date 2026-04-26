module.exports.config = {
    name: "kick",
    version: "1.0.0",
    hasPermssion: 1,
    credits: "D-Jukie",
    description: "Xoá thành viên khỏi nhóm bằng cách tag, reply hoặc dùng 'all'. Hủy kick bằng cách gửi lệnh 'hủy'.",
    commandCategory: "Quản trị viên",
    usages: "[tag/reply/all]",
    cooldowns: 0
};

const kickTracking = new Map();  // Lưu thông tin các lượt kick đang diễn ra

module.exports.run = async function ({ args, api, event, Threads, Users }) {
    const { participantIDs } = (await Threads.getData(event.threadID)).threadInfo;
    const botID = api.getCurrentUserID();
    const commandSender = event.senderID;

    // Hàm xử lý kick với countdown có thể hủy
    const kickWithCountdown = async (userID) => {
        const name = await Users.getNameUser(userID); // Lấy tên người dùng
        let countdown = 10;

        api.sendMessage(`⚠️ Sẽ kick ${name} sau ${countdown} giây...`, event.threadID, (err, info) => {
            if (err) return;

            // Lưu thông tin kick vào `kickTracking`
            kickTracking.set(info.messageID, { userID, commandSender, countdownID: null, canceled: false });

            // Thiết lập interval đếm ngược
            const countdownID = setInterval(async () => {
                countdown--;

                // Nếu kick đã bị hủy, dừng đếm ngược
                if (kickTracking.get(info.messageID)?.canceled) {
                    clearInterval(countdownID);
                    api.sendMessage(`❎ Đã hủy kick ${name} bởi người ra lệnh.`, event.threadID); // Gửi tin nhắn hủy
                    kickTracking.delete(info.messageID); // Xóa thông tin sau khi hủy
                    return;
                }

                if (countdown > 0) {
                    // Cập nhật tin nhắn đếm ngược
                    await api.editMessage(`⚠️ Sẽ kick ${name} sau ${countdown} giây...`, info.messageID);
                } else {
                    // Thực hiện kick và xóa thông tin
                    clearInterval(countdownID);
                    api.removeUserFromGroup(userID, event.threadID);
                    api.sendMessage(`✅ Đã kick ${name} khỏi nhóm.`, event.threadID); // Gửi tin nhắn xác nhận kick
                    kickTracking.delete(info.messageID);
                }
            }, 1000);

            // Lưu interval ID để sử dụng sau
            kickTracking.set(info.messageID, { userID, commandSender, countdownID });
        });
    };

    try {
        if (args.join().includes('@')) {
            const mention = Object.keys(event.mentions);
            for (let userID of mention) {
                kickWithCountdown(userID); // Gọi hàm kick với userID
            }
        } else if (event.type === "message_reply") {
            const uid = event.messageReply.senderID;
            kickWithCountdown(uid); // Gọi hàm kick với uid
        } else if (args[0] === "all") {
            const listUserID = participantIDs.filter(ID => ID !== botID && ID !== event.senderID);
            for (let idUser of listUserID) {
                await kickWithCountdown(idUser); // Gọi hàm kick với idUser
            }
        } else {
            api.sendMessage("❎ Vui lòng tag, reply hoặc dùng 'all' để kick.", event.threadID, event.messageID);
        }
    } catch {
        api.sendMessage('❎ Đã xảy ra lỗi khi kick người dùng.', event.threadID, event.messageID);
    }

    // Kiểm tra lệnh 'hủy' từ người dùng
    if (args[0] === "hủy") {
        const lastKickMessageID = Array.from(kickTracking.keys()).pop(); // Lấy ID tin nhắn kick cuối cùng
        const lastKickInfo = kickTracking.get(lastKickMessageID);

        if (lastKickInfo && lastKickInfo.commandSender === commandSender) {
            lastKickInfo.canceled = true; // Đánh dấu là đã hủy
            clearInterval(lastKickInfo.countdownID); // Dừng đếm ngược
            const name = await Users.getNameUser(lastKickInfo.userID); // Lấy tên người dùng để thông báo
            api.sendMessage(`❎ Đã hủy kick ${name} khỏi nhóm.`, event.threadID); // Gửi tin nhắn thông báo hủy
            kickTracking.delete(lastKickMessageID); // Xóa thông tin kick đã hủy
        } else {
            api.sendMessage("❎ Không có lượt kick nào để hủy.", event.threadID);
        }
    }
};