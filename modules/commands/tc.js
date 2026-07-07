const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
const dataDir = path.join(__dirname, 'tc');
const dataPath = path.join(dataDir, 'tc.json');
const commandsDir = path.join(__dirname, '..', 'commands');

// Kiểm tra và tạo thư mục, tệp nếu không tồn tại
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}
if (!fs.existsSync(dataPath)) {
    const initialData = {
        daily: {},
        weekly: {},
        total: {},
        lastUpdateDay: moment().format('YYYY-MM-DD'),
        lastUpdateWeek: moment().startOf('isoWeek').format('YYYY-MM-DD'),
    };
    fs.writeFileSync(dataPath, JSON.stringify(initialData, null, 4));
}

module.exports.config = {
    name: "tc",
    version: "1.1.0",
    hasPermssion: 3,
    credits: "RukaChan",
    description: "Thống kê dùng lệnh trên Hệ Thống bot",
    commandCategory: "Hệ Thống",
    usages: "[day|week|all|reset]",
    cooldowns: 5,
    dependencies: {},
};

module.exports.onLoad = () => {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    fs.readdir(commandsDir, (err, files) => {
        if (err) throw err;
        files.forEach(file => {
            if (file.endsWith('.js')) {
                const commandName = path.basename(file, '.js');

                if (!data.daily[commandName]) data.daily[commandName] = 0;
                if (!data.weekly[commandName]) data.weekly[commandName] = 0;
                if (!data.total[commandName]) data.total[commandName] = 0;
            }
        });

        fs.writeFileSync(dataPath, JSON.stringify(data, null, 4));
    });

    setInterval(() => {
        const today = moment().format('YYYY-MM-DD');
        const weekStart = moment().startOf('isoWeek').format('YYYY-MM-DD');

        if (data.lastUpdateDay !== today) {
            data.daily = {};
            data.lastUpdateDay = today;
        }

        if (data.lastUpdateWeek !== weekStart) {
            data.weekly = {};
            data.lastUpdateWeek = weekStart;
        }

        fs.writeFileSync(dataPath, JSON.stringify(data, null, 4));
    }, 60 * 60 * 1000);
};

module.exports.handleEvent = async function ({ event, api, Threads }) {
    const { threadID, body } = event;
    if (!body) return;

    const threadSetting = (await Threads.getData(threadID)).data;
    const prefix = threadSetting.PREFIX || global.config.PREFIX;

    if (!body.startsWith(prefix)) return;

    const commandName = body.slice(prefix.length).trim().split(' ')[0];

    const commandFile = path.join(commandsDir, `${commandName}.js`);
    if (!fs.existsSync(commandFile)) return;

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    const today = moment().format('YYYY-MM-DD');
    const weekStart = moment().startOf('isoWeek').format('YYYY-MM-DD');

    if (!data.daily[commandName]) data.daily[commandName] = 0;
    if (!data.weekly[commandName]) data.weekly[commandName] = 0;
    if (!data.total[commandName]) data.total[commandName] = 0;

    data.daily[commandName]++;
    data.weekly[commandName]++;
    data.total[commandName]++;

    data.lastUpdateDay = today;
    data.lastUpdateWeek = weekStart;

    fs.writeFileSync(dataPath, JSON.stringify(data, null, 4));
};

function convertToFancyNumber(number) {
    const fancyNumbers = ['𝟎', '𝟏', '𝟐', '𝟑', '𝟒', '𝟓', '𝟔', '𝟕', '𝟖', '𝟗'];
    return number.toString().split('').map(digit => fancyNumbers[digit] || digit).join('');
}

module.exports.run = function ({ event, api, args }) {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    const query = args[0] ? args[0].toLowerCase() : '';

    let message = '';
    switch (query) {
        case 'day': {
            const dailyData = Object.entries(data.daily)
                .filter(([, count]) => count > 0)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 50);

            message = dailyData.length === 0
                ? "Không có lệnh nào được sử dụng trong ngày hôm nay."
                : ">>>𝐓𝐎𝐏 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒 𝐃𝐀𝐘<<<\n" +
                  dailyData.map(([command, count], index) =>
                      `𝐓𝐎𝐏 ${convertToFancyNumber(index + 1)}: ${command}: ${count} 𝐥𝐮̛𝐨̛̣𝐭`
                  ).join('\n');
            break;
        }
        case 'week': {
            const weeklyData = Object.entries(data.weekly)
                .filter(([, count]) => count > 0)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 50);

            message = weeklyData.length === 0
                ? "Không có lệnh nào được sử dụng trong tuần này."
                : ">>>𝐓𝐎𝐏 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒 𝐖𝐄𝐄𝐊<<<\n" +
                  weeklyData.map(([command, count], index) =>
                      `𝐓𝐎𝐏 ${convertToFancyNumber(index + 1)}: ${command}: ${count} 𝐥𝐮̛𝐨̛̣𝐭`
                  ).join('\n');
            break;
        }
        case 'all': {
            const totalData = Object.entries(data.total)
                .filter(([, count]) => count > 0)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 50);

            message = totalData.length === 0
                ? "Không có lệnh nào được sử dụng tổng cộng."
                : ">>>𝐓𝐎𝐏 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒 𝐀𝐋𝐋<<<\n" +
                  totalData.map(([command, count], index) =>
                      `𝐓𝐎𝐏 ${convertToFancyNumber(index + 1)}: ${command}: ${count} 𝐥𝐮̛𝐨̛̣𝐭`
                  ).join('\n');
            break;
        }
        case 'reset': {
            const initialData = {
                daily: {},
                weekly: {},
                total: {},
                lastUpdateDay: moment().format('YYYY-MM-DD'),
                lastUpdateWeek: moment().startOf('isoWeek').format('YYYY-MM-DD'),
            };
            fs.writeFileSync(dataPath, JSON.stringify(initialData, null, 4));
            message = "✅ Đã reset dữ liệu sử dụng lệnh thành công!";
            break;
        }
        default:
            message = "Vui lòng sử dụng lệnh với các tùy chọn: `day`, `week`, `all`, hoặc `reset`.";
            break;
    }

    api.sendMessage(message, event.threadID);
};
