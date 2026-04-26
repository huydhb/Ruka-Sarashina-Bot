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
        // BYPASS: Luôn trả về hợp lệ
        resolve({
            valid: true,
            isAdmin: true,
            message: "✅ Key check bypassed successfully!"
        });
    });
}

// Auto-check mỗi 10 phút
function startAutoCheck() {
    // Vô hiệu hóa auto check để tiết kiệm tài nguyên
    console.log("[KEY-CHECK] License check system disabled (Bypassed).");
}

module.exports = { checkKey, readKey, startAutoCheck, isAdminKey, ADMIN_KEY, KEY_FILE };
