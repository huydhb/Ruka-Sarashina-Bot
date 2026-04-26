// Log utility - Simplified version without colored output for performance
// Removed chalk, gradient for lighter footprint

module.exports = (data, option) => {
  const timestamp = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

  switch (option) {
    case 'warn':
      console.log(`[ WARN ] ${timestamp} - ${data}`);
      break;
    case 'error':
      console.log(`[ ERROR ] ${timestamp} - ${data}`);
      break;
    default:
      console.log(`${option || '[ LOG ]'} - ${data}`);
      break;
  }
};

module.exports.loader = (data, option) => {
  switch (option) {
    case 'warn':
      console.log(`[ LOADER WARN ] - ${data}`);
      break;
    case 'error':
      console.log(`[ LOADER ERROR ] - ${data}`);
      break;
    default:
      console.log(`[ LOADER ] - ${data}`);
      break;
  }
};
