const fs = require("fs");
const { get } = require("axios");
const moment = require("moment-timezone");

moment.locale("vi");

module.exports.config = {
    name: 'autosend',
    version: '1.1.0',
    hasPermssion: 3,
    credits: 'TatsuYTB',
    description: 'Tự động gửi tin nhắn theo giờ, có thể bật/tắt theo nhóm',
    commandCategory: 'Hệ Thống',
    usages: '[on | off | test]',
    cooldowns: 3
};

const r = a => a[Math.floor(Math.random() * a.length)];

const config = [
    {
        timer: '07:00',
        message: ['Bây giờ là {gio}\nChúc các bạn có 1 buổi sáng vui vẻ :3\nHôm nay là: {thu}\nFact: {fact}']
    },
    {
        timer: '10:00',
        message: ['Bây giờ là 10:00\nChúc các bạn có 1 buổi trưa vui vẻ :3\nFact: {fact}']
    },
    {
        timer: '19:00',
        message: ['Bây giờ là 19:00\nChúc các bạn có 1 buổi tối vui vẻ :3\nFact: {fact}']
    },
    {
        timer: '22:00',
        message: ['Bây giờ là 22:00\nChúc các bạn ngủ ngon <3\nFact: {fact}']
    }
];

let lastSentTime = {};
const dataPath = __dirname + "/data/autosend.json";

function loadData() {
    if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, JSON.stringify({}));
    return JSON.parse(fs.readFileSync(dataPath));
}

function saveData(data) {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

async function getFact() {
    try {
        const factRes = await get("https://api.popcat.xyz/fact", {
            headers: { "Accept": "application/json" }
        });
        let fact = factRes.data.fact;

        const translateRes = await get(`https://translate.googleapis.com/translate_a/single`, {
            params: {
                client: "gtx",
                sl: "auto",
                tl: "vi",
                dt: "t",
                q: fact
            }
        });

        if (Array.isArray(translateRes.data)) {
            fact = translateRes.data[0][0][0];
        }
        return fact;
    } catch {
        return "Không thể lấy fact lúc này.";
    }
}

async function buildMessage(template) {
    const now = moment().tz("Asia/Ho_Chi_Minh");
    const thu = now.format("dddd");
    const fact = await getFact();

    return template
        .replace(/{gio}/g, now.format("HH:mm:ss (D/MM/YYYY)"))
        .replace(/{thu}/g, thu)
        .replace(/{fact}/g, fact);
}

module.exports.onLoad = o => {
    if (!!global.autosendmessage_setinterval) clearInterval(global.autosendmessage_setinterval);

    global.autosendmessage_setinterval = setInterval(async function () {
        try {
            const now = moment().tz("Asia/Ho_Chi_Minh");
            const currentTime = now.format("HH:mm");

            const task = config.find(i => i.timer === currentTime);
            if (!task) return;

            if (lastSentTime[currentTime] === now.format("HH:mm")) return;
            lastSentTime[currentTime] = now.format("HH:mm");

            const data = loadData();
            for (const threadID of global.data.allThreadID) {
                if (data[threadID] && data[threadID].enabled) {
                    const msgTemplate = r(task.message);
                    const msg = await buildMessage(msgTemplate);
                    o.api.sendMessage({ body: msg }, threadID).catch(() => {});
                }
            }
        } catch (err) { }
    }, 1000);
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    let data = loadData();

    if (!data[threadID]) data[threadID] = { enabled: false };

    const action = args[0]?.toLowerCase();

    switch (action) {
        case "on":
            data[threadID].enabled = true;
            saveData(data);
            return api.sendMessage("✅ Đã bật autosend cho nhóm này.", threadID, messageID);

        case "off":
            data[threadID].enabled = false;
            saveData(data);
            return api.sendMessage("❌ Đã tắt autosend cho nhóm này.", threadID, messageID);

        case "test":
            if (!data[threadID].enabled) 
                return api.sendMessage("⚠️ Autosend hiện đang tắt trong nhóm này. Bật bằng lệnh: autosend on", threadID, messageID);

            const msgTemplate = r(config[0].message); // test dùng mẫu đầu tiên
            const msg = await buildMessage(msgTemplate);
            return api.sendMessage({ body: "[TEST AUTOSEND]\n" + msg }, threadID, messageID);

        default:
            return api.sendMessage(
                "⚙️ Sử dụng: \n" +
                "• autosend on → bật autosend cho nhóm\n" +
                "• autosend off → tắt autosend cho nhóm\n" +
                "• autosend test → gửi thử 1 tin autosend ngay lập tức",
                threadID, messageID
            );
    }
};
