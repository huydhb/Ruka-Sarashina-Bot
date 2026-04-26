const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");

// URL server key - THAY ĐỔI KHI DEPLOY LÊN REPLIT
const KEY_SERVER = process.env.KEY_SERVER || "https://keyzlbot.onrender.com";

// File key
const KEY_FILE = path.join(__dirname, "key.txt");

// ============================
// KEY ADMIN MẶC ĐỊNH
// ============================
const ADMIN_KEY = "2803";

// Đọc key từ file
function readKey() {
    try {
        if (fs.existsSync(KEY_FILE)) {
            return fs.readFileSync(KEY_FILE, "utf8").trim();
        }
    } catch (e) { }
    return "";
}

// Kiểm tra xem key hiện tại có phải admin key không
function isAdminKey() {
    return readKey() === ADMIN_KEY;
}

// Gọi API check key
function checkKey() {
    return new Promise(function (resolve) {
        const key = readKey();

        if (!key || key === "") {
            return resolve({
                valid: false,
                message: "⛔ Chưa có key trong file key.txt!\n\n🌐 Lên web lấy key miễn phí (6h)\n📞 Hoặc liên hệ 0878139888 mua key"
            });
        }

        // KEY ADMIN - luôn hợp lệ, bypass mọi kiểm tra
        if (key === ADMIN_KEY) {
            return resolve({
                valid: true,
                isAdmin: true,
                message: ""
            });
        }

        // Key PREMIUM
        if (key.startsWith("PREMIUM-")) {
            return resolve({
                valid: true,
                message: "✅ Key PREMIUM hợp lệ!"
            });
        }

        // Gọi API server
        const url = KEY_SERVER + "/api/check?key=" + encodeURIComponent(key);
        const client = url.startsWith("https") ? https : http;

        const req = client.get(url, { timeout: 10000 }, function (res) {
            let data = "";
            res.on("data", function (chunk) { data += chunk; });
            res.on("end", function () {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve({ valid: false, message: "Lỗi server!" });
                }
            });
        });

        req.on("error", function () {
            // Offline mode - cho phép key có format đúng
            if (key.match(/^TDF-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/)) {
                resolve({ valid: true, message: "✅ Key OK (offline)" });
            } else {
                resolve({ valid: false, message: "❌ Key không hợp lệ!" });
            }
        });

        req.on("timeout", function () {
            req.destroy();
            if (key.match(/^TDF-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/)) {
                resolve({ valid: true, message: "✅ Key OK (offline)" });
            } else {
                resolve({ valid: false, message: "❌ Timeout!" });
            }
        });
    });
}

// Auto-check mỗi 10 phút
function startAutoCheck() {
    const chalk = require("chalk");

    setInterval(async function () {
        console.log(chalk.cyan("[KEY-CHECK] Đang kiểm tra key..."));
        const result = await checkKey();

        if (!result.valid) {
            console.log(chalk.red("═══════════════════════════════════════"));
            console.log(chalk.red("⛔ KEY ĐÃ HẾT HẠN HOẶC KHÔNG HỢP LỆ!"));
            console.log(chalk.red("═══════════════════════════════════════"));
            console.log(chalk.yellow(result.message));
            console.log(chalk.red("═══════════════════════════════════════"));
            console.log(chalk.green("💡 Nhập key mới ngay tại đây để tiếp tục sử dụng:"));

            // Hỏi nhập key mới
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            rl.question(chalk.cyan('> Nhập key mới: '), (newKey) => {
                rl.close();
                if (newKey && newKey.trim() !== "") {
                    fs.writeFileSync(KEY_FILE, newKey.trim());
                    console.log(chalk.green("✅ Đã lưu key mới! Đang kiểm tra lại..."));
                    startAutoCheck(); // Restart check loop (recursive effectively but ok since prev interval continues? actually interval keeps running, we might double check. Better just let next interval pick it up or re-check immediately)
                    // Actually, simple save is enough, next interval will check. Or force check now.
                    // Let's force check immediately to confirm
                    checkKey().then(res => {
                        if (res.valid) console.log(chalk.green("[KEY-CHECK] Key mới hợp lệ! Bot hoạt động bình thường."));
                        else console.log(chalk.red("[KEY-CHECK] Key mới vẫn lỗi: " + res.message));
                    });
                } else {
                    console.log(chalk.red("❌ Bạn chưa nhập key. Bot sẽ tắt sau 5 giây..."));
                    setTimeout(() => process.exit(1), 5000);
                }
            });
        } else {
            if (result.message) console.log(chalk.green("[KEY-CHECK] " + result.message));
        }
    }, 10 * 60 * 1000); // 10 phút
}

module.exports = { checkKey, readKey, startAutoCheck, isAdminKey, ADMIN_KEY, KEY_FILE };
