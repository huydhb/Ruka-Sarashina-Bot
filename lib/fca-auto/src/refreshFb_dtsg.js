"use strict";

const utils = require("../utils");
const log = require("npmlog");

module.exports = function (defaultFuncs, api, ctx) {
  /**
   * Refreshes the fb_dtsg and jazoest values.
   * @param {Function|Object} obj
   * @param {Function} callback
   * @returns {Promise}
   */
  return function refreshFb_dtsg(obj, callback) {
    let resolveFunc = function () {};
    let rejectFunc = function () {};
    const returnPromise = new Promise(function (resolve, reject) {
      resolveFunc = resolve;
      rejectFunc = reject;
    });

    if (utils.getType(obj) === "Function" || utils.getType(obj) === "AsyncFunction") {
      callback = obj;
      obj = {};
    }

    if (!obj) obj = {};

    if (utils.getType(obj) !== "Object") {
      throw new utils.CustomError("the first parameter must be an object or a callback function");
    }

    if (!callback) {
      callback = function (err, data) {
        if (err) return rejectFunc(err);
        resolveFunc(data);
      };
    }

    if (Object.keys(obj).length == 0) {
      utils
        .get("https://m.facebook.com/", ctx.jar, null, ctx.globalOptions, { noRef: true })
        .then(function (resData) {
          const html = resData.body;

          // Tìm fb_dtsg theo nhiều cách
          let fb_dtsg = utils.getFrom(html, 'name="fb_dtsg" value="', '"');
          if (!fb_dtsg) fb_dtsg = utils.getFrom(html, '"fb_dtsg":"', '"');
          if (!fb_dtsg) fb_dtsg = utils.getFrom(html, '"DTSGInitialData":{"token":"', '"');
          if (!fb_dtsg) fb_dtsg = utils.getFrom(html, '"token":"', '"');

          const jazoest = utils.getFrom(html, 'name="jazoest" value="', '"');

          if (!fb_dtsg) {
            require("fs").writeFileSync("debug_fbdtsg.html", html);
            throw new utils.CustomError("❌ Không tìm thấy fb_dtsg. HTML đã lưu vào debug_fbdtsg.html");
          }

          ctx.fb_dtsg = fb_dtsg;
          ctx.jazoest = jazoest;

          callback(null, {
            data: {
              fb_dtsg: fb_dtsg,
              jazoest: jazoest,
            },
            message: "✅ Đã làm mới fb_dtsg và jazoest",
          });
        })
        .catch(function (err) {
          log.error("refreshFb_dtsg", err);
          return callback(err);
        });
    } else {
      Object.keys(obj).forEach(function (key) {
        ctx[key] = obj[key];
      });

      callback(null, {
        data: obj,
        message: "refreshed " + Object.keys(obj).join(", "),
      });
    }

    return returnPromise;
  };
};
