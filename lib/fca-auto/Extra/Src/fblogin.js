module.exports = function (globalFca) {
    const axios = require('axios');
    const crypto = require('crypto');
    const { v4: uuidv4 } = require('uuid');
    const qs = require('qs');
    const speakeasy = require('speakeasy');
    const fs = require('fs');
    const path = require('path');

    const Database = require('../Database');
    const logger = globalFca.Require.logger;

    const getFrom = (html, start, end) => {
        const startIdx = html.indexOf(start);
        if (startIdx === -1) return '';
        const endIdx = html.indexOf(end, startIdx + start.length);
        if (endIdx === -1) return '';
        return html.substring(startIdx + start.length, endIdx);
    };

    class FacebookLogin {
        /**
         * @param {Array<Object>} appState 
         */
        static async _bypassAutomationWarning(appState) {
            try {
                logger.Normal("Đang kiểm tra checkpoint cảnh báo tự động...");

                const c_user = (appState.find(c => c.key === "c_user") || {}).value;
                if (!c_user) {
                    logger.Warning("Không tìm thấy ID người dùng trong appState để kiểm tra cảnh báo.");
                    return;
                }

                const cookie = appState.map(c => `${c.key}=${c.value}`).join('; ');
                const headers = {
                    'Cookie': cookie,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                };

                const { data: html, request } = await axios.get('https://www.facebook.com/', { headers });
                const isWarningCheckpoint = request.res.responseUrl.includes('601051028565049');

                if (isWarningCheckpoint) {
                    logger.Warning("Phát hiện cảnh báo tự động! Đang cố gắng vượt qua...");

                    const fb_dtsg = getFrom(html, '["DTSGInitialData",[],{"token":"', '"}');
                    const jazoest = getFrom(html, 'jazoest=', '"');
                    const lsd = getFrom(html, '["LSD",[],{"token":"', '"}');

                    if (!fb_dtsg || !jazoest) {
                        logger.Error("Không thể lấy đủ token cần thiết để vượt checkpoint.");
                        return;
                    }

                    const formBypass = {
                        av: c_user,
                        fb_dtsg,
                        jazoest,
                        lsd,
                        fb_api_caller_class: "RelayModern",
                        fb_api_req_friendly_name: "FBScrapingWarningMutation",
                        variables: JSON.stringify({}),
                        server_timestamps: true,
                        doc_id: "6339492849481770"
                    };

                    const { data: bypassResult } = await axios.post("https://www.facebook.com/api/graphql/", qs.stringify(formBypass), { headers });

                    if (bypassResult.data?.fb_scraping_warning_clear?.success) {
                        logger.Success("Đã vượt qua cảnh báo tự động thành công.");
                    } else {
                        logger.Error("Vượt checkpoint thất bại. Phản hồi không thành công.");
                    }
                } else {
                    logger.Normal("Không phát hiện cảnh báo tự động.");
                }
            } catch (error) {
                logger.Error("Đã xảy ra lỗi trong quá trình kiểm tra checkpoint:", error);
            }
        }

        static async login() {
            const email = Database().get("Account");
            const password = Database().get("Password");
            const twoFactorSecret = Database().get("TwoFAKey") || "0";

            if (!email || !password) {
                logger.Warning("Không tìm thấy email hoặc mật khẩu trong Database.");
                return { status: false, message: 'Thiếu thông tin tài khoản' };
            }

            logger.Normal("Bắt đầu tiến trình đăng nhập Facebook...");

            const adid = uuidv4();
            const device_id = uuidv4();
            const family_device_id = uuidv4();
            const machine_id = [...Array(24)].map(() => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('');

            let loginData = {
                adid, email, password, device_id, family_device_id,
                locale: 'en_US',
                credentials_type: 'password',
                generate_session_cookies: '1',
                source: 'login',
                machine_id,
                fb_api_caller_class: 'com.facebook.account.login.protocol.Fb4aAuthHandler',
                api_key: '882a8490361da98702bf97a021ddc14d',
                access_token: '350685531728|62f8ce9f74b12f84c123cc23437a4a32'
            };

            const sig = Object.entries(Object.fromEntries(Object.entries(loginData).sort())).map(([k, v]) => `${k}=${v}`).join('');
            loginData.sig = crypto.createHash('md5').update(sig + loginData.access_token).digest('hex');

            const headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
                'x-fb-http-engine': 'Liger',
                'x-fb-friendly-name': 'authenticate'
            };

            try {
                logger.Normal("Đang gửi yêu cầu đăng nhập lần đầu...");
                const res = await axios.post('https://b-graph.facebook.com/auth/login', qs.stringify(loginData), { headers });

                const cookies = res.data.session_cookies;
                const appState = cookies.map(c => ({
                    key: c.name,
                    value: c.value,
                    domain: 'facebook.com',
                    path: c.path,
                    expires: c.expires,
                    httpOnly: c.secure,
                    secure: c.secure
                }));

                await this._bypassAutomationWarning(appState);

                fs.writeFileSync(path.join(__dirname, '../../../appstate.json'), JSON.stringify(appState, null, 2));
                logger.Normal("Đăng nhập thành công, appState đã được lưu vào appstate.json");

                return { status: true, appState };

            } catch (err) {
                const errorData = err.response?.data?.error?.error_data;

                if (!errorData || twoFactorSecret === '0') {
                    logger.Error("Thiếu mã 2FA hoặc tài khoản sai.");
                    return { status: false, message: 'Cần mã 2FA hoặc thông tin đăng nhập sai.' };
                }

                const totpCode = speakeasy.totp({
                    secret: twoFactorSecret.replace(/\s+/g, '').toUpperCase(),
                    encoding: 'base32'
                });

                logger.Normal(`Đã tạo mã 2FA: ${totpCode}`);
                logger.Normal("Gửi lại yêu cầu đăng nhập kèm mã 2FA...");

                const twoFactorData = {
                    ...loginData,
                    credentials_type: 'two_factor',
                    twofactor_code: totpCode,
                    userid: errorData.uid,
                    machine_id: errorData.machine_id,
                    first_factor: errorData.login_first_factor
                };

                const sig2 = Object.entries(Object.fromEntries(Object.entries(twoFactorData).sort())).map(([k, v]) => `${k}=${v}`).join('');
                twoFactorData.sig = crypto.createHash('md5').update(sig2 + loginData.access_token).digest('hex');

                try {
                    const twoFARes = await axios.post('https://b-graph.facebook.com/auth/login', qs.stringify(twoFactorData), { headers });
                    const cookies = twoFARes.data.session_cookies;
                    const appState = cookies.map(c => ({
                        key: c.name,
                        value: c.value,
                        domain: 'facebook.com',
                        path: c.path,
                        expires: c.expires,
                        httpOnly: c.secure,
                        secure: c.secure
                    }));

                    await this._bypassAutomationWarning(appState);

                    fs.writeFileSync(path.join(__dirname, '../../../appstate.json'), JSON.stringify(appState, null, 2));
                    logger.Normal("Đăng nhập bằng 2FA thành công, appState đã được lưu.");

                    return { status: true, appState };

                } catch (err2) {
                    logger.Error("Đăng nhập với 2FA thất bại.");
                    return { status: false, message: 'Đăng nhập với 2FA thất bại.' };
                }
            }
        }
    }

    return FacebookLogin;
};