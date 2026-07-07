const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
const schedule = require('node-schedule');

const dataDir = path.join(__dirname, 'data');
const dataFilePath = path.join(dataDir, 'nhacnho.json');

let scheduledJobs = {};

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

function loadData() {
    if (fs.existsSync(dataFilePath)) {
        try {
            return JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
        } catch (e) {
            return {};
        }
    } else {
        return {};
    }
}

function saveData(data) {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 4));
}

module.exports.config = {
    name: "nhacnho",
    version: "1.2.0",
    hasPermssion: 3,
    credits: "TatsuYTB",
    description: "Tạo nhắc nhở theo ngày + giờ kèm lý do, có thể cancel",
    commandCategory: "Hệ Thống",
    usages: "<số ngày> <giờ:phút> <lý do> [uid] | cancel",
    cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
    const userId = event.senderID;
    let data = loadData();

    // CANCEL (hủy nhắc nhở của người dùng)
    if (args[0] && args[0].toLowerCase() === "cancel") {
        if (scheduledJobs[userId]) {
            scheduledJobs[userId].cancel();
            delete scheduledJobs[userId];
        }
        if (data[userId]) {
            delete data[userId];
            saveData(data);
        }
        return api.sendMessage("⏹️ Đã hủy tất cả nhắc nhở của bạn.", event.threadID, event.messageID);
    }

    // Kiểm tra đủ tham số tối thiểu: số ngày & giờ
    if (args.length < 3) {
        return api.sendMessage(
            'Vui lòng nhập đủ tham số: <số ngày> <giờ:phút> <lý do> [uid]\n' +
            'Ví dụ: nhacnho 7 07:30 Học bài nhóm 123456789',
            event.threadID, event.messageID
        );
    }

    const numDays = parseInt(args[0]);
    const time = args[1];

    // Nếu thỏa điều kiện: nếu arg cuối cùng là UID (chỉ số) => lấy làm targetUid
    let targetUid = event.threadID;
    let reason = "";

    const possibleLast = args[args.length - 1];
    const isUid = /^\d+$/.test(possibleLast); // simple numeric uid detection
    if (isUid && args.length >= 4) {
        targetUid = possibleLast;
        reason = args.slice(2, args.length - 1).join(' ').trim();
    } else {
        reason = args.slice(2).join(' ').trim();
    }

    if (isNaN(numDays) || !/^\d{1,2}:\d{2}$/.test(time) || reason.length === 0) {
        return api.sendMessage('Tham số không hợp lệ. Đảm bảo: số ngày là số, giờ đúng định dạng HH:MM, và có lý do (reason).', event.threadID, event.messageID);
    }

    const startDate = moment().format('YYYY-MM-DD');
    const notifyTime = time;

    // Lưu nhắc nhở (mỗi user chỉ có 1 nhắc nhở). Nếu muốn nhiều nhắc nhở/uid khác nhau, có thể mở rộng sau.
    data[userId] = { startDate, numDays, notifyTime, targetUid, reason };
    saveData(data);

    api.sendMessage(
        `✅ Đã thiết lập nhắc nhở.\n` +
        `⏰ Thời gian: mỗi ngày lúc ${notifyTime} trong ${numDays} ngày\n` +
        `📝 Lý do: ${reason}\n` +
        `📩 Nơi gửi: ${targetUid === event.threadID ? "Nhóm hiện tại" : `UID ${targetUid}`}`,
        event.threadID, event.messageID
    );

    scheduleNotification(api, userId, data[userId]);
};

function scheduleNotification(api, userId, userData) {
    let { startDate, numDays, notifyTime, targetUid, reason } = userData;

    // Hủy job cũ nếu tồn tại
    if (scheduledJobs[userId]) {
        try { scheduledJobs[userId].cancel(); } catch(e){}
    }

    let [hour, minute] = notifyTime.split(':');

    const job = schedule.scheduleJob({ hour: parseInt(hour), minute: parseInt(minute) }, function() {
        let today = moment().format('YYYY-MM-DD');
        let daysPassed = moment(today).diff(moment(startDate), 'days') + 1;

        if (daysPassed <= numDays) {
            // Gửi tin nhắn nhắc nhở, kèm lý do
            const text = `🔔 Nhắc nhở (${daysPassed}/${numDays})\nLý do: ${reason}\nNgày: ${today}\nThời gian: ${notifyTime}`;
            // Nếu targetUid là một thread id (không phải user id) nó vẫn sẽ gửi vào nơi chỉ định.
            api.sendMessage(text, targetUid).catch(() => {});
        } else {
            // Hết hạn nhắc nhở -> xóa data và job
            let all = loadData();
            delete all[userId];
            saveData(all);
            try { job.cancel(); } catch(e){}
            delete scheduledJobs[userId];
        }
    });

    scheduledJobs[userId] = job;
}

// Khi bot khởi động lại, schedule lại tất cả nhắc nhở đã lưu
module.exports.handleEvent = async function({ api }) {
    let data = loadData();
    for (let userId in data) {
        if (!scheduledJobs[userId]) {
            scheduleNotification(api, userId, data[userId]);
        }
    }
};

// Giữ lại helper nếu cần
module.exports.convertHMS = function(value) {
    const sec = parseInt(value, 10);
    let hours = Math.floor(sec / 3600);
    let minutes = Math.floor((sec - (hours * 3600)) / 60);
    let seconds = sec - (hours * 3600) - (minutes * 60);
    if (hours < 10) { hours = "0" + hours; }
    if (minutes < 10) { minutes = "0" + minutes; }
    if (seconds < 10) { seconds = "0" + seconds; }
    return (hours != '00' ? hours + ':' : '') + minutes + ':' + seconds;
};
