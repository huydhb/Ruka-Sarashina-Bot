module.exports.config = {
  name: "dú",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "Vtuan",
  description: "Xem ảnh",
  commandCategory: "Random-img",
  usages: "",
  cooldowns: 30
};

module.exports.run = async function({ api, event, args }) {
    return api.sendMessage(("dú cái l ra web segs mà xem:)"), event.threadID);
}