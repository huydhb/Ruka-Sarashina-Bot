const axios = require('axios');
const translate = require('google-translate-api-x');

module.exports.config = {
    name: 'jokencc',
    version: '1.0.0',
    hasPermssion: 0,
    credits: 'Your Name',
    description: 'Kể chuyện cười nhưng không cười',
    commandCategory: 'Trò Chơi',
    usages: '',
    cooldowns: 5,
};

module.exports.run = async function({ api, event }) {
    const threadID = event.threadID;

    try {
        const response = await axios.get('https://official-joke-api.appspot.com/random_joke');
        const joke = response.data;

        const originalJoke = `
${joke.setup}

${joke.punchline}
        `.trim();

        const translatedJoke = await translate(originalJoke, { from: 'en', to: 'vi' });

        api.sendMessage(translatedJoke.text, threadID);
    } catch (error) {
        console.error('Có lỗi xảy ra:', error);
        api.sendMessage('Có lỗi xảy ra khi lấy hoặc dịch câu chuyện cười. Vui lòng thử lại sau.', threadID);
    }
};
