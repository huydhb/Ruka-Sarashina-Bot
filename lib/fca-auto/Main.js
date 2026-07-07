'use strict';

//-[ Require config and use ]-!/

if (global.Fca.Require.FastConfig.Config != 'default') {
    //do ssth
}
const { exec, spawn } = require('child_process');
const Language = global.Fca.Require.languageFile.find((/** @type {{ Language: string; }} */i) => i.Language == global.Fca.Require.FastConfig.Language).Folder.Index;
const FacebookLogin = require('./Extra/Src/fblogin.js')(global.Fca);


//-[ Require All Package Need Use ]-!/

var utils = global.Fca.Require.utils,
    logger = global.Fca.Require.logger,
    fs = global.Fca.Require.fs,
    getText = global.Fca.getText,
    log = global.Fca.Require.log,
    express = require("express")(),
    { join } = require('path'),
    cheerio = require("cheerio"),
    { readFileSync, writeFileSync } = require('fs-extra'),
    Database = require("./Extra/Database"),
    readline = require("readline"),
    chalk = require("chalk"),
    figlet = require("figlet"),
    os = require("os"),
    deasync = require('deasync'),
    Security = require("./Extra/Security/Base"),
    { getAll, deleteAll } = require('./Extra/ExtraGetThread'),
    ws = require('ws'),
    Websocket = require('./Extra/Src/Websocket'),
    Convert = require('ansi-to-html');
    

//-[ Set Variable For Process ]-!/

log.maxRecordSize = 100;
var checkVerified = null;
const Boolean_Option = ['online','selfListen','listenEvents','updatePresence','forceLogin','autoMarkDelivery','autoMarkRead','listenTyping','autoReconnect','emitReady'];

//-[ Set And Check Template HTML ]-!/

const css = readFileSync(join(__dirname, 'Extra', 'Html', 'Classic', 'style.css'));
const js = readFileSync(join(__dirname, 'Extra', 'Html', 'Classic', 'script.js'));

//-[ Hàm tạo giao diện HTML nâng cấp ]-!/
function ClassicHTML(UserName, Type, link) {
    return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <title>Horizon FCA - Trang Thông Tin</title>
        <link rel="stylesheet" href="./style.css">
        <style>
            body { background: linear-gradient(120deg, #232526, #414345); color: #fff; font-family: 'Segoe UI', Arial, sans-serif; }
            .card {
                background: rgba(40,40,40,0.92); border-radius: 14px; margin: 40px auto 0; max-width: 500px; box-shadow: 0 8px 32px 0 rgba(31,38,135,0.37);
                padding: 32px 30px 25px 30px;
            }
            .card h2 { color: #00e8d4; }
            .card h3 { color: #f2c94c; }
            .footer { margin-top: 35px; color: #aaa; }
            #music audio { width: 90%; border-radius: 8px; margin: 8px 0; }
            .badge { background: #00e8d4; color: #232526; border-radius: 14px; padding: 5px 15px; font-weight: bold; letter-spacing: 1px; }
        </style>
    </head>
    <body>
        <div class="card">
            <h2>Horizon FCA - Thông Tin Người Dùng</h2>
            <h3><span class="badge">Người dùng:</span> ${UserName}</h3>
            <h3><span class="badge">Loại:</span> ${Type}</h3>
            <canvas id="myCanvas"></canvas>
            <div id="music">
                <audio controls loop src="${link}">Trình duyệt không hỗ trợ audio.</audio>
            </div>
            <div class="footer">
                <b>Session ID:</b> ${global.Fca.Require.Security.create().uuid}<br>
                <b>Hệ điều hành:</b> ${os.type()} ${os.platform()}<br>
                <b>Phiên bản NodeJS:</b> ${process.version}<br>
                <b>Bot:</b> FCA-Horizon-Remastered<br>
                <b>Nhà phát triển:</b> <a href="https://fb.com/pcoder090" style="color:#00e8d4">PCoder</a>
            </div>
        </div>
        <script src="./script.js"></script>
    </body>
    </html>
    `
}

//++++++++++ [ AUTO RECOVERY FUNCTION ] ++++++++++
async function handleLoginFailure() {
    logger.Warning("Đăng nhập thất bại. Đang kiểm tra cài đặt AutoLogin...");
    
    if (global.Fca.Require.FastConfig.AutoLogin) {
        logger.Normal("AutoLogin đã được bật. Đang cố gắng tạo mới appState thông qua fblogin.js...");
        try {
            const loginResult = await FacebookLogin.login();
            if (loginResult.status === true) {
                logger.Success("Đã tạo mới appState thành công. Đang khởi động lại bot...");

                // ✅ Khởi động lại bot (chọn 1 trong 2 cách dưới)

                // Cách 1: Nếu bạn đang dùng pm2/forever để quản lý bot
                //process.exit(1);

                // Cách 2: Nếu không dùng pm2, tự động restart lại bot bằng lệnh spawn
                const { spawn } = require('child_process');
                spawn(process.argv[0], process.argv.slice(1), {
                    stdio: 'inherit',
                    detached: true
                });
                process.exit(0); // Thoát tiến trình hiện tại để tiến trình mới thay thế
                
            } else {
                logger.Error(`Đăng nhập bằng fblogin.js thất bại: ${loginResult.message}. Vui lòng kiểm tra lại thông tin tài khoản đã lưu.`);
                process.exit(0);
            }
        } catch (err) {
            logger.Error("Đã xảy ra lỗi không mong muốn trong quá trình đăng nhập lại tự động.", err);
            process.exit(0);
        }
    } else {
        logger.Error("Đăng nhập thất bại. Vui lòng cập nhật lại appState hoặc bật AutoLogin kèm thông tin tài khoản trong file FastConfigFca.json.");
        process.exit(0);
    }
}

// +++++++++++++++++++++++++++++++++++++++++++++++


//-[ Stating Http Infomation ]-!/

express.set('DFP', (process.env.PORT || process.env.port || 3004));

express.use(function(req, res, next) {
    switch (req.url.split('?')[0]) {
        case '/script.js': {
            res.writeHead(200, { 'Content-Type': 'text/javascript' });
                res.write(js);
            break;
        }
        case '/style.css': {
            res.writeHead(200, { 'Content-Type': 'text/css' });
                res.write(css);
            break;
        }
        default: {
            res.writeHead(200, "OK", { "Content-Type": "text/html" });
            res.write(ClassicHTML(global.Fca.Require.FastConfig.HTML.UserName, "Premium Access", global.Fca.Require.FastConfig.HTML.MusicLink));
        }
    }
    res.end();
})
var Server;
if (global.Fca.Require.FastConfig.HTML.HTML) {
    Server = express.listen(express.get('DFP'))
        .on('error', function (err) {
            if (err.code === 'EADDRINUSE') {
                log.error('SERVER', `Port ${express.get('DFP')} is already in use.`);
            } else {
                log.error('SERVER', err);
            }
        });
}


function setOptions(globalOptions, options) {
    Object.keys(options).map(function(key) {
        switch (Boolean_Option.includes(key)) {
            case true: {
                globalOptions[key] = Boolean(options[key]);
                break;
            }
            case false: {
                switch (key) {
                    case 'pauseLog': {
                        if (options.pauseLog) log.pause();
                            else log.resume();
                        break;
                    }
                    case 'logLevel': {
                        log.level = options.logLevel;
                            globalOptions.logLevel = options.logLevel;
                        break;
                    }
                    case 'logRecordSize': {
                        log.maxRecordSize = options.logRecordSize;
                            globalOptions.logRecordSize = options.logRecordSize;
                        break;
                    }
                    case 'pageID': {
                        globalOptions.pageID = options.pageID.toString();
                        break;
                    }
                    case 'userAgent': {
                        globalOptions.userAgent = (options.userAgent || 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36');
                        break;
                    }
                    case 'proxy': {
                        if (typeof options.proxy != "string") {
                            delete globalOptions.proxy;
                            utils.setProxy();
                        } else {
                            globalOptions.proxy = options.proxy;
                            utils.setProxy(globalOptions.proxy);
                        }
                        break;
                    }
                    default: {
                        log.warn("setOptions", "Unrecognized option given to setOptions: " + key);
                        break;
                    }
                }
                break;
            }
        }
    });
}

function buildAPI(globalOptions, html, jar) {
    let fb_dtsg = null;
    let irisSeqID = null;

    function getFBDTSG(html) {
        let match = html.match(/\["DTSGInitialData",\[\],{"token":"([^"]+)"}/);
        if (match) {
            return match[1].replace(/\\/g, '');
        }
        match = html.match(/{"token":"([^"]+)","async_get_token"/);
        if (match) {
            logger.Normal("Found fb_dtsg in async_get_token pattern");
            return match[1];
        }
        match = html.match(/<input type="hidden" name="fb_dtsg" value="([^"]+)"/);
        if (match) {
            logger.Normal("Found fb_dtsg in input field pattern");
            return match[1];
        }

        logger.Warning("Could not find fb_dtsg in any pattern");
        return null;
    }

    fb_dtsg = getFBDTSG(html);
    irisSeqID = (html.match(/irisSeqID":"([^"]+)"/) || [])[1];

    if (fb_dtsg) logger.Normal("Process OnLogin");

    var userID = (jar.getCookies("https://www.facebook.com")
        .filter(cookie => ["c_user", "i_user"].includes(cookie.key))
        .pop() || {}).value;

    if (!userID) {
        throw { 
            error: "NO_USER_ID", 
            message: "Login successful but could not retrieve userID from cookies. The appState is likely invalid." 
        };
    }

    process.env['UID'] = logger.Normal(getText(Language.UID, userID), userID);
    let needWarningHandle = false;
    let mqttEndpoint, region;

    const endpointMatch = html.match(/"endpoint":"([^"]+)"/);
    if (endpointMatch) {
        mqttEndpoint = endpointMatch[1].replace(/\\\//g, '/');
        const url = new URL(mqttEndpoint);
        region = url.searchParams.get('region')?.toUpperCase() || "PRN";
        
        logger.Normal(`MQTT Region: ${region}`);

        if (endpointMatch.input.includes("601051028565049")) {
            logger.Warning("Tài khoản đã bị dính auto!");
            needWarningHandle = true;
        }
    } else {
        logger.Warning('Sử dụng MQTT endpoint mặc định');
        mqttEndpoint = `wss://edge-chat.facebook.com/chat?region=prn&sid=${userID}`;
        region = "PRN";
    }

    var ctx = {
        userID,
        jar,
        clientID: utils.getGUID(),
        globalOptions,
        loggedIn: true,
        access_token: 'NONE',
        clientMutationId: 0,
        mqttClient: undefined,
        lastSeqId: irisSeqID,
        syncToken: undefined,
        mqttEndpoint,
        region,
        firstListen: true,
        fb_dtsg,
        req_ID: 0,
        lastPresence: Date.now(),
        debug: false
    };

    var defaultFuncs = utils.makeDefaults(html, userID, ctx);

    async function clearWarning(retries = 0) {
        try {
            const form = {
                av: userID,
                fb_api_caller_class: "RelayModern",
                fb_api_req_friendly_name: "FBScrapingWarningMutation",
                doc_id: "6339492849481770",
                variables: JSON.stringify({}),
                server_timestamps: true,
                fb_dtsg: ctx.fb_dtsg
            };

            const res = await defaultFuncs.post("https://www.facebook.com/api/graphql/", jar, form, globalOptions);
            const data = JSON.parse(res.body);

            if (data.data?.fb_scraping_warning_clear?.success) {
                logger.Normal("Đã xử lý thành công cảnh báo tài khoản!");
                logger.Normal("Đang khởi động lại bot...");
                await new Promise(resolve => setTimeout(resolve, 2000));
                exec('node index.js', { stdio: 'inherit' });
                process.exit(1);
            }

            if (retries < 2) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                return await clearWarning(retries + 1);
            }

            return false;

        } catch (e) {
            logger.Error("Lỗi khi xử lý cảnh báo:", e);
            return false;
        }
    }

    var api = {
        setOptions: setOptions.bind(null, globalOptions),
        getAppState: () => utils.getAppState(jar),
        
        refreshDTSG: async function() {
            try {
                const res = await defaultFuncs.get('https://www.facebook.com/settings', jar, null, globalOptions);
                let newDtsg = null;

                let match = res.body.match(/\["DTSGInitialData",\[\],{"token":"([^"]+)"}/);
                if (match) {
                    logger.Normal("Refreshed fb_dtsg from DTSGInitialData");
                    newDtsg = match[1].replace(/\\/g, '');
                }

                if (!newDtsg) {
                    match = res.body.match(/{"token":"([^"]+)","async_get_token"/);
                    if (match) {
                        logger.Normal("Refreshed fb_dtsg from async_get_token");
                        newDtsg = match[1];
                    }
                }

                if (!newDtsg) {
                    match = res.body.match(/<input type="hidden" name="fb_dtsg" value="([^"]+)"/);
                    if (match) {
                        logger.Normal("Refreshed fb_dtsg from input field");
                        newDtsg = match[1];
                    }
                }

                if (!newDtsg) {
                    logger.Warning("Failed to refresh fb_dtsg - no pattern matched");
                    return ctx.fb_dtsg;
                }

                logger.Normal("Successfully refreshed fb_dtsg");
                ctx.fb_dtsg = newDtsg;
                return newDtsg;

            } catch (error) {
                logger.Warning("Error while refreshing fb_dtsg:", error.message);
                return ctx.fb_dtsg;
            }
        },

        sendRequest: async function(url, form = {}, qs = {}) {
            if (!form.fb_dtsg && ctx.fb_dtsg) {
                form.fb_dtsg = ctx.fb_dtsg;
            }

            try {
                const res = await defaultFuncs.post(url, ctx.jar, form, qs);
                
                if (res.body.includes('invalid_fb_dtsg')) {
                    logger.Warning("Invalid fb_dtsg detected, refreshing...");
                    await this.refreshDTSG();
                    form.fb_dtsg = ctx.fb_dtsg;
                    return await defaultFuncs.post(url, ctx.jar, form, qs);
                }

                return res;

            } catch (error) {
                throw error;
            }
        },

        postFormData: function(url, body) {
            return defaultFuncs.postFormData(url, ctx.jar, body);
        },

        clearWarning: async function() {
            return await clearWarning();
        }
    };

    if (needWarningHandle) {
        clearWarning().catch(e => logger.Warning("Không thể xử lý cảnh báo:", e));
    }

    fs.readdirSync(__dirname + "/src")
        .filter(f => f.endsWith(".js") && !f.includes('Dev_'))
        .forEach(f => {
            const name = f.split('.')[0];
            if ((f === 'getThreadInfo.js' && !global.Fca.Require.FastConfig.AntiGetInfo.AntiGetThreadInfo) || 
                (f === 'getUserInfo.js' && !global.Fca.Require.FastConfig.AntiGetInfo.AntiGetUserInfo)) {
                api[name] = require(`./src/${f.includes('getThreadInfo') ? 'getThreadMain.js' : 'getUserInfoMain.js'}`)(defaultFuncs, api, ctx);
            } else {
                api[name] = require(`./src/${f}`)(defaultFuncs, api, ctx);
            }
        });

    return {ctx, defaultFuncs, api};
}

function makeLogin(jar, email, password, loginOptions, callback, prCallback) {
    return function(res) {
        var html = res.body,$ = cheerio.load(html),arr = [];

        $("#login_form input").map((i, v) => arr.push({ val: $(v).val(), name: $(v).attr("name") }));

        arr = arr.filter(function(v) {
            return v.val && v.val.length;
        });
        var form = utils.arrToForm(arr);
            form.lsd = utils.getFrom(html, "[\"LSD\",[],{\"token\":\"", "\"}");
            form.lgndim = Buffer.from("{\"w\":1440,\"h\":900,\"aw\":1440,\"ah\":834,\"c\":24}").toString('base64');
            form.email = email;
            form.pass = password;
            form.default_persistent = '0';
            form.locale = 'en_US';       
            form.timezone = '240';
            form.lgnjs = ~~(Date.now() / 1000);

        html.split("\"_js_").slice(1).map((val) => {
            jar.setCookie(utils.formatCookie(JSON.parse("[\"" + utils.getFrom(val, "", "]") + "]"), "facebook"),"https://www.facebook.com")
        });
        return utils
            .post("https://www.facebook.com/login/device-based/regular/login/?login_attempt=1&lwv=110", jar, form, loginOptions)
            .then(utils.saveCookies(jar))
            .then(function(/** @type {{ headers: any; }} */res) {
                var headers = res.headers;  
                if (!headers.location) throw { error: Language.InvaildAccount };

                if (headers.location.indexOf('https://www.facebook.com/checkpoint/') > -1) {
                    logger.Warning(Language.TwoAuth);
                    var nextURL = 'https://www.facebook.com/checkpoint/?next=https%3A%2F%2Fwww.facebook.com%2Fhome.php';

                    return utils
                        .get(headers.location, jar, null, loginOptions)
                        .then(utils.saveCookies(jar))
                        .then(function(res) {
                            if (!Database().get('ThroughAcc')) {
                                Database().set('ThroughAcc', email);
                            }
                            else {
                                if (String((Database().get('ThroughAcc'))).replace(RegExp('"','g'), '') != String(email).replace(RegExp('"','g'), '')) {
                                    Database().set('ThroughAcc', email);
                                    if (Database().get('Through2Fa')) {
                                        Database().delete('Through2Fa');
                                    }
                                }
                            }
                            var html = res.body,$ = cheerio.load(html), arr = [];
                            $("form input").map((i, v) => arr.push({ val: $(v).val(), name: $(v).attr("name") }));
                            arr = arr.filter(v => { return v.val && v.val.length });
                            var form = utils.arrToForm(arr);
                            if (html.indexOf("checkpoint/?next") > -1) {
                                setTimeout(() => {
                                    checkVerified = setInterval((_form) => {}, 5000, {
                                        fb_dtsg: form.fb_dtsg,
                                        jazoest: form.jazoest,
                                        dpr: 1
                                    });
                                }, 2500);  
                                switch (global.Fca.Require.FastConfig.Login2Fa) {
                                    case true: {
                                        const question = question => {
                                            const rl = readline.createInterface({
                                                input: process.stdin,
                                                output: process.stdout
                                            });
                                            var done,answ;
                                                rl.question(question, answer => {
                                                    rl.close();
                                                    answ = answer;
                                                    done = true
                                                })
                                                deasync.loopWhile(function(){
                                                    return !done;
                                                });
                                            return answ;
                                        };
                                        try {
                                            const Old_Cookie = Database().get('Through2Fa');
                                                if (Old_Cookie) {
                                                    Old_Cookie.map(function(/** @type {{ key: string; value: string; expires: string; domain: string; path: string; }} */c) {
                                                        let str = c.key + "=" + c.value + "; expires=" + c.expires + "; domain=" + c.domain + "; path=" + c.path + ";";
                                                        jar.setCookie(str, "http://" + c.domain);
                                                    });
                                                    let Form = utils.arrToForm(arr);
                                                        Form.lsd = utils.getFrom(html, "[\"LSD\",[],{\"token\":\"", "\"}");
                                                        Form.lgndim = Buffer.from("{\"w\":1440,\"h\":900,\"aw\":1440,\"ah\":834,\"c\":24}").toString('base64');
                                                        Form.email = email;
                                                        Form.pass = password;
                                                        Form.default_persistent = '0';
                                                        Form.locale = 'en_US';
                                                        Form.timezone = '240';
                                                        Form.lgnjs = ~~(Date.now() / 1000);
                                                    return utils
                                                        .post("https://www.facebook.com/login/device-based/regular/login/?login_attempt=1&lwv=110", jar, Form, loginOptions)
                                                        .then(utils.saveCookies(jar))
                                                    .then(function(res) {
                                                            let headers = res.headers
                                                                if (!headers['set-cookie'][0].includes('deleted')) {
                                                                    logger.Warning(Language.ErrThroughCookies, function() {
                                                                        Database().delete('Through2Fa');
                                                                    });
                                                                    process.exit(1);
                                                                }
                                                        if (headers.location && headers.location.indexOf('https://www.facebook.com/checkpoint/') > -1) {
                                                            return utils
                                                                .get(headers.location, jar, null, loginOptions)
                                                                .then(utils.saveCookies(jar))
                                                                .then(function(res) {
                                                                    var html = res.body,$ = cheerio.load(html), arr = [];
                                                                    $("form input").map((i, v) => arr.push({ val: $(v).val(), name: $(v).attr("name") }));
                                                                    arr = arr.filter(v => { return v.val && v.val.length });
                                                                    var Form = utils.arrToForm(arr);

                                                                    if (html.indexOf("checkpoint/?next") > -1) {
                                                                        setTimeout(() => {
                                                                            checkVerified = setInterval((_form) => {}, 5000, {
                                                                                fb_dtsg: Form.fb_dtsg,
                                                                                jazoest: Form.jazoest,
                                                                                dpr: 1
                                                                            });
                                                                        }, 2500);

                                                                        if (!res.headers.location && res.headers['set-cookie'][0].includes('checkpoint')) {
                                                                            try {
                                                                                delete Form.name_action_selected;
                                                                                Form['submit[Continue]'] = $("#checkpointSubmitButton").html();
                                                                                return utils
                                                                                    .post(nextURL, jar, Form, loginOptions)
                                                                                    .then(utils.saveCookies(jar))
                                                                                    .then(function() {
                                                                                        Form['submit[This was me]'] = "This was me";
                                                                                        return utils.post(nextURL, jar, Form, loginOptions).then(utils.saveCookies(jar));
                                                                                    })
                                                                                    .then(function() {
                                                                                        delete Form['submit[This was me]'];
                                                                                        Form.name_action_selected = 'save_device';
                                                                                        Form['submit[Continue]'] = $("#checkpointSubmitButton").html();
                                                                                        return utils.post(nextURL, jar, Form, loginOptions).then(utils.saveCookies(jar));
                                                                                    })
                                                                                    .then(function(res) {
                                                                                        var headers = res.headers;
                                                                                        if (!headers.location && res.headers['set-cookie'][0].includes('checkpoint')) {
                                                                                            Database().delete('Through2Fa');
                                                                                            process.exit(1);
                                                                                        }
                                                                                        var appState = utils.getAppState(jar,false);
                                                                                        Database().set('Through2Fa', appState);
                                                                                        return loginHelper(appState, email, password, loginOptions, callback);
                                                                                    })
                                                                                    .catch((e) => callback(e));
                                                                            }
                                                                            catch (e) {
                                                                                console.log(e)
                                                                            }
                                                                        }
                                                                    }
                                                                })
                                                        }
                                                        return utils.get('https://www.facebook.com/', jar, null, loginOptions).then(utils.saveCookies(jar));
                                                    })
                                                    .catch((e) => console.log(e));
                                                }
                                        }
                                        catch (e) {
                                            Database().delete('Through2Fa');
                                        }
                                        const Otp_code = require('totp-generator');
                                        const Code = global.Fca.Require.FastConfig.AuthString.includes('|') == false ? Otp_code(global.Fca.Require.FastConfig.AuthString.includes(" ") ? global.Fca.Require.FastConfig.AuthString.replace(RegExp(" ", 'g'), "") : global.Fca.Require.FastConfig.AuthString) :  question(Language.EnterSecurityCode); 
                                                try {
                                                    const approvals = function(N_Code) { 
                                                        form.approvals_code = N_Code;
                                                        form['submit[Continue]'] = $("#checkpointSubmitButton").html();
                                                        var prResolve,prReject;
                                                        var rtPromise = new Promise((resolve, reject) => { prResolve = resolve; prReject = reject; });

                                                        if (typeof N_Code == "string") {
                                                            utils
                                                                .post(nextURL, jar, form, loginOptions)
                                                                .then(utils.saveCookies(jar))
                                                                .then(function(res) {
                                                                    var $ = cheerio.load(res.body);
                                                                    var error = $("#approvals_code").parent().attr("data-xui-error");
                                                                    if (error) {
                                                                        logger.Warning(Language.InvaildTwoAuthCode,function() { approvals(question(Language.EnterSecurityCode)) }); //bruh loop
                                                                    };
                                                                })
                                                                .then(function() {
                                                                    delete form.no_fido;delete form.approvals_code;
                                                                    form.name_action_selected = 'save_device'; //'save_device' || 'dont_save;
                                                                    return utils.post(nextURL, jar, form, loginOptions).then(utils.saveCookies(jar));
                                                                }) 
                                                                .then(function(res) {
                                                                    var headers = res.headers;
                                                                    if (!headers.location && res.headers['set-cookie'][0].includes('checkpoint')) {
                                                                        try {
                                                                            delete form.name_action_selected;
                                                                            form['submit[Continue]'] = $("#checkpointSubmitButton").html();
                                                                            return utils
                                                                                .post(nextURL, jar, form, loginOptions)
                                                                                .then(utils.saveCookies(jar))
                                                                                .then(function() {
                                                                                    form['submit[This was me]'] = "This was me";
                                                                                    return utils.post(nextURL, jar, form, loginOptions).then(utils.saveCookies(jar));
                                                                                })
                                                                                .then(function() {
                                                                                    delete form['submit[This was me]'];
                                                                                    form.name_action_selected = 'save_device';
                                                                                    form['submit[Continue]'] = $("#checkpointSubmitButton").html();
                                                                                    return utils.post(nextURL, jar, form, loginOptions).then(utils.saveCookies(jar));
                                                                                })
                                                                                .then(function(res) {
                                                                                    var headers = res.headers;
                                                                                    if (!headers.location && res.headers['set-cookie'][0].includes('checkpoint')) throw { error: "wtf ??:D" };
                                                                                    var appState = utils.getAppState(jar,false);
                                                                                    Database().set('Through2Fa', appState);
                                                                                    return loginHelper(appState, email, password, loginOptions, callback);
                                                                                })
                                                                                .catch((e) => callback(e));
                                                                        }
                                                                        catch (e) {
                                                                            console.log(e)
                                                                        }
                                                                    }
                                                                    var appState = utils.getAppState(jar,false);
                                                                    if (callback === prCallback) {
                                                                        callback = function(err, api) {
                                                                            if (err) return prReject(err);
                                                                            return prResolve(api);
                                                                        };
                                                                    }
                                                                    Database().set('Through2Fa', appState);
                                                                    return loginHelper(appState, email, password, loginOptions, callback);
                                                                })
                                                                .catch(function(err) {
                                                                        if (callback === prCallback) prReject(err);
                                                                        else callback(err);
                                                                });
                                                        }
                                                        else {
                                                            utils
                                                                .post("https://www.facebook.com/checkpoint/?next=https%3A%2F%2Fwww.facebook.com%2Fhome.php", jar, form, loginOptions, null, { "Referer": "https://www.facebook.com/checkpoint/?next" })
                                                                .then(utils.saveCookies(jar))
                                                                .then((res) => {
                                                                    try { 
                                                                        JSON.parse(res.body.replace(/for\s*\(\s*;\s*;\s*\)\s*;\s*/, ""));
                                                                    } catch (ex) {
                                                                        clearInterval(checkVerified);
                                                                        logger.Warning(Language.VerifiedCheck);
                                                                        if (callback === prCallback) {
                                                                            callback = function(err, api) {
                                                                                if (err) return prReject(err);
                                                                                return prResolve(api);
                                                                            };
                                                                        }
                                                                        return loginHelper(utils.getAppState(jar,false), email, password, loginOptions, callback);
                                                                    }
                                                                })
                                                                .catch((ex) => {
                                                                    log.error("login", ex);
                                                                    if (callback === prCallback) prReject(ex);
                                                                    else callback(ex);
                                                                });
                                                            }
                                                        return rtPromise;
                                                    }
                                                    return approvals(Code)
                                                }
                                                catch (e) {
                                                    logger.Error(e)
                                                    logger.Error();
                                                    process.exit(0);
                                                }
                                            } 
                                    case false: {
                                        throw {
                                            error: 'login-approval',
                                            continue: function submit2FA(code) {
                                                form.approvals_code = code;
                                                form['submit[Continue]'] = $("#checkpointSubmitButton").html(); //'Continue';
                                                var prResolve,prReject;
                                                var rtPromise = new Promise((resolve, reject) => { prResolve = resolve; prReject = reject; });
                                                if (typeof code == "string") {
                                                    utils
                                                        .post(nextURL, jar, form, loginOptions)
                                                        .then(utils.saveCookies(jar))
                                                        .then(function(/** @type {{ body: string | Buffer; }} */res) {
                                                            var $ = cheerio.load(res.body);
                                                            var error = $("#approvals_code").parent().attr("data-xui-error");
                                                            if (error) {
                                                                throw {
                                                                    error: 'login-approval',
                                                                    errordesc: Language.InvaildTwoAuthCode,
                                                                    lerror: error,
                                                                    continue: submit2FA
                                                                };
                                                            }
                                                        })
                                                        .then(function() {
                                                            delete form.no_fido;delete form.approvals_code;
                                                            form.name_action_selected = 'dont_save'; //'save_device' || 'dont_save;
                                                            return utils.post(nextURL, jar, form, loginOptions).then(utils.saveCookies(jar));
                                                        })
                                                        .then(function(res) {
                                                            var headers = res.headers;
                                                            if (!headers.location && res.headers['set-cookie'][0].includes('checkpoint')) throw { error: Language.ApprovalsErr };
                                                            var appState = utils.getAppState(jar,false);
                                                            if (callback === prCallback) {
                                                                callback = function(err, api) {
                                                                    if (err) return prReject(err);
                                                                    return prResolve(api);
                                                                };
                                                            }
                                                            return loginHelper(appState, email, password, loginOptions, callback);
                                                        })
                                                        .catch(function(err) {
                                                            if (callback === prCallback) prReject(err);
                                                            else callback(err);
                                                        });
                                                } else {
                                                    utils
                                                        .post("https://www.facebook.com/checkpoint/?next=https%3A%2F%2Fwww.facebook.com%2Fhome.php", jar, form, loginOptions, null, { "Referer": "https://www.facebook.com/checkpoint/?next" })
                                                        .then(utils.saveCookies(jar))
                                                        .then((res) => {
                                                            try { 
                                                                JSON.parse(res.body.replace(/for\s*\(\s*;\s*;\s*\)\s*;\s*/, ""));
                                                            } catch (ex) {
                                                                clearInterval(checkVerified);
                                                                logger.Warning(Language.VerifiedCheck);
                                                                if (callback === prCallback) {
                                                                    callback = function(err, api) {
                                                                        if (err) return prReject(err);
                                                                        return prResolve(api);
                                                                    };
                                                                }
                                                                return loginHelper(utils.getAppState(jar,false), email, password, loginOptions, callback);
                                                            }
                                                        })
                                                        .catch((ex) => {
                                                            log.error("login", ex);
                                                            if (callback === prCallback) prReject(ex);
                                                            else callback(ex);
                                                        });
                                                    }
                                                return rtPromise;
                                            }
                                        };
                                    }
                                }
                            }
                        });
                }
                return utils.get('https://www.facebook.com/', jar, null, loginOptions).then(utils.saveCookies(jar));
            });
    };
}

function backup(data,globalOptions, callback, prCallback) {
    try {
        var appstate;
        try {
            appstate = JSON.parse(data)
        }
        catch(e) {
            appstate = data;
        }
            logger.Warning(Language.BackupNoti);
        try {
            loginHelper(appstate,null,null,globalOptions, callback, prCallback)
        }
        catch (e) {
            logger.Error(Language.ErrBackup);
            process.exit(0);
        }
    }
    catch (e) {
        return logger.Error();
    }
}

function loginHelper(appState, email, password, globalOptions, callback, prCallback) {
    var mainPromise = null;
    var jar = utils.getJar();

    try {
        if (appState) {
            switch (Database().has("FBKEY")) {
                case true: {
                    process.env.FBKEY = Database().get("FBKEY");
                }
                    break;
                case false: {
                    const SecurityKey = global.Fca.Require.Security.create().apiKey;
                        process.env['FBKEY'] = SecurityKey;
                    Database().set('FBKEY', SecurityKey);
                }
                    break;
                default: {
                    const SecurityKey = global.Fca.Require.Security.create().apiKey;
                        process.env['FBKEY'] = SecurityKey;
                    Database().set('FBKEY', SecurityKey);
                }
            }
            try {
                switch (global.Fca.Require.FastConfig.EncryptFeature) {
                    case true: {
                        appState = JSON.parse(JSON.stringify(appState, null, "\t"));
                        switch (utils.getType(appState)) {
                            case "Array": {
                                switch (utils.getType(appState[0])) {
                                    case "Object": {
                                        logger.Normal(Language.NotReadyToDecrypt);
                                    }
                                        break;
                                    case "String": {
                                        appState = Security(appState,process.env['FBKEY'],'Decrypt');
                                        logger.Normal(Language.DecryptSuccess);
                                    }
                                        break;
                                    default: {
                                        logger.Warning(Language.InvaildAppState);
                                        process.exit(0)
                                    }
                                }
                            }
                                break;
                            default: {
                                logger.Warning(Language.InvaildAppState);
                                process.exit(0)
                            }
                        } 
                    }
                        break;
                    case false: {
                        switch (utils.getType(appState)) { 
                            case "Array": {
                                switch (utils.getType(appState[0])) {
                                    case "Object": {
                                        logger.Normal(Language.EncryptStateOff);
                                    }
                                        break;
                                    case "String": {
                                        appState = Security(appState,process.env['FBKEY'],'Decrypt');
                                        logger.Normal(Language.EncryptStateOff);
                                        logger.Normal(Language.DecryptSuccess);
                                    }
                                        break;
                                    default: {
                                        logger.Warning(Language.InvaildAppState);
                                        process.exit(0)
                                    }
                                }
                            }
                                break;
                            default: {
                                logger.Warning(Language.InvaildAppState);
                                process.exit(0)
                            }
                        } 
                    }
                        break;
                    default: {
                        logger.Warning(getText(Language.IsNotABoolean,global.Fca.Require.FastConfig.EncryptFeature))
                        process.exit(0);
                    }
                }
            }
            catch (e) {
                console.log(e);
            }

            try {
                appState = JSON.parse(appState);
            }
            catch (e) {
                try {
                    appState = appState;
                }
                catch (e) {
                    return logger.Error();
                }
            }

            try {
                global.Fca.Data.AppState = appState;
                appState.map(function(c) {
                    var str = c.key + "=" + c.value + "; expires=" + c.expires + "; domain=" + c.domain + "; path=" + c.path + ";";
                    jar.setCookie(str, "http://" + c.domain);
                });
                Database().set('Backup', appState);
                mainPromise = utils.get('https://www.facebook.com/', jar, null, globalOptions, { noRef: true }).then(utils.saveCookies(jar));
            } 
            catch (e) {
                // This will be caught by the main promise's catch block
                throw new Error("Could not process the provided appState. It might be corrupted or invalid.");
            }
        }   
        else {
            mainPromise = utils
                .get("https://www.facebook.com/", null, null, globalOptions, { noRef: true })
                .then(utils.saveCookies(jar))
                .then(makeLogin(jar, email, password, globalOptions, callback, prCallback))
                .then(function() {
                    return utils.get('https://www.facebook.com/', jar, null, globalOptions).then(utils.saveCookies(jar));
                });
        }
    } catch (e) {
        // This initial catch is for synchronous errors during setup
        log.error("login-sync", e.error || e);
        return handleLoginFailure();
    }

    function handleRedirect(res) {
        var reg = /<meta http-equiv="refresh" content="0;url=([^"]+)[^>]+>/;
        var redirect = reg.exec(res.body);
        if (redirect && redirect[1]) {
            return utils.get(redirect[1], jar, null, globalOptions).then(utils.saveCookies(jar));
        }
        return res;
    }

    var ctx, api;
    mainPromise = mainPromise
        .then(handleRedirect)
        .then(function(res) {
            let Regex_Via = /MPageLoadClientMetrics/gs; 
            if (!Regex_Via.test(res.body)) {
                globalOptions.userAgent = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36";
                return utils.get('https://www.facebook.com/', jar, null, globalOptions, { noRef: true }).then(utils.saveCookies(jar));
            }
            return res;
        })
        .then(handleRedirect)
        .then(function(res) {
            var html = res.body;
            var Obj = buildAPI(globalOptions, html, jar);
            ctx = Obj.ctx;
            api = Obj.api;
            return res;
        });

    if (globalOptions.pageID) {
        mainPromise = mainPromise
            .then(function() {
                return utils.get('https://www.facebook.com/' + ctx.globalOptions.pageID + '/messages/?section=messages&subsection=inbox', ctx.jar, null, globalOptions);
            })
            .then(function(resData) {
                var url = utils.getFrom(resData.body, 'window.location.replace("https:\\/\\/www.facebook.com\\', '");').split('\\').join('');
                url = url.substring(0, url.length - 1);
                return utils.get('https://www.facebook.com' + url, ctx.jar, null, globalOptions);
            });
    }

    mainPromise
        .then(async() => { 
            callback(null, api);
        })
        .catch(function(e) {
            log.error("login", e.error || e);
            return handleLoginFailure();
        });
}

function setUserNameAndPassWord() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    // Clear console and show cool heading
    console.clear();
    console.log(
        chalk.hex('#00FFFF')(
            figlet.textSync('PCODER', {
                font: 'ANSI Shadow',
                horizontalLayout: 'default',
                verticalLayout: 'default',
                width: 80,
                whitespaceBreak: true
            })
        )
    );

    // Info box
    const infoBox = [
        chalk.hex('#FFB300').bold('┌─────────────────────────────┐'),
        chalk.hex('#FFB300').bold('│ ') + chalk.hex('#00FF99')('OS: ') + chalk.hex('#FFD700')(os.type()),
        chalk.hex('#FFB300').bold('│ ') + chalk.hex('#00FF99')('Version: ') + chalk.hex('#FFD700')(os.version()),
        chalk.hex('#FFB300').bold('│ ') + chalk.hex('#00FF99')('FCA: ') + chalk.hex('#FFD700')(global.Fca.Version),
        chalk.hex('#FFB300').bold('└─────────────────────────────┘')
    ].join('\n');
    console.log(infoBox);

    // Instructions
    console.log(
        chalk.bgHex('#6600CC').bold(
            '\n[!] Để sử dụng AutoLogin, bạn cần bật bảo mật 2FA cho tài khoản Facebook!\n'
        )
    );
    console.log(
        chalk.hex('#FF69B4').italic('Lưu ý: Nên dùng key 2FA dạng base32, KHÔNG dùng mã 6 số (code)!\n')
    );

    // Prompts
    const typeAccountPrompt = Language.TypeAccount || chalk.hex('#00FFFF')("Nhập email/SĐT Facebook: ");
    const typePasswordPrompt = Language.TypePassword || chalk.hex('#FFA500')("Nhập mật khẩu Facebook: ");
    const type2FAPrompt = Language.Type2FA || chalk.hex('#FF00FF')("Nhập 2FA secret key (để trống nếu không có): ");

    rl.question(typeAccountPrompt, (Account) => {
        if (!Account.includes("@") && isNaN(parseInt(Account))) {
            rl.close();
            logger.Normal(Language.TypeAccountError || "Tài khoản không hợp lệ. Thoát...", () => process.exit(1));
            return;
        }
        rl.question(typePasswordPrompt, function (Password) {
            rl.question(type2FAPrompt, function (Secret) {
                rl.close();
                try {
                    Database().set("Account", Account);
                    Database().set("Password", Password);
                    Database().set("TwoFAKey", Secret || "0");
                } catch (e) {
                    logger.Warning(Language.ErrDataBase || "Không thể lưu dữ liệu đăng nhập.");
                    logger.Error();
                    process.exit(0);
                }
                if (global.Fca.Require.FastConfig.ResetDataLogin) {
                    global.Fca.Require.FastConfig.ResetDataLogin = false;
                    global.Fca.Require.fs.writeFileSync(
                        process.cwd() + '/FastConfigFca.json',
                        JSON.stringify(global.Fca.Require.FastConfig, null, 4)
                    );
                }
                logger.Success(
                    Language.SuccessSetData ||
                        chalk.greenBright("\n✔️ Đã lưu tài khoản! Khởi động lại bot...\n")
                );
                process.exit(1);
            });
        });
    });
}

function login(loginData, options, callback) {
    if (utils.getType(options) === 'Function' || utils.getType(options) === 'AsyncFunction') {
        callback = options;
        options = {};
    }

    var globalOptions = {
        selfListen: false,
        listenEvents: true,
        listenTyping: false,
        updatePresence: false,
        forceLogin: false,
        autoMarkDelivery: false,
        autoMarkRead: false,
        autoReconnect: true,
        logRecordSize: 100,
        online: false,
        emitReady: false,
        userAgent: "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"
    };
    
    var prCallback = null;
    if (utils.getType(callback) !== "Function" && utils.getType(callback) !== "AsyncFunction") {
        var rejectFunc = null;
        var resolveFunc = null;
        var returnPromise = new Promise(function(resolve, reject) {
            resolveFunc = resolve;
            rejectFunc = reject;
        }); 
        prCallback = function(error, api) {
            if (error) return rejectFunc(error);
            return resolveFunc(api);
        };
        callback = prCallback;
    }

    if (loginData.email && loginData.password) {
        setOptions(globalOptions, {
            logLevel: "silent",
            forceLogin: true,
            userAgent: "Mozilla/5.o (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"
        });
        loginHelper(loginData.appState, loginData.email, loginData.password, globalOptions, callback, prCallback);
    }
    else if (loginData.appState) {
        setOptions(globalOptions, options);
        
        let All = (getAll()).filter(i => i && i.data && i.data.messageCount !== undefined);
        
            if (All.length >= 1) {
                deleteAll(All.map(obj => obj.data.threadID));
            }
        
        switch (global.Fca.Require.FastConfig.AutoLogin) {
            case true: {
                if (global.Fca.Require.FastConfig.ResetDataLogin) return setUserNameAndPassWord();
                else {
                    try {
                        const TempState = Database().get("TempState")
                        if (TempState) { 
                            try {
                                loginData.appState = JSON.parse(TempState);
                            }
                            catch (_) {
                                loginData.appState = TempState;
                            }
                            Database().delete("TempState");
                        }
                    }
                    catch (e) {
                        console.log(e)
                        Database().delete("TempState");
                            logger.Warning(Language.ErrDataBase);
                            logger.Error();
                        process.exit(0);
                    }
                    try {
                        if (Database().has('Account') && Database().has('Password')) return loginHelper(loginData.appState, loginData.email, loginData.password, globalOptions, callback, prCallback);
                        else return setUserNameAndPassWord();
                    }
                    catch (e) {
                        console.log(e)
                        logger.Warning(Language.ErrDataBase);
                            logger.Error();
                        process.exit(0);
                    }
                }
            }
            case false: {
                return loginHelper(loginData.appState, loginData.email, loginData.password, globalOptions, callback, prCallback);
            }
        }
    }
    return returnPromise;
}
module.exports = login;