module.exports.config = {
    name: 'menu',
    version: '1.1.1',
    hasPermssion: 0,
    credits: 'DC-Nam mod by Vtuan',//Mod by TatsuYTB
    description: 'Xem danh sách nhóm lệnh, thông tin lệnh',
    commandCategory: 'Danh sách lệnh',
    usages: '[...name commands|all|per <permission level>]',
    cooldowns: 5,
    envConfig: {
        autoUnsend: {
            status: true,
            timeOut: 60 
        },
        sendAttachments: {
            status: true,
            random: true,
            url: 'https://i.imgur.com/LKkw8SL.jpg'
        }
    }
};

const {
    autoUnsend = module.exports.config.envConfig.autoUnsend,
    sendAttachments = module.exports.config.envConfig.sendAttachments
} = global.config == undefined ? {} : global.config.menu == undefined ? {} : global.config.menu;

const { compareTwoStrings, findBestMatch } = require('string-similarity');
const { readFileSync, writeFileSync, existsSync } = require('fs-extra');

module.exports.run = async function({ api, event, args }) {
    const { sendMessage: send, unsendMessage: un } = api;
    const { threadID: tid, messageID: mid, senderID: sid } = event;
    const cmds = global.client.commands;
    const isAdmin = global.config.ADMINBOT.includes(sid);

    if (args.length >= 1) {
        if (args[0] === 'per' && !isNaN(args[1])) {
            const permissionLevel = parseInt(args[1]);
            const filteredCmds = filterCommandsByPermission(cmds.values(), permissionLevel);
            var txt = `Commands with permission level ${permissionLevel}\n`,
                count = 0;
            for (const cmd of filteredCmds) {
                txt += `${++count}. ${cmd.config.name} | ${cmd.config.description}\n`;
            }
            const msg = sendAttachments.status ? { body: txt } : txt;
            return send(msg, tid, (a, b) => autoUnsend.status ? setTimeout(v1 => un(v1), 1000 * autoUnsend.timeOut, b.messageID) : '');
        }
        
        if (typeof cmds.get(args.join(' ')) == 'object') {
            const body = infoCmds(cmds.get(args.join(' ')).config);
            const msg = sendAttachments.status ? { body } : body;
            return send(msg, tid, mid);
        } else {
            if (args[0] == 'all') {
                const data = filterCommands(cmds.values(), isAdmin);
                var txt = 'Menu all\n',
                count = 0;
                for (const cmd of data) txt += `${++count}. ${cmd.config.name} | ${cmd.config.description}\n`;
                const msg = sendAttachments.status ? { body: txt } : txt;
                send(msg, tid, (a, b) => autoUnsend.status ? setTimeout(v1 => un(v1), 1000 * autoUnsend.timeOut, b.messageID) : '');
            } else {
                const cmdsValue = filterCommands(cmds.values(), isAdmin);
                const arrayCmds = [];
                for (const cmd of cmdsValue) arrayCmds.push(cmd.config.name);
                const similarly = findBestMatch(args.join(' '), arrayCmds);
                if (similarly.bestMatch.rating >= 0.3) return send(` "${args.join(' ')}" là lệnh gần giống là "${similarly.bestMatch.target}" ?`, tid, mid);
            };
        };
    } else {
        const data = commandsGroup(isAdmin);
        const totalCmds = data.reduce((acc, cur) => acc + cur.commandsName.length, 0); 
        var txt = '====== Menu ======\n',
        count = 0;
        for (const { commandCategory, commandsName } of data) txt += `${++count}. ${commandCategory} || có ${commandsName.length} lệnh\n`;
        txt += `╭────╮\n ${totalCmds} lệnh\n╰────╯\n➜ Reply từ 1 đến ${data.length} để chọn\n➜ Gỡ tự động sau: 60s\n➜Bạn có thể thả icon 😾 để bot gỡ tin nhắn\n➩ FB ADMIN: https://www.facebook.com/???`;
        const msg = sendAttachments.status ? { body: txt } : txt;
        send(msg, tid, (a, b) => {
            global.client.handleReply.push({
                name: module.exports.config.name,
                messageID: b.messageID,
                author: sid,
                'case': 'infoGr',
                data
            });
            if (autoUnsend.status) setTimeout(v1 => un(v1), 1000 * autoUnsend.timeOut, b.messageID);
        });
    };
};

module.exports.handleReply = async function({ handleReply: $, api, event }) {
    const { sendMessage: send, unsendMessage: un } = api;
    const { threadID: tid, messageID: mid, senderID: sid, args } = event;
    const isAdmin = global.config.ADMINBOT.includes(sid);

    if (sid != $.author) {
        const msg = sendAttachments.status ? { body: `Đi ra chỗ khác chơi 🥹` } : `Đi ra chỗ khác chơi 🥹`;
        return send(msg, tid, mid);
    };
    
    switch ($.case) {
        case 'infoGr': {
            var data = $.data[(+args[0]) - 1];
            if (data == undefined) {
                const txt = `"${args[0]}" không nằm trong số thứ tự menu`;
                const msg = sendAttachments.status ? { body: txt } : txt;
                return send(msg, tid, mid);
            };
            un($.messageID);
            var txt = '『 ' + data.commandCategory + ' 』\n\n',
            count = 0;
            for (const name of data.commandsName) txt += `${++count}. ${name}\n`;
            txt += `\n\n➩ Reply từ 1 đến ${data.commandsName.length} để chọn\n➩ Gỡ tự động sau: 60s`;
            const msg = sendAttachments.status ? { body: txt } : txt;
            send(msg, tid, (a, b) => {
                global.client.handleReply.push({
                    name: module.exports.config.name,
                    messageID: b.messageID,
                    author: sid,
                    'case': 'infoCmds',
                    data: data.commandsName
                });
                if (autoUnsend.status) setTimeout(v1 => un(v1), 1000 * autoUnsend.timeOut, b.messageID);
            });
        };
        break;
        
        case 'infoCmds': {
            var data = global.client.commands.get($.data[(+args[0]) - 1]);
            if (typeof data != 'object') {
                const txt = `"${args[0]}" không nằm trong số thứ tự menu`;
                const msg = sendAttachments.status ? { body: txt } : txt;
                return send(msg, tid, mid);
            };
            const { config = {} } = data || {};
            un($.messageID);
            const msg = sendAttachments.status ? { body: infoCmds(config) } : infoCmds(config);
            send(msg, tid, mid);
        };
        break;
        
        default:
        // code
    }
};

function filterCommands(commands, isAdmin) {
    return Array.from(commands).filter(cmd => {
        const { commandCategory, hasPermssion } = cmd.config;
        if (isAdmin) return true;
        return commandCategory !== 'Hệ Thống' && hasPermssion < 2;
    });
}

function filterCommandsByPermission(commands, permissionLevel) {
    return Array.from(commands).filter(cmd => {
        return cmd.config.hasPermssion === permissionLevel;
    });
}

function commandsGroup(isAdmin) {
    const array = [],
    cmds = filterCommands(global.client.commands.values(), isAdmin);
    for (const cmd of cmds) {
        const { name, commandCategory } = cmd.config;
        const find = array.find(i => i.commandCategory == commandCategory);
        !find ? array.push({ commandCategory, commandsName: [name] }) : find.commandsName.push(name);
    };
    array.sort(sortCompare('commandsName'));
    return array;
}

function infoCmds(a) {
    return `${a.name}\n\n➜ Phiên bản : ${a.version}\n➜ Quyền hạn : ${premssionTxt(a.hasPermssion)}\n➜ Tác giả : ${a.credits}\n➜ Mô tả : ${a.description}\n➜ Thuộc nhóm : ${a.commandCategory}\n➜ Cách dùng : ${a.usages}\n➜ Thời gian chờ : ${a.cooldowns} giây\n`;
}

function premssionTxt(a) {
    return a == 0 ? 'Thành Viên' : a == 1 ? 'Quản Trị Viên Nhóm' : a == 2 ? 'Người Điều Hành Bot' : 'ADMINBOT';
}

function prefix(a) {
    const tidData = global.data.threadData.get(a) || {};
    return tidData.PREFIX || global.config.PREFIX;
}

function sortCompare(k) {
    return function(a, b) {
        return (a[k].length > b[k].length ? 1 : a[k].length < b[k].length ? -1 : 0) * -1;
    };
}
