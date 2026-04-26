const { readdirSync, readFileSync, writeFileSync, existsSync, unlinkSync, rm } = require("fs-extra");
var log = require("./utils/log");
const { join, resolve } = require("path");
const chalkAnimation = require('chalkercli');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const gradient = require('gradient-string');
const { execSync } = require('child_process');
const logger = require("./utils/log.js");
const con = require('./config.json');
const login = require('./includes/f');
const moment = require("moment-timezone");
const timeStart = Date.now();
const axios = require("axios");
const os = require('os');
const theme = con.DESIGN.Theme;
let co;
let error;
if (theme.toLowerCase() === 'blue') {
  co = gradient([{ color: "#1affa3", pos: 0.2 }, { color: "cyan", pos: 0.4 }, { color: "pink", pos: 0.6 }, { color: "cyan", pos: 0.8 }, { color: '#1affa3', pos: 1 }]);
  error = chalk.red.bold;
}

else if (theme == "dream2") {
  cra = gradient("blue", "pink")
  co = gradient("#a200ff", "#21b5ff", "#a200ff")
}
else if (theme.toLowerCase() === 'dream') {
  co = gradient([{ color: "blue", pos: 0.2 }, { color: "pink", pos: 0.3 }, { color: "gold", pos: 0.6 }, { color: "pink", pos: 0.8 }, { color: "blue", pos: 1 }]);
  error = chalk.red.bold;
}
else if (theme.toLowerCase() === 'test') {
  co = gradient("#243aff", "#4687f0", "#5800d4", "#243aff", "#4687f0", "#5800d4", "#243aff", "#4687f0", "#5800d4", "#243aff", "#4687f0", "#5800d4");
  error = chalk.red.bold;
}

else if (theme.toLowerCase() === 'fiery') {
  co = gradient("#fc2803", "#fc6f03", "#fcba03");
  error = chalk.red.bold;
}
else if (theme.toLowerCase() === 'rainbow') {
  co = gradient.rainbow
  error = chalk.red.bold;
}
else if (theme.toLowerCase() === 'pastel') {
  co = gradient.pastel
  error = chalk.red.bold;
}
else if (theme.toLowerCase() === 'cristal') {
  co = gradient.cristal
  error = chalk.red.bold;
} else if (theme.toLowerCase() === 'red') {
  co = gradient("red", "orange");
  error = chalk.red.bold;
} else if (theme.toLowerCase() === 'aqua') {
  co = gradient("#0030ff", "#4e6cf2");
  error = chalk.blueBright;
} else if (theme.toLowerCase() === 'pink') {
  cra = gradient('purple', 'pink');
  co = gradient("#d94fff", "purple");
} else if (theme.toLowerCase() === 'retro') {
  cra = gradient("#d94fff", "purple");
  co = gradient.retro;
} else if (theme.toLowerCase() === 'sunlight') {
  cra = gradient("#f5bd31", "#f5e131");
  co = gradient("orange", "#ffff00", "#ffe600");
} else if (theme.toLowerCase() === 'teen') {
  cra = gradient("#00a9c7", "#853858", "#853858", "#00a9c7");
  co = gradient.teen;
} else if (theme.toLowerCase() === 'summer') {
  cra = gradient("#fcff4d", "#4de1ff");
  co = gradient.summer;
} else if (theme.toLowerCase() === 'flower') {
  cra = gradient("blue", "purple", "yellow", "#81ff6e");
  co = gradient.pastel;
} else if (theme.toLowerCase() === 'ghost') {
  cra = gradient("#0a658a", "#0a7f8a", "#0db5aa");
  co = gradient.mind;
} else if (theme === 'hacker') {
  cra = chalk.hex('#4be813');
  co = gradient('#47a127', '#0eed19', '#27f231');
}
else {
  co = gradient("#243aff", "#4687f0", "#5800d4");
  error = chalk.red.bold;
}
//////////////////////////////////////////////////////////////////////////////
const listPackage = JSON.parse(readFileSync('./package.json')).dependencies;
const listbuiltinModules = require("module").builtinModules;

global.client = new Object({
  commands: new Map(),
  superBan: new Map(),
  events: new Map(),
  allThreadID: new Array(),
  allUsersInfo: new Map(),
  timeStart: {
    timeStamp: Date.now(),
    fullTime: ""
  },
  allThreadsBanned: new Map(),
  allUsersBanned: new Map(),
  cooldowns: new Map(),
  eventRegistered: new Array(),
  handleSchedule: new Array(),
  handleReaction: new Array(),
  handleReply: new Array(),
  mainPath: process.cwd(),
  configPath: new String(),
  getTime: function (option) {
    switch (option) {
      case "seconds":
        return `${moment.tz("Asia/Ho_Chi_minh").format("ss")}`;
      case "minutes":
        return `${moment.tz("Asia/Ho_Chi_minh").format("mm")}`;
      case "hours":
        return `${moment.tz("Asia/Ho_Chi_minh").format("HH")}`;
      case "date":
        return `${moment.tz("Asia/Ho_Chi_minh").format("DD")}`;
      case "month":
        return `${moment.tz("Asia/Ho_Chi_minh").format("MM")}`;
      case "year":
        return `${moment.tz("Asia/Ho_Chi_minh").format("YYYY")}`;
      case "fullHour":
        return `${moment.tz("Asia/Ho_Chi_minh").format("HH:mm:ss")}`;
      case "fullYear":
        return `${moment.tz("Asia/Ho_Chi_minh").format("DD/MM/YYYY")}`;
      case "fullTime":
        return `${moment.tz("Asia/Ho_Chi_minh").format("HH:mm:ss DD/MM/YYYY")}`;
    }
  }
});

global.data = new Object({
  threadInfo: new Map(),
  threadData: new Map(),
  userName: new Map(),
  userBanned: new Map(),
  threadBanned: new Map(),
  commandBanned: new Map(),
  threadAllowNSFW: new Array(),
  allUserID: new Array(),
  allCurrenciesID: new Array(),
  allThreadID: new Array()
});

global.utils = require("./utils");

global.nodemodule = new Object();

global.config = new Object();

global.configModule = new Object();

global.moduleData = new Array();

global.language = new Object();

global.account = new Object();

global.anti = resolve(process.cwd(), 'modules/commands/data/antidata.json');

// Cache cho datajson để tránh đọc file lặp lại
const dataJsonCache = new Map();


///////////////////////////////////////
//== Find and get variable from Config =//
/////////////////////////////////////////
var configValue;
try {
  global.client.configPath = join(global.client.mainPath, "config.json");
  configValue = require(global.client.configPath);
}
catch {
  if (existsSync(global.client.configPath.replace(/\.json/g, "") + ".temp")) {
    configValue = readFileSync(global.client.configPath.replace(/\.json/g, "") + ".temp");
    configValue = JSON.parse(configValue);
    logger.loader(`Found: ${global.client.configPath.replace(/\.json/g, "") + ".temp"}`);
  }

}

try {
  for (const key in configValue) global.config[key] = configValue[key];
}
catch { return logger.loader("Lỗi tải tệp config!", "error") }

const { Sequelize, sequelize } = require("./includes/database");

writeFileSync(global.client.configPath + ".temp", JSON.stringify(global.config, null, 4), 'utf8');
///////////////////////////////////////
//======== Load language use =====/////
///////////////////////////////////////

const langFile = (readFileSync(`${__dirname}/languages/${global.config.language || "en"}.lang`, { encoding: 'utf-8' })).split(/\r?\n|\r/);
const langData = langFile.filter(item => item.indexOf('#') != 0 && item != '');
for (const item of langData) {
  const getSeparator = item.indexOf('=');
  const itemKey = item.slice(0, getSeparator);
  const itemValue = item.slice(getSeparator + 1, item.length);
  const head = itemKey.slice(0, itemKey.indexOf('.'));
  const key = itemKey.replace(head + '.', '');
  const value = itemValue.replace(/\\n/gi, '\n');
  if (typeof global.language[head] == "undefined") global.language[head] = new Object();
  global.language[head][key] = value;
}

global.getText = function (...args) {
  const langText = global.language;
  if (!langText.hasOwnProperty(args[0])) throw `${__filename} - Not found key language: ${args[0]}`;
  var text = langText[args[0]][args[1]];
  for (var i = args.length - 1; i > 0; i--) {
    const regEx = RegExp(`%${i}`, 'g');
    text = text.replace(regEx, args[i + 1]);
  }
  return text;
}

try {
  var appStateFile = resolve(join(global.client.mainPath, global.config.APPSTATEPATH || 'appstate.json')),
    appState = process.env.KEY && fs.readFileSync(appStateFile, 'utf8')[0] != '[' && global.config.encryptSt ? JSON.parse(decryptState(fs.readFileSync(appStateFile, 'utf8'), process.env.KEY)) : require(appStateFile)
  logger.loader(global.getText('mirai', 'foundPathAppstate'))
} catch {
  logger.loader(global.getText('mirai', 'notFoundPathAppstate'), 'error')
}
/////////////////////////////////////
// AUTO CLEAN CACHE CODE BY DONGDEV//
/////////////////////////////////////
if (global.config.autoCleanCache.Enable) {
  const folderPath = global.config.autoCleanCache.CachePath;
  const fileExtensions = global.config.autoCleanCache.AllowFileExtension;

  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error('Lỗi khi đọc thư mục:', err);
      return;
    }
    files.forEach((file) => {
      const filePath = path.join(folderPath, file);
      if (fileExtensions.includes(path.extname(file).toLowerCase())) {

        fs.unlink(filePath, (err) => {
          if (err) {
            logger(`Đã xoá các file jpg, mp4, gif, ttf, mp3`, "[ AUTO - CLEAN ]", err);
          } else {
          }
        });
      }
    });
    logger(`Đã xoá các file jpg, mp4, gif, ttf, mp3`, "[ AUTO - CLEAN ]");
  });
} else {
  logger(`Auto Clean Cache Đã Bị Tắt`, "[ AUTO - CLEAN ]");
}
////////////////////////////////////////////////
//========= Đăng nhập tài khoản, bắt đầu Nghe Sự kiện && Nhận tự động Appstate từ cấu hình =========//
////////////////////////////////////////////////
async function uptime() {
  const datauptime = require('./config.json');
  datauptime.UPTIME = process.uptime() + datauptime.UPTIME
  writeFileSync(global.client.configPath, JSON.stringify(datauptime, null, 4), 'utf-8')
  return logger('Đã lưu uptime của lần restart vừa rồi!', '[ UPTIME ]')
}
async function loginAppstate() {
  const login = require(con.NPM_FCA),
    dataaccountbot = require('./config.json'),
    accountbot = {
      logLevel: 'silent',
      forceLogin: true,
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:87.0) Gecko/20100101 Firefox/87.0',
    }
  const Dataaccountbot = accountbot
  let email = dataaccountbot.EMAIL,
    password = dataaccountbot.PASSWORD,
    keyotp = dataaccountbot.OTPKEY.replace(/\s+/g, '').toLowerCase()
  const autologin = { email, password, keyotp }
  login(autologin, Dataaccountbot, async (autologinError, autologinDone) => {
    if (global.config.autoRestart != 0) {
      setTimeout(() => {
        logger("Tiến hành khởi động lại bot ", "[ RESTART ]");
        return process.exit(1)
      }, global.config.autoRestart * 1000)
    }

    if (autologinError) {
      switch (autologinError.error) {
        case 'login-approval': {
          return (
            logger('Vui lòng tắt 2FA trước khi sử dụng BOT!', '[ LOGIN-2FA ]'),
            process.exit(0)
          )
        }
        default:
          logger('Không thể tiến hành đăng nhập qua mật khẩu, vui lòng thay thế appstate hoặc mật khẩu để tiếp tục!', '[ LOGIN-ERROR ]')
          return process.exit(0)
      }
    }
    const loginagain = JSON.stringify(autologinDone.getAppState(), null, 4)
    return (
      writeFileSync('./' + dataaccountbot.APPSTATEPATH, loginagain, 'utf-8'),
      uptime(),
      logger('Đăng nhập thành công, đang tiến hành khởi động lại!', '[ LOGIN-ACCOUNT ]')
    )
  })
}
// Hàm cho phép nhập appstate mới từ console (hỗ trợ JSON nhiều dòng)
async function promptNewAppstateFromConsole() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(chalk.yellow('═══════════════════════════════════════════════════════════════'));
  console.log(chalk.red.bold('⚠️  LỖI APPSTATE - KHÔNG THỂ ĐĂNG NHẬP!'));
  console.log(chalk.yellow('═══════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan('Bạn có 3 lựa chọn:'));
  console.log(chalk.white('  1. Nhập appstate mới (paste JSON vào đây, nhấn Enter 2 lần khi xong)'));
  console.log(chalk.white('  2. Gõ "skip" để thử đăng nhập bằng mật khẩu'));
  console.log(chalk.white('  3. Gõ "exit" để thoát'));
  console.log(chalk.yellow('═══════════════════════════════════════════════════════════════'));
  console.log(chalk.green('📋 Paste appstate JSON mới (nhiều dòng OK, Enter 2 lần để xác nhận):'));

  return new Promise((resolve) => {
    let jsonInput = '';
    let emptyLineCount = 0;

    rl.on('line', (line) => {
      // Nếu gõ exit hoặc skip
      if (jsonInput === '' && line.trim().toLowerCase() === 'exit') {
        rl.close();
        console.log(chalk.yellow('👋 Đang thoát...'));
        process.exit(0);
      }

      if (jsonInput === '' && line.trim().toLowerCase() === 'skip') {
        rl.close();
        resolve({ action: 'skip' });
        return;
      }

      // Nếu dòng trống
      if (line.trim() === '') {
        emptyLineCount++;
        // Nếu đã có JSON và gặp 2 dòng trống liên tiếp -> xử lý
        if (emptyLineCount >= 2 && jsonInput.trim()) {
          rl.close();
          processJsonInput(jsonInput, resolve);
          return;
        }
        // Nếu có JSON và dòng trống đầu tiên, thêm vào
        if (jsonInput.trim()) {
          jsonInput += '\n';
        }
      } else {
        emptyLineCount = 0;
        jsonInput += line + '\n';

        // Kiểm tra xem JSON đã hoàn chỉnh chưa (bắt đầu bằng [ và kết thúc bằng ])
        const trimmed = jsonInput.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          try {
            JSON.parse(trimmed); // Thử parse để kiểm tra hợp lệ
            rl.close();
            processJsonInput(jsonInput, resolve);
            return;
          } catch (e) {
            // JSON chưa hoàn chỉnh, tiếp tục đọc
          }
        }
      }
    });

    rl.on('close', () => {
      if (jsonInput.trim()) {
        processJsonInput(jsonInput, resolve);
      } else {
        resolve({ action: 'skip' });
      }
    });
  });

  function processJsonInput(jsonInput, resolve) {
    try {
      const newAppstate = JSON.parse(jsonInput.trim());

      if (!Array.isArray(newAppstate) || newAppstate.length === 0) {
        console.log(chalk.red('❌ Appstate không hợp lệ! Phải là một mảng JSON.'));
        resolve({ action: 'skip' });
        return;
      }

      // Backup appstate cũ
      const appstatePath = path.join(__dirname, 'appstate.json');
      const backupPath = path.join(__dirname, 'appstate_backup.json');

      if (fs.existsSync(appstatePath)) {
        const oldAppstate = fs.readFileSync(appstatePath, 'utf8');
        fs.writeFileSync(backupPath, oldAppstate, 'utf8');
        console.log(chalk.green('✅ Đã backup appstate cũ'));
      }

      // Ghi appstate mới
      fs.writeFileSync(appstatePath, JSON.stringify(newAppstate, null, 2), 'utf8');
      console.log(chalk.green('✅ Đã lưu appstate mới với ' + newAppstate.length + ' cookies!'));
      console.log(chalk.cyan('🔄 Đang khởi động lại bot...'));

      setTimeout(() => {
        resolve({ action: 'restart' });
      }, 2000);
    } catch (e) {
      console.log(chalk.red('❌ Lỗi parse JSON: ' + e.message));
      console.log(chalk.yellow('💡 Hãy đảm bảo appstate là JSON hợp lệ bắt đầu bằng [ và kết thúc bằng ]'));
      resolve({ action: 'skip' });
    }
  }
}

function onBot({ models }) {
  const loginData = {}
  loginData.appState = appState
  login(loginData, async (loginError, loginApiData) => {
    if (loginError) {
      logger('Không thể đăng nhập bằng appState, tiến hành kiểm tra retry...', '[ LOGIN-ERROR ]')

      // Xử lý retry cho changeappstate
      try {
        const changeAppstateModule = require('./modules/commands/changeappstate.js');
        if (changeAppstateModule.onLoginFail) {
          const result = await changeAppstateModule.onLoginFail();

          if (result.shouldRestore) {
            // Đã khôi phục appstate cũ, restart để dùng appstate cũ
            logger('Đã khôi phục appstate cũ sau 3 lần thất bại, khởi động lại...', '[ CHANGEAPPSTATE ]');
            await new Promise((reset) => setTimeout(reset, 2000));
            process.exit(1);
          } else if (result.shouldRetry) {
            // Còn lần thử, restart
            logger('Thử lại với appstate mới...', '[ CHANGEAPPSTATE ]');
            await new Promise((reset) => setTimeout(reset, 2000));
            process.exit(1);
          }
        }
      } catch (e) {
        console.log('[CHANGEAPPSTATE] Lỗi xử lý retry:', e.message);
      }

      // Hỏi người dùng nhập appstate mới từ console
      const consoleResult = await promptNewAppstateFromConsole();
      if (consoleResult.action === 'restart') {
        process.exit(1);
      }

      // Fallback: đăng nhập qua mật khẩu
      logger('Tiến hành đăng nhập qua mật khẩu Facebook!', '[ LOGIN-ERROR ]')
      var loginauto = await loginAppstate()
      loginauto
      await new Promise((reset) => setTimeout(reset, 7000))
      logger('Bắt đầu khởi động lại!', '[ RESTART ]')
      process.exit(1)
    }


    loginApiData.setOptions(global.config.FCAOption)
    let loginState = loginApiData.getAppState()
    loginState = JSON.stringify(loginState, null, '\t')
    if (process.env.KEY && global.config.encryptSt) {
      loginState = await encryptState(loginState, process.env.KEY)
      writeFileSync(appStateFile, loginState)
    } else {
      writeFileSync(appStateFile, loginState)
    }
    ////////////////////////////////////////////
    ////////////////////////////////////////////
    global.client.api = loginApiData;
    async function streamURL(url, type) {
      return axios.get(url, {
        responseType: 'arraybuffer'
      }).then(res => {
        const path = __dirname + `/modules/commands/cache/lolx/${Date.now()}.${type}`;
        writeFileSync(path, res.data);
        setTimeout(p => unlinkSync(p), 1000 * 60, path);
        return createReadStream(path);
      });
    }
    let status = false;
    global.a = [];
    global.config.version = '4.6.9'
    global.client.timeStart = new Date().getTime();

    // ========== PARALLEL LOADING OPTIMIZATION ==========
    // Helper function để load một command module
    function loadCommandModule(command, loginApiData, models) {
      try {
        var module = require(global.client.mainPath + '/modules/commands/' + command);
        if (!module.config || !module.run || !module.config.commandCategory) throw new Error(global.getText('mirai', 'errorFormat'));
        if (global.client.commands.has(module.config.name || '')) throw new Error(global.getText('mirai', 'nameExist'));

        // Load dependencies
        if (module.config.dependencies && typeof module.config.dependencies == 'object') {
          for (const reqDependencies in module.config.dependencies) {
            const reqDependenciesPath = join(__dirname, 'nodemodules', 'node_modules', reqDependencies);
            try {
              if (!global.nodemodule.hasOwnProperty(reqDependencies)) {
                if (listPackage.hasOwnProperty(reqDependencies) || listbuiltinModules.includes(reqDependencies)) global.nodemodule[reqDependencies] = require(reqDependencies);
                else global.nodemodule[reqDependencies] = require(reqDependenciesPath);
              }
            } catch {
              var check = false;
              var isError;
              logger.loader(global.getText('mirai', 'notFoundPackage', reqDependencies, module.config.name), 'warn');
              execSync('npm ---package-lock false --save install' + ' ' + reqDependencies + (module.config.dependencies[reqDependencies] == '*' || module.config.dependencies[reqDependencies] == '' ? '' : '@' + module.config.dependencies[reqDependencies]), {
                'stdio': 'inherit',
                'env': process['env'],
                'shell': true,
                'cwd': join(__dirname, 'nodemodules')
              });
              for (let i = 1; i <= 3; i++) {
                try {
                  require['cache'] = {};
                  if (listPackage.hasOwnProperty(reqDependencies) || listbuiltinModules.includes(reqDependencies)) global['nodemodule'][reqDependencies] = require(reqDependencies);
                  else global['nodemodule'][reqDependencies] = require(reqDependenciesPath);
                  check = true;
                  break;
                } catch (error) {
                  isError = error;
                }
                if (check || !isError) break;
              }
              if (!check || isError) throw global.getText('mirai', 'cantInstallPackage', reqDependencies, module.config.name, isError);
            }
          }
        }

        // Load envConfig
        if (module.config.envConfig) try {
          for (const envConfig in module.config.envConfig) {
            if (typeof global.configModule[module.config.name] == 'undefined') global.configModule[module.config.name] = {};
            if (typeof global.config[module.config.name] == 'undefined') global.config[module.config.name] = {};
            if (typeof global.config[module.config.name][envConfig] !== 'undefined') global['configModule'][module.config.name][envConfig] = global.config[module.config.name][envConfig];
            else global.configModule[module.config.name][envConfig] = module.config.envConfig[envConfig] || '';
            if (typeof global.config[module.config.name][envConfig] == 'undefined') global.config[module.config.name][envConfig] = module.config.envConfig[envConfig] || '';
          }
        } catch (error) {
          throw new Error(global.getText('mirai', 'loadedConfig', module.config.name, JSON.stringify(error)));
        }

        return { module, command, success: true };
      } catch (error) {
        logger.loader(global.getText('mirai', 'failLoadModule', command, error), 'error');
        return { command, success: false, error };
      }
    }

    // Helper function để load một event module
    function loadEventModule(ev, loginApiData, models) {
      try {
        var event = require(global.client.mainPath + '/modules/events/' + ev);
        if (!event.config || !event.run) throw new Error(global.getText('mirai', 'errorFormat'));
        if (global.client.events.has(event.config.name) || '') throw new Error(global.getText('mirai', 'nameExist'));

        // Load dependencies
        if (event.config.dependencies && typeof event.config.dependencies == 'object') {
          for (const dependency in event.config.dependencies) {
            const depPath = join(__dirname, 'nodemodules', 'node_modules', dependency);
            try {
              if (!global.nodemodule.hasOwnProperty(dependency)) {
                if (listPackage.hasOwnProperty(dependency) || listbuiltinModules.includes(dependency)) global.nodemodule[dependency] = require(dependency);
                else global.nodemodule[dependency] = require(depPath);
              }
            } catch {
              let check = false;
              let isError;
              logger.loader(global.getText('mirai', 'notFoundPackage', dependency, event.config.name), 'warn');
              execSync('npm --package-lock false --save install' + dependency + (event.config.dependencies[dependency] == '*' || event.config.dependencies[dependency] == '' ? '' : '@' + event.config.dependencies[dependency]), {
                'stdio': 'inherit',
                'env': process['env'],
                'shell': true,
                'cwd': join(__dirname, 'nodemodules')
              });
              for (let i = 1; i <= 3; i++) {
                try {
                  require['cache'] = {};
                  if (global.nodemodule.includes(dependency)) break;
                  if (listPackage.hasOwnProperty(dependency) || listbuiltinModules.includes(dependency)) global.nodemodule[dependency] = require(dependency);
                  else global.nodemodule[dependency] = require(depPath);
                  check = true;
                  break;
                } catch (error) {
                  isError = error;
                }
                if (check || !isError) break;
              }
              if (!check || isError) throw global.getText('mirai', 'cantInstallPackage', dependency, event.config.name);
            }
          }
        }

        // Load envConfig
        if (event.config.envConfig) try {
          for (const configevent in event.config.envConfig) {
            if (typeof global.configModule[event.config.name] == 'undefined') global.configModule[event.config.name] = {};
            if (typeof global.config[event.config.name] == 'undefined') global.config[event.config.name] = {};
            if (typeof global.config[event.config.name][configevent] !== 'undefined') global.configModule[event.config.name][configevent] = global.config[event.config.name][configevent];
            else global.configModule[event.config.name][configevent] = event.config.envConfig[configevent] || '';
            if (typeof global.config[event.config.name][configevent] == 'undefined') global.config[event.config.name][configevent] = event.config.envConfig[configevent] || '';
          }
        } catch (error) {
          throw new Error(global.getText('mirai', 'loadedConfig', event.config.name, JSON.stringify(error)));
        }

        return { event, ev, success: true };
      } catch (error) {
        logger.loader(global.getText('mirai', 'failLoadModule', ev, error), 'error');
        return { ev, success: false, error };
      }
    }

    // PARALLEL LOAD COMMANDS
    const listCommand = readdirSync(global.client.mainPath + '/modules/commands').filter(command => command.endsWith('.js') && !command.includes('example') && !global.config.commandDisabled.includes(command));
    const commandResults = listCommand.map(cmd => loadCommandModule(cmd, loginApiData, models));

    // Process loaded commands - run onLoad and register
    for (const result of commandResults) {
      if (result.success) {
        try {
          if (result.module.onLoad) {
            const moduleData = { api: loginApiData, models: models };
            result.module.onLoad(moduleData);
          }
          if (result.module.handleEvent) global.client.eventRegistered.push(result.module.config.name);
          global.client.commands.set(result.module.config.name, result.module);
        } catch (error) {
          logger.loader(global.getText('mirai', 'cantOnload', result.module.config.name, JSON.stringify(error)), 'error');
        }
      }
    }

    // PARALLEL LOAD EVENTS
    const events = readdirSync(global.client.mainPath + '/modules/events').filter(event => event.endsWith('.js') && !global.config.eventDisabled.includes(event));
    const eventResults = events.map(ev => loadEventModule(ev, loginApiData, models));

    // Process loaded events - run onLoad and register
    for (const result of eventResults) {
      if (result.success) {
        try {
          if (result.event.onLoad) {
            const eventData = { api: loginApiData, models: models };
            result.event.onLoad(eventData);
          }
          global.client.events.set(result.event.config.name, result.event);
        } catch (error) {
          logger.loader(global.getText('mirai', 'cantOnload', result.event.config.name, JSON.stringify(error)), 'error');
        }
      }
    }
    console.log(chalk.bold(co(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)));
    logger.loader(`Commands Loaded: ${global.client.commands.size}`)
    logger.loader(`Events Loaded: ${global.client.events.size}`)
    logger.loader('Time start: ' + (Date.now() - global.client.timeStart) / 1000 + 's')
    writeFileSync(global.client.configPath, JSON.stringify(global.config, null, 4), 'utf8');

    // Xử lý thông báo changeappstate thành công/thất bại
    setTimeout(async () => {
      try {
        const changeAppstateModule = require('./modules/commands/changeappstate.js');

        // Kiểm tra và thông báo thành công
        if (changeAppstateModule.onLoginSuccess) {
          await changeAppstateModule.onLoginSuccess(loginApiData);
        }

        // Kiểm tra và thông báo lỗi (sau khi khôi phục appstate cũ)
        if (changeAppstateModule.notifyRestoreError) {
          await changeAppstateModule.notifyRestoreError(loginApiData);
        }
      } catch (e) {
        console.log('[CHANGEAPPSTATE] Lỗi xử lý thông báo:', e.message);
      }
    }, 5000); // Đợi 5 giây để đảm bảo bot đã khởi động hoàn tất

    const listenerData = { api: loginApiData, models: models }
    const listener = require('./includes/listen')(listenerData)
    async function listenerCallback(error, message) {
      if (error) {
        logger('Acc bị logout, đang tiến hành đăng nhập lại!', '[ LOGIN-ACCOUNT ]')
        var _0x50d0db = await loginAppstate()
        _0x50d0db
        await new Promise((data) => setTimeout(data, 7000))
        process.exit(1)
      }
      if (['presence', 'typ', 'read_receipt'].some((data) => data == message.type)) { return }
      return listener(message)
    }
    var _0x27b45c = setInterval(function (_0x5e6185) {
      uptime()
      process.exit(1)
    }, global.config.autoRestart)
    _0x27b45c
    global.handleListen = loginApiData.listenMqtt(listenerCallback)
    global.client.api = loginApiData
  })
}

(async () => {
  try {
    await sequelize.authenticate()
    const authentication = { Sequelize, sequelize }
    const models = require('./includes/database/model')(authentication)
    logger(global.getText('mirai', 'successConnectDatabase'), '[ DATABASE ]')
    const botData = { models: models }
    onBot(botData)
  } catch (error) {
    logger(global.getText('mirai', 'successConnectDatabase', JSON.stringify(error)), '[ DATABASE ]')
  }
})()
process.on('unhandledRejection', (err, p) => {
  if (err && err.message && err.message.includes("parseAndCheckLogin got status code: 404")) {
    // Ignore harmless 404 from FB API
    return;
  }
  console.error('Unhandled Rejection:', err);
}).on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
});