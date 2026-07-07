const os = require('os'); 
const moment = require('moment-timezone');
const fs = require('fs').promises;
const osu = require('os-utils');
const { performance } = require('perf_hooks');
const checkDiskSpace = require('check-disk-space').default;

module.exports.config = {
    name: "upt1",
    version: "2.0.0",
    hasPermission: 1,
    credits: "Vtuan",
    description: "Hiển thị thông tin hệ thống của bot",
    commandCategory: "Hệ Thống",
    usages: "",
    cooldowns: 5
};

async function getDependencyCount() {
    try {
        const packageJsonString = await fs.readFile('package.json', 'utf8');
        const packageJson = JSON.parse(packageJsonString);
        const depCount = Object.keys(packageJson.dependencies || {}).length;
        const devDepCount = Object.keys(packageJson.devDependencies || {}).length;
        return { depCount, devDepCount };
    } catch (error) {
        console.error('Không thể đọc file package.json:', error);
        return { depCount: -1, devDepCount: -1 };
    }
}

function getStatusByPing(ping) {
    if (ping < 200) {
        return 'tốt';
    } else if (ping < 800) {
        return 'bình thường';
    } else {
        return 'xấu';
    }
}

function getPrimaryIP() {
    const interfaces = os.networkInterfaces();
    for (let iface of Object.values(interfaces)) {
        for (let alias of iface) {
            if (alias.family === 'IPv4' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return '127.0.0.1';
}

module.exports.run = async ({ api, event, Users }) => {
    const start = performance.now();  // Bắt đầu đo thời gian xử lý

    // Lấy thông tin hệ thống và gửi
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const uptime = process.uptime();

    const { depCount, devDepCount } = await getDependencyCount();
    let name = await Users.getNameUser(event.senderID);
    const primaryIp = getPrimaryIP();
    const botStatus = getStatusByPing(Date.now() - event.timestamp);

    const uptimeHours = Math.floor(uptime / (60 * 60));
    const uptimeMinutes = Math.floor((uptime % (60 * 60)) / 60);
    const uptimeSeconds = Math.floor(uptime % 60);

    const uptimeString = `${uptimeHours.toString().padStart(2, '0')}:${uptimeMinutes.toString().padStart(2, '0')}:${uptimeSeconds.toString().padStart(2, '0')}`;

    checkDiskSpace('C:').then((diskSpace) => {
        const freeDiskSpace = (diskSpace.free / 1024 / 1024 / 1024).toFixed(2); // Đơn vị GB

        osu.cpuUsage(function (cpuUsage) {
            const end = performance.now();  // Kết thúc đo thời gian xử lý
            const processingTime = ((end - start) / 1000).toFixed(3);  // Thời gian xử lý, hiển thị dưới dạng giây

            const replyMsg = `
𖢨 · Bây giờ là: ${moment().tz('Asia/Ho_Chi_Minh').format('HH:mm:ss')} || ${moment().tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY')}
𖢨 · Thời gian đã hoạt động: ${uptimeString}
𖢨 · Prefix mặc định: ${global.config.PREFIX}
𖢨 · Địa chỉ IP: ${primaryIp}
𖢨 · Tổng số dependencies: ${depCount}
𖢨 · Tổng số devDependencies: ${devDepCount}
𖢨 · Tình trạng bot: ${botStatus}
𖢨 · Tổng người dùng: ${global.data.allUserID.length}
𖢨 · Tổng nhóm: ${global.data.allThreadID.length}
𖢨 · Thông tin hệ thống:
𖢨 · Hệ điều hành: ${os.type()} ${os.release()} (${os.arch()})
𖢨 · CPU: ${os.cpus().length} core(s) - ${os.cpus()[0].model.trim()} @ ${os.cpus()[0].speed}MHz
𖢨 · CPU đã sử dụng: ${(cpuUsage * 100).toFixed(1)}%
𖢨 · RAM: ${(usedMemory / 1024 / 1024 / 1024).toFixed(2)}GB/${(totalMemory / 1024 / 1024 / 1024).toFixed(2)}GB (Used/Total)
𖢨 · RAM trống: ${(freeMemory / 1024 / 1024 / 1024).toFixed(2)}GB
𖢨 · Dung lượng trống : ${freeDiskSpace}GB
𖢨 · Ping: ${Date.now() - event.timestamp}ms
𖢨 · Thời gian xử lý: ${processingTime} giây
𖢨 · Yêu cầu bởi: ${name}
            `.trim();

            // Gửi thông tin hệ thống
            api.sendMessage(replyMsg, event.threadID, event.messageID);
        });
    }).catch((err) => {
        console.error('Không thể lấy thông tin ổ đĩa:', err);
    });
};

module.exports.handleEvent = async ({ event, api, Users, Threads }) => {
    const { threadID, body } = event;

    // Kiểm tra nếu tin nhắn chứa từ khóa upt1
    const keywords = ["upt1", "uptime1"];
    if (keywords.some(keyword => body.toLowerCase().includes(keyword))) {
        await module.exports.run({ api, event, Users, Threads });
    }
};
