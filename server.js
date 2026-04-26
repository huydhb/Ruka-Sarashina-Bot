/**
 * Render Keep-Alive Server
 * Giữ cho Render biết bot đang chạy
 */
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.json({
        status: '🟢 Online',
        bot: process.env.BOT_NAME || 'Ruka-Sarashina-Bot',
        uptime: Math.floor(process.uptime()) + 's',
        time: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
    });
});

app.get('/health', (req, res) => res.sendStatus(200));

app.listen(PORT, () => {
    console.log(`[SERVER] Keep-alive server running on port ${PORT}`);
});

module.exports = app;
