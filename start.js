/**
 * Auto Restart Bot Script
 * Tự động khởi động lại bot khi bị crash, tối đa 5 lần
 * Sử dụng: node start.js
 */

const { spawn } = require('child_process');
const path = require('path');

const MAX_RESTARTS = 5;
const RESTART_DELAY = 3000; // 3 giây delay trước khi restart

let restartCount = 0;
let botProcess = null;

function log(message) {
    const time = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    console.log(`[${time}] ${message}`);
}

function startBot() {
    log(`🚀 Đang khởi động bot... (Lần ${restartCount + 1}/${MAX_RESTARTS + 1})`);

    botProcess = spawn('node', ['index.js'], {
        cwd: __dirname,
        stdio: 'inherit',
        shell: true
    });

    botProcess.on('exit', (code, signal) => {
        if (code === 0) {
            log('✅ Bot đã tắt bình thường.');
            process.exit(0);
        } else {
            log(`❌ Bot bị crash! Exit code: ${code}, Signal: ${signal}`);

            restartCount++;

            if (restartCount <= MAX_RESTARTS) {
                log(`🔄 Đang restart... (${restartCount}/${MAX_RESTARTS})`);
                setTimeout(startBot, RESTART_DELAY);
            } else {
                log(`⛔ Đã vượt quá ${MAX_RESTARTS} lần restart. Dừng lại.`);
                process.exit(1);
            }
        }
    });

    botProcess.on('error', (err) => {
        log(`❌ Lỗi khi khởi động bot: ${err.message}`);

        restartCount++;

        if (restartCount <= MAX_RESTARTS) {
            log(`🔄 Đang restart... (${restartCount}/${MAX_RESTARTS})`);
            setTimeout(startBot, RESTART_DELAY);
        } else {
            log(`⛔ Đã vượt quá ${MAX_RESTARTS} lần restart. Dừng lại.`);
            process.exit(1);
        }
    });
}

// Xử lý Ctrl+C
process.on('SIGINT', () => {
    log('⏹️ Đang tắt bot...');
    if (botProcess) {
        botProcess.kill('SIGINT');
    }
    process.exit(0);
});

// Bắt đầu
log('========================================');
log('   AUTO RESTART BOT - MAX 5 RESTARTS   ');
log('========================================');
startBot();
