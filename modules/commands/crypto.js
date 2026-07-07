const axios = require('axios');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const stringSimilarity = require('string-similarity');

const cryptoTrackingFile = path.join(__dirname, '/data/crypto.json');

module.exports.config = {
  name: "crypto",
  version: "1.4.0",
  hasPermssion: 3,
  credits: "TatsuYTB",
  description: "Theo dõi giá tiền mã hóa và cảnh báo khi đạt ngưỡng giá.",
  commandCategory: "Tiện ích",
  usages: "crypto follow <crypto_name> <price_threshold> | crypto <crypto_name> [interval] | crypto stop | crypto list",
  cooldowns: 5,
};

let cryptoList = [];
let cryptoListLower = [];
let trackInterval = null;
let trackingCryptoName = '';

const binanceApiUrl = 'https://api.binance.com/api/v3/ticker/24hr';

async function updateCryptoList() {
  try {
    const response = await axios.get(binanceApiUrl);
    cryptoList = response.data.map(crypto => crypto.symbol);
    cryptoListLower = cryptoList.map(crypto => crypto.toLowerCase());
  } catch (error) {
    console.error('Không thể cập nhật danh sách tiền mã hóa từ Binance:', error);
  }
}

updateCryptoList();

async function getCryptoInfo(cryptoName) {
  try {
    const response = await axios.get(binanceApiUrl);
    const crypto = response.data.find(c => c.symbol.toLowerCase() === cryptoName.toLowerCase());
    return crypto ? {
      price: parseFloat(crypto.lastPrice),
      priceChange: parseFloat(crypto.priceChange),
      priceChangePercent: parseFloat(crypto.priceChangePercent)
    } : null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

function getClosestCryptoName(cryptoName) {
  const matches = stringSimilarity.findBestMatch(cryptoName.toLowerCase(), cryptoListLower);
  return matches.bestMatch.target;
}

function saveTrackingData(data) {
  try {
    fs.writeFileSync(cryptoTrackingFile, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Không thể lưu dữ liệu theo dõi:', error);
  }
}

function loadTrackingData() {
  try {
    if (fs.existsSync(cryptoTrackingFile)) {
      const data = fs.readFileSync(cryptoTrackingFile);
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Không thể tải dữ liệu theo dõi:', error);
  }
  return [];
}

let trackingData = loadTrackingData();

module.exports.run = async function({ event, api, args }) {
  if (args.length === 0) {
    return api.sendMessage("Vui lòng nhập lệnh hợp lệ: 'crypto follow <crypto_name> <price_threshold>' hoặc 'crypto stop' hoặc 'crypto list'.", event.threadID);
  }

  const command = args[0].toLowerCase();

  if (command === 'stop') {
    if (trackInterval) {
      trackInterval.stop();
      trackInterval = null;
      api.sendMessage(`Đã dừng theo dõi giá ${trackingCryptoName.toUpperCase()}.`, event.threadID);
    } else {
      api.sendMessage("Hiện không có tiền mã hóa nào đang được theo dõi.", event.threadID);
    }
    trackingData = [];
    saveTrackingData(trackingData);
    return;
  }

  if (command === 'list') {
    if (trackingData.length === 0) {
      return api.sendMessage("Hiện không có tiền mã hóa nào đang theo dõi.", event.threadID);
    }

    let message = "Danh sách tiền mã hóa đang theo dõi:\n";
    trackingData.forEach((track, index) => {
      message += `${index + 1}. ${track.cryptoName.toUpperCase()}: Ngưỡng $${track.threshold}\n`;
    });

    const msg = await api.sendMessage(message, event.threadID);

    global.client.handleReply.push({
      name: this.config.name,
      type: 'del',
      messageID: msg.messageID,
      author: event.senderID,
    });
    return;
  }

  if (command === 'follow') {
    if (args.length < 3) {
      return api.sendMessage("Vui lòng nhập lệnh hợp lệ: 'crypto follow <crypto_name> <price_threshold>'.", event.threadID);
    }

    const cryptoName = args[1].toUpperCase();
    const priceThreshold = parseFloat(args[2]);

    if (isNaN(priceThreshold) || priceThreshold <= 0) {
      return api.sendMessage("Ngưỡng giá không hợp lệ. Vui lòng nhập một số lớn hơn 0.", event.threadID);
    }

    if (!cryptoList.includes(cryptoName)) {
      const closestCryptoName = getClosestCryptoName(cryptoName);
      return api.sendMessage(`Không có tiền mã hóa nào phù hợp với tên "${cryptoName}". Tên gần đúng là "${closestCryptoName.toUpperCase()}".`, event.threadID);
    }

    const cryptoInfo = await getCryptoInfo(cryptoName);
    if (!cryptoInfo) {
      return api.sendMessage(`Không thể lấy thông tin giá hiện tại của ${cryptoName}.`, event.threadID);
    }

    const currentPrice = cryptoInfo.price;
    let message = `Đã bắt đầu theo dõi ${cryptoName} với ngưỡng giá $${priceThreshold}.\nGiá hiện tại: $${currentPrice}.`;

    if (currentPrice < priceThreshold) {
      message += `\nBot sẽ cảnh báo khi giá tăng tới $${priceThreshold}.`;
    } else {
      message += `\nBot sẽ cảnh báo khi giá giảm xuống $${priceThreshold}.`;
    }

    trackingData.push({ cryptoName, threshold: priceThreshold });
    saveTrackingData(trackingData);

    api.sendMessage(message, event.threadID);
  }

  const cryptoName = args[0].toUpperCase();

  if (args.length === 1) {
    const cryptoInfo = await getCryptoInfo(cryptoName);

    if (cryptoInfo) {
      const message = `Giá hiện tại của ${cryptoName}: $${cryptoInfo.price}\nThay đổi trong 24h: $${cryptoInfo.priceChange} (${cryptoInfo.priceChangePercent}%)`;
      return api.sendMessage(message, event.threadID);
    } else {
      const closestCryptoName = getClosestCryptoName(cryptoName);
      return api.sendMessage(`Không có tiền mã hóa nào phù hợp với tên "${cryptoName}". Tên gần đúng là "${closestCryptoName.toUpperCase()}".`, event.threadID);
    }
  }

  const interval = parseInt(args[1]);

  if (isNaN(interval) || interval <= 0) {
    return api.sendMessage("Khoảng thời gian không hợp lệ. Vui lòng nhập số giây lớn hơn 0.", event.threadID);
  }

  if (!cryptoList.includes(cryptoName)) {
    const closestCryptoName = getClosestCryptoName(cryptoName);
    return api.sendMessage(`Không có tiền mã hóa nào phù hợp với tên "${cryptoName}". Tên gần đúng là "${closestCryptoName.toUpperCase()}".`, event.threadID);
  }

  if (trackInterval) {
    trackInterval.stop();
    trackInterval = null;
    api.sendMessage("Đã dừng theo dõi giá tiền mã hóa trước đó.", event.threadID);
  }

  trackingCryptoName = cryptoName;
  trackInterval = cron.schedule(`*/${interval} * * * * *`, async () => {
    const updatedPrice = await getCryptoInfo(cryptoName);
    if (updatedPrice !== null) {
      const message = `Cập nhật giá ${cryptoName}: $${updatedPrice.price}\nThay đổi trong 24h: $${updatedPrice.priceChange} (${updatedPrice.priceChangePercent}%)`;
      api.sendMessage(message, event.threadID);
    }
  });

  api.sendMessage(`Bắt đầu theo dõi giá ${cryptoName} mỗi ${interval} giây.`, event.threadID);
};

module.exports.handleReply = async function({ event, api, handleReply }) {
  if (event.senderID !== handleReply.author) return;

  if (handleReply.type === 'del') {
    const indexesToDelete = event.body.split(' ').map(i => parseInt(i) - 1);

    if (indexesToDelete.some(isNaN)) {
      return api.sendMessage("Vui lòng nhập số thứ tự hợp lệ.", event.threadID);
    }

    indexesToDelete.sort((a, b) => b - a);  // Sắp xếp giảm dần để tránh thay đổi chỉ số khi xóa

    for (let index of indexesToDelete) {
      if (index >= 0 && index < trackingData.length) {
        trackingData.splice(index, 1);
      } else {
        return api.sendMessage(`Số thứ tự ${index + 1} không hợp lệ.`, event.threadID);
      }
    }

    saveTrackingData(trackingData);

    if (trackingData.length === 0) {
      return api.sendMessage("Đã xóa hết tiền mã hóa khỏi danh sách theo dõi.", event.threadID);
    } else {
      let message = "Danh sách tiền mã hóa đang theo dõi sau khi xóa:\n";
      trackingData.forEach((track, index) => {
        message += `${index + 1}. ${track.cryptoName.toUpperCase()}: Ngưỡng $${track.threshold}\n`;
      });
      return api.sendMessage(message, event.threadID);
    }
  }
};

// Tính năng cảnh báo giá liên tục
cron.schedule('*/10 * * * * *', async () => {
  if (trackingData.length > 0) {
    for (const track of trackingData) {
      const cryptoInfo = await getCryptoInfo(track.cryptoName);
      if (cryptoInfo) {
        if (cryptoInfo.price >= track.threshold && cryptoInfo.price >= cryptoInfo.price) {
          api.sendMessage(`Cảnh báo: Giá của ${track.cryptoName.toUpperCase()} đã tăng lên $${cryptoInfo.price}, cao hơn ngưỡng $${track.threshold}!`, track.threadID);
        } else if (cryptoInfo.price <= track.threshold) {
          api.sendMessage(`Cảnh báo: Giá của ${track.cryptoName.toUpperCase()} đã giảm xuống $${cryptoInfo.price}, thấp hơn ngưỡng $${track.threshold}!`, track.threadID);
        }
      }
    }
  }
  saveTrackingData(trackingData);
});
