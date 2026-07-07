const configCommand = {
    name: 'atdreel',
    version: '1.0.0',
    hasPermssion: 2,
    credits: 'RukaChan',
    description: 'Tự động tải xuống khi phát hiện liên kết video reel/watch facebook',
    commandCategory: 'Tiện ích',
    usages: '[]',
    cooldowns: 3
},
axios = require('axios'),
fs = require('fs'),
path = require('path'),
os = require('os'),
statusAuto = {};

const configPath = path.join(__dirname, '../../config.json');
let defaultStatus = true;

// Thay đổi URL API này thành URL API bạn đã deploy từ https://github.com/sh13y/Facebook-Video-Download-API
const API_URL = "https://fdown.isuru.eu.org"; 

function loadSettings() {
    try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config.autodownreel && typeof config.autodownreel.status === 'boolean') {
            defaultStatus = config.autodownreel.status;
        }
    } catch (e) {
        console.log('autodownreel: Lỗi đọc config.json');
    }
}

loadSettings();

const reqStreamURL = async url => {
    const res = await axios.get(url, {
        responseType: 'stream',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
        }
    });
    res.data.path = "video.mp4";
    return res.data;
};

async function noprefix(arg) {
    const { api, event } = arg;
    const isEnable = statusAuto[event.threadID] === undefined ? defaultStatus : statusAuto[event.threadID];

    if (!isEnable || event.senderID == api.getCurrentUserID()) return;
    if (!event.body) return;

    // Regex hỗ trợ các dạng link video/reel/watch của Facebook
    const regEx_fb = /(https?:\/\/(?:www\.|web\.|m\.)?facebook\.com\/(?:reel|share\/r|share\/v|watch|.*\/videos)\/[^\s]+|https?:\/\/fb\.watch\/[^\s]+)/g;
    let links = event.body.match(regEx_fb) || [];
    
    if (event.type == 'message_reply' && event.messageReply && event.messageReply.body) {
        let replyLinks = event.messageReply.body.match(regEx_fb) || [];
        links.push(...replyLinks);
    }
    
    if (links.length == 0) return;
    links = [...new Set(links)];

    for (const link of links) {
        api.sendMessage("⏳ Đang kiểm tra liên kết Facebook...", event.threadID, async (err, info) => {
            try {
                let processedLink = link;
                try {
                    const resRedirect = await axios.get(link, {
                        maxRedirects: 0,
                        validateStatus: (status) => status >= 200 && status < 400,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                        }
                    });
                    if (resRedirect.headers.location) {
                        processedLink = new URL(resRedirect.headers.location, link).toString();
                    }
                    
                    let parsedUrl = new URL(processedLink);
                    if (parsedUrl.pathname.includes('/watch')) {
                        let videoId = parsedUrl.searchParams.get('v');
                        if (videoId) {
                            parsedUrl.search = `?v=${videoId}`;
                        } else {
                            parsedUrl.search = '';
                        }
                    } else {
                        parsedUrl.search = '';
                    }
                    processedLink = parsedUrl.toString();
                } catch (e) {
                    console.error("autodownreel: Lỗi xử lý link", e.message);
                }

                // Gọi API download
                const res = await axios.post(`${API_URL}/download`, {
                    url: processedLink,
                    quality: 'best'
                }, {
                    headers: {
                        'accept': '*/*',
                        'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
                        'content-type': 'application/json',
                        'origin': 'https://fdown.isuru.eu.org',
                        'priority': 'u=1, i',
                        'referer': 'https://fdown.isuru.eu.org/',
                        'sec-ch-ua': '"Google Chrome";v="149", "Chromium";v="149", "Not)A;Brand";v="24"',
                        'sec-ch-ua-mobile': '?1',
                        'sec-ch-ua-platform': '"Android"',
                        'sec-fetch-dest': 'empty',
                        'sec-fetch-mode': 'cors',
                        'sec-fetch-site': 'same-origin',
                        'user-agent': 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36'
                    }
                });
                
                const data = res.data;
                //console.log(data);
                if (!data || data.status !== 'success' || !data.video_info) {
                    if (info) api.unsendMessage(info.messageID);
                    console.log(data.error || data.detail);
                    return;
                }

                const videoInfo = data.video_info;

                if (info) api.editMessage(`⏳ Đang tải xuống video Facebook...`, info.messageID);

                const title = videoInfo.title || 'Không có tiêu đề';
                const author = videoInfo.uploader || 'Không rõ';
                const views = videoInfo.view_count ? videoInfo.view_count.toLocaleString() : '0';
                const duration = videoInfo.duration ? `${videoInfo.duration}s` : 'Không rõ';
                
                let body = `🎬 FACEBOOK DOWNLOADER\n` +
                            `━━━━━━━━━━━━━━━━━━━━━━\n` +
                            `📌 ${title}\n` +
                            `⏱️ Thời lượng: ${duration}  |  👀 Lượt xem: ${views}\n` +
                            `━━━━━━━━━━━━━━━━━━━━━━`;

                if (!data.download_url) {
                    if (info) api.unsendMessage(info.messageID);
                    return;
                }

                // Stream trực tiếp — giống autodowntiktok
                let attachments = [];
                attachments.push(await reqStreamURL(data.download_url));

                if (attachments.length == 0) {
                    if (info) api.unsendMessage(info.messageID);
                    return;
                }

                api.sendMessage({
                    body: body,
                    attachment: attachments
                }, event.threadID, () => {
                    if (info) api.unsendMessage(info.messageID);
                }, event.messageID);

            } catch (e) {
                if (e.response && e.response.data && e.response.data.detail) {
                    const detail = e.response.data.detail;
                    console.error(`autodownreel error: ${detail.message || JSON.stringify(detail)}`);
                } else {
                    console.error('autodownreel error:', e.message);
                }
                if (info) api.editMessage("❌ Không thể tải video. Video có thể đang ở chế độ riêng tư, bị xóa hoặc link không hợp lệ.", info.messageID);
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