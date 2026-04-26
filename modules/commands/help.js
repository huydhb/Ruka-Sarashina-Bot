module.exports.config = {
    name: "help",
    version: "1.1.1",
    hasPermssion: 0,
    credits: "DC-Nam mod by BaoHuy",
    description: "Xem danh sách lệnh và hướng dẫn sử dụng",
    commandCategory: "Người dùng",
    usages: "[tên lệnh/all]",
    cooldowns: 2
};

module.exports.run = async function({ api, event, args }) {
    const { threadID: tid, messageID: mid } = event;
    const cmds = global.client.commands;
    const type = args[0] ? args[0].toLowerCase() : "";
    let msg = "";

    if (type && type !== "all") {
        const command = cmds.get(type) || Array.from(cmds.values()).find(cmd => cmd.config.name.toLowerCase() === type);
        if (!command) {
            return api.sendMessage(`⚠️ Không tìm thấy lệnh '${type}' trong hệ thống.`, tid, mid);
        }
        const cmd = command.config;
        msg = `📜 [ HƯỚNG DẪN SỬ DỤNG ]\n` +
              `━━━━━━━━━━━━━━━━━━━━━━\n` +
              `📝 Tên lệnh: ${cmd.name}\n` +
              `🕹️ Phiên bản: ${cmd.version}\n` +
              `🔑 Quyền hạn: ${TextPr(cmd.hasPermssion)}\n` +
              `🏘️ Nhóm: ${cmd.commandCategory}\n` +
              `📝 Mô tả: ${cmd.description}\n` +
              `📌 Cách dùng: ${cmd.usages}\n` +
              `⏳ Chờ: ${cmd.cooldowns}s\n` +
              `━━━━━━━━━━━━━━━━━━━━━━`;
        return api.sendMessage(msg, tid, mid);
    } else {
        const categories = {};
        for (const [name, command] of cmds) {
            const cat = command.config.commandCategory || "Chưa phân loại";
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(command.config.name);
        }

        msg = `📝 [ DANH SÁCH LỆNH ]\n` +
              `━━━━━━━━━━━━━━━━━━━━━━\n`;
        
        let count = 0;
        for (const cat in categories) {
            msg += `💎 ${cat.toUpperCase()}\n`;
            msg += `➜ ${categories[cat].join(", ")}\n\n`;
            count += categories[cat].length;
        }

        msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `📌 Hiện có ${count} lệnh trên bot\n`;
        msg += `📝 Gõ help [tên lệnh] để xem chi tiết cách dùng!`;

        return api.sendMessage(msg, tid, mid);
    }
};

function TextPr(permission) {
    return permission === 0 ? "Thành Viên" : 
           permission === 1 ? "Quản Trị Viên" : 
           permission === 2 ? "Admin Bot" : 
           "Toàn Quyền";
}
