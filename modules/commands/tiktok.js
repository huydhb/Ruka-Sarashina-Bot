const axios = require("axios");
const fs = require("fs-extra");

module.exports.config = {
  name: "tiktok",
  version: "1.0.0",
  hasPermission: 0,
  credits: "Kz Khánhh",
  description: "Tải video tiktok",
  commandCategory: "Tiện ích",
  usage: "searchtt + từ khóa tìm kiếm, ví dụ: .searchtt buồn",
  cooldowns: 5
};

const roof = n => +n != +Math.floor(n) ? +Math.floor(n) + 1 : +n;
const localeStr = n => ((+n).toLocaleString()).replace(/,/g, '.');
const { get } = require('axios');
const {
    createReadStream,
    mkdirSync,
    rmdirSync,
    unlinkSync
} = require('fs-extra');
const {
    image
} = require('image-downloader');

module.exports.handleReply = async ({ api, event, handleReply }) => {
    const $ = handleReply;
    if ($.case == 'runListUserPost') {
        if (['list'].includes(event.args[0])) {
            if (event.args[1] > roof($.data.length / 6) || event.args[1] < 1 || isNaN(event.args[1])) return api.sendMessage(`𝗧𝗿𝗮𝗻𝗴 ${event.args[1]} 𝗸𝗵𝗼̂𝗻𝗴 𝗻𝗮̆̀𝗺 𝘁𝗿𝗼𝗻𝗴 𝗱𝗮𝗻𝗵 𝘀𝗮́𝗰𝗵!`, event.threadID, event.messageID); else return runListUserPost(api, event, $.data, 6, +event.args[1], $.type, $.author);
        } else return api.sendMessage({ body: $.type ? infoVideoUserPost($.data[event.args[0] - 1]) : infoMusicUserPost($.data[event.args[0] - 1].music_info), attachment: await downStreamURL($.data[event.args[0] - 1][$.type ? 'play' : 'music'], __dirname + `/cache/${event.messageID}.${$.type ? 'mp4' : 'mp3'}`) }, event.threadID, () => unlinkSync(__dirname + `/cache/${event.messageID}.${$.type ? 'mp4' : 'mp3'}`), event.messageID);
    };
    const { threadID, messageID, body } = event;
    if (handleReply.author != event.senderID || !body) return;
    let args = body.split(' ');
    switch (handleReply.type) {
        case 'search':
            if (isNaN(body)) return;
            const { videoInfo } = handleReply;
            const index = parseInt(body) - 1;
            if (index < 0 || index >= videoInfo.length) return api.sendMessage("𝗦𝗼̂́ 𝘁𝘂̛́ 𝘁𝘂̣ 𝗸𝗵𝗼̂𝗻𝗴 𝗵𝗼̛̣𝗽 𝗹𝗲̂", threadID, messageID);
            api.setMessageReaction("⌛", event.messageID, () => { }, true);
            api.unsendMessage(handleReply.messageID);

            const { digg_count, comment_count, play_count, share_count, download_count, duration, region, title, nickname, unique_id, video_url } = videoInfo[index];
            axios.get(video_url, { responseType: "stream" }).then(res => {
                res.data.pipe(fs.createWriteStream(__dirname + "/cache/tiktok.mp4"));
                res.data.on("end", () => {
                    api.setMessageReaction("✅", event.messageID, () => { }, true);
                    api.sendMessage({ body: `
====== [ 𝐓𝐈𝐊𝐓𝐎𝐊 ] ====
➣ 𝘘𝘶𝘰̂́𝘤 𝘨𝘪𝘢: ${region || 'N/A'}
➣ 𝘛𝘪𝘵𝘭𝘦: ${title}
➣ 𝘒𝘦̂𝘯𝘩: ${nickname}
➣ 𝘐𝘋 𝘯𝘨𝘶̛𝘰̛̀𝘪 𝘥𝘶̀𝘯𝘨: ${unique_id}
➣ 𝘓𝘶̛𝘰̛̣𝘵 𝘵𝘪𝘮: ${digg_count}
➣ 𝘛𝘰̂̉𝘯𝘨 𝘣𝘪̀𝘯𝘩 𝘭𝘶𝘢̣̂𝘯: ${comment_count}
➣ 𝘓𝘶̛𝘰̛̣𝘵 𝘹𝘦𝘮: ${play_count}
➣ 𝘓𝘶̛𝘰̛̣𝘵 𝘤𝘩𝘪𝘢 𝘴𝘦̉: ${share_count}
➣ 𝘓𝘶̛𝘰̛̣𝘵 𝘵𝘢̉𝘪: ${download_count}
➣ 𝘛𝘪𝘮𝘦: ${duration} giây`, attachment: fs.createReadStream(__dirname + "/cache/tiktok.mp4") }, threadID, () => fs.unlinkSync(__dirname + "/cache/tiktok.mp4"), messageID);
                });
            }).catch(err => console.log(err));
            break;
    }
};

module.exports.run = async ({ api, event, args }) => {
    api.setMessageReaction("⌛", event.messageID, () => { }, true);
    const search = args.join(" ");
    if (!search) return api.sendMessage("𝗕𝗮̣𝗻 𝗰𝗵𝘂̛𝗮 𝗻𝗵𝗮̣̂𝗽 𝘁𝘂̛̀ 𝗸𝗵𝗼́𝗮 𝘁𝗶̀𝗺 𝗸𝗶𝗲̂́𝗺", event.threadID);
    
    try {
        const response = await axios.get(`https://www.tikwm.com/api/feed/search`, {
            params: {
                keywords: search,
                count: 12,
                cursor: 0,
                HD: 1
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const result = response.data.data.videos;
        if (!result || result.length == 0) return api.sendMessage("𝗞𝗵𝗼̂𝗻𝗴 𝘁𝗶̀𝗺 𝘁𝗵𝗮̂́𝘆 𝗸𝗲̂́𝘁 𝗾𝘂𝗮̉ 𝗻𝗮̀𝗼", event.threadID);

        const lengthResult = result.length > 9 ? 9 : result.length;
        let videoInfo = [];
        let msg = `🔎 𝐻𝑒̣̂ 𝑡ℎ𝑜̂́𝑛𝑔 đ𝑎̃ 𝑡𝑖̀𝑚 𝑡ℎ𝑎̂́𝑦 ${lengthResult} 𝘬𝘦̂́𝘵 𝘲𝘶𝘢̉ 𝑝ℎ𝑢̀ ℎ𝑜̛̣𝑣𝑖 𝑏𝑎̣𝑛\n====================\n`;
        
        let nameATM = [], attachment = [];
        for (let i = 0; i < lengthResult; i++) {
            const video = result[i];
            
            // Cấu trúc dữ liệu từ TikWM API
            const digg_count = video.digg_count || 0;
            const comment_count = video.comment_count || 0;
            const play_count = video.play_count || 0;
            const share_count = video.share_count || 0;
            const download_count = video.download_count || 0;
            const duration = video.duration || 0;
            const region = video.region || 'N/A';
            const title = video.title || 'Không có tiêu đề';
            const nickname = video.author?.nickname || 'Không rõ';
            const unique_id = video.author?.unique_id || 'Không rõ';
            const video_url = video.play || video.wmplay || '';
            const cover = video.cover || video.origin_cover || '';
            
            if (cover) {
                try {
                    let stream_ = await axios.get(encodeURI(cover), { responseType: 'arraybuffer' });
                    const tempDir = __dirname + "/tikinfo" + Date.now() + i + ".png";
                    fs.writeFileSync(tempDir, Buffer.from(stream_.data, 'utf8'));
                    nameATM.push(tempDir);
                    attachment.push(fs.createReadStream(tempDir));
                } catch (e) {
                    console.log('Lỗi tải ảnh cover:', e.message);
                }
            }
            
            msg += `➣ Kết quả: ${i + 1}\n➣ Tác giả: ${nickname}\n➣ Title: ${title}\n➣ 𝗧𝗵𝗼̛̀𝗶 𝗴𝗶𝗮𝗻: ${duration} giây\n====================\n`;
            videoInfo.push({ digg_count, comment_count, play_count, share_count, download_count, region, nickname, title, video_url, cover, unique_id, duration });
        }
        
        api.setMessageReaction("✅", event.messageID, () => { }, true);
        msg += '\n\n😉 𝑃𝘩𝑎̉𝘯 𝘩𝑜̂̀𝘪 𝘵𝑖𝘯 𝘯ℎ𝘢̆́𝑛 𝑛𝘢̀𝑦 𝑡𝘩𝑒𝘰 𝘴𝑜̂́ 𝑡𝘩𝑢̛́ 𝑡𝘶̛̣ 𝘷𝑖𝘥𝑒𝘰 𝘤𝑎̂̀𝘯 𝘹𝑒𝘮';

        api.sendMessage({ body: msg, attachment }, event.threadID, (err, info) => {
            if (err) return console.log(err);
            nameATM.forEach(pa => {
                try {
                    fs.unlinkSync(pa);
                } catch (e) {
                    console.log('Lỗi xóa file:', e.message);
                }
            });
            global.client.handleReply.push({
                name: module.exports.config.name,
                author: event.senderID,
                messageID: info.messageID,
                videoInfo,
                type: "search"
            });
        });
        
    } catch (err) {
        console.log('Lỗi khi gọi TikWM API:', err.message);
        api.sendMessage("Có lỗi xảy ra khi tìm kiếm video TikTok. Vui lòng thử lại sau!", event.threadID);
        api.setMessageReaction("❌", event.messageID, () => { }, true);
    }
};