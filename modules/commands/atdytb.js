const axios = require("axios");
const fs = require("fs");

const isURL = (u) => /^http(|s):\/\//.test(u);

exports.handleEvent = async function (o) {
  try {
    const str = o.event.body;
    const send = (msg) =>
      o.api.sendMessage(msg, o.event.threadID, o.event.messageID);
    const head = (app) =>
      `==『 𝐀𝐮𝐭𝐨𝐝𝐨𝐰𝐧 𝐘𝐨𝐮𝐭𝐮𝐛𝐞 』==\n────────────────`;

    if (isURL(str) && /(^https:\/\/)((www)\.)?(youtube|youtu)(PP)*\.(com|be)\//.test(str)) {
      let ytdl = require('@distube/ytdl-core');

      ytdl.getInfo(str).then(async info => {
        let detail = info.videoDetails;
        let format = info.formats.find(f => f.qualityLabel && f.qualityLabel.includes('360p') && f.audioBitrate);
        if (format) {
          send({
            body: `${head('YOUTUBE')}\n- Tiêu Đề: ${detail.title}`,
            attachment: await streamURL(format.url, 'mp4')
          });
        } else {
          console.error(error);
        }
      });
    }
  } catch(e) {
    console.log('Error', e);
  }
};

exports.run = () => {};

exports.config = {
  name: 'atdytb',
  version: '1',
  hasPermssion: 0,
  credits: 'TatsuYTB',
  description: '',
  commandCategory: 'Tiện ích',
  usages: [],
  cooldowns: 3
};

function streamURL(url, type) {
  return axios.get(url, {
    responseType: 'arraybuffer'
  }).then(res => {
    const path = __dirname + `/cache/${Date.now()}.${type}`;
    fs.writeFileSync(path, res.data);
    setTimeout(p => fs.unlinkSync(p), 1000 * 60, path);
    return fs.createReadStream(path);
  });
}
