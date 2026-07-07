module.exports.config = {
  name: "idbox",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "manhIT",
  description: "lấy ID nhóm chat.",
  commandCategory: "Nhóm",
  usages: "",
  cooldowns: 5,
  dependencies: {

  }
};

module.exports.run = async({api,event, Threads}) => {
    return api.sendMessage(`${event.threadID}`, event.threadID, event.messageID);
}