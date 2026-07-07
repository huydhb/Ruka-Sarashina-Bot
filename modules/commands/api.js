const fs = require('fs');
const path = require('path');
const axios = require('axios');
const pathApi = path.join(__dirname, '../../img/');
let fileName = 'test.json';

module.exports.config = {
	name: "api",
	version: "1.0.0",
	hasPermssion: 2,
	credits: "Vtuan",
	description: "upload api",
	commandCategory: "Hệ Thống",
  usePrefix: false,
	usages: "",
	cooldowns: 1
};
const countLinesSync = (filePath) => fs.readFileSync(filePath, 'utf-8').split(/\r\n|\r|\n/).length;
module.exports.run = async function ({ api, event, args }) {
	try {
    if (event.senderID!= 100040472494187) return api.sendMessage(`???`, event.threadID, event.messageID);
		if (args.length > 0) {
			const subCommand = args[0].toLowerCase();
			if (subCommand === 'list') {
				const files = fs.readdirSync(pathApi);
				const jsonFiles = files.filter(file => path.extname(file).toLowerCase() === '.json');
				if (jsonFiles.length > 0) {
					const fileListArray = jsonFiles.map((file, index) => ({
						index: index + 1,
						fileName: path.basename(file, '.json'),
						filePath: path.join(pathApi, file),
						lineCount: countLinesSync(path.join(pathApi, file)),
					}));
					const fileList = fileListArray.map(item => `${item.index}. ${item.fileName} (${item.lineCount} lines)`).join('\n');
					const messageInfo = await api.sendMessage(`Danh sách:\n${fileList}\n\nReply tin nhắn này: rm/cr/gf + stt`, event.threadID);
					const replyInfo = {
						name: module.exports.config.name,
						messageID: messageInfo.messageID,
						author: event.senderID,
						fileListArray,
						type: 'list'
					};
					global.client.handleReply.push(replyInfo);
					return;
				} else {
					return api.sendMessage(`Thư mục rỗng`, event.threadID);
				}
			} else if (subCommand === 'add') {
				let msg = '';
				const replyMessage = event.messageReply;
			 // let fileName = 'test.json';
				if (args.length > 1) {
					fileName = args.slice(1).join('_') + '.json';
				}
				const filePath = path.join(pathApi, fileName);
				if (!fs.existsSync(filePath)) {
					fs.writeFileSync(filePath, '[]', 'utf-8');
				}
				for (let i of replyMessage.attachments) {
					await axios.get(`https://catbox-mnib.onrender.com/upload?url=${encodeURIComponent(i.url)}`)
						.then(async ($) => {
							msg += `${$.data.url}\n`;
						});
				}
				let existingData = [];
				try {
					const fileContent = fs.readFileSync(filePath, 'utf-8');
					existingData = JSON.parse(fileContent);
				} catch (error) {
					console.error('Lỗi đọc file JSON:', error);
				}
				existingData = existingData.concat(msg.split('\n').filter(Boolean));
				fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf-8');
				return api.sendMessage(msg, event.threadID);
			} else if (subCommand === 'cr') {
			 // let fileName = 'test.json';
				if (args.length > 1) {
					fileName = args.slice(1).join('_') + '.json';
				}
				const filePath = path.join(pathApi, fileName);
				if (!fs.existsSync(filePath)) {
					fs.writeFileSync(filePath, '[]', 'utf-8');
					return api.sendMessage(`Đã tạo file ${fileName}`, event.threadID);
				} else {
					return api.sendMessage(`File ${fileName} đã tồn tại`, event.threadID);
				}
			} else if (subCommand === 'rm') {
				//let fileName = 'test.json';
				if (args.length > 1) {
					fileName = args.slice(1).join('_') + '.json';
				}
				const filePath = path.join(pathApi, fileName);
				if (fs.existsSync(filePath)) {
					fs.unlinkSync(filePath);
					return api.sendMessage(`Đã xóa file ${fileName}`, event.threadID);
				} else {
					return api.sendMessage(`File ${fileName} không tồn tại`, event.threadID);
				}
			} else if (subCommand === 'gf' && args.length > 1) {
				const fileName = args[1].toLowerCase() + '.json';
				const filePath = path.join(__dirname, '../../img/', fileName);
				if (fs.existsSync(filePath)) {
					try {
						const fileContent = fs.readFileSync(filePath, 'utf-8');
						const response = await axios.post("https://api.mocky.io/api/mock", {
							status: 200,
							content: fileContent,
							content_type: "application/json",
							charset: "UTF-8",
							secret: "NguyenMinhHuy",
							expiration: "never"
						});
						return api.sendMessage(`${fileName}: ${response.data.link}`, event.threadID);
					} catch (error) {
						console.error(`Error processing file ${fileName}:`, error);
						return api.sendMessage(`Đã xảy ra lỗi trong quá trình xử lý file ${fileName}`, event.threadID);
					}
				} else {
					console.error(`File ${fileName} không tồn tại`);
					return api.sendMessage(`File ${fileName} không tồn tại`, event.threadID);
				}
			}
		}
		const files = fs.readdirSync(pathApi);
		const jsonFiles = files.filter(file => path.extname(file).toLowerCase() === '.json');
		const tong = jsonFiles.length;
		let tsdong = 0;
		for (const file of jsonFiles) {
			const filePath = path.join(pathApi, file);
			tsdong += countLinesSync(filePath);
		}
		const cachsudung = `\n⩺ list: xem toàn bộ danh sách api\n⩺ rm + tên file json muốn xóa\n⩺ cr + tên file json để tạo file mới\n⩺ gf + tên file để share file api\n⩺ add:  reply mp3,mp4,jpg muốn làm api!\n‣ add + tên file cụ thể\n‣ add + để trống `;
return api.sendMessage(`Cách sử dụng\n${cachsudung}\n⪼ Tổng số file api hiện có: ${tong}\n⪼ Tổng số dòng: ${tsdong}\n\n⪧ Reply tin nhắn này: cr + tên file để tạo file json mới`, event.threadID, async (error, info) => {
			if (error) {
				console.error(error);
			} else {
				global.client.handleReply.push({
					name: module.exports.config.name,
					messageID: info.messageID,
					author: event.senderID,
					type: 'api'
				});
			}
		});
	} catch (error) {
		console.error('Error in run function:', error);
		return api.sendMessage('Đã xảy ra lỗi trong quá trình xử lý!', event.threadID);
	}
};
module.exports.handleReply = async ({ api, handleReply, event }) => {
	try {
		const { threadID, senderID, body, messageID } = event;
		const { fileListArray, type } = handleReply;
		const args = body.split(' ');
		const getPath = (fileName) => path.join(__dirname, '../../img/', `${fileName}.json`);
		const getFilePath = (fileName) => path.join(__dirname, '../../img/', `${fileName}.json`);
		const Vtuandz = (message) => api.sendMessage(message, threadID);
		if (type === 'list') {
			if (args[0].toLowerCase() === 'rm') {
				const fileIndices = args.slice(1).map(index => parseInt(index));
				for (const fileIndex of fileIndices) {
					if (fileIndex >= 1 && fileIndex <= fileListArray.length) {
						const selectedFile = fileListArray[fileIndex - 1];
						const filePath = getPath(selectedFile.fileName);
						fs.unlink(filePath, (err) => {
							if (err) console.error(`Error deleting file ${filePath}:`, err);
						});
							Vtuandz(`Đã xóa file ${selectedFile.fileName}`);
					} else {
							Vtuandz(`Index ${fileIndex} không hợp lệ`);
					}
				}
			} else if (args[0].toLowerCase() === 'cr') {
				//let fileName = 'test.json';
				if (args.length > 1) fileName = args.slice(1).join('_') + '.json';
				const filePath = getPath(fileName);
				if (!fs.existsSync(filePath)) {
					fs.writeFileSync(filePath, '[]', 'utf-8');
						Vtuandz(`Đã tạo file ${fileName}`);
				} else {
						Vtuandz(`File ${fileName} đã tồn tại`);
				}
			} else if (args[0].toLowerCase() === 'gf') {
				const fileIndices = args.slice(1).map(index => parseInt(index));
				for (const fileIndex of fileIndices) {
					if (fileIndex >= 1 && fileIndex <= fileListArray.length) {
						const selectedFile = fileListArray[fileIndex - 1];
						const filePath = getPath(selectedFile.fileName);
						try {
							const fileContent = fs.readFileSync(filePath, 'utf-8');
							const response = await axios.post("https://api.mocky.io/api/mock", {
								status: 200,
								content: fileContent,
								content_type: "application/json",
								charset: "UTF-8",
								secret: "NguyenMinhHuy",
								expiration: "never"
							});
							const mockyLink = response.data.link;
							console.log(mockyLink);
								Vtuandz(`${selectedFile.fileName}: ${mockyLink}`);
						} catch (error) {
							console.error('Error posting file content to RunMocky or processing response:', error);
								Vtuandz('Đã xảy ra lỗi trong quá trình xử lý!');
						}
					} else {
							Vtuandz(`Index ${fileIndex} không hợp lệ`);
					}
				}
			}
		} else if (type === 'api' && args[0].toLowerCase() === 'cr') {
		 // let fileName = 'test.json';
			if (args.length > 1) fileName = args.slice(1).join('_') + '.json';
			const filePath = getPath(fileName);
			if (!fs.existsSync(filePath)) {
				fs.writeFileSync(filePath, '[]', 'utf-8');
					Vtuandz(`Đã tạo file ${fileName}`);
			} else {
					Vtuandz(`File ${fileName} đã tồn tại`);
			}
		}
	} catch (error) {
		console.error('Lỗi trong hàm handleReply:', error);
	}
};