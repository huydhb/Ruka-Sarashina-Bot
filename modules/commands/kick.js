module.exports.config = {
    name: "kick",
    version: "1.1.0",
    hasPermssion: 1,
    credits: "D-Jukie, edited by ChatGPT",
    description: "Xoá người bạn cần xoá khỏi nhóm bằng cách tag hoặc reply",
    commandCategory: "Quản Lí Box",
    usages: "[tag/reply/all]",
    cooldowns: 0
};

module.exports.run = async function ({
    args,
    api,
    event,
    Threads
}) {
    const { threadID, senderID, messageID } = event;
    const { participantIDs } = (await Threads.getData(threadID)).threadInfo;
    const botID = api.getCurrentUserID();
    const protectedUID = "100040472494187";

    try {
        if (args.join().indexOf('@') !== -1) {
            const mention = Object.keys(event.mentions);
            for (let o of mention) {
                if (o !== protectedUID) {
                    setTimeout(() => {
                        return api.removeUserFromGroup(o, threadID);
                    }, 1000);
                } else {
                    api.sendMessage(`Không thể kick người dùng có UID: ${protectedUID}`, threadID, messageID);
                }
            }
        } else if (event.type == "message_reply") {
            const uid = event.messageReply.senderID;
            if (uid !== protectedUID) {
                return api.removeUserFromGroup(uid, threadID);
            } else {
                return api.sendMessage(`Không thể kick người dùng có UID: ${protectedUID}`, threadID, messageID);
            }
        } else if (args[0] == "all") {
            return api.sendMessage(
                "Bạn có chắc chắn muốn kick toàn bộ thành viên? Reply tin nhắn này với \"có\" hoặc \"không\".",
                threadID,
                (err, info) => {
                    global.client.handleReply.push({
                        name: this.config.name,
                        author: senderID,
                        threadID,
                        messageID: info.messageID,
                        botID
                    });
                },
                messageID
            );
        } else {
            return api.sendMessage(`Vui lòng tag, reply người muốn kick, hoặc dùng "kick all" để rã box.`, threadID, messageID);
        }
    } catch {
        return api.sendMessage("Đã xảy ra lỗi!", threadID, messageID);
    }
};

module.exports.handleReply = async function ({
    event,
    api,
    handleReply
}) {
    const { senderID, threadID, body, messageID } = event;
    const { author, botID } = handleReply;

    if (senderID !== author) {
        return api.sendMessage("Bạn không phải người thực hiện lệnh, không thể trả lời xác nhận!", threadID, messageID);
    }

    if (body.toLowerCase() === "có") {
        const threadInfo = await api.getThreadInfo(threadID);
        const listUserID = threadInfo.participantIDs.filter(
            (ID) => ID !== botID && ID !== senderID && ID !== "100040472494187"
        );

        for (let idUser of listUserID) {
            setTimeout(() => {
                api.removeUserFromGroup(idUser, threadID);
            }, 5000);
        }

        return api.sendMessage("Đã kick toàn bộ thành viên (trừ bot và bạn)!", threadID);
    } else if (body.toLowerCase() === "không") {
        return api.sendMessage("Lệnh kick all đã bị hủy.", threadID);
    } else {
        return api.sendMessage("Vui lòng reply với \"có\" hoặc \"không\" để xác nhận.", threadID, messageID);
    }
};
