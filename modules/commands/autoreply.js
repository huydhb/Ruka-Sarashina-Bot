const fs = require("fs");
const path = __dirname + "/data/autoreply/autoreply.json";
const cooldowns = {};
const { downloadFile } = require("../../utils/index");

module.exports.config = {
    name: "autoreply",
    version: "1.1.0",
    hasPermssion: 0,
    credits: "RukaChan",
    description: "Thiết lập tự động trả lời tin nhắn cho từng nhóm, hỗ trợ hình ảnh và video",
    commandCategory: "Quản Lí Box",
    usages: "[add|addvideo|addimage|list] [Từ Khóa] | [Bot Trả Lời]",
    cooldowns: 5
};

module.exports.onLoad = () => {
    const dataDir = __dirname + "/data/autoreply";
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
    if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({}));
};

const getFileExtension = (url, type) => {
    if (type === "photo") return ".jpg";
    if (type === "video") return ".mp4";
    const ext = url.split(".").pop();
    return `.${ext}`;
};

const getUniqueFileName = (type, id, extension) => {
    const timestamp = Date.now();
    return `${type}-${id}-${timestamp}${extension}`;
};

const countKeywordsByType = (data, threadID, senderID, type) => {
    if (!data[threadID]) return 0;
    return Object.values(data[threadID]).filter(k => k.senderID === senderID && k.type === type).length;
};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, body, messageID } = event;
    if (!body) return;

    const currentTime = Date.now();
    if (cooldowns[threadID] && currentTime - cooldowns[threadID] < 5000) return;

    let data = JSON.parse(fs.readFileSync(path));
    if (data[threadID] && data[threadID][body]) {
        const replyData = data[threadID][body];
        if (replyData.type === "text") {
            api.sendMessage(replyData.content, threadID, messageID);
        } else if (replyData.type === "image" || replyData.type === "video") {
            if (!fs.existsSync(replyData.path)) {
                return api.sendMessage("⚠️ Tệp đính kèm không tồn tại hoặc đã bị xóa.", threadID, messageID);
            }
            api.sendMessage({
                body: replyData.content || "",
                attachment: fs.createReadStream(replyData.path)
            }, threadID, messageID);
        }
        cooldowns[threadID] = currentTime;
    }
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
    if (handleReply.type !== "delList") return;

    const { threadID, messageID, senderID, body } = event;
    if (senderID !== handleReply.author) return;

    let data = JSON.parse(fs.readFileSync(path));
    const indexes = body.split(",").map(n => parseInt(n.trim())).filter(n => !isNaN(n));
    let deleted = [];

    indexes.forEach(i => {
        const key = handleReply.keys[i - 1];
        if (key && data[threadID] && data[threadID][key]) {
            const replyData = data[threadID][key];
            if (replyData.type === "image" || replyData.type === "video") {
                if (fs.existsSync(replyData.path)) {
                    try { fs.unlinkSync(replyData.path); } catch {}
                }
            }
            delete data[threadID][key];
            deleted.push(key);
        }
    });

    fs.writeFileSync(path, JSON.stringify(data, null, 2));
    api.sendMessage(
        deleted.length > 0
            ? `✅ Đã xóa các từ khóa: ${deleted.join(", ")}`
            : "❌ Không có từ khóa hợp lệ để xóa.",
        threadID,
        messageID
    );
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID, messageReply } = event;
    let data = JSON.parse(fs.readFileSync(path));
    const action = args[0] ? args[0].toLowerCase() : "";
    const input = args.join(" ").slice(action.length).trim();

    switch (action) {
        case "add":
        case "addvideo":
        case "addimage": {
            const [key, reply] = input.split(" | ").map(item => item?.trim());
            if (!key) return api.sendMessage("Vui lòng nhập từ khóa.", threadID, messageID);
            if (action === "add" && (!reply || reply.length === 0))
                return api.sendMessage("Vui lòng nhập cú pháp: từ khóa | nội dung", threadID, messageID);

            let isFile = false, attachment = null;
            if ((action === "addvideo" || action === "addimage") && messageReply?.attachments?.length > 0) {
                isFile = true;
                attachment = messageReply.attachments[0];
                if (action === "addvideo" && attachment.type !== "video")
                    return api.sendMessage("Tệp đính kèm không phải video.", threadID, messageID);
                if (action === "addimage" && attachment.type !== "photo")
                    return api.sendMessage("Tệp đính kèm không phải hình ảnh.", threadID, messageID);
            }
            if ((action === "addvideo" || action === "addimage") && !attachment)
                return api.sendMessage("Vui lòng reply kèm một tệp đính kèm phù hợp.", threadID, messageID);

            if (!data[threadID]) data[threadID] = {};
            const textCount = countKeywordsByType(data, threadID, senderID, "text");
            const imageCount = countKeywordsByType(data, threadID, senderID, "image");
            const videoCount = countKeywordsByType(data, threadID, senderID, "video");

            if (action === "add" && textCount >= 10) return api.sendMessage("Bạn đã đạt giới hạn 10 từ khóa gửi văn bản.", threadID, messageID);
            if (action === "addimage" && imageCount >= 5) return api.sendMessage("Bạn đã đạt giới hạn 5 từ khóa gửi hình ảnh.", threadID, messageID);
            if (action === "addvideo" && videoCount >= 3) return api.sendMessage("Bạn đã đạt giới hạn 3 từ khóa gửi video.", threadID, messageID);

            const extension = isFile ? getFileExtension(attachment.url, attachment.type) : null;
            const uniqueFileName = isFile ? getUniqueFileName(attachment.type, attachment.id, extension) : null;
            const filePath = isFile ? `${__dirname}/data/autoreply/${uniqueFileName}` : null;

            data[threadID][key] = {
                type: isFile ? (attachment.type === "video" ? "video" : "image") : "text",
                content: reply || "",
                path: filePath,
                senderID: senderID
            };

            if (isFile) {
                try {
                    await downloadFile(attachment.url, filePath);
                    fs.writeFileSync(path, JSON.stringify(data, null, 2));
                    return api.sendMessage(`Đã thêm từ khóa "${key}" kèm ${attachment.type === "video" ? "video" : "ảnh"}.`, threadID, messageID);
                } catch (err) {
                    console.error(err);
                    return api.sendMessage("Đã xảy ra lỗi khi lưu file.", threadID, messageID);
                }
            } else {
                fs.writeFileSync(path, JSON.stringify(data, null, 2));
                return api.sendMessage(`Đã thêm từ khóa "${key}".`, threadID, messageID);
            }
        }

        case "list": {
            if (!data[threadID] || Object.keys(data[threadID]).length === 0)
                return api.sendMessage("Hiện không có từ khóa nào được thiết lập.", threadID, messageID);

            let listMessage = "📌 Danh sách từ khóa:\n";
            const keys = Object.keys(data[threadID]);
            keys.forEach((key, index) => {
                const replyData = data[threadID][key];
                const typeInfo = replyData.type === "text" ? "Văn bản" : replyData.type === "image" ? "Ảnh" : "Video";
                listMessage += `${index + 1}. ${key} (${typeInfo}) ➝ ${replyData.content || "[Không có nội dung]"}\n`;
            });
            listMessage += "\n👉 Reply tin nhắn này với số thứ tự (vd: 1 hoặc 1,2,3) để xóa từ khóa.";

            return api.sendMessage(listMessage, threadID, (err, info) => {
                if (err) return;
                global.client.handleReply.push({
                    type: "delList",
                    name: this.config.name,
                    author: senderID,
                    messageID: info.messageID,
                    keys
                });
            }, messageID);
        }

        default:
            api.sendMessage(
                ">Hướng Dẫn<\n"
                + "ADD: #autoreply add [Từ Khóa] | [Bot Trả Lời]\n"
                + "ADDVIDEO: #autoreply addvideo [Từ Khóa] | [Nội Dung] (reply kèm video)\n"
                + "ADDIMAGE: #autoreply addimage [Từ Khóa] | [Nội Dung] (reply kèm ảnh)\n\n"
                + "LIST: #autoreply list\n",
                threadID, messageID
            );
    }
};
