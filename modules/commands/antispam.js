const fs = require("fs-extra");

module.exports.config = {
    name: "antispam",
    version: "1.0.1",
    hasPermssion: 1,
    credits: "TatsuYTB",
    description: "Tự động kick người dùng khi spam trong nhóm",
    commandCategory: "Quản Lí Box",
    usages: "antispam",
    cooldowns: 0,
};

const path = "./modules/commands/data/antispam.json";
let antiSpamStatus = {};
let usersSpam = {};

if (!fs.existsSync(path)) {
    fs.writeFileSync(path, JSON.stringify({}, null, 4));
} else {
    antiSpamStatus = JSON.parse(fs.readFileSync(path));
}

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, senderID, messageID, type } = event;

    if (!antiSpamStatus[threadID] || !antiSpamStatus[threadID].status) return;

    const settings = antiSpamStatus[threadID];

    if (type !== "message" && type !== "message_reply" && type !== "message_sticker") return;

    if (!usersSpam[senderID]) {
        usersSpam[senderID] = { count: 0, start: Date.now() };
    }

    const userSpamData = usersSpam[senderID];
    userSpamData.count++;

    if (Date.now() - userSpamData.start > settings.spamTime) {
        userSpamData.count = 1;
        userSpamData.start = Date.now();
    }

    if (userSpamData.count > settings.spamCount) {
        try {
            const userInfo = await api.getUserInfo(senderID);
            const userName = userInfo[senderID]?.name || "𝐍𝐠𝐮̛𝐨̛̀𝐢 𝐝𝐮̀𝐧𝐠 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤";

            api.removeUserFromGroup(senderID, threadID, (err) => {
                if (!err) {
                    api.sendMessage(
                        {
                            body: `✅ Thành viên [ ${userName} ] đã bị kick do vượt quá ${settings.spamCount} tin nhắn trong ${settings.spamTime / 1000} giây.`,
                            mentions: [{ tag: `[${userName}]`, id: senderID }],
                        },
                        threadID
                    );
                } else {
                    api.sendMessage(
                        "❌ Có lỗi khi kick thành viên spam. Hãy cấp quyền Quản Trị Viên cho bot",
                        threadID
                    );
                }
            });
        } catch (error) {
            api.sendMessage(
                "❌ Lỗi khi lấy thông tin, Không thể kick thành viên.",
                threadID
            );
        }

        delete usersSpam[senderID];
    }
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID } = event;
    const infoThread = await api.getThreadInfo(threadID);
    const adminIDs = infoThread.adminIDs.map((e) => e.id);
    const idBot = api.getCurrentUserID();

    if (!adminIDs.includes(idBot)) {
        return api.sendMessage("Bot cần quyền Quản Trị Viên để sử dụng tính năng này.", threadID);
    }

    switch (args[0]) {
        case "set":
            const spamCount = parseInt(args[1]);
            const spamTimeInSeconds = parseInt(args[2]);

            if (!spamCount || !spamTimeInSeconds) {
                return api.sendMessage(
                    "Vui lòng cung cấp Tin Nhắn và Thời Gian hợp lệ",
                    threadID
                );
            }

            antiSpamStatus[threadID] = {
                spamCount,
                spamTime: spamTimeInSeconds * 1000,
                status: false,
            };

            fs.writeFileSync(path, JSON.stringify(antiSpamStatus, null, 4));
            api.sendMessage(
                `✅ Đã cài đặt chống spam:\n- Số tin nhắn: ${spamCount}\n- Thời gian: ${spamTimeInSeconds} giây\nDùng 'antispam on' để bật chế độ chống spam.`,
                threadID
            );
            break;

        case "on":
            if (!antiSpamStatus[threadID]) {
                return api.sendMessage(
                    "❌ Vui lòng cài đặt thông số dùng '#antispam set tin nhắn giây(ví dụ: antispam set 5 10)'.",
                    threadID
                );
            }

            antiSpamStatus[threadID].status = true;
            fs.writeFileSync(path, JSON.stringify(antiSpamStatus, null, 4));
            api.sendMessage("🔒 Đã bật chế độ chống spam.", threadID);
            break;

        case "off":
            if (antiSpamStatus[threadID]) {
                antiSpamStatus[threadID].status = false;
                fs.writeFileSync(path, JSON.stringify(antiSpamStatus, null, 4));
                api.sendMessage("🔓 Đã tắt chế độ chống spam.", threadID);
            } else {
                api.sendMessage("❌ Chế độ chống spam chưa được thiết lập!!!", threadID);
            }
            break;

        default:
            api.sendMessage(
                "📖 Hướng dẫn sử dụng:\n- Bật: antispam on\n- Tắt: antispam off\n- Cài đặt: #antispam set tin nhắn giây(ví dụ: #antispam set 5 10 là khi có người chat quá 5 tin nhắn trong 10 giây bot sẽ kick người đó)",
                threadID
            );
    }
};
