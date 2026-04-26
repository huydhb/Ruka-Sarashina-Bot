module.exports.config = {
  name: "leaveNoti",
  eventType: ["log:unsubscribe"],
  version: "1.0.2",
  credits: "RukaChan",
  description: "Thông báo người rời/kick khỏi nhóm (có random mp4 nếu có)",
  dependencies: {
    "fs-extra": "",
    path: "",
  },
};

module.exports.onLoad = function () {
  const { existsSync, mkdirSync } = global.nodemodule["fs-extra"];
  const { join } = global.nodemodule["path"];

  const base = join(__dirname, "cache", "leaveMP4");
  if (!existsSync(base)) mkdirSync(base, { recursive: true });

  const randomDir = join(base, "random");
  if (!existsSync(randomDir)) mkdirSync(randomDir, { recursive: true });

  return;
};

module.exports.run = async function ({ api, event, Users }) {
  try {
    const { createReadStream, existsSync, mkdirSync, readdirSync } =
      global.nodemodule["fs-extra"];
    const { join } = global.nodemodule["path"];
    const moment = require("moment-timezone");

    const { threadID } = event;
    const leftID = event?.logMessageData?.leftParticipantFbId;

    // Bot tự rời thì bỏ qua
    if (!leftID || leftID == api.getCurrentUserID()) return;

    // Đảm bảo folder tồn tại (tránh readdirSync lỗi)
    const base = join(__dirname, "cache", "leaveMP4");
    const randomDir = join(base, "random");
    if (!existsSync(base)) mkdirSync(base, { recursive: true });
    if (!existsSync(randomDir)) mkdirSync(randomDir, { recursive: true });

    // Time (VN)
    const tz = "Asia/Ho_Chi_Minh";
    const date = moment.tz(tz).format("DD/MM/YYYY");
    const gio = moment.tz(tz).format("HH:mm:ss");
    const hour = parseInt(moment.tz(tz).format("H"), 10);

    const session =
      hour < 3
        ? "Đêm khuya"
        : hour < 8
          ? "Buổi sáng sớm"
          : hour < 12
            ? "Buổi trưa"
            : hour < 17
              ? "Buổi chiều"
              : hour < 23
                ? "Buổi tối"
                : "Đêm khuya";

    // Thread info
    let threadName = "nhóm";
    let memCount = 0;
    try {
      const info = await api.getThreadInfo(threadID);
      threadName = info?.threadName || threadName;
      memCount = info?.participantIDs?.length || 0;
    } catch (_) {
      memCount = event?.participantIDs?.length || 0;
    }

    // Names
    const leftName =
      global.data.userName.get(leftID) || (await Users.getNameUser(leftID));

    const authorID = event.author;
    const authorName = authorID ? await Users.getNameUser(authorID) : "QTV";

    // Self leave vs kicked
    const isSelfLeave = authorID == leftID;

    // Dòng hành động
    const actionLine = isSelfLeave
      ? `𝐶𝗮̣̂𝘂 𝗱𝗮̃ 𝘁𝘂̛̣ 𝗿𝗼̛̀𝗶 𝗸𝗵𝗼̉𝗶 ${threadName}.`
      : `𝐶𝗮̣̂𝘂 𝗱𝗮̃ 𝗯𝗶̣ 👑 ${authorName} 𝗸𝗶𝗰𝗸 𝗸𝗵𝗼̉𝗶 ${threadName}.`;

    // Template
    let msg =
      typeof (global.data.threadData.get(parseInt(threadID)) || {})
        .customLeave === "undefined"
        ? `‎[⚜️] Bái bai 𝗰𝗮̣̂𝘂 {name}.
{action}
[❗] 𝐻𝑖𝑒̣̂𝑛 𝑡𝑎̣𝑖 ${threadName} 𝑐𝑜̀𝑛 {memCount} 𝑡ℎ𝑎̀𝑛ℎ 𝑣𝑖𝑒̂𝑛.
[🌐] 𝐾ℎ𝑖 𝑞𝑢𝑎𝑦 𝑙𝑎̣𝑖 𝗰𝗮̣̂𝘂 ℎ𝑎̃𝑦 𝑑𝑢̀𝑛𝑔 𝑙𝑒̣̂𝑛ℎ đ𝑒̂̉ 𝑥𝑒𝑚 𝑙𝑢𝑎̣̂𝑡 𝑏𝑜𝑥 𝑛ℎ𝑒́:
◆━━━━━━━━━━━━━━━◆
[📝] /rule
[💥] 𝐂𝐚̂́𝐦 𝐬𝐩𝐚𝐦 𝐛𝐨𝐭 𝐡𝐚𝐲 𝐜𝐡𝐮̛̉𝐢 𝐛𝐨𝐭 𝐭𝐡𝐢̀ 𝐬𝐞̃ 𝐚̆𝐧 𝐛𝐚𝐧 𝐡𝐨𝐚̣̆𝐜 𝐪𝐭𝐯 𝐬𝐞̃ 𝐤𝐢𝐜𝐤
[❤️] 𝐶ℎ𝑢́𝑐 𝗰𝗮̣̂𝘂 𝑐𝑜́ 𝑚𝑜̣̂𝑡 {buoi} || {date} || {gio} 𝑣𝑢𝑖 𝑣𝑒̉
🌸𝗣𝗥𝗢𝗙𝗜𝗟𝗘: https://facebook.com/profile.php?id={uid}`
        : (global.data.threadData.get(parseInt(threadID)) || {}).customLeave;

    // Replace placeholder
    msg = msg
      .replace(/\{name}/g, leftName)
      .replace(/\{action}/g, actionLine)
      .replace(/\{memCount}/g, String(memCount))
      .replace(/\{buoi}/g, session)
      .replace(/\{date}/g, date)
      .replace(/\{gio}/g, gio)
      .replace(/\{author}/g, authorName)
      .replace(/\{uidAuthor}/g, authorID)
      .replace(/\{uid}/g, leftID);

    // Attachment: ưu tiên mp4 theo threadID, nếu không có thì random
    const threadMp4 = join(base, `${threadID}.mp4`);
    const randomFiles = readdirSync(randomDir);

    const formPush = {
      body: msg,
      mentions: [{ tag: leftName, id: leftID }],
    };

    if (existsSync(threadMp4)) {
      formPush.attachment = createReadStream(threadMp4);
    } else if (randomFiles.length) {
      const pick = randomFiles[Math.floor(Math.random() * randomFiles.length)];
      formPush.attachment = createReadStream(join(randomDir, pick));
    }

    // Nếu upload attachment lỗi (408/500), fallback gửi text
    return api.sendMessage(formPush, threadID, (err) => {
      if (!err) return;
      console.log(
        "[leaveNoti] sendMessage fail, fallback text:",
        err?.code || err,
      );
      api.sendMessage(
        { body: msg, mentions: [{ tag: leftName, id: leftID }] },
        threadID,
      );
    });
  } catch (e) {
    console.log("[leaveNoti] ERROR:", e);
  }
};