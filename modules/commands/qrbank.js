const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "qrbank",
  version: "1.2.0",
  hasPermssion: 1,
  credits: "N.Trung",
  description: "Tạo mã QR chuyển khoản VietQR",
  commandCategory: "Tiện ích",
  usages: "qr",
  cooldowns: 5,
};

// Danh sách ngân hàng sắp xếp theo yêu cầu (STT)
const sortedBankList = [
  { code: "546034", name: "CAKE by VPBank" },
  { code: "546035", name: "Ubank by VPBank" },
  { code: "963388", name: "TIMO" },
  { code: "970403", name: "Sacombank" },
  { code: "970405", name: "Agribank" },
  { code: "970407", name: "Techcombank" },
  { code: "970415", name: "VietinBank" },
  { code: "970416", name: "ACB" },
  { code: "970418", name: "BIDV" },
  { code: "970422", name: "MB Bank" },
  { code: "970423", name: "TPBank" },
  { code: "970426", name: "MSB" },
  { code: "970429", name: "SCB" },
  { code: "970431", name: "Eximbank" },
  { code: "970432", name: "VPBank" },
  { code: "970436", name: "Vietcombank" },
  { code: "970437", name: "HDBank" },
  { code: "970441", name: "VIB" },
  { code: "970443", name: "SHB" },
  { code: "970448", name: "OCB" },
  { code: "970454", name: "VietCapitalBank" },
  { code: "971005", name: "ViettelMoney" },
  { code: "971011", name: "VNPTMoney" },
];

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;
  return api.sendMessage("🔢 Nhập số tài khoản ngân hàng:", threadID, (err, info) => {
    global.client.handleReply.push({
      name: module.exports.config.name,
      step: 1,
      author: senderID,
      messageID: info.messageID,
      data: {}
    });
  });
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;
  const { step, author, data } = handleReply;
  if (senderID !== author) return;

  switch (step) {
    case 1: {
      data.accountNo = body.trim();
      return api.sendMessage("👤 Nhập tên chủ tài khoản:", threadID, (err, info) => {
        global.client.handleReply.push({
          name: module.exports.config.name,
          step: 2,
          author,
          messageID: info.messageID,
          data
        });
      });
    }

    case 2: {
      data.accountName = body.trim();

      let msg = "🏦 Danh sách ngân hàng hỗ trợ:\n────────────────\n";
      sortedBankList.forEach((bank, i) => {
        msg += `🔢 ${i + 1}. ${bank.name} (${bank.code})\n`;
      });
      msg += "────────────────\n👉 Reply số thứ tự để chọn ngân hàng.";

      return api.sendMessage(msg, threadID, (err, info) => {
        global.client.handleReply.push({
          name: module.exports.config.name,
          step: 3,
          author,
          messageID: info.messageID,
          data
        });
      });
    }

    case 3: {
      const index = parseInt(body.trim()) - 1;
      if (isNaN(index) || index < 0 || index >= sortedBankList.length)
        return api.sendMessage("❎ Số thứ tự không hợp lệ. Vui lòng thử lại.", threadID, messageID);

      const selectedBank = sortedBankList[index];
      data.acqId = selectedBank.code;
      data.bankFullName = selectedBank.name;

      return api.sendMessage("💵 Nhập số tiền cần chuyển:", threadID, (err, info) => {
        global.client.handleReply.push({
          name: module.exports.config.name,
          step: 4,
          author,
          messageID: info.messageID,
          data
        });
      });
    }

    case 4: {
      data.amount = body.trim();
      return api.sendMessage("📝 Nhập nội dung chuyển khoản:", threadID, (err, info) => {
        global.client.handleReply.push({
          name: module.exports.config.name,
          step: 5,
          author,
          messageID: info.messageID,
          data
        });
      });
    }

    case 5: {
      data.addInfo = body.trim();

      if (
        isNaN(data.accountNo) ||
        isNaN(data.acqId) ||
        isNaN(data.amount)
      ) {
        return api.sendMessage("❎ Số tài khoản, mã ngân hàng, và số tiền phải là số!", threadID, messageID);
      }

      try {
        const res = await axios.post("https://api.vietqr.io/v2/generate", {
          accountNo: data.accountNo,
          accountName: data.accountName,
          acqId: data.acqId,
          amount: parseInt(data.amount),
          addInfo: data.addInfo,
          template: "compact"
        });

        const qrData = res.data?.data?.qrDataURL;
        if (!qrData) return api.sendMessage("❎ Không thể tạo QR. Thử lại sau!", threadID, messageID);

        const qrBuffer = Buffer.from(qrData.replace(/^data:image\/png;base64,/, ""), "base64");
        const filePath = path.join(__dirname, "cache", `qr-${Date.now()}.png`);
        fs.writeFileSync(filePath, qrBuffer);

        const result = `✅ Mã QR đã tạo:\n────────────────\n🏦 ${data.bankFullName} (${data.acqId})\n🔢 STK: ${data.accountNo}\n👤 Chủ TK: ${data.accountName}\n💰 Số tiền: ${parseInt(data.amount).toLocaleString()} VND\n📝 Nội dung: ${data.addInfo}`;

        return api.sendMessage({
          body: result,
          attachment: fs.createReadStream(filePath)
        }, threadID, () => fs.unlinkSync(filePath), messageID);

      } catch (e) {
        console.error(e);
        return api.sendMessage("❎ Đã có lỗi xảy ra khi tạo mã QR!", threadID, messageID);
      }
    }

    default: return;
  }
};