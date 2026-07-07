this.config = {
  name: "contact",
  version: "1.0.1",
  hasPermssion: 0,
  credits: "DongDev - Mod by GPT",
  description: "Contact thành viên trong nhóm",
  commandCategory: "Công cụ",
  usages: "",
  cooldowns: 5,
  images: []
};

this.handleEvent = async ({ api, event }) => {
  const { threadID, messageReply, senderID, mentions, type, body } = event;
  if (!body) return;

  if (body.trim().toLowerCase() === "contact") {
    let id;

    if (Object.keys(mentions).length > 0) {
      id = Object.keys(mentions)[0].replace(/\&mibextid=ZbWKwL/g, '');
    } else if (type === "message_reply") {
      id = messageReply.senderID;
    } else {
      id = senderID;
    }

    api.shareContact("", id, threadID);
  }
};

this.run = async ({ api: { shareContact }, event: { threadID, messageReply, senderID, mentions, type }, args }) => {
  let id = Object.keys(mentions).length > 0
    ? Object.keys(mentions)[0].replace(/\&mibextid=ZbWKwL/g, '')
    : args[0] !== undefined
      ? isNaN(args[0]) ? await global.utils.getUID(args[0]) : args[0]
      : senderID;

  if (type === "message_reply") id = messageReply.senderID;

  shareContact("", id, threadID);
};
