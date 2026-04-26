const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: "cratedatabase",
    version: "4.0.0",
    hasPermssion: 1,
    credits: "Bot",
    description: "Tạo database thành viên nhóm theo lớp",
    commandCategory: "Hỗ trợ nhóm",
    usages: "/cratedatabase - Tạo database thành viên",
    cooldowns: 10
};

const dataDir = path.join(__dirname, 'data', 'member_database');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

function getDbPath(threadID) {
    return path.join(dataDir, `${threadID}.json`);
}

function writeDatabase(threadID, data) {
    const dbPath = getDbPath(threadID);
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
}

module.exports.run = async function ({ api, event, Users }) {
    const { threadID, messageID } = event;
    const moment = require("moment-timezone");
    const time = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY");

    try {
        const threadInfo = await api.getThreadInfo(threadID);
        if (!threadInfo || !threadInfo.participantIDs) {
            return api.sendMessage("Không thể lấy thông tin nhóm!", threadID, messageID);
        }

        const memberInfos = threadInfo.userInfo || [];
        const botID = api.getCurrentUserID();

        // Tạo 21 lớp: 3 khối x 7 lớp (ABCDEGH, không có F)
        const grades = ["10", "11", "12"];
        const letters = ["A", "B", "C", "D", "E", "G", "H"];
        const classes = {};

        for (const grade of grades) {
            for (const letter of letters) {
                const className = `${grade}${letter}`;
                classes[className] = {
                    total: 0,
                    confirmed: 0,
                    members: {}
                };
            }
        }

        // Cấu trúc HYBRID - nhanh nhất
        const database = {
            threadID: threadID,
            threadName: threadInfo.threadName || "Không tên",
            createdAt: time,
            updatedAt: time,
            totalMembers: 0,
            firstWinner: null,
            classes: classes,
            memberIndex: {} // Tra cứu nhanh: uid -> lớp
        };

        // Thêm thành viên (chưa phân lớp)
        for (const member of memberInfos) {
            if (member.id === botID) continue;

            const memberName = member.name || await Users.getNameUser(member.id) || "Không tên";

            // Lưu vào index để tra nhanh
            database.memberIndex[member.id] = {
                name: memberName,
                lop: "",
                status: 0
            };

            database.totalMembers++;
        }

        writeDatabase(threadID, database);

        return api.sendMessage(
            `TẠO DATABASE THÀNH CÔNG\n` +
            `Nhóm: ${database.threadName}\n` +
            `Tổng: ${database.totalMembers} thành viên`,
            threadID
        );

    } catch (error) {
        return api.sendMessage("Lỗi khi tạo database!", threadID, messageID);
    }
};
