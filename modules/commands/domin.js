module.exports.config = {
    name: "domin",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "TatsuYTB",
    description: "Dò mìn",
    commandCategory: "Trò Chơi",
    usages: "",
    cooldowns: 0
  };
  
  const fs = require("fs-extra");
  const dirpath = __dirname + `/data/domin/`;
  const { loadImage, createCanvas } = require("canvas");
  var texthelp = "Hướng dẫn:\n" +
  "1. Bảng chơi được chia thành 70 ô nhỏ trong đó có 10 ô là mìn, các ô không gần mìn sẽ được đào sẵn.\n"+
  "2. Nếu đào trúng ô chứa mìn, trò chơi kết thúc và người chơi thua. Nếu đào ô không chứa mìn, ô đó sẽ hiển thị số lượng ô có mìn xung quanh nó.\n" +
  "3. Dựa vào các con số này, người chơi phải suy luận vị trí của các ô có mìn và đánh dấu chúng.\n" +
  "4. Người chơi sẽ chiến thắng khi đào lên 60 ô mà không đụng quả mìn nào.\n" +
  "5. Tương tác với trò chơi bằng cú pháp: <hành động> <tọa độ>\n" +
  "Vd: 1 E5 (đào ô có tọa độ E5)."
  async function draw(map,id) {
    const canvas = createCanvas(1200, 1000);
    const ctx = canvas.getContext('2d');
    var avatar = await loadImage(`https://graph.facebook.com/${id}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
    ctx.drawImage(avatar, 520, 10, 160, 160);
    var background = await loadImage("https://raw.githubusercontent.com/KhoaDo472005/minesweeper/main/board.png");
    ctx.drawImage(background, 0, 0, 1200, 1000);
    var texture1 = await loadImage("https://raw.githubusercontent.com/KhoaDo472005/minesweeper/main/texture1.png");
    var texture2 = await loadImage("https://raw.githubusercontent.com/KhoaDo472005/minesweeper/main/texture2.png");
    var co = await loadImage("https://raw.githubusercontent.com/KhoaDo472005/minesweeper/main/co.png");
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 7; j++) {
        const o = map[i][j];
        if (o.opened) {
          ctx.drawImage(texture2, 100+100*i, 800-100*j, 100, 100);
          if (o.isMine) {
            var mine = await loadImage("https://raw.githubusercontent.com/KhoaDo472005/minesweeper/main/bomb.png");
            ctx.drawImage(mine, 100+100*i, 800-100*j, 100, 100);
          } else {
            var number = await loadImage(`https://raw.githubusercontent.com/KhoaDo472005/minesweeper/main/no${o.adjacentMines}.png`);
            ctx.drawImage(number, 100+100*i, 800-100*j, 100, 100);
          }
        } else {
          ctx.drawImage(texture1, 100+100*i, 800-100*j, 100, 100);
          if (o.markked) ctx.drawImage(co, 100+100*i, 800-100*j, 100, 100);
        }
      }
    }
    var path = dirpath + id + ".png";
    fs.writeFileSync(path, canvas.toBuffer("image/png"));
    return path;
  }
  module.exports.onLoad = () => {
    if (!fs.existsSync(dirpath)) fs.mkdirSync(dirpath);
  }
  module.exports.run = async function ({ api, event }) {
    var { threadID, messageID, senderID } = event;
    var choose = ["1", "2"];
    var text = "Reply lựa chọn!\n1. Chơi mới\n2. Hướng dẫn";
    if (fs.existsSync(dirpath + senderID + ".json")) { choose.push("3"); text += "\n3. Chơi tiếp" }
    return api.sendMessage(text, threadID, (error, info) => {
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: senderID,
        invalidC: choose,
        type: "procedure"
      })
    }, messageID)
  }
  module.exports.handleReply = async function ({ event, api, handleReply}) {
    var {sendMessage: send, unsendMessage: unsend} = api;
    var {threadID: tid, messageID: mid, senderID: sid, args } = event;
  try {
    if (sid !== handleReply.author) return;
    if (handleReply.type == "procedure") {
      if (!handleReply.invalidC.includes(event.body)) return send("❌ Lựa chọn không hợp lệ!", tid, mid);
      if (event.body == "1") {
        unsend(handleReply.messageID);
        send("Đang khởi tạo...",tid,mid)
        const numberOfMines = 10;
        const map = [];
        for (let i = 0; i < 10; i++) {
          const row = [];
          for (let j = 0; j < 7; j++) {
            row.push({
              opened: false,
              isMine: false,
              markked: false,
              adjacentMines: 0
            });
          }
          map.push(row);
        }
        let minesCount = 0;
        while (minesCount < numberOfMines) {
          const x = Math.floor(Math.random() * 10);
          const y = Math.floor(Math.random() * 7);
          if (!map[x][y].isMine) {
            map[x][y].isMine = true;
            minesCount++;
          }
        }
        const directions = [
          [0, 1],
          [0, -1],
          [1, 0],
          [-1, 0],
          [1, 1],
          [1, -1],
          [-1, 1],
          [-1, -1]
        ];
        for (let i = 0; i < 10; i++) {
          for (let j = 0; j < 7; j++) {
            if (!map[i][j].isMine) {
              let count = 0;
              for (let k = 0; k < directions.length; k++) {
                const [dx, dy] = directions[k];
                const newX = i + dx;
                const newY = j + dy;
                if (newX >= 0 && newX < 10 && newY >= 0 && newY < 7 && map[newX][newY].isMine) count++; 
              }
              map[i][j].adjacentMines = count;
            }
          }
        }
        for (let i = 0; i < 10; i++) {
          for (let j = 0; j < 7; j++) {
            if (map[i][j].adjacentMines == 0 && !map[i][j].isMine) map[i][j].opened = true;
          }
        }
        fs.writeFileSync(dirpath+`${sid}.json`, JSON.stringify(map, null, 2));
        return send({body:"1. Đào lên\n2. Đánh dấu\n3. Bỏ đánh dấu\nVd: 1 E5,E4,E3 (đào ô E5,E4,E3)", attachment: fs.createReadStream(await draw(map, sid))}, tid, (error, info) => {
          global.client.handleReply.push({
            name: this.config.name,
            messageID: info.messageID,
            author: sid,
            type: "play"
          })
        }, mid);
      }
      if (event.body == "2") {
        unsend(handleReply.messageID);
        return send(texthelp, tid, mid)
      }
      if (event.body == "3") {
        try {
        unsend(handleReply.messageID);
        var map = JSON.parse(fs.readFileSync(dirpath+sid+".json"));
        return send({body:"1. Đào lên\n2. Đánh dấu\n3. Bỏ đánh dấu\nVd: 1 E5 (đào ô E5)", attachment: fs.createReadStream(await draw(map, sid))}, tid, (error, info) => {
          global.client.handleReply.push({
            name: this.config.name,
            messageID: info.messageID,
            author: sid,
            type: "play"
          })
        }, mid);
        } catch (error) {return send(`❌ Đã xảy ra lỗi!\n Vui lòng thử lại hoặc chơi mới\n Chi tiết lỗi:\n${error}`,tid,mid)}
      }
    }
    if (handleReply.type == "play") {
      var map = JSON.parse(fs.readFileSync(dirpath + sid + ".json"));
      var choose = parseInt(args[0]);
      if (![1, 2, 3].includes(choose) || args.length < 2) 
        return send("❌ Cú pháp không hợp lệ!", tid, mid);
        unsend(handleReply.messageID); 
      var string = "ABCDEFGHIK";
      var coordinates = args[1].split(",").map(coord => coord.trim());
      var invalidCoords = [];
      for (let coord of coordinates) {
        var x = string.indexOf(coord.slice(0, 1).toUpperCase());
        var y = parseInt(coord.slice(1));
        if (x == -1 || isNaN(y) || y < 0 || y > 6) {
          invalidCoords.push(coord);
          continue;
        }
        if (choose == 1) {
          if (map[x][y].opened) {
            invalidCoords.push(coord);
            continue;
          }
          if (map[x][y].markked) {
            invalidCoords.push(coord);
            continue;
          }
          map[x][y].opened = true;
          if (map[x][y].isMine) {
            fs.unlinkSync(dirpath + sid + ".json");
            return send({ body: `Trò chơi kết thúc!\nBạn đã đào trúng mìn 💣 ở ${coord}`, attachment: fs.createReadStream(await draw(map, sid)) }, tid, mid);
          }
        }
        if (choose == 2) {
          if (map[x][y].markked || map[x][y].opened) {
            invalidCoords.push(coord);
            continue;
          }
          map[x][y].markked = true;
        }
        if (choose == 3) {
          if (!map[x][y].markked) {
            invalidCoords.push(coord);
            continue;
          }
          map[x][y].markked = false;
        }
      }
      var unopen = 0;
      for (let col of map) {
        for (let cell of col) {
          if (!cell.opened && !cell.isMine) unopen++;
        }
      }
      if (unopen === 0) {
        fs.unlinkSync(dirpath + sid + ".json");
        return send({ body: "Bạn đã thắng!", attachment: fs.createReadStream(await draw(map, sid)) }, tid, mid);
      }
      fs.writeFileSync(dirpath + `${sid}.json`, JSON.stringify(map, null, 2));
      let invalidMessage = invalidCoords.length > 0 
        ? `Tọa độ không hợp lệ: ${invalidCoords.join(", ")}\nTiếp tục`
        : "Tiếp tục";
      return send({ 
        body: `${invalidMessage}\n1. Đào lên\n2. Đánh dấu\n3. Bỏ đánh dấu\nVd: 1 E5,E4,E3`, 
        attachment: fs.createReadStream(await draw(map, sid)) 
      }, tid, (error, info) => {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: sid,
          type: "play"
        });
      }, mid);
    }      if (handleReply.type == "play") {
      var map = JSON.parse(fs.readFileSync(dirpath + sid + ".json"));
      var action = parseInt(args[0]);
      var coordinates = args[1].split(",").map(coord => coord.trim());
      if (!isValidSyntax(action, coordinates)) {
        return send("❌ Cú pháp không hợp lệ! Vui lòng thử lại.\nVd: 1 E5,E4,E3", tid, mid);
      }
      unsend(handleReply.messageID);
      var invalidCoords = [];
      for (let coord of coordinates) {
        var string = "ABCDEFGHIK";
        var x = string.indexOf(coord.slice(0, 1).toUpperCase());
        var y = parseInt(coord.slice(1));
        if (action === 1) {
          if (map[x][y].opened || map[x][y].markked) {
            invalidCoords.push(coord);
            continue;
          }
          map[x][y].opened = true;
          if (map[x][y].isMine) {
            fs.unlinkSync(dirpath + sid + ".json");
            return send({ body: `Trò chơi kết thúc!\nBạn đã đào trúng mìn 💣 ở ${coord}`, attachment: fs.createReadStream(await draw(map, sid)) }, tid, mid);
          }
        }
        if (action === 2) {
          if (map[x][y].markked || map[x][y].opened) {
            invalidCoords.push(coord);
            continue;
          }
          map[x][y].markked = true;
        }
        if (action === 3) {
          if (!map[x][y].markked) {
            invalidCoords.push(coord);
            continue;
          }
          map[x][y].markked = false;
        }
      }
      var unopen = 0;
      for (let col of map) {
        for (let cell of col) {
          if (!cell.opened && !cell.isMine) unopen++;
        }
      }
      if (unopen === 0) {
        fs.unlinkSync(dirpath + sid + ".json");
        return send({ body: "Bạn đã thắng!", attachment: fs.createReadStream(await draw(map, sid)) }, tid, mid);
      }
      fs.writeFileSync(dirpath + `${sid}.json`, JSON.stringify(map, null, 2));
      let invalidMessage = invalidCoords.length > 0 
        ? `Tọa độ không hợp lệ: ${invalidCoords.join(", ")}\nTiếp tục`
        : "Tiếp tục";
      return send({ 
        body: `${invalidMessage}\n1. Đào lên\n2. Đánh dấu\n3. Bỏ đánh dấu\nVd: 1 E5,E4,E3`, 
        attachment: fs.createReadStream(await draw(map, sid)) 
      }, tid, (error, info) => {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: sid,
          type: "play"
        });
      }, mid);
    }    
  } catch(error) {return send("Đã xảy ra lỗi!"+error, tid, mid)}
  }