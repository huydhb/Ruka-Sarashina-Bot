module.exports.config = {
    name: "event",
    version: "1.0.1",
    hasPermssion: 3,
    credits: "Mirai Team",
    description: "Quản lý/Kiểm soát toàn bộ module của bot",
    commandCategory: "Admin",
    usages: "[load/unload/loadAll/unloadAll/info] [tên module]",
    cooldowns: 5,
    images: [],
    dependencies: {
        "fs-extra": "",
        "child_process": "",
        "path": ""
    }
};

module.exports.loadCommand = function ({ moduleList, threadID, messageID }) {
    const { execSync } = require("child_process");
    const { writeFileSync, unlinkSync, readFileSync } = require("fs-extra");
    const { join } = require("path");
    const { configPath, mainPath, api } = global.client;
    const logger = require(mainPath + "/utils/log");
    const listPackage = JSON.parse(readFileSync(global.client.mainPath + '/package.json')).dependencies;
    const listbuiltinModules = require("module").builtinModules;
    var errorList = [];

    delete require.cache[require.resolve(configPath)];
    var configValue = require(configPath);
    writeFileSync(configPath + ".temp", JSON.stringify(configValue, null, 4), 'utf8');

    for (const nameModule of moduleList) {
        try {
            const dirModule = join(__dirname, "..", "events", `${nameModule}.js`);
            delete require.cache[require.resolve(dirModule)];
            var event = require(dirModule);
            if (!event.config || !event.run) throw new Error("❎ Định dạng lỗi.");

            if (event.config.dependencies && typeof event.config.dependencies == "object") {        
                for (const packageName in event.config.dependencies) {
                    const moduleDir = join(global.client.mainPath, "nodemodules", "node_modules", packageName);
                    try {
                        if (!global.nodemodule.hasOwnProperty(packageName)) {
                            if (listPackage.hasOwnProperty(packageName) || listbuiltinModules.includes(packageName)) global.nodemodule[packageName] = require(packageName);
                            else global.nodemodule[packageName] = require(moduleDir);
                        }
                    }
                    catch {
                        var tryLoadCount = 0, loadSuccess = false, error;
                        logger.loader(`Không tìm thấy package ${packageName} cho module ${event.config.name}`, "warn");
                        execSync(`npm --package-lock false --save install ${packageName}${(event.config.dependencies[packageName] == "*" || event.config.dependencies[packageName] == "") ? "" : `@${event.config.dependencies[packageName]}`}`,
                        {
                            stdio: "inherit",
                            env: process.env,
                            shell: true,
                            cwd: join(global.client.mainPath, "nodemodules")
                        });

                        for (tryLoadCount = 1; tryLoadCount <= 3; tryLoadCount++) {
                            require.cache = {}
                            try {
                                require.cache = {};
                                if (listPackage.hasOwnProperty(packageName) || listbuiltinModules.includes(packageName)) global.nodemodule[packageName] = require(packageName);
                                else global.nodemodule[packageName] = require(moduleDir);
                                loadSuccess = true;
                                break;
                            }
                            catch (e) { error = e }
                            if (loadSuccess || !error) break;
                        }
                        if (!loadSuccess || error) throw new Error(`Không thể cài đặt package ${packageName} cho module ${event.config.name}, lỗi: ${error}`);
                    }
                }
                logger.loader(`Đã tải thành công package cho module ${event.config.name}`);
            }

            if (event.config.envConfig && typeof event.config.envConfig == "object") {
                try {
                    for (const key in event.config.envConfig) {
                        if (typeof global.configModule[event.config.name] == "undefined") global.configModule[event.config.name] = {};
                        if (typeof global.config[event.config.name] == "undefined") global.config[event.config.name] = {};
                        if (typeof global.config[event.config.name][key] !== "undefined") global.configModule[event.config.name][key] = global.config[event.config.name][key];
                        else global.configModule[event.config.name][key] = event.config.envConfig[key] || "";
                        if (typeof global.config[event.config.name][key] == "undefined") global.config[event.config.name][key] = event.config.envConfig[key] || "";
                    }
                    logger.loader(`Đã tải thành công config cho module ${event.config.name}`);
                }
                catch (error) { throw new Error(`Đã tải thành công config cho module ${event.config.name}, lỗi: ${JSON.stringify(error)}`) }
            }

            if (event.onLoad) {
                try { event.onLoad({ api }) }
                catch (error) { throw new Error(`Không thể khởi chạy setup cho module ${event.config.name}, lỗi: ${JSON.stringify(error)}`, "error") }
            }

            if (global.config["eventDisabled"].includes(`${nameModule}.js`) || configValue["eventDisabled"].includes(`${nameModule}.js`)) {
                configValue["eventDisabled"].splice(configValue["eventDisabled"].indexOf(`${nameModule}.js`), 1);
                global.config["eventDisabled"].splice(global.config["eventDisabled"].indexOf(`${nameModule}.js`), 1);
            }

            global.client.events.delete(nameModule);
            global.client.events.set(event.config.name, event);
            logger.loader(`Đã tải sự kiện ${event.config.name}!`);
        } catch (error) { errorList.push(`Không thể tải module ${event.config.name}, lỗi: ${error}`) };
    }
    if (errorList.length != 0) api.sendMessage(errorList.join("\n\n"), threadID, messageID);
    api.sendMessage(`☑️ Đã tải thành công ${moduleList.length - errorList.length} sự kiện`, threadID, messageID);
    writeFileSync(configPath, JSON.stringify(configValue, null, 4), 'utf8');
    unlinkSync(configPath + ".temp");
    return;
}

module.exports.unloadModule = function ({ moduleList, threadID, messageID }) {
    const { writeFileSync, unlinkSync } = global.nodemodule["fs-extra"];
    const { configPath, api } = global.client;
    const logger = require(mainPath + "/utils/log").loader;

    delete require.cache[require.resolve(configPath)];
    var configValue = require(configPath);
    writeFileSync(configPath + ".temp", JSON.stringify(configValue, null, 4), 'utf8');

    for (const nameModule of moduleList) {
        global.client.events.delete(nameModule);
        configValue["eventDisabled"].push(`${nameModule}.js`);
        global.config["eventDisabled"].push(`${nameModule}.js`);
        logger(`Đã hủy tải module ${nameModule}`);
    }

    writeFileSync(configPath, JSON.stringify(configValue, null, 4), 'utf8');
    unlinkSync(configPath + ".temp");

    return api.sendMessage(`☑️ Đã hủy tải thành công ${moduleList.length} sự kiện`, threadID, messageID);
}

module.exports.run = function ({ event, args, api }) {
    const { readdirSync } = global.nodemodule["fs-extra"];
    const { join } = global.nodemodule["path"];
    const { threadID, messageID } = event;
    var moduleList = args.splice(1, args.length);

    switch (args[0]) {
        case "l":
        case "load": {
            if (moduleList.length == 0) return api.sendMessage("❎ Tên module không được để trống!", threadID, messageID);
            else return this.loadCommand({ moduleList, threadID, messageID });
        }
        case "unload": {
            if (moduleList.length == 0) return api.sendMessage("❎ Tên module không được để trống!", threadID, messageID);
            else return this.unloadModule({ moduleList, threadID, messageID });
        }
        case "loadAll": {
            moduleList = readdirSync(join(global.client.mainPath, "modules", "events")).filter((file) => file.endsWith(".js") && !file.includes('example'));
            moduleList = moduleList.map(item => item.replace(/\.js/g, ""));
            return this.loadCommand({ moduleList, threadID, messageID });
        }
        case "unloadAll": {
            moduleList = readdirSync(join(global.client.mainPath, "modules", "events")).filter((file) => file.endsWith(".js") && !file.includes('example'));
            moduleList = moduleList.map(item => item.replace(/\.js/g, ""));
            return this.unloadModule({ moduleList, threadID, messageID });
        }
        case "info": {
            const event = global.client.events.get(moduleList.join("") || "");
            if (!event) return api.sendMessage("❎ Module bạn nhập không tồn tại!", threadID, messageID);
            const { name, version, credits, dependencies } = event.config;
            return api.sendMessage(`|› ${name.toUpperCase()}\n|› Tác giả: ${credits}\n|› Phiên bản: ${version}\n|› Các package yêu cầu: ${((Object.keys(dependencies || {})).join(", ") || "Không có")}\n──────────────────`, threadID, messageID);
        }
        default: {
            return global.utils.throwError(this.config.name, threadID, messageID);
        }
    }
}