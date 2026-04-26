const configCommand = {
    name: 'autodowntiktok',
    version: '1.0.6',
    hasPermssion: 2,
    credits: 'Pcoder',
    description: 'Tự động tải xuống khi phát hiện liên kết video tiktok',
    commandCategory: 'Tiện ích',
    usages: '[]',
    cooldowns: 3
},
axios = require('axios'),
fs = require('fs'),
path = require('path'),
statusAuto = {};

const configPath = path.join(__dirname, '../../config.json');
let defaultStatus = true;

function loadSettings() {
    try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config.autodowntiktok && typeof config.autodowntiktok.status === 'boolean') {
            defaultStatus = config.autodowntiktok.status;
        }
    } catch (e) {
        console.log('autodowntiktok: Lỗi đọc config.json');
    }
}

loadSettings();

const reqStreamURL = async url => {
    return (await axios.get(url, {
        responseType: 'stream',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
        }
    })).data;
};

async function noprefix(arg) {
    const { api, event } = arg;
    const isEnable = statusAuto[event.threadID] === undefined ? defaultStatus : statusAuto[event.threadID];

    if (!isEnable || event.senderID == api.getCurrentUserID()) return;
    if (!event.body) return;

    const regEx_tiktok = /(https?:\/\/(?:[a-zA-Z0-9-]+\.)?tiktok\.com\/[^\s]+)/g;
    let links = event.body.match(regEx_tiktok) || [];
    
    if (event.type == 'message_reply' && event.messageReply && event.messageReply.body) {
        let replyLinks = event.messageReply.body.match(regEx_tiktok) || [];
        links.push(...replyLinks);
    }
    
    if (links.length == 0) return;
    links = [...new Set(links)];

    for (const link of links) {
        api.sendMessage("⏳ Đang tải xuống video TikTok, vui lòng chờ...", event.threadID, async (err, info) => {
            try {
                const res = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(link)}`);
                const data = res.data.data;

                if (!data || !data.play) {
                    if (info) api.unsendMessage(info.messageID);
                    return;
                }

                const title = data.title || 'Không có tiêu đề';
                const author = data.author ? data.author.nickname : 'Không rõ';
                const duration = data.duration || 0;
                const digg = (data.digg_count || 0).toLocaleString();
                const comment = (data.comment_count || 0).toLocaleString();
                const share = (data.share_count || 0).toLocaleString();
                const download = (data.download_count || 0).toLocaleString();

                const body = `🎬 TIKTOK DOWNLOADER\n` +
                            `━━━━━━━━━━━━━━━━━━━━━━\n` +
                            `📌 ${title}\n` +
                            `🎤 ${author}  |  ⏱️ ${duration}s\n` +
                            `━━━━━━━━━━━━━━━━━━━━━━\n` +
                            `❤️ ${digg}  ` +
                            `💬 ${comment}  ` +
                            `🔁 ${share}  ` +
                            `⬇️ ${download}\n` +
                            `━━━━━━━━━━━━━━━━━━━━━━`;

                const stream = await reqStreamURL(data.play);

                await api.sendMessage({
                    body: body,
                    attachment: stream
                }, event.threadID, () => {
                    if (info) api.unsendMessage(info.messageID);
                }, event.messageID);

            } catch (e) {
                console.error('autodowntiktok error:', e);
                if (info) api.unsendMessage(info.messageID);
            }
        }, event.messageID);
    }
};

function runCommand(arg) {
    const { api, event } = arg;
    const out = (a, b, c, d) => api.sendMessage(a, b ? b : event.threadID, c ? c : null, d ? d : event.messageID);
    
    loadSettings();
    try {
        if (statusAuto[event.threadID] === undefined) {
            statusAuto[event.threadID] = !defaultStatus;
        } else {
            statusAuto[event.threadID] = !statusAuto[event.threadID];
        }
        const s = statusAuto[event.threadID];
        out((s ? 'Bật' : 'Tắt') + ' ' + configCommand.name);
    } catch (e) {
        out(e.message);
    };
};

module.exports = {
    config: configCommand,
    run: runCommand,
    handleEvent: noprefix
}