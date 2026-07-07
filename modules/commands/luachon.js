module.exports.config = {
	name: "luachon",
	version: "1.0.1",
	hasPermssion: 0,
	credits: "Mirai Team",
	description: "Nhờ bot chọn giúp một trong những thứ bạn cần làm",
	commandCategory: "Công cụ",
	usages: "luachon 123 | 456 | ...",
	cooldowns: 5
};

module.exports.languages = {
	"vi": {
		"return": "Bạn nên chọn: %1"
	},
	"en": {
		"return": "%1 is more suitable with you, I think so :thinking:"
	}
}

module.exports.run = async ({ api, event, args, getText }) => {
	const { threadID, messageID } = event;

	var input = args.join(" ").trim();
	if (!input) return global.utils.throwError(this.config.name, threadID, messageID);
	var array = input.split(" | ");
	return api.sendMessage(getText("return", array[Math.floor(Math.random() * array.length)]),threadID, messageID);
}