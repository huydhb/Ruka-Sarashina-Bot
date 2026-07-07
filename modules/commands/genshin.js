const axios = require('axios');
const cheerio = require('cheerio');

module.exports.config = {
    name: "genshin",
    version: "1.1.0",
    hasPermssion: 3,
    credits: "TatsuYTB",
    description: "Fetch information about a Genshin Impact character or weapon",
    commandCategory: "Hệ Thống",
    usages: "[character/weapon] [name]",
    cooldowns: 5,
    handleReaction: true
};

module.exports.languages = {
    "vi": {
        "fetching": "Đang lấy thông tin về %1 %2...",
        "notFound": "Không tìm thấy thông tin về %1 %2.",
        "characterInfo": "Tên: %1\nNguyên tố: %2\nQuốc gia: %3\nNhân vật: %7\nNgày sinh nhật: %4\nNgày ra mắt: %5\nĐã ra mắt được: %6",
        "weaponInfo": "Tên: %1\nLoại: %2\nĐộ hiếm: %3 ★\nTấn Công Căn Bản: %5\n%6: %7 %\nTinh Luyện: %8\nMô tả: %4",
        "suggestions": "Bạn có ý định tìm: %1?"
    },
    "en": {
        "fetching": "Fetching information about %1 %2...",
        "notFound": "Information about %1 %2 not found.",
        "characterInfo": "Name: %1\nElement: %2\nNation: %3\nBirthday: %4\nRelease Date: %5\nReleased: %6\nStars: %7",
        "weaponInfo": "Name: %1\nType: %2\nRarity: %3\nBasic Attack: %6\nEffect: %4\nSubstat: %7\nDescription: %5",
        "suggestions": "Did you mean: %1?"
    }
};

const elementTranslation = {
    "Dendro": "Thảo",
    "Pyro": "Hỏa",
    "Hydro": "Thủy",
    "Electro": "Lôi",
    "Anemo": "Phong",
    "Cryo": "Băng",
    "Geo": "Nham"
};

const translateElement = (element) => {
    return elementTranslation[element] || element;
};

const formatDate = (dateString) => {
    const months = {
        "January": 1, "February": 2, "March": 3, "April": 4, "May": 5, "June": 6,
        "July": 7, "August": 8, "September": 9, "October": 10, "November": 11, "December": 12
    };
    const [month, day, year] = dateString.split(' ');
    return `${parseInt(day)}/${months[month]}/${year}`;
};

const formatBirthday = (birthday) => {
    const months = {
        "January": 1, "February": 2, "March": 3, "April": 4, "May": 5, "June": 6,
        "July": 7, "August": 8, "September": 9, "October": 10, "November": 11, "December": 12
    };
    const [month, day] = birthday.split(' ');
    return `${parseInt(day)}/${months[month]}`;
};

const translateReleasedTime = (releasedTime) => {
    let time = releasedTime.replace('years', 'năm').replace('year', 'năm').replace('months', 'tháng').replace('month', 'tháng').replace('ago', 'trước');
    return time;
};

const modifyCharacterName = (characterName) => {
    return characterName.split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join('_');
};

const modifyWeaponName = (weaponName) => {
    return weaponName.split(' ').join('_');
};

const knownCharacters = [
    // List of known characters
];

const knownWeapons = [
    // List of known weapons
];

const levenshteinDistance = (a, b) => {
    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1, // insertion
                    matrix[i - 1][j] + 1 // deletion
                );
            }
        }
    }

    return matrix[b.length][a.length];
};

const getClosestMatches = (input, list, maxDistance = 3) => {
    const distances = list.map(name => ({
        name,
        distance: levenshteinDistance(input.toLowerCase(), name.toLowerCase())
    }));

    distances.sort((a, b) => a.distance - b.distance);

    return distances.filter(item => item.distance <= maxDistance).map(item => item.name);
};

const fetchCharacterInfo = async (characterName) => {
    const modifiedName = modifyCharacterName(characterName);
    const url = `https://genshin-impact.fandom.com/wiki/${encodeURIComponent(modifiedName)}`;

    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const name = $('h1.page-header__title').text().trim();
        if (!name) {
            const suggestions = getClosestMatches(characterName, knownCharacters);
            return { suggestions };
        }

        const element = $('td[data-source="element"] a').attr('title').trim();
        const translatedElement = translateElement(element);
        const nation = $('div[data-source="region"] > div').text().trim();
        const birthday = $('div[data-source="birthday"] > div').text().trim();
        const formattedBirthday = formatBirthday(birthday);

        const releaseDateElement = $('div[data-source="releaseDate"] > div.pi-data-value').html().split('<br>');
        const releaseDate = releaseDateElement[0].trim();
        const formattedReleaseDate = formatDate(releaseDate);
        const releasedTime = releaseDateElement[1].trim();
        const translatedReleasedTime = translateReleasedTime(releasedTime);

        const starsElement = $('td[data-source="quality"] img').attr('title').trim();
        const stars = starsElement ? starsElement.replace('Stars', 'Sao') : "Unknown";

        return { name, element: translatedElement, nation, birthday: formattedBirthday, releaseDate: formattedReleaseDate, releasedTime: translatedReleasedTime, stars };
    } catch (error) {
        console.error("Error fetching character info:", error);
        const suggestions = getClosestMatches(characterName, knownCharacters);
        return { suggestions };
    }
};

const fetchWeaponInfo = async (weaponName) => {
    const modifiedName = modifyWeaponName(weaponName);
    const url = `https://genshin-builds.com/vi/weapon/${encodeURIComponent(modifiedName)}`;

    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const nameStarsElement = $('h1.mr-2.text-3xl.text-white').text().trim();
        const nameMatch = nameStarsElement.match(/(.*)\s\((\d)★\)/);
        if (!nameMatch) {
            const suggestions = getClosestMatches(weaponName, knownWeapons);
            return { suggestions };
        }

        const name = nameMatch[1].trim();
        const stars = nameMatch[2].trim();

        const type = $('ul li:contains("Loại:")').text().replace('Loại: ', '').trim();
        const substat = $('ul li:contains("Thứ hai:")').text().replace('Thứ hai: ', '').trim();
        const description = $('div.flex.flex-grow.flex-col > div:last-child').text().trim();

        const basicAttackElement = $('div.text-xl:contains("Tấn Công Căn Bản")').text().trim();
        const basicAttack = basicAttackElement.replace('Tấn Công Căn Bản: ', '').trim();

        let critRate = null;
        const critRateLabels = ["ST Bạo Kích", "HP", "Hiệu Quả Nạp Nguyên Tố", "Tỉ Lệ Bạo Kích"];

        for (let i = 0; i < critRateLabels.length; i++) {
            const critRateLabel = critRateLabels[i];
            const elements = $(`div.text-xl:contains("${critRateLabel}")`);

            elements.each((index, element) => {
                const text = $(element).text().trim();
                if (text.includes(critRateLabel)) {
                    critRate = critRate || {};
                    const critRateValue = text.replace(`${critRateLabel}: `, '').trim().match(/\d+/)[0];
                    critRate = critRateValue;
                    return false;
                }
            });

            if (critRate) {
                break;
            }
        }

        const refinement = $('div.mb-8 h2:contains("Tinh luyện")').next('div.card').text().trim();

        console.log("Fetched weapon info:", { name, type, stars, description, basicAttack, substat, critRate, refinement });

        return { name, type, stars, description, basicAttack, substat, critRate, refinement };
    } catch (error) {
        console.error("Error fetching weapon info:", error);
        const suggestions = getClosestMatches(weaponName, knownWeapons);
        return { suggestions };
    }
};

const fetchMaxLevelWeaponInfo = async (weaponName) => {
    const modifiedName = modifyWeaponName(weaponName);
    const url = `https://genshin-builds.com/vi/weapon/${encodeURIComponent(modifiedName)}`;

    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const buttonSelector = 'button.mx-2.my-1.rounded.border.p-1.px-4.border-gray-700.bg-vulcan-700.text-white.hover\\:bg-vulcan-600';
        const buttonRefinementSelector = 'button.mx-2.my-1.rounded.border.p-1.px-4.border-gray-800.bg-vulcan-800';

        for (let i = 0; i < 1; i++) {
            $(buttonSelector).click();
        }

        const maxLevelInfo = $('div.card:contains("Cấp độ: 90")').html();
        const $maxLevel = cheerio.load(maxLevelInfo);

        const basicAttack = $maxLevel('div.text-xl:contains("Tấn Công Căn Bản")').text().replace('Tấn Công Căn Bản: ', '').trim();
        const critRate = $maxLevel('div.text-xl:contains("ST Bạo Kích")').text().replace('ST Bạo Kích: ', '').trim();

        for (let i = 0; i < 4; i++) {
            $(buttonRefinementSelector).click();
        }

        const refinementInfo = $('div.card:contains("Vết Cắt Sương Mù")').html();
        const $refinement = cheerio.load(refinementInfo);
        const refinement = $refinement('div').text().trim();

        console.log("Fetched max level weapon info:", { basicAttack, critRate, refinement });

        return { basicAttack, critRate, refinement };
    } catch (error) {
        console.error("Error fetching max level weapon info:", error);
        return null;
    }
};

module.exports.handleReaction = async function (o) {
    const { threadID: t, messageID: m, reaction: r } = o.event;

    console.log("Reaction received:", r);

    if (r !== "😼") return;

    console.log("Fetching max level weapon info for:", o.data.weaponName);

    const maxLevelInfo = await fetchMaxLevelWeaponInfo(o.data.weaponName);
    if (maxLevelInfo) {
        const { basicAttack, critRate, refinement } = maxLevelInfo;
        const maxLevelMessage = `Tấn Công Căn Bản (Cấp 90): ${basicAttack}\nST Bạo Kích (Cấp 90): ${critRate}\nTinh Luyện: ${refinement}`;
        console.log("Sending max level weapon info message:", maxLevelMessage);
        o.api.sendMessage({ body: maxLevelMessage }, t, m);
    } else {
        console.log("No max level info found.");
    }
};

const setReactionListener = async (api) => {
    if (!api.setMessageReactionListener) {
        return;
    }

    api.setMessageReactionListener(module.exports.handleReaction);
};

module.exports = {
    ...module.exports,
    onLoad: async function ({ api }) {
        setReactionListener(api);
    }
};

module.exports.onLoad = async function ({ api }) {
    setReactionListener(api);
};

module.exports.run = async ({ api, event, args, getText }) => {
    if (args.length < 2) {
        return api.sendMessage(getText("usages"), event.threadID, event.messageID);
    }

    const type = args[0].toLowerCase();
    const name = args.slice(1).join(" ");
    if (!name) {
        return api.sendMessage(getText("usages"), event.threadID, event.messageID);
    }

    api.sendMessage(getText("fetching", type, name), event.threadID, event.messageID);

    let info;
    if (type === "character") {
        info = await fetchCharacterInfo(name);
    } else if (type === "weapon") {
        info = await fetchWeaponInfo(name);
    } else {
        return api.sendMessage(getText("usages"), event.threadID, event.messageID);
    }

    if (info) {
        if (info.suggestions) {
            const suggestions = info.suggestions.join(", ");
            return api.sendMessage(getText("suggestions", suggestions), event.threadID, event.messageID);
        }

        if (type === "character") {
            const { name, element, nation, birthday, releaseDate, releasedTime, stars } = info;
            const message = getText("characterInfo", name, element, nation, birthday, releaseDate, releasedTime, stars);
            api.sendMessage(message, event.threadID, event.messageID);
        } else if (type === "weapon") {
            const { name, type, stars, description, basicAttack, substat, critRate, refinement } = info;
            const message = getText("weaponInfo", name, type, stars, description, basicAttack, substat, critRate, refinement);

            api.sendMessage(message, event.threadID, (error, info) => {
                if (error) return console.error(error);

                const reactionData = {
                    threadID: event.threadID,
                    messageID: info.messageID,
                    weaponName: name,
                    api: api
                };

                module.exports.handleReaction.data = reactionData;
            });
        }
    } else {
        api.sendMessage(getText("notFound", type, name), event.threadID, event.messageID);
    }
};
