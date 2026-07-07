const fs = require('fs-extra');
const ytdl = require('@distube/ytdl-core');

async function downloadMusicFromYoutube(link, path) {
    var timestart = Date.now();
    if (!link) return 'Thiếu link';

    return new Promise((resolve, reject) => {
        ytdl(link, {
            filter: format =>
                format.quality === 'tiny' && format.audioBitrate === 48 && format.hasAudio === true
        })
            .pipe(fs.createWriteStream(path))
            .on("close", async () => {
                try {
                    var data = await ytdl.getInfo(link);
                    var result = {
                        title: data.videoDetails.title,
                        dur: Number(data.videoDetails.lengthSeconds),
                        viewCount: data.videoDetails.viewCount,
                        likes: data.videoDetails.likes,
                        author: data.videoDetails.author.name,
                        timestart: timestart
                    };
                    resolve(result);
                } catch (err) {
                    reject(err);
                }
            })
            .on("error", reject);
    });
}

module.exports.config = {
    name: "sing",
    version: "1.1.0",
    hasPermssion: 0,
    credits: "D-Jukie (mod tách tin nhắn: GPT-5)",
    description: "Phát nhạc thông qua link YouTube hoặc từ khoá tìm kiếm",
    commandCategory: "Tiện ích",
    usages: "[searchMusic]",
    cooldowns: 0
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
    const moment = require("moment-timezone");
    var timeNow = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss");

    try {
        var path = `${__dirname}/cache/sing-${event.senderID}.mp3`;
        var data = await downloadMusicFromYoutube('https://www.youtube.com/watch?v=' + handleReply.link[event.body - 1], path);

        if (fs.statSync(path).size > 26214400) {
            return api.sendMessage('❎ Không thể gửi file vì dung lượng lớn hơn 25MB.', event.threadID, () => fs.unlinkSync(path), event.messageID);
        }

        api.unsendMessage(handleReply.messageID);

        // Text reply trực tiếp vào lựa chọn
        api.sendMessage(
            `==== 『 𝐒𝐈𝐍𝐆 𝐘𝐎𝐔𝐓𝐔𝐁𝐄 』 ====\n\n→ Title: ${data.title}\n→ Thời lượng: ${this.convertHMS(data.dur)}\n→ Tên kênh: ${data.author}\n→ Số view: ${data.viewCount}\n→ Thời gian xử lý: ${Math.floor((Date.now() - data.timestart) / 1000)} giây\n━━━━━━━━━━━━━━━\n=== 『 RukaChan💤 』 ===\n\n===「${timeNow}」===`,
            event.threadID,
            () => {
                // Sau đó mới gửi nhạc (không reply gì cả)
                api.sendMessage(
                    { attachment: fs.createReadStream(path) },
                    event.threadID,
                    () => fs.unlinkSync(path)
                );
            },
            event.messageID // reply text vào tin nhắn lựa chọn
        );

    } catch (e) {
        console.log("Error in handleReply:", e);
        return api.sendMessage('❎ Đã xảy ra lỗi, vui lòng thử lại!\n' + e, event.threadID, event.messageID);
    }
};

module.exports.convertHMS = function (value) {
    const sec = parseInt(value, 10);
    let hours = Math.floor(sec / 3600);
    let minutes = Math.floor((sec - (hours * 3600)) / 60);
    let seconds = sec - (hours * 3600) - (minutes * 60);
    if (hours < 10) hours = "0" + hours;
    if (minutes < 10) minutes = "0" + minutes;
    if (seconds < 10) seconds = "0" + seconds;
    return (hours !== '00' ? hours + ':' : '') + minutes + ':' + seconds;
};

module.exports.run = async function ({ api, event, args }) {
    const moment = require("moment-timezone");
    var timeNow = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss");

    if (args.length === 0) return api.sendMessage('❎ Phần tìm kiếm không được để trống!', event.threadID, event.messageID);

    const keywordSearch = args.join(" ");
    var path = `${__dirname}/cache/sing-${event.senderID}.mp3`;
    if (fs.existsSync(path)) fs.unlinkSync(path);

    if (args.join(" ").indexOf("https://") === 0) {
        try {
            var data = await downloadMusicFromYoutube(args.join(" "), path);
            if (fs.statSync(path).size > 26214400) return api.sendMessage('❎ Không thể gửi file vì dung lượng lớn hơn 25MB.', event.threadID, () => fs.unlinkSync(path), event.messageID);

            // Gửi text trước
            api.sendMessage(
                `==== 『 𝐒𝐈𝐍𝐆 𝐘𝐎𝐔𝐓𝐔𝐁𝐄 』 ====\n\n→ Title: ${data.title}\n→ Thời lượng: ${this.convertHMS(data.dur)}\n→ Tên kênh: ${data.author}\n→ Số view: ${data.viewCount}\n→ Thời gian xử lý: ${Math.floor((Date.now() - data.timestart) / 1000)} giây\n━━━━━━━━━━━━━━━\n=== 『 RukaChan💤 』 ===\n\n===「${timeNow}」===`,
                event.threadID,
                () => {
                    // Sau đó mới gửi nhạc
                    api.sendMessage(
                        { attachment: fs.createReadStream(path) },
                        event.threadID,
                        () => fs.unlinkSync(path),
                        event.messageID
                    );
                }
            );

        } catch (e) {
            console.log("Error in run:", e);
            return api.sendMessage('❎ Đã xảy ra lỗi, vui lòng thử lại!\n' + e, event.threadID, event.messageID);
        }
    } else {
        try {
            const Youtube = require('youtube-search-api');
            var link = [], msg = "", num = 0;
            var data = (await Youtube.GetListByKeyword(keywordSearch, false, 10)).items;
            for (let value of data) {
                link.push(value.id);
                num++;
                msg += `${num}. 🎬 ${value.title}\n⏰ ${value.length.simpleText}\n\n`;
            }
            var body = `🔎 Có ${link.length} kết quả trùng với từ khoá tìm kiếm:\n━━━━━━━━━━━━━━━\n\n${msg}\n━━━━━━━━━━━━━━━\n\n👉 Reply để chọn bài hát\n\n===「${timeNow}」===`;

            return api.sendMessage(
                body,
                event.threadID,
                (error, info) => {
                    global.client.handleReply.push({
                        type: 'reply',
                        name: this.config.name,
                        messageID: info.messageID,
                        author: event.senderID,
                        link
                    });
                },
                event.messageID
            );
        } catch (e) {
            console.log("Error in search:", e);
            return api.sendMessage('❎ Đã xảy ra lỗi khi tìm kiếm!\n' + e, event.threadID, event.messageID);
        }
    }
};
