module.exports.config = {
  name: "randommem",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "D-Jukie",
  description: "Chọn ngẫu nhiên số thành viên trong box",
  commandCategory: "Nhóm",
  cooldowns: 0
};
module.exports.run = async ({ api, event, args, Users }) => {
  const { threadID, messageID, participantIDs, isGroup } = event;
  const num = parseInt(args[0]) || 1;
  if(isGroup == false) return api.sendMessage('→ 𝐕𝐮𝐢 𝐥𝐨̀𝐧𝐠 𝐭𝐡𝐮̛̣𝐜 𝐡𝐢𝐞̣̂𝐧 𝐥𝐞̣̂𝐧𝐡 𝐧𝐚̀𝐲 𝐨̛̉ 𝐧𝐡𝐨́𝐦!', threadID, messageID);
  const random = participantIDs.sort(function() {
        return .5 - Math.random();
    });
    const members = [];
    for( let i = 0; i <= num - 1; i++) {
      var name = (await Users.getData(random[i])).name;
      members.push(name)
    }
  return api.sendMessage(`→ Người được chọn là: ${members.join(' ')}`, threadID, messageID);
}
