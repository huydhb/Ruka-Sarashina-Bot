module.exports.config = {
  name: "renewqtv",
  version: "1.0",
  hasPermssion: 3,
  credits: "RukaChan",
  description: "Làm mới danh sách quản trị viên toàn bộ nhóm",
  commandCategory: "Hệ Thống",
  usages: "để trống",
  cooldowns: 5,
};

module.exports.run = async function ({ event, api, Threads }) {
  const { threadID, senderID } = event;
  
  api.sendMessage("🔄 Đang cập nhật danh sách quản trị viên toàn bộ nhóm, vui lòng chờ...", threadID);
  
  const allThreads = await Threads.getAll();
  let updatedThreads = 0;
  let totalAdminsUpdated = 0;
  
  for (const thread of allThreads) {
    const targetID = thread.threadID;
    
    try {
      const threadInfo = await api.getThreadInfo(targetID);
      const adminCount = threadInfo.adminIDs.length;

      await Threads.setData(targetID, { threadInfo });
      global.data.threadInfo.set(targetID, threadInfo);

      updatedThreads++;
      totalAdminsUpdated += adminCount;
    } catch (error) {
      console.error(`Không thể cập nhật nhóm ${targetID}:`, error);
    }
  }

  return api.sendMessage(
    `✅ Đã làm mới danh sách quản trị viên toàn bộ nhóm mà bot tham gia!\n\n📦 Số nhóm đã cập nhật: ${updatedThreads}\n👨‍💻 Tổng số quản trị viên cập nhật: ${totalAdminsUpdated}\n\n📌 Cập nhật thành công!`,
    threadID
  );
};
