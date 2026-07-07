module.exports.config = { 
    name: "kbb",
    version: "1.2.0",
    hasPermssion: 0,
    credits: "D-Jukie",
    description: "Kéo búa bao (Oẳn tù tì) ngẫu nhiên",
    commandCategory: "Trò Chơi",
    usages: "[kéo/búa/bao] [số tiền]",
    cooldowns: 0
};

module.exports.run = async function({ api, event, args, Currencies }) {
    const { threadID, messageID, senderID } = event;
    const money = (await Currencies.getData(senderID)).money;

    const choices = ["kéo", "búa", "bao"];
    const icons = { "kéo": "✌", "búa": "✊", "bao": "✋" };

    if (!args[0]) return api.sendMessage("Cách chơi: kbb kéo/búa/bao số tiền ví dụ: kbb kéo 1000", threadID, messageID);
    const userChoice = args[0].toLowerCase();
    if (!choices.includes(userChoice)) return api.sendMessage("Lựa chọn không hợp lệ! Chọn kéo, búa hoặc bao.", threadID, messageID);

    const coins = parseInt(args[1]) || 0;
    if (coins < 50) return api.sendMessage("Mức cược phải >= 50$", threadID, messageID);
    if (money < coins) return api.sendMessage(`Bạn không đủ ${coins}$ để chơi`, threadID, messageID);

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
const botChoice = randomChoice(choices);


    // So sánh kết quả
    let result, moneyChange;
    if (userChoice === botChoice) {
        result = "Hòa";
        moneyChange = 0;
    } else if (
        (userChoice === "kéo" && botChoice === "bao") ||
        (userChoice === "búa" && botChoice === "kéo") ||
        (userChoice === "bao" && botChoice === "búa")
    ) {
        result = "Bạn thắng";
        moneyChange = coins;
        await Currencies.setData(senderID, { money: money + coins });
    } else {
        result = "Bạn thua";
        moneyChange = -coins;
        await Currencies.setData(senderID, { money: money - coins });
    }

    const msg = `
Kết quả:
Người: ${icons[userChoice]} ${userChoice}
Bot: ${icons[botChoice]} ${botChoice}

${result} ${moneyChange > 0 ? `→ Cộng: ${moneyChange}$` : moneyChange < 0 ? `→ Trừ: ${-moneyChange}$` : ""}
    `;
    return api.sendMessage(msg, threadID, messageID);
};
