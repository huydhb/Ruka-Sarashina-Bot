module.exports.imgur = async (l) => {
    const f = require("fs"), r = require('request');
    try {
        let p, t;
        await new Promise((resolve, reject) => {
            r(l).on('response', function (response) {
                const e = response.headers['content-type'].split('/')[1];
                t = response.headers['content-type'].split('/')[0];
                p = process.cwd() + '/srcipts/cmds/cache' + `/${Date.now()}.${e}`;
                response.pipe(f.createWriteStream(p)).on('finish', resolve).on('error', reject);
            }).on('error', reject);
        });       
        const uploadResponse = await new Promise((resolve, reject) => {
            r({
                method: 'POST',
                url: 'https://api.imgur.com/3/upload',
                headers: {'Authorization': 'Client-ID c76eb7edd1459f3'},
                formData: t === "video" ? {'video': f.createReadStream(p)} : {'image': f.createReadStream(p)}
            }, (e, response, b) => {
                if (e) {reject(e);return;}
                resolve(JSON.parse(b));
            });
        });       
        f.unlink(p, err => { if (err) throw new Error(err); });
        return {link: uploadResponse.data.link};
    } catch (e) { throw new Error(e); }
};
// Share làm chó, bán làm chó