const moment = require('moment-timezone');

module.exports.config = {
    name: "bank",
    version: "0.0.1",
    hasPermssion: 0,
    credits: "D-Jukie-keychinhle (chinhle đã sủi)",
    description: "",
    commandCategory: "Tiện ích",
    usages: "",
    cooldowns: 0,
    dependencies: {
        "fs-extra": "",
        "request": "",
        "axios": ""
    }
};

module.exports.onLoad = async () => {
    const { existsSync, writeFileSync, mkdirSync } = require("fs-extra");
    const { join } = require("path");
    const dir = join(__dirname, 'data');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const pathData = join(__dirname, 'data/bank.json');
    if (!existsSync(pathData)) writeFileSync(pathData, "[]", "utf-8");

    setInterval(checkAndCalculateInterest, 1 * 60 * 60 * 1000);
    return;
};

async function checkAndCalculateInterest() {
    const { readFileSync, writeFileSync } = require("fs-extra");
    const { join } = require("path");
    const pathData = join(__dirname, 'data/bank.json');
    const laisuat = 0.05;

    let user = JSON.parse(readFileSync(pathData, "utf-8"));
    const now = moment();

    user = user.map(account => {
        if (!account.lastInterestTime) {
            account.lastInterestTime = now.toISOString();
            return account;
        }

        const lastTime = moment(account.lastInterestTime);
        const diffHours = now.diff(lastTime, 'hours');

        if (diffHours >= 12) {
            // Tính lãi
            let updatedMoney = BigInt(account.money) + (BigInt(account.money) * BigInt(Math.floor(laisuat * 100))) / BigInt(100); 
            account.money = String(updatedMoney);
            account.lastInterestTime = now.toISOString();
        }

        return account;
    });

    writeFileSync(pathData, JSON.stringify(user, null, 2));
    console.log('Đã kiểm tra và tính lãi nếu đủ 12 giờ.');
}

module.exports.run = async function({ api, event, args, Currencies }) {
    const { threadID, messageID, senderID } = event;
    const { readFileSync, writeFileSync } = require("fs-extra");
    const { join } = require("path");
    const pathData = join(__dirname, 'data/bank.json');
    const timeIM = 12; 

    try {
        let user = JSON.parse(readFileSync(pathData, "utf-8"));

        if (args[0] == '-r' || args[0] == 'register') {
            if (!user.find(i => i.senderID == senderID)) {
                const newUser = { senderID: senderID, money: "0", lastInterestTime: moment().toISOString() };
                user.push(newUser);
                writeFileSync(pathData, JSON.stringify(user, null, 2));
                return api.sendMessage(`[ ✅ SUCCESS ] - Bạn đã đăng kí thành công, gửi ít nhất 10000$ để có lãi💰`, threadID, messageID);
            } else {
                return api.sendMessage(`[ ⚠️ WARNING ] - Bạn đã có tài khoản trên hệ thống MIRAI Bank🏦`, threadID, messageID);
            }
        }

        if (args[0] == 'check' || args[0] == 'coins') {
            if (!user.find(i => i.senderID == senderID)) {
                return api.sendMessage(`[⚠️ WARNING] - Bạn chưa đăng kí sử dụng banking, ${global.config.PREFIX}${this.config.name} register để đăng kí🏦`, threadID, messageID);
            } else {
                const userData = user.find(i => i.senderID == senderID);
                const lastInterestTime = moment(userData.lastInterestTime).format('HH:mm:ss DD/MM/YYYY');
                return api.sendMessage(`[ BANKING ] - Số tiền bạn gửi Mirai Bank là: ${formatNumber(userData.money)}$\n💷 Lãi: 5% mỗi ${timeIM} giờ\n🕒 Lần cuối tính lãi: ${lastInterestTime}`, threadID, messageID);
            }
        }

        if (args[0] == 'gửi' || args[0] == 'send') {
            if (!args[1] || isNaN(args[1])) return api.sendMessage("[❎ FAILED] - Số tiền gửi vào phải là một con số", threadID, messageID);
            if (!user.find(i => i.senderID == senderID)) {
                return api.sendMessage(`[⚠️ WARNING] - Bạn chưa đăng kí sử dụng banking, ${global.config.PREFIX}${this.config.name} register để đăng kí🏦`, threadID, messageID);
            } else {
                let balances = (await Currencies.getData(senderID)).money;
                let balance = args[1] !== 'all' ? BigInt(args[1]) : BigInt(balances);
                if (balance < 10000n) return api.sendMessage('[ ⚠️ WARNING ] - Số tiền gửi ngân hàng phải lớn hơn 10,000', threadID, messageID);
                if (balance > BigInt(balances)) return api.sendMessage(`[ ⚠️ WARNING ] - Số dư không đủ ${formatNumber(balance)} để gửi vào Mirai Bank💰`, threadID, messageID);

                let userData = user.find(i => i.senderID == senderID);
                userData.money = String(BigInt(userData.money) + balance);

                writeFileSync(pathData, JSON.stringify(user, null, 2));
                await Currencies.decreaseMoney(senderID, Number(balance));
                return api.sendMessage(`[ ✅ SUCCESS ] - Bạn vừa gửi ${formatNumber(balance)}$ vào Mirai Bank\n💷 Lãi: 5% mỗi ${timeIM} giờ`, threadID, messageID);
            }
        }

        if (args[0] == 'rút' || args[0] == 'lấy') {
            if (!args[1] || isNaN(args[1])) return api.sendMessage("[⚠️ WARNING] - Vui lòng nhập số tiền 💰", threadID, messageID);
            if (!user.find(i => i.senderID == senderID)) {
                return api.sendMessage(`[⚠️ WARNING] - Bạn chưa đăng kí sử dụng banking, ${global.config.PREFIX}${this.config.name} register để đăng kí🏦`, threadID, messageID);
            } else {
                let userData = user.find(i => i.senderID == senderID);
                let money = args[1] !== 'all' ? BigInt(args[1]) : BigInt(userData.money);
                if (money < 10000n) return api.sendMessage('[ ⚠️ WARNING ] - Số tiền rút ngân hàng phải lớn hơn 10,000', threadID, messageID);
                if (money > BigInt(userData.money)) return api.sendMessage('[ ⚠️ WARNING ] - Số dư của bạn không đủ để thực hiện giao dịch này!', threadID, messageID);

                await Currencies.increaseMoney(senderID, Number(money));
                userData.money = String(BigInt(userData.money) - money);
                writeFileSync(pathData, JSON.stringify(user, null, 2));
                return api.sendMessage(`[ BANKING ] - Rút thành công ${formatNumber(money)}$, số dư còn lại là ${formatNumber(userData.money)}$`, threadID, messageID);
            }
        } else {
            return api.sendMessage(`=====🏦MIRAI BANK🏦=====\n\n${global.config.PREFIX}${this.config.name} register -> Đăng kí gửi tiền tại MIRAI Bank💹\n${global.config.PREFIX}${this.config.name} check -> Xem số tiền trong MIRAI Bank💳\n${global.config.PREFIX}${this.config.name} gửi 10000 -> Gửi tiền vào Mirai Bank💷\n${global.config.PREFIX}${this.config.name} rút 10000 -> Rút tiền từ Mirai Bank💰`, threadID, messageID);
        }
    } catch (e) {
        console.error(e);
        return api.sendMessage("[⚠️ ERROR] - Đã xảy ra lỗi trong quá trình thực hiện.", threadID, messageID);
    }
};

function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
