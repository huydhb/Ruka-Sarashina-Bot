module.exports.config = {
	name: "info",
	version: "2.1.0",
	hasPermssion: 0,
	credits: "Bot-Mess",
	description: "Get info người dùng",
	commandCategory: "Tiện ích",
	usages: "[reply / @tag / uid]",
	cooldowns: 5
};

const axios = require("axios");
const fs    = require("fs-extra");

// ── Lấy bio qua GraphQL nội bộ ──────────────────────────────
async function getBio(uid, api) {
	try {
		const src = await api.httpPost("https://www.facebook.com/api/graphql/", {
			av: api.getCurrentUserID(),
			fb_api_req_friendly_name: "ProfileCometBioTextEditorPrivacyIconQuery",
			fb_api_caller_class: "RelayModern",
			doc_id: "5009284572488938",
			variables: JSON.stringify({ id: uid })
		});
		const bio = JSON.parse(src).data?.user?.profile_intro_card;
		return bio?.bio?.text || "Không có";
	} catch (_) { return "Không có"; }
}

// ── Scrape mbasic lấy thêm thông tin ────────────────────────
async function scrapeMbasic(uid, cookie) {
	const result = { cover: null, hometown: null, work: null, education: null, relationship: null, followers: null };
	try {
		const { data: html } = await axios.get(`https://mbasic.facebook.com/${uid}`, {
			headers: {
				cookie: cookie || "",
				"user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Mobile Safari/537.36",
				"accept-language": "vi-VN,vi;q=0.9"
			},
			timeout: 12000
		});

		// Cover photo
		const cov = html.match(/id="cover-photo"[\s\S]*?<img[^>]+src="([^"]+)"/i)
			|| html.match(/<img[^>]+src="(https:\/\/[^"]*\/cover[^"]+)"/i);
		if (cov) result.cover = cov[1].replace(/&amp;/g, "&");

		// Followers
		const fol = html.match(/(\d[\d,.]+)\s*(người theo dõi|followers)/i);
		if (fol) result.followers = fol[1];

		// Hometown / Nơi sống / Nơi làm / Học tại / Quan hệ
		const pairs = [
			[/(?:Sống tại|Lives in)[^<]*<[^>]+>([^<]+)/i,              "hometown"],
			[/(?:Quê quán|From)[^<]*<[^>]+>([^<]+)/i,                  "hometown"],
			[/(?:Làm việc tại|Works at)[^<]*<[^>]+>([^<]+)/i,          "work"],
			[/(?:Học tại|Đã học tại|Studied at)[^<]*<[^>]+>([^<]+)/i,  "education"],
			[/(Đã kết hôn|Độc thân|Đang hẹn hò|Married|Single|In a relationship)[^<]*/i, "relationship"]
		];
		for (const [re, key] of pairs) {
			const m = html.match(re);
			if (m && !result[key]) result[key] = m[1]?.trim();
		}
	} catch (_) {}
	return result;
}

// ════════════════════════════════════════════════════════════
module.exports.run = async function ({ api, event, args }) {
	const { threadID, messageID, senderID, type, mentions, messageReply } = event;
	const s = msg => api.sendMessage(msg, threadID, messageID);
	let uid;

	// ── 1. Xác định UID ──────────────────────────────────────
	if (type === "message_reply" && messageReply) {
		uid = messageReply.senderID;

	} else if (Object.keys(mentions).length > 0) {
		const keys = Object.keys(mentions).filter(k => k !== senderID);
		uid = keys[0] || Object.keys(mentions)[0];

	} else if (args.some(a => a.startsWith("@"))) {
		// Gõ @tên thủ công → tìm trong participantIDs
		const atIdx   = args.findIndex(a => a.startsWith("@"));
		const search  = args.slice(atIdx).join(" ").replace(/^@/, "").toLowerCase().trim();
		const members = event.participantIDs || [];
		if (!members.length) return s("❌ Không lấy được danh sách thành viên nhóm.");
		try {
			const map  = await api.getUserInfo(members);
			let found  = null;
			for (const [id, u] of Object.entries(map)) {
				if (id === senderID) continue;
				const n = (u.name || "").toLowerCase();
				if (n.includes(search) || search.split(" ").some(w => w.length > 1 && n.includes(w))) {
					found = id; break;
				}
			}
			if (!found) return s(`❌ Không tìm thấy "${args.slice(atIdx).join(" ")}" trong nhóm.\n💡 Dùng /info <UID> hoặc reply tin nhắn.`);
			uid = found;
		} catch (e) { return s("❌ Lỗi tìm thành viên: " + e.message); }

	} else {
		const raw = args.find(a => /\d{5,}/.test(a));
		uid = raw ? String(raw.match(/\d{5,}/)[0]) : senderID;
	}
	uid = String(uid);

	// ── 2. Lấy thông tin ─────────────────────────────────────
	try {
		api.sendMessage("🔄 Đang lấy thông tin...", threadID, messageID);

		const cookie = global.config?.ACCESSCOOKIE_WHITE || global.cookie || "";

		// Song song: getUserInfo (built-in, không cần token), bio, mbasic
		const [fcaMap, bio, mbasic] = await Promise.all([
			api.getUserInfo([uid]).catch(() => ({})),
			getBio(uid, api),
			scrapeMbasic(uid, cookie)
		]);

		const fca        = fcaMap[uid] || {};
		const name       = fca.name        || "Không có";
		const gender     = fca.gender === "male" ? "Nam" : fca.gender === "female" ? "Nữ" : "Không có";
		const profileUrl = fca.profileUrl  || `https://www.facebook.com/profile.php?id=${uid}`;
		const hometown   = mbasic.hometown  || "Không có";
		const work       = mbasic.work      || "Không có";
		const education  = mbasic.education || "Không có";
		const cover      = mbasic.cover     || "Không có";
		const followers  = mbasic.followers || "Không có";
		const rela       = mbasic.relationship || "Không có";

		// ── 3. Tải avatar (không cần token) ──────────────────
		const avatarUrl  = `https://graph.facebook.com/${uid}/picture?width=720&height=720&redirect=true`;
		const cachePath  = __dirname + "/cache/1.png";
		let attachment;
		try {
			const img = await axios.get(avatarUrl, { responseType: "arraybuffer", timeout: 10000 });
			fs.outputFileSync(cachePath, img.data);
			attachment = fs.createReadStream(cachePath);
		} catch (_) {}

		// ── 4. Gửi kết quả ────────────────────────────────────
		const body = `👤 Tên: ${name}
🔎 UID: ${uid}
⚥  Giới tính: ${gender}
📝 Bio: ${bio}
🏡 Quê quán: ${hometown}
🎓 Trường: ${education}
💼 Nơi làm: ${work}
💞 Quan hệ: ${rela}
👥 Followers: ${followers}
🖼 Ảnh bìa: ${cover !== "Không có" ? "Có (xem profile)" : "Không có"}
🔗 Link: ${profileUrl}`;

		api.sendMessage(
			{ body, ...(attachment ? { attachment } : {}) },
			threadID,
			() => { try { fs.unlinkSync(cachePath); } catch (_) {} },
			messageID
		);

	} catch (e) {
		s(`❌ Lỗi: ${e.message}`);
	}
};
