const axios = require("axios");
const fs = require('fs'), path = require('path');

const GROQ_API_KEY = (() => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, '../../config.json'), 'utf8')).GROQ_API_KEY || ''; } catch(e) { return ''; } })();

module.exports.config = {
  name: "ask",
  version: "4.0.0",
  hasPermssion: 0,
  credits: "TDF-2803",
  description: "Chat voi AI Groq",
  commandCategory: "Nguoi dung",
  usages: "[cau hoi]",
  cooldowns: 3,
  usePrefix: true,
};

async function chat(prompt) {
  try {
    const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
      messages: [
        { role: "system", content: "Ban la TDF-Bot. Tra loi ngan gon bang tieng Viet." },
        { role: "user", content: prompt }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024
    }, {
      headers: {
        "Authorization": "Bearer " + GROQ_API_KEY,
        "Content-Type": "application/json"
      },
      timeout: 30000
    });
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Loi Groq:", error.message);
    throw error;
  }
}

module.exports.run = async function ({ api, event, args }) {
  try {
    var query = args.join(" ");
    if (event.type === "message_reply" && event.messageReply) {
      query = query + " " + event.messageReply.body;
    }

    if (!query || query.trim() === "") {
      return api.sendMessage("Ban muon hoi gi?", event.threadID, event.messageID);
    }

    var result = await chat(query);

    // Reply truc tiep vao tin nhan nguoi hoi
    return api.sendMessage(result, event.threadID, event.messageID);

  } catch (error) {
    return api.sendMessage("Loi roi, thu lai sau!", event.threadID, event.messageID);
  }
};