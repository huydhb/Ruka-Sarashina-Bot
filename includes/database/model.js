module.exports = function (input) {
	const force = false;

	const Users = require("./models/users")(input);
	const Threads = require("./models/threads")(input);
	const Currencies = require("./models/currencies")(input);

	// Sync song song thay vì tuần tự - nhanh hơn
	Promise.all([
		Users.sync({ force }),
		Threads.sync({ force }),
		Currencies.sync({ force })
	]).catch(err => console.error('Database sync error:', err));

	return {
		model: {
			Users,
			Threads,
			Currencies
		},
		use: function (modelName) {
			return this.model[`${modelName}`];
		}
	}
}