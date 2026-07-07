const fs = require('fs');

module.exports.config = {
    name: "morse",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "TatsuYTB",
    description: "Chuyển đổi văn bản thành mã Morse và ngược lại",
    commandCategory: "Tiện ích",
    usages: "[encode|decode] [văn bản|mã Morse]",
    cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
    const { threadID, messageID } = event;

    if (args.length < 2) {
        return api.sendMessage("Sử dụng: morse [encode|decode] [văn bản|mã Morse]", threadID, messageID);
    }

    const mode = args[0].toLowerCase();
    const input = args.slice(1).join(" ");

    if (mode === "encode") {
        const morse = textToMorse(input);
        return api.sendMessage(`Mã Morse: ${morse}`, threadID, messageID);
    } else if (mode === "decode") {
        const text = morseToText(input);
        return api.sendMessage(`Văn bản: ${text}`, threadID, messageID);
    } else {
        return api.sendMessage("Chế độ không hợp lệ. Sử dụng: morse [encode|decode] [văn bản|mã Morse]", threadID, messageID);
    }
};

const morseCode = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---',
    'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-',
    'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--', 'Z': '--..',
    '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
    ' ': '/'
};

const textToMorse = (text) => {
    return text.toUpperCase().split('').map(char => morseCode[char] || char).join(' ');
};

const morseToText = (morse) => {
    const morseToChar = Object.fromEntries(Object.entries(morseCode).map(([char, morse]) => [morse, char]));
    return morse.split(' ').map(code => morseToChar[code] || code).join('');
};
