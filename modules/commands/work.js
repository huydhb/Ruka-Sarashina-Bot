// danh sách công việc
let works = [
    { name: 'câu cá', done: [
        '{name} bạn vừa bắt được cá đèn lồng và bán được {money}$',
        '{name} bạn vừa bắt được cá mập và bán được {money}$',
        '{name} bạn vừa bắt được tôm tít và bán được {money}$',
        '{name} bạn vừa bắt được cá ngừ và bán được {money}$',
        '{name} bạn vừa bắt được cá thu và bán được {money}$',
        '{name} bạn vừa bắt được cá koi và bán được {money}$',
        '{name} bạn vừa bắt được cá trê và bán được {money}$',
        '{name} bạn vừa bắt được cá chép và bán được {money}$'
    ]},
    { name: 'săn thú hoang', done: [
        '{name} bắn được con rắn và bán được {money}$',
        '{name} bắn được con rồng komodo và bán được {money}$',
        '{name} bắn được con bói cá và bán được {money}$',
        '{name} bắn được con gấu nâu và bán được {money}$'
    ]},
    { name: 'Đào đá', done: [
        '{name} đã đào được viên kim cương và bán được {money}$',
        '{name} đã đào được vàng và bán được {money}$',
        '{name} đã đào được quặng sắt và bán được {money}$',
        '{name} đã đào được ngọc lục bảo và bán được {money}$'
    ]},
    { name: 'bắn chim', done: [
        '{name} bắn được con chim đen và bán được {money}$',
        '{name} bắn được con đại bàng và bán được {money}$',
        '{name} bắn được con chim én và bán được {money}$'
    ]}
];

// cấu hình module
exports.config = {
    name: 'works',
    version: '0.0.3',
    hasPermssion: 0,
    credits: 'DC-Nam',
    description: 'work',
    commandCategory: 'Tiện ích',
    usages: '[]',
    cooldowns: 3
};

let _0 = x => x < 10 ? '0' + x : x;
let random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

exports.run = async o => {
    let body = `[ Công việc ]\n${works.map((w, i) => `[${i + 1}] ${w.name}`).join('\n')}\n\n-> Reply số tương ứng để chọn công việc.`;
    o.api.sendMessage({ body }, o.event.threadID, (err, res) => {
        res.name = exports.config.name;
        res.event = o.event;
        global.client.handleReply.push(res); // chỉ push handleReply
    }, o.event.messageID);
};

exports.handleReply = async o => {
    let _ = o.handleReply;
    let uid = o.event.senderID;
    let user = await o.Users.getData(uid);
    if (!user) return o.api.sendMessage(`Error`, o.event.threadID);

    let data = user.data || {};
    let send = (msg) => o.api.sendMessage(msg, o.event.threadID);

    if (uid != _.event.senderID) return;

    // kiểm tra cooldown
    if (data.work && data.work >= Date.now()) {
        let x = data.work - Date.now();
        return send(`Hãy làm việc sau: ${_0(Math.floor(x / 60000))} phút ${_0(Math.floor(x / 1000 % 60))} giây.`);
    }

    let index = parseInt(o.event.body) - 1;
    if (isNaN(index) || index < 0 || index >= works.length)
        return send(`Công việc không hợp lệ, vui lòng reply số từ 1 đến ${works.length}.`);

    let work = works[index];
    data.work = Date.now() + (1000 * 60 * 60); // cooldown 1 giờ
    o.Users.setData(uid, user);

    send(`Đang ${work.name}...`);
    await new Promise(res => setTimeout(res, 3500));

    let done = work.done[random(0, work.done.length - 1)];
    let money = random(5000, 20000);
    send(done.replace(/{name}/g, user.name).replace(/{money}/g, money));

    o.Currencies.increaseMoney(uid, money);
};
