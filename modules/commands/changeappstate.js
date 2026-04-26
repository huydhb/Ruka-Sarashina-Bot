const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: "changeappstate",
    version: "2.0.0",
    hasPermssion: 2, // Tất cả admin đều có thể dùng
    credits: "Bot",
    description: "Thay đổi appstate với backup an toàn và tự động khôi phục nếu lỗi",
    commandCategory: "Admin",
    usages: '/changeappstate [appstate JSON]',
    cooldowns: 10
};

const botDir = path.join(__dirname, '../..');
const appstatePath = path.join(botDir, 'appstate.json');
const backupPath = path.join(botDir, 'appstate_backup.json');
const retryPath = path.join(botDir, 'appstate_retry.json');

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;

    // Kiểm tra quyền admin (cả admin chính và admin phụ)
    const { NDH, ADMINBOT } = global.config;
    const isMainAdmin = NDH && (NDH.includes(senderID.toString()) || NDH.includes(senderID));
    const isSubAdmin = ADMINBOT && (ADMINBOT.includes(senderID.toString()) || ADMINBOT.includes(senderID));

    if (!isMainAdmin && !isSubAdmin) {
        return api.sendMessage("⚠️ Chỉ Admin mới được dùng lệnh này!", threadID, messageID);
    }

    const newAppstateStr = args.join(" ").trim();

    if (!newAppstateStr) {
        return api.sendMessage(
            "📋 Cách dùng: /changeappstate [appstate JSON]\n\n" +
            "Ví dụ: /changeappstate [{\"key\":\"...\", ...}]\n\n" +
            "📌 Lưu ý:\n" +
            "• Bot sẽ tự động backup appstate cũ\n" +
            "• Nếu appstate mới lỗi, bot sẽ thử lại tối đa 3 lần\n" +
            "• Sau 3 lần thất bại, bot sẽ khôi phục appstate cũ",
            threadID, messageID
        );
    }

    // Parse và validate appstate mới
    let newAppstate;
    try {
        newAppstate = JSON.parse(newAppstateStr);

        if (!Array.isArray(newAppstate)) {
            return api.sendMessage("❌ Appstate phải là một mảng JSON!", threadID, messageID);
        }

        if (newAppstate.length === 0) {
            return api.sendMessage("❌ Appstate không được rỗng!", threadID, messageID);
        }

        // Kiểm tra cấu trúc cơ bản của appstate
        const hasValidStructure = newAppstate.some(item =>
            item && (item.key || item.name) && item.value !== undefined
        );
        if (!hasValidStructure) {
            return api.sendMessage("❌ Cấu trúc appstate không hợp lệ! Cần có key/name và value.", threadID, messageID);
        }
    } catch (e) {
        return api.sendMessage("❌ Lỗi parse JSON! Kiểm tra lại định dạng appstate.\n\nChi tiết: " + e.message, threadID, messageID);
    }

    try {
        // 1. Backup appstate cũ (bản nháp)
        if (fs.existsSync(appstatePath)) {
            const oldAppstate = fs.readFileSync(appstatePath, 'utf8');
            fs.writeFileSync(backupPath, oldAppstate, 'utf8');
            console.log('[CHANGEAPPSTATE] ✅ Đã backup appstate cũ vào appstate_backup.json');
        }

        // 2. Lưu thông tin retry để main.js kiểm tra khi khởi động
        const retryInfo = {
            threadID: threadID,
            retryCount: 0,
            maxRetry: 3,
            timestamp: Date.now(),
            newAppstateApplied: true
        };
        fs.writeFileSync(retryPath, JSON.stringify(retryInfo, null, 2), 'utf8');
        console.log('[CHANGEAPPSTATE] 📝 Đã lưu thông tin retry');

        // 3. Ghi appstate mới
        fs.writeFileSync(appstatePath, JSON.stringify(newAppstate, null, 2), 'utf8');
        console.log('[CHANGEAPPSTATE] ✅ Đã ghi appstate mới');

        // 4. Thông báo và restart
        api.sendMessage(
            "✅ Đã lưu appstate mới!\n" +
            "🔄 Bot sẽ khởi động lại trong 3 giây...\n\n" +
            "📌 Nếu thành công: Bot sẽ báo 'Thay appstate thành công bot đã khởi động'\n" +
            "📌 Nếu thất bại 3 lần: Bot sẽ khôi phục appstate cũ và báo lỗi",
            threadID, () => {
                setTimeout(() => {
                    console.log('[CHANGEAPPSTATE] 🔄 Đang khởi động lại bot...');
                    process.exit(1); // Restart bot
                }, 3000);
            }
        );

    } catch (error) {
        console.error('[CHANGEAPPSTATE] ❌ Lỗi:', error);
        return api.sendMessage("❌ Lỗi khi thay appstate: " + error.message, threadID, messageID);
    }
};

// Hàm tĩnh để kiểm tra và xử lý retry khi bot khởi động
// Sẽ được gọi từ main.js
module.exports.checkAndHandleRetry = async function (api) {
    try {
        if (!fs.existsSync(retryPath)) {
            return { needsRetry: false };
        }

        const retryInfo = JSON.parse(fs.readFileSync(retryPath, 'utf8'));

        // Kiểm tra xem retry info có còn hợp lệ không (trong 5 phút)
        if (Date.now() - retryInfo.timestamp > 5 * 60 * 1000) {
            console.log('[CHANGEAPPSTATE] ⏰ Retry info đã hết hạn, xóa file');
            fs.unlinkSync(retryPath);
            return { needsRetry: false };
        }

        return {
            needsRetry: retryInfo.newAppstateApplied,
            retryInfo: retryInfo
        };
    } catch (error) {
        console.error('[CHANGEAPPSTATE] Lỗi đọc retry info:', error);
        return { needsRetry: false };
    }
};

// Xử lý khi bot khởi động thành công
module.exports.onLoginSuccess = async function (api) {
    try {
        if (!fs.existsSync(retryPath)) {
            return;
        }

        const retryInfo = JSON.parse(fs.readFileSync(retryPath, 'utf8'));

        if (!retryInfo.newAppstateApplied) {
            return;
        }

        // Bot khởi động thành công với appstate mới
        console.log('[CHANGEAPPSTATE] ✅ Bot khởi động thành công với appstate mới');

        // Xóa file retry
        fs.unlinkSync(retryPath);

        // Xóa file backup (không cần nữa vì appstate mới hoạt động)
        if (fs.existsSync(backupPath)) {
            fs.unlinkSync(backupPath);
            console.log('[CHANGEAPPSTATE] 🗑️ Đã xóa backup (không cần nữa)');
        }

        // Thông báo thành công vào nhóm
        if (retryInfo.threadID) {
            api.sendMessage("✅ Thay appstate thành công bot đã khởi động", retryInfo.threadID);
        }

    } catch (error) {
        console.error('[CHANGEAPPSTATE] Lỗi xử lý onLoginSuccess:', error);
    }
};

// Xử lý khi bot khởi động thất bại
module.exports.onLoginFail = async function () {
    try {
        if (!fs.existsSync(retryPath)) {
            return { shouldRestore: false };
        }

        const retryInfo = JSON.parse(fs.readFileSync(retryPath, 'utf8'));

        if (!retryInfo.newAppstateApplied) {
            return { shouldRestore: false };
        }

        retryInfo.retryCount = (retryInfo.retryCount || 0) + 1;
        console.log(`[CHANGEAPPSTATE] ⚠️ Lần thử ${retryInfo.retryCount}/${retryInfo.maxRetry}`);

        if (retryInfo.retryCount >= retryInfo.maxRetry) {
            // Đã thử đủ 3 lần, khôi phục appstate cũ
            console.log('[CHANGEAPPSTATE] ❌ Đã thử 3 lần thất bại, khôi phục appstate cũ...');

            if (fs.existsSync(backupPath)) {
                const oldAppstate = fs.readFileSync(backupPath, 'utf8');
                fs.writeFileSync(appstatePath, oldAppstate, 'utf8');
                console.log('[CHANGEAPPSTATE] ✅ Đã khôi phục appstate cũ');

                // Xóa file backup
                fs.unlinkSync(backupPath);
            }

            // Cập nhật retry info để thông báo lỗi
            retryInfo.newAppstateApplied = false;
            retryInfo.failedAndRestored = true;
            fs.writeFileSync(retryPath, JSON.stringify(retryInfo, null, 2), 'utf8');

            return {
                shouldRestore: true,
                threadID: retryInfo.threadID
            };
        } else {
            // Vẫn còn lần thử, cập nhật retry count
            fs.writeFileSync(retryPath, JSON.stringify(retryInfo, null, 2), 'utf8');
            return { shouldRestore: false, shouldRetry: true };
        }

    } catch (error) {
        console.error('[CHANGEAPPSTATE] Lỗi xử lý onLoginFail:', error);
        return { shouldRestore: false };
    }
};

// Thông báo lỗi sau khi khôi phục
module.exports.notifyRestoreError = async function (api) {
    try {
        if (!fs.existsSync(retryPath)) {
            return;
        }

        const retryInfo = JSON.parse(fs.readFileSync(retryPath, 'utf8'));

        if (retryInfo.failedAndRestored && retryInfo.threadID) {
            api.sendMessage("❌ Lỗi appstate vui lòng đổi cái khác", retryInfo.threadID);

            // Xóa file retry sau khi thông báo
            fs.unlinkSync(retryPath);
        }
    } catch (error) {
        console.error('[CHANGEAPPSTATE] Lỗi thông báo restore:', error);
    }
};
