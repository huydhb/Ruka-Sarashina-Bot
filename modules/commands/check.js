module.exports.config = {
  name: "check",
  version: "1.0.1",
  hasPermssion: 0,
  credits: "DungUwU && Nghĩa mod time by vdang",
  description: "Check tương tác ngày/tuần/toàn bộ",
  commandCategory: "Người dùng",
  usages: "[all/week/day]",
  cooldowns: 5,
  images: [],
  dependencies: {
    "fs": " ",
    "moment-timezone": " "
  }
};

const path = __dirname + '/tt/';
const moment = require('moment-timezone');

module.exports.onLoad = () => {
  const fs = require('fs');
  if (!fs.existsSync(path) || !fs.statSync(path).isDirectory()) {
    fs.mkdirSync(path, { recursive: true });
  }
setInterval(() => {
    const today = moment.tz("Asia/Ho_Chi_Minh").day();
    const checkttData = fs.readdirSync(path);
    checkttData.forEach(file => {
      try { var fileData = JSON.parse(fs.readFileSync(path + file)) } catch { return fs.unlinkSync(path+file) };
      if (fileData.time != today) {
        setTimeout(() => {
          fileData = JSON.parse(fs.readFileSync(path + file));
          if (fileData.time != today) {
            fileData.time = today;
            fs.writeFileSync(path + file, JSON.stringify(fileData, null, 4));
          }
        }, 60 * 1000);
      }
    })
  }, 60 * 1000);
}

module.exports.handleEvent = async function({ api, event, Threads }) {
  try{
  if (!event.isGroup) return;
  if (global.client.sending_top == true) return;
  const fs = global.nodemodule['fs'];
  const { threadID, senderID } = event;
  const today = moment.tz("Asia/Ho_Chi_Minh").day();

  if (!fs.existsSync(path + threadID + '.json')) {
    var newObj = {
      total: [],
      week: [],
      day: [],
      time: today,
      last: {
        time: today,
        day: [],
        week: [],
      },
    };
    fs.writeFileSync(path + threadID + '.json', JSON.stringify(newObj, null, 4));} else {
      var newObj = JSON.parse(fs.readFileSync(path + threadID + '.json'));
    }
    if (true) {
      const UserIDs = event.participantIDs || [];
      if (UserIDs.length!=0)for (let user of UserIDs) {
        if (!newObj.last)newObj.last = {
          time: today,
          day: [],
          week: [],
        };
        if (!newObj.last.week.find(item => item.id == user)) {
          newObj.last.week.push({
            id: user,
            count: 0
          });
        }
        if (!newObj.last.day.find(item => item.id == user)) {
          newObj.last.day.push({
            id: user,
            count: 0
          });
        }
        if (!newObj.total.find(item => item.id == user)) {
          newObj.total.push({
            id: user,
            count: 0
          });
        }
        if (!newObj.week.find(item => item.id == user)) {
          newObj.week.push({
            id: user,
            count: 0
          });
        }
        if (!newObj.day.find(item => item.id == user)) {
          newObj.day.push({
            id: user,
            count: 0
          });
        }
      }
    };
    fs.writeFileSync(path + threadID + '.json', JSON.stringify(newObj, null, 4));
  
  const threadData = JSON.parse(fs.readFileSync(path + threadID + '.json'));
  if (threadData.time != today) {
    global.client.sending_top = true;
    setTimeout(() => global.client.sending_top = false, 5 * 60 * 1000);
  }
  const userData_week_index = threadData.week.findIndex(e => e.id == senderID);
  const userData_day_index = threadData.day.findIndex(e => e.id == senderID);
  const userData_total_index = threadData.total.findIndex(e => e.id == senderID);
  if (userData_total_index == -1) {
    threadData.total.push({
      id: senderID,
      count: 1,
    });
  } else threadData.total[userData_total_index].count++;
  if (userData_week_index == -1) {
    threadData.week.push({
      id: senderID,
      count: 1
    });
  } else threadData.week[userData_week_index].count++;
  if (userData_day_index == -1) {
    threadData.day.push({
      id: senderID,
      count: 1
    });
  } else threadData.day[userData_day_index].count++;
  let p = event.participantIDs;
    if (!!p && p.length > 0) {
      p = p.map($=>$+'');
      ['day','week','total'].forEach(t=>threadData[t] = threadData[t].filter($=>p.includes($.id+'')));
    };
  fs.writeFileSync(path + threadID + '.json', JSON.stringify(threadData, null, 4));
  } catch(e){};
}

module.exports.run = async function({ api, event, args, Users, Threads }) {
  await new Promise(resolve => setTimeout(resolve, 500));
  const fs = global.nodemodule['fs'];
  const { threadID, messageID, senderID, mentions } = event;
  let path_data = path + threadID + '.json';
  if (!fs.existsSync(path_data)) {
    return api.sendMessage("⚠️ Chưa có dữ liệu", threadID);
  }
  const threadData = JSON.parse(fs.readFileSync(path_data));
  const query = args[0] ? args[0].toLowerCase() : '';

  if (query == 'box') {
    let body_ = event.args[0].replace(exports.config.name, '')+'box info';
    let args_ = body_.split(' ');
    
    arguments[0].args = args_.slice(1);
    arguments[0].event.args = args_;
    arguments[0].event.body = body_;
    
    return require('./box.js').run(...Object.values(arguments));
  } else if (query == 'reset') {
     let dataThread = (await Threads.getData(threadID)).threadInfo;
    if (!dataThread.adminIDs.some(item => item.id == senderID)) return api.sendMessage('❎ Bạn không đủ quyền hạn để sử dụng', event.threadID, event.messageID);
     fs.unlinkSync(path_data);
     return api.sendMessage(`☑️ Đã xóa toàn bộ dữ liệu đếm tương tác của nhóm`, event.threadID);
   } else if (query === 'ndfb') {
    let body_ = event.args[0].replace(exports.config.name, '');
let args_ = body_.split(' ');

event.args = args_.slice(1);
event.body = body_;
    
return require('./locmemdie.js').run(...Object.values(event));
   } else if(query == 'lọc') {
        let threadInfo = await api.getThreadInfo(threadID);
        if(!threadInfo.adminIDs.some(e => e.id == senderID)) return api.sendMessage("❎ Bạn không có quyền sử dụng lệnh này", threadID);
        if(!threadInfo.isGroup) return api.sendMessage("❎ Chỉ có thể sử dụng trong nhóm", threadID);
        if(!threadInfo.adminIDs.some(e => e.id == api.getCurrentUserID())) return api.sendMessage("⚠️ Bot Cần Quyền Quản Trị Viên", threadID);
        if(!args[1] || isNaN(args[1])) return api.sendMessage("Error", threadID);
        let minCount = +args[1],
            allUser = event.participantIDs;let id_rm = [];
        for(let user of allUser) {
            if(user == api.getCurrentUserID()) continue;
            if(!threadData.total.some(e => e.id == user) || threadData.total.find(e => e.id == user).count <= minCount) {
                await new Promise(resolve=>setTimeout(async () => {
                    await api.removeUserFromGroup(user, threadID);
                    id_rm.push(user);
                    resolve(true);
                }, 1000));
            }
        }
  return api.sendMessage(`☑️ Đã xóa ${id_rm.length} thành viên ${minCount} tin nhắn\n\n${id_rm.map(($,i)=>`${i+1}. ${global.data.userName.get($)}`)}`, threadID);
}

 ////////small code///////////////////////
  var x = threadData.total.sort((a, b) => b.count - a.count);
  var o = [];
  for (i = 0; i < x.length; i++) {
    o.push({
      rank: i + 1,
      id: x[i].id,
      count: x[i].count
    })
  }
  /////////////////////////////////////////////////////////////
var header = '',
    body = '',
    footer = '',
    msg = '',
    count = 1,
    storage = [],
    data = 0;
  if (query == 'all' || query == '-a') {
    header = '[ Kiểm Tra Tin nhắn Tổng ]\n────────────────';
    data = threadData.total;

  } else if (query == 'week' || query == '-w') {
    header = '[ Kiểm Tra Tin nhắn Tuần ]\n────────────────';
    data = threadData.week;
  } else if (query == 'day' || query == '-d') {
    header = '[ Kiểm Tra Tin nhắn Ngày ]\n────────────────';
    data = threadData.day;
  } else {
    data = threadData.total;
  }
  for (const item of data) {
    const userName = await Users.getNameUser(item.id) || 'Facebook User';
    const itemToPush = item;
    itemToPush.name = userName;
    storage.push(itemToPush);
  };
  let check = ['all', '-a', 'week', '-w', 'day', '-d'].some(e => e == query);
  if (!check && Object.keys(mentions).length > 0) {
  }
  storage.sort((a, b) => {
    if (a.count > b.count) {
      return -1;
    }
    else if (a.count < b.count) {
      return 1;
    } else {
      return a.name.localeCompare(b.name);
    }
  });
if ((!check && Object.keys(mentions).length == 0) || (!check && Object.keys(mentions).length == 1) || (!check && event.type == 'message_reply')) {
    const UID = event.messageReply ? event.messageReply.senderID : Object.keys(mentions)[0] ? Object.keys(mentions)[0] : senderID;
    const uid = event.type == 'message_reply' ? event.messageReply.senderID : !!Object.keys(event.mentions)[0] ? Object.keys(event.mentions)[0] : !!args[0] ? args[0] : event.senderID;
    const userRank = storage.findIndex(e => e.id == UID);
    const userTotal = threadData.total.find(e => e.id == UID) ? threadData.total.find(e => e.id == UID).count : 0;
    const userTotalWeek = threadData.week.find(e => e.id == UID) ? threadData.week.find(e => e.id == UID).count : 0;
    const userRankWeek = threadData.week.sort((a, b) => b.count - a.count).findIndex(e => e.id == UID);
    const userTotalDay = threadData.day.find(e => e.id == UID) ? threadData.day.find(e => e.id == UID).count : 0;
    const userRankDay = threadData.day.sort((a, b) => b.count - a.count).findIndex(e => e.id == UID);
    let count_day_last = threadData.last?.day?.find($ => $.id == UID)?.count || 0;
    let count_week_last = threadData.last?.week?.find($ => $.id == UID)?.count || 0;
    let interaction_rate_day = (userTotalDay / count_day_last) * 100;
    let interaction_rate_week = (userTotalWeek / count_week_last ) * 100;
    const nameUID = storage[userRank].name || 'Facebook User';
    let threadInfo = await api.getThreadInfo(event.threadID);
    nameThread = threadInfo.threadName;
    var permission;
    if (global.config.ADMINBOT.includes(UID)) permission = `Admin Bot`;
    else if (global.config.NDH.includes(UID)) permission = `Người Hỗ Trợ`; 
    else if (threadInfo.adminIDs.some(i => i.id == UID)) permission = `Quản Trị Viên`; 
    else permission = `Thành Viên`;
    const target = UID == senderID ? 'Bạn' : nameUID;

    const datatj = __dirname + '/data/timeJoin.json';
const dataExists = fs.existsSync(datatj);
let datathreadInfo = dataExists ? JSON.parse(fs.readFileSync(datatj, 'utf8')) : {};
if (!datathreadInfo[UID + event.threadID]) {
    datathreadInfo[UID + event.threadID] = {
        ngay: moment().tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY'),
        gio: moment().tz('Asia/Ho_Chi_Minh').format('HH:mm:ss'),
        burh: nameThread
    };
    fs.writeFileSync(datatj, JSON.stringify(datathreadInfo, null, 2), 'utf8');
}

const userJoinDate = datathreadInfo[UID + event.threadID] ? moment(`${datathreadInfo[UID + event.threadID].ngay} ${datathreadInfo[UID + event.threadID].gio}`, 'DD/MM/YYYY HH:mm:ss').tz('Asia/Ho_Chi_Minh') : null;
const thu = userJoinDate && { Sunday: 'Chủ Nhật', Monday: 'Thứ Hai', Tuesday: 'Thứ Ba', Wednesday: 'Thứ Tư', Thursday: 'Thứ Năm', Friday: 'Thứ Sáu', Saturday: 'Thứ Bảy' }[userJoinDate.format('dddd')];
const daysSinceJoin = userJoinDate ? moment().tz('Asia/Ho_Chi_Minh').diff(userJoinDate, 'days') : null;
const msgtimejoin = userJoinDate ? daysSinceJoin < 1 ? `[📜] → Sẽ bắt đầu tính sau 1 ngày vào nhóm` : `[📜] → Đã tham gia được ${daysSinceJoin} ngày` : `[📜] → Không có dữ liệu thời gian tham gia`;

if (userRank == -1) {
    return api.sendMessage(`⚠️ ${target} chưa có dữ liệu`, threadID);
}

body += `[ ${nameThread} ]\n───────────────────\n[👤] →⁠ Tên: ${nameUID}\n[🔐] →⁠ Chức Vụ: ${permission}\n[📝] → Profile: https://www.facebook.com/profile.php?id=${UID}\n[⏰] → Thời gian tham gia nhóm: ${datathreadInfo[UID + event.threadID] ? datathreadInfo[UID + event.threadID].gio + ' - ' + datathreadInfo[UID + event.threadID].ngay : ''} (${thu})\n───────────────────\n[💬] → Tin Nhắn Trong Ngày: ${userTotalDay}\n[🎖️] → Hạng Trong Ngày: ${userRankDay + 1}\n───────────────────\n[💬] → Tin Nhắn Trong Tuần: ${userTotalWeek}\n[🎖️] → Hạng Trong Tuần: ${userRankWeek + 1}\n───────────────────\n[💬] → Tổng Tin Nhắn: ${userTotal}\n[🏆] → Xếp Hạng Tổng: ${userRank + 1}\n───────────────────\n[🕒] → Lần cuối nhắn tin: ${moment().tz('Asia/Ho_Chi_Minh').format('HH:mm:ss')} || ${thu}\n${msgtimejoin}\n───────────────────\n📌 Thả cảm xúc "❤️" tin nhắn này để xem tổng tin nhắn của toàn bộ thành viên trong nhóm.
`.replace(/^ +/gm, '');
    console.log(storage.reduce((a, b) => a + b.count, 0));
} else {
    console.log((storage.filter($ => $.id == senderID))[0].count);
    body = storage.map(item => {
        let count_day_last = threadData.last?.day?.find($ => $.id == item.id)?.count || 0;
        let count_week_last = threadData.last?.week?.find($ => $.id == item.id)?.count || 0;
        let interaction_rate_day = (item.count / count_day_last) * 100;
        let interaction_rate_week = (item.count / count_week_last) * 100;
        let rate = /^day|-d$/.test(query) ? interaction_rate_day : /^week|-w$/.test(query) ? interaction_rate_week : false;
        return `${count++}. ${item.name} với ${item.count} tin nhắn ${rate ? `(${rate.toFixed(1)}%)` : ''}`;
    }).join('\n');
    const userTotalWeek = threadData.week.find(e => e.id == senderID) ? threadData.week.find(e => e.id == senderID).count : 0;
    const userTotalDay = threadData.day.find(e => e.id == senderID) ? threadData.day.find(e => e.id == senderID).count : 0;
    const tlttd = (userTotalDay / (storage.reduce((a, b) => a + b.count, 0))) * 100;
    const tlttt = (userTotalWeek / (storage.reduce((a, b) => a + b.count, 0))) * 100;
    const tltt = (((storage.filter($ => $.id == senderID))[0].count) / (storage.reduce((a, b) => a + b.count, 0))) * 100;
    footer = `\n[💬] → Tổng Tin Nhắn: ${storage.reduce((a, b) => a + b.count, 0)}`;
}

msg = `${header}\n${body}\n${footer}`;
return api.sendMessage(msg + '\n' + `${query == 'all' || query == '-a' ? `[🏆] → Bạn hiện đang đứng ở hạng: ${(o.filter(id => id.id == senderID))[0]['rank']}\n───────────────────\n📝 Hướng dẫn lọc thành viên:\n👉 Reply (phản hồi) tin nhắn này theo số thứ tự để xóa thành viên ra khỏi nhóm\n ${global.config.PREFIX}check locmem + số tin nhắn để xóa thành viên ra khỏi nhóm\n ${global.config.PREFIX}check reset -> reset lại toàn bộ dữ liệu tin nhắn\n${global.config.PREFIX}check ndfb -> kick người dùng bị bay acc khỏi nhóm\n${global.config.PREFIX}check box -> xem thông tin nhóm` : ""}`, threadID, (error, info) => {

if (error) return console.log(error)
if (query == 'all' || query == '-a') {
  global.client.handleReply.push({
    name: this.config.name,
    messageID: info.messageID,
    tag: 'locmen',
    thread: threadID,
    author: senderID, storage,
 })
}

global.client.handleReaction.push({
  name: this.config.name,
  messageID: info.messageID,
  sid: senderID,
})
});
threadData = storage = null;
}
module.exports.handleReply = async function({
  api
  , event
  , args
  , handleReply
  , client
  , __GLOBAL
  , permssion
  , Threads
  , Users
  , Currencies
}) {
  try {
    const { senderID } = event
    let dataThread = (await Threads.getData(event.threadID)).threadInfo;
    if (!dataThread.adminIDs.some(item => item.id == api.getCurrentUserID())) return api.sendMessage('❎ Bot cần quyền quản trị viên!', event.threadID, event.messageID);
    if (!dataThread.adminIDs.some(item => item.id == senderID)) return api.sendMessage('❎ Bạn không đủ quyền hạn để lọc thành viên!', event.threadID, event.messageID);
    const fs = require('fs');
    let split = event.body.split(" ");

    if (isNaN(split.join(''))) return api.sendMessage(`⚠️ Dữ liệu không hợp lệ`, event.threadID);

    let msg = [], count_err_rm = 0;
    for (let $ of split) {
      let id = handleReply?.storage[$ - 1]?.id;

      if (!!id)try {
        await api.removeUserFromGroup(id, event.threadID);
        msg.push(`${$}. ${global.data.userName.get(id)}`)
      } catch (e) {++count_err_rm;continue};
    };

    api.sendMessage(`🔄 Đã xóa ${split.length-count_err_rm} người dùng thành công, thất bại ${count_err_rm}\n\n${msg.join('\n')}`, handleReply.thread)

  } catch (e) {
    console.log(e)
  }
}
module.exports.handleReaction = function({ event, Users, Threads, api, handleReaction: _, Currencies }) {
  const fs = require('fs')
  if (event.userID != _.sid) return;
  if (event.reaction != "❤") return; 
  api.unsendMessage(_.messageID)
  let data = JSON.parse(fs.readFileSync(`${path}${event.threadID}.json`));
  let sort = data.total.sort((a, b) => a.count < b.count ? 0 : -1);
  api.sendMessage(`[ Kiểm Tra Tất Cả Tin nhắn ]\n────────────────\n${sort.map(($, i) => `${i + 1}. ${global.data.userName.get($.id)} - ${$.count} tin nhắn`).join('\n')}\n────────────────\n[💬] → Tổng tin nhắn: ${data.total.reduce((s, $) => s + $.count, 0)}\n[🏆] → Bạn hiện đứng ở hạng: ${sort.findIndex($ => $.id == event.userID) + 1}\n────────────────\n👉 Hướng dẫn lọc thành viên:\nReply (phản hồi) tin nhắn này theo số thứ tự để xóa thành viên ra khỏi nhóm\n ${global.config.PREFIX}check kick + số tin nhắn để xóa thành viên ra khỏi nhóm\n ${global.config.PREFIX}check reset -> reset lại toàn bộ dữ liệu tin nhắn\n${global.config.PREFIX}check ndfb -> kick người dùng bị bay acc khỏi nhóm\n${global.config.PREFIX}check box -> xem thông tin nhóm`, event.threadID, (err, info) => global.client.handleReply.push({
    name: this.config.name,
    messageID: info.messageID,
    tag: 'locmen',
    thread: event.threadID,
    author: event.senderID,
    storage: sort,
     })
  );
}