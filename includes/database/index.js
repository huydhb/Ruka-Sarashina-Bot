const Sequelize = require("sequelize");
const { resolve } = require("path");
const { DATABASE } = global.config;

var dialect = Object.keys(DATABASE), storage;
dialect = dialect[0];
storage = resolve(__dirname, `../${DATABASE[dialect].storage}`);

module.exports.sequelize = new Sequelize({
	dialect,
	storage,
	pool: {
		max: 5,      // Giảm từ 20 xuống 5 - tiết kiệm memory
		min: 0,
		acquire: 30000,  // Giảm từ 60s xuống 30s - khởi động nhanh hơn
		idle: 10000      // Giảm từ 20s xuống 10s
	},
	retry: {
		match: [
			/SQLITE_BUSY/,
		],
		name: 'query',
		max: 20
	},
	logging: false,
	transactionType: 'IMMEDIATE',
	define: {
		underscored: false,
		freezeTableName: true,
		charset: 'utf8',
		dialectOptions: {
			collate: 'utf8_general_ci'
		},
		timestamps: true
	},
	sync: {
		force: false
	}
});

module.exports.Sequelize = Sequelize;