const randomChatRequests = {};  // Lưu trữ các yêu cầu chat ngẫu nhiên
const activeConnections = {};   // Lưu trữ các kết nối đang hoạt động
const connectionQueue = [];     // Hàng chờ các yêu cầu kết nối
const MAX_CONNECTIONS = 1;      // Giới hạn số lượng kết nối hoạt động
const CONNECTION_TIMEOUT = 5 * 60 * 1000; // Thời gian kết nối tối đa (5 phút)

module.exports.config = {
  name: "chatngaunhien",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "TatsuYTB",
  description: "Chat ngẫu nhiên với người khác trong nhóm khác",
  commandCategory: "Nhóm",
  usages: "chatngaunhien",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, senderID, messageID } = event;

  if (args[0] === "ketthuc") {
    if (!activeConnections[senderID]) {
      return api.sendMessage("Bạn không có kết nối nào đang hoạt động!", threadID, messageID);
    }
    
    endConnection(senderID, api, threadID);
    return;
  }

  if (activeConnections[senderID]) {
    return api.sendMessage("Bạn đang có một kết nối đang hoạt động\nVui lòng kết thúc bằng cách reply tin nhắn kết thúc vào tin nhắn chat ngẫu nhiên hoặc dùng lệnh #chatngaunhien ketthuc để kết thúc phiên trước khi bắt đầu một kết nối mới!", threadID, messageID);
  }

  if (randomChatRequests[threadID] && randomChatRequests[threadID][senderID]) {
    return api.sendMessage("Bạn đã gửi yêu cầu chat ngẫu nhiên trước đó, vui lòng đợi!", threadID, messageID);
  }

  // Kiểm tra xem người dùng đã gửi yêu cầu ở nhóm khác chưa
  for (const tid in randomChatRequests) {
    if (tid !== threadID && randomChatRequests[tid][senderID]) {
      return api.sendMessage("Bạn đã gửi yêu cầu chat ngẫu nhiên trước đó, vui lòng đợi!", threadID, messageID);
    }
  }

  // Kiểm tra logic 1
  if (Object.keys(randomChatRequests).length > 0 && Object.keys(activeConnections).length < MAX_CONNECTIONS) {
    connectionQueue.push({ threadID, senderID, messageID });
    return api.sendMessage("Nhóm của bạn hiện đang có yêu cầu kết nối, bạn sẽ được thêm vào hàng chờ!", threadID, messageID);
  }

  // Kiểm tra logic 2
  if (Object.keys(activeConnections).length >= MAX_CONNECTIONS) {
    connectionQueue.push({ threadID, senderID, messageID });
    return api.sendMessage("Hiện tại đang có kết nối hoạt động. Yêu cầu của bạn đã được thêm vào hàng chờ.", threadID, messageID);
  }

  for (const tid in randomChatRequests) {
    if (tid !== threadID) {
      for (const uid in randomChatRequests[tid]) {
        const otherRequest = randomChatRequests[tid][uid];
        delete randomChatRequests[tid][uid];

        if (Object.keys(randomChatRequests[tid]).length === 0) {
          delete randomChatRequests[tid];
        }

        establishConnection(senderID, uid, threadID, tid, api);

        clearTimeout(otherRequest.timeout);
        return;
      }
    }
  }

  if (!randomChatRequests[threadID]) {
    randomChatRequests[threadID] = {};
  }

  randomChatRequests[threadID][senderID] = {
    timeout: setTimeout(() => {
      delete randomChatRequests[threadID][senderID];
      if (Object.keys(randomChatRequests[threadID]).length === 0) {
        delete randomChatRequests[threadID];
      }
      api.sendMessage("Đã hết 10 phút. Không tìm thấy người muốn chat ngẫu nhiên!", threadID);
    }, 10 * 60 * 1000)
  };

  api.sendMessage("Đã gửi yêu cầu chat ngẫu nhiên, vui lòng đợi tìm người mới chat cùng.", threadID, messageID);
};

function establishConnection(user1, user2, threadID1, threadID2, api) {
  activeConnections[user1] = user2;
  activeConnections[user2] = user1;

  api.sendMessage("Bạn đã được kết nối với người khác. Bây giờ hãy bắt đầu chat!", threadID1);
  api.sendMessage("Bạn đã được kết nối với người khác. Bây giờ hãy bắt đầu chat!", threadID2);
}

function endConnection(userID, api, threadID) {
  const partnerID = activeConnections[userID];

  api.sendMessage("Kết nối chat ngẫu nhiên của bạn đã bị kết thúc.", threadID);

  if (partnerID && activeConnections[partnerID]) {
    api.sendMessage("Người dùng kia đã kết thúc chat ngẫu nhiên.", activeConnections[partnerID]);
    delete activeConnections[partnerID];
  }

  delete activeConnections[userID];
}
