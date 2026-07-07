const { createCanvas } = require('canvas');
const fs = require('fs').promises;
const path = require('path');

const gameRooms = new Map();
const playerStates = new Map();
const BoardSize = 19;
const Columns = 'ABCDEFGHJKLMNOPQRST';
const Directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const StarPoints = [[3,3],[3,9],[3,15],[9,3],[9,9],[9,15],[15,3],[15,9],[15,15]];

module.exports.config = {
    name: "covay",
    version: "2.0.1",
    hasPermssion: 0,
    credits: "lechii",
    description: "Game cờ vây",
    commandCategory: "Trò Chơi",
    usages: "[create|join|start|info|end|pass|resign]",
    cooldowns: 2,
};

module.exports.handleReply = async ({ api, event, handleReply }) => {
    const { threadID, messageID, senderID, body } = event;
    const game = gameRooms.get(threadID);

    if (!game || game.status !== 'playing' || senderID !== game.players[game.currentPlayer]) {
        return api.sendMessage("❌ Không phải lượt của bạn!", threadID, messageID);
    }

    const move = parseMove(body.trim().toUpperCase());
    if (!move) {
        return api.sendMessage("❌ Tọa độ không hợp lệ! VD: D4, A1, T19", threadID, messageID);
    }

    const result = game.makeMove(move.col, move.row);
    if (!result.success) {
        return api.sendMessage(`❌ ${result.error}`, threadID, messageID);
    }

    const moveNotation = `${Columns[move.col]}${BoardSize - move.row}`;
    const currentPlayerId = game.players[1 - game.currentPlayer];
    const nextPlayerId = game.players[game.currentPlayer];
    const playerIcon = game.currentPlayer === 1 ? '⚫' : '⚪';
    const nextPlayerIcon = game.currentPlayer === 0 ? '⚫' : '⚪';

    const [currentPlayerInfo, nextPlayerInfo] = await Promise.all([
        api.getUserInfo(currentPlayerId),
        api.getUserInfo(nextPlayerId)
    ]);

    const currentPlayerName = currentPlayerInfo[currentPlayerId]?.name || currentPlayerId;
    const nextPlayerName = nextPlayerInfo[nextPlayerId]?.name || nextPlayerId;

    let message = `${playerIcon} đã đánh: ${moveNotation} (${currentPlayerName})\n`;
    if (result.captured > 0) message += `🎯 bắt được: ${result.captured} quân\n`;
    message += `\n${nextPlayerIcon} lượt tiếp theo: ${nextPlayerName}\n📍 nước thứ: ${game.moves.length}`;

    await sendBoardMessage(api, threadID, game, message);
};

class GoGame {
    constructor(roomId, creator) {
        this.roomId = roomId;
        this.creator = creator;
        this.players = [creator];
        this.status = 'waiting';
        this.board = Array(BoardSize).fill().map(() => Array(BoardSize).fill(null));
        this.moves = [];
        this.currentPlayer = 0;
        this.capturedStones = { black: 0, white: 0 };
        this.passCount = 0;
        this.koBoard = null;
        this.endVotes = new Set();
    }

    addPlayer(userId) {
        return this.players.length < 2 && !this.players.includes(userId) && (this.players.push(userId));
    }

    isValidMove(col, row) {
        return col >= 0 && col < BoardSize && row >= 0 && row < BoardSize && this.board[row][col] === null;
    }

    getNeighbors(col, row) {
        return Directions
            .map(([dx, dy]) => [col + dx, row + dy])
            .filter(([c, r]) => c >= 0 && c < BoardSize && r >= 0 && r < BoardSize);
    }

    getGroup(col, row, color) {
        const group = new Set();
        const stack = [[col, row]];

        while (stack.length > 0) {
            const [c, r] = stack.pop();
            const key = `${c},${r}`;
            if (group.has(key) || this.board[r][c] !== color) continue;

            group.add(key);
            this.getNeighbors(c, r).forEach(([nc, nr]) => {
                if (!group.has(`${nc},${nr}`)) stack.push([nc, nr]);
            });
        }

        return Array.from(group).map(key => key.split(',').map(Number));
    }

    hasLiberties(group) {
        return group.some(([col, row]) =>
            this.getNeighbors(col, row).some(([nc, nr]) => this.board[nr][nc] === null)
        );
    }

    captureGroups(opponentColor) {
        const captured = [];
        const processed = new Set();

        for (let row = 0; row < BoardSize; row++) {
            for (let col = 0; col < BoardSize; col++) {
                const key = `${col},${row}`;
                if (this.board[row][col] === opponentColor && !processed.has(key)) {
                    const group = this.getGroup(col, row, opponentColor);
                    group.forEach(([c, r]) => processed.add(`${c},${r}`));

                    if (!this.hasLiberties(group)) {
                        group.forEach(([c, r]) => {
                            this.board[r][c] = null;
                            captured.push([c, r]);
                        });
                    }
                }
            }
        }
        return captured;
    }

    isSuicide(col, row, color) {
        this.board[row][col] = color;
        const group = this.getGroup(col, row, color);
        const hasLiberties = this.hasLiberties(group);

        const opponentColor = color === 'black' ? 'white' : 'black';
        const canCapture = this.getNeighbors(col, row).some(([nc, nr]) =>
            this.board[nr][nc] === opponentColor && !this.hasLiberties(this.getGroup(nc, nr, opponentColor))
        );

        this.board[row][col] = null;
        return !hasLiberties && !canCapture;
    }

    boardToString() {
        return this.board.map(row => row.map(cell => cell || 'empty').join(',')).join(';');
    }

    makeMove(col, row) {
        const color = this.currentPlayer === 0 ? 'black' : 'white';

        if (!this.isValidMove(col, row)) return { success: false, error: "Vị trí không hợp lệ" };
        if (this.isSuicide(col, row, color)) return { success: false, error: "Nước đi tự sát" };

        const prevBoard = this.boardToString();
        this.board[row][col] = color;

        const opponentColor = color === 'black' ? 'white' : 'black';
        const captured = this.captureGroups(opponentColor);

        if (this.koBoard === this.boardToString()) {
            this.board[row][col] = null;
            captured.forEach(([c, r]) => this.board[r][c] = opponentColor);
            return { success: false, error: "Vi phạm luật Ko" };
        }

        this.moves.push({ col, row, color, captured: captured.length, moveNumber: this.moves.length + 1 });
        this.capturedStones[color] += captured.length;
        this.koBoard = prevBoard;
        this.currentPlayer = 1 - this.currentPlayer;
        this.passCount = 0;

        return { success: true, captured: captured.length };
    }

    pass() {
        this.passCount++;
        const currentColor = this.currentPlayer === 0 ? 'black' : 'white';
        this.currentPlayer = 1 - this.currentPlayer;
        this.moves.push({ type: 'pass', player: currentColor, moveNumber: this.moves.length + 1 });

        if (this.passCount >= 2) this.status = 'ended';
        return this.passCount >= 2;
    }

    endGame() {
        this.status = 'ended';
        return { blackScore: this.capturedStones.black, whiteScore: this.capturedStones.white + 6.5 };
    }
}

function createBoardImage(game) {
    const cellSize = 30, margin = 50, canvasSize = BoardSize * cellSize + margin * 2;
    const canvas = createCanvas(canvasSize, canvasSize);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#D2B48C';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    for (let i = 0; i < canvasSize; i += 2) {
        ctx.fillStyle = i % 4 === 0 ? '#C8A882' : '#D6BC90';
        ctx.fillRect(0, i, canvasSize, 1);
    }

    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 3;
    ctx.strokeRect(margin - 15, margin - 15, BoardSize * cellSize + 30, BoardSize * cellSize + 30);

    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < BoardSize; i++) {
        const pos = margin + i * cellSize;
        ctx.beginPath();
        ctx.moveTo(margin, pos);
        ctx.lineTo(canvasSize - margin, pos);
        ctx.moveTo(pos, margin);
        ctx.lineTo(pos, canvasSize - margin);
        ctx.stroke();
    }

    ctx.fillStyle = '#654321';
    StarPoints.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(margin + x * cellSize, margin + y * cellSize, 4, 0, 2 * Math.PI);
        ctx.fill();
    });

    for (let row = 0; row < BoardSize; row++) {
        for (let col = 0; col < BoardSize; col++) {
            const stone = game.board[row][col];
            if (stone) {
                const x = margin + col * cellSize;
                const y = margin + row * cellSize;
                const radius = 13;

                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.beginPath();
                ctx.arc(x + 2, y + 2, radius, 0, 2 * Math.PI);
                ctx.fill();

                const gradient = ctx.createRadialGradient(x - 4, y - 4, 0, x, y, radius);
                if (stone === 'black') {
                    gradient.addColorStop(0, '#4a4a4a');
                    gradient.addColorStop(1, '#000000');
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                } else {
                    gradient.addColorStop(0, '#ffffff');
                    gradient.addColorStop(1, '#e0e0e0');
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.strokeStyle = '#666666';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
            }
        }
    }

    if (game.moves.length > 0) {
        const lastMove = game.moves[game.moves.length - 1];
        if (lastMove.col !== undefined && lastMove.row !== undefined) {
            const x = margin + lastMove.col * cellSize;
            const y = margin + lastMove.row * cellSize;
            ctx.fillStyle = lastMove.color === 'black' ? '#ffffff' : '#000000';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(game.moves.length.toString(), x, y);
        }
    }

    ctx.fillStyle = '#654321';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < BoardSize; i++) {
        const pos = margin + i * cellSize;
        const coordinate = Columns[i];
        const number = (BoardSize - i).toString();
        ctx.fillText(coordinate, pos, margin - 25);
        ctx.fillText(coordinate, pos, canvasSize - margin + 25);
        ctx.fillText(number, margin - 25, pos);
        ctx.fillText(number, canvasSize - margin + 25, pos);
    }

    ctx.fillStyle = '#654321';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`⚫${game.capturedStones.black} ⚪${game.capturedStones.white}`, canvasSize / 2, canvasSize - 15);

    return canvas.toBuffer('image/png');
}

async function sendBoardMessage(api, threadID, game, message) {
    try {
        const boardBuffer = createBoardImage(game);
        const tempPath = path.join(__dirname, `temp_board_${threadID}_${Date.now()}.png`);
        await fs.writeFile(tempPath, boardBuffer);

        api.sendMessage({
            body: message,
            attachment: require('fs').createReadStream(tempPath)
        }, threadID, async (err, info) => {
            try {
                await fs.unlink(tempPath);
            } catch (unlinkErr) {
                console.error('Lỗi xóa file tạm:', unlinkErr);
            }
            if (!err) {
                global.client.handleReply.push({
                    name: module.exports.config.name,
                    messageID: info.messageID,
                    author: threadID,
                    type: 'move'
                });
            }
        });
    } catch (error) {
        console.error('Lỗi tạo hình ảnh:', error);
        api.sendMessage(message, threadID);
    }
}

function parseMove(text) {
    const match = text.match(/^([A-HJ-T])(\d{1,2})$/);
    if (!match) return null;

    const col = Columns.indexOf(match[1]);
    const row = BoardSize - parseInt(match[2]);

    return (col === -1 || row < 0 || row >= BoardSize) ? null : { col, row };
}

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const command = args[0]?.toLowerCase();

    try {
        switch (command) {
            case 'create': {
                if (gameRooms.has(threadID)) {
                    return api.sendMessage("❌ Đã có game trong nhóm này! Sử dụng 'covay end' để kết thúc.", threadID, messageID);
                }

                const game = new GoGame(threadID, senderID);
                gameRooms.set(threadID, game);
                playerStates.set(senderID, threadID);

                api.sendMessage("🔥 GAME CỜ VÂY ĐÃ ĐƯỢC TẠO!\n\n" +
                    "📋 Cách chơi:\n" +
                    "• `covay join` - Tham gia game (cần 2 người)\n" +
                    "• `covay start` - Bắt đầu game\n" +
                    "• `covay info` - Xem thông tin game\n" +
                    "• `covay end` - Kết thúc game\n\n" +
                    "⚫ Luật cờ vây:\n" +
                    "• Quân đen đi trước\n" +
                    "• Bắt quân khi bao vây hoàn toàn\n" +
                    "• Không được đi vào vị trí tự sát\n" +
                    "• Luật Ko: không được lặp lại thế cờ\n" +
                    "• Pass 2 lần liên tiếp = kết thúc game\n\n", threadID, messageID);
                break;
            }

            case 'join': {
                const game = gameRooms.get(threadID);
                if (!game) {
                    return api.sendMessage("❌ Không có game nào! Sử dụng 'covay create' để tạo.", threadID, messageID);
                }

                if (game.status !== 'waiting') {
                    return api.sendMessage("❌ Game đã bắt đầu hoặc kết thúc!", threadID, messageID);
                }

                if (game.addPlayer(senderID)) {
                    playerStates.set(senderID, threadID);
                    const userInfo = await api.getUserInfo(senderID);
                    const playerName = userInfo[senderID]?.name || senderID;
                    api.sendMessage(`✅ ${playerName} đã tham gia game!\n\n` +
                        `👥 Người chơi: ${game.players.length}/2\n` +
                        `⚫ Đen: ${game.players[0]}\n` +
                        `⚪ Trắng: ${game.players[1] || 'Chờ...'}\n\n` +
                        (game.players.length === 2 ? "🎮 Sẵn sàng! Sử dụng 'covay start' để bắt đầu" : "⏳ Chờ người chơi thứ 2..."), threadID, messageID);
                } else {
                    api.sendMessage("❌ Không thể tham gia! (Đã đủ người hoặc đã tham gia)", threadID, messageID);
                }
                break;
            }

            case 'start': {
                const game = gameRooms.get(threadID);
                if (!game) {
                    return api.sendMessage("❌ Không có game nào!", threadID, messageID);
                }

                if (game.players.length < 2) {
                    return api.sendMessage("❌ Cần đủ 2 người chơi!", threadID, messageID);
                }

                if (game.status !== 'waiting') {
                    return api.sendMessage("❌ Game đã bắt đầu hoặc kết thúc!", threadID, messageID);
                }

                game.status = 'playing';

                const [player1Info, player2Info] = await Promise.all([
                    api.getUserInfo(game.players[0]),
                    api.getUserInfo(game.players[1])
                ]);

                const player1Name = player1Info[game.players[0]]?.name || game.players[0];
                const player2Name = player2Info[game.players[1]]?.name || game.players[1];

                const message = "🎮 GAME BẮT ĐẦU!\n\n" +
                    `⚫ Đen: ${player1Name}\n` +
                    `⚪ Trắng: ${player2Name}\n\n` +
                    "🎯 Cách đánh:\n" +
                    "• Reply tin nhắn này với tọa độ (VD: D4)\n" +
                    "• `covay pass` - Bỏ lượt\n" +
                    "• `covay dauhang` - Đầu hàng\n\n" +
                    "⚫ Lượt đầu: QUÂN ĐEN";

                await sendBoardMessage(api, threadID, game, message);
                break;
            }

            case 'info': {
                const game = gameRooms.get(threadID);
                if (!game) {
                    return api.sendMessage("❌ Không có game nào!", threadID, messageID);
                }

                const statusText = {
                    waiting: "⏳ Chờ người chơi",
                    playing: "🎮 Đang chơi",
                    ended: "🏁 Đã kết thúc"
                };

                let info = `📊 THÔNG TIN GAME\n\n🎯 Trạng thái: ${statusText[game.status]}\n👥 Người chơi: ${game.players.length}/2\n`;

                if (game.players.length > 0) {
                    const [player1Info, player2Info] = await Promise.all([
                        api.getUserInfo(game.players[0]),
                        game.players.length > 1 ? api.getUserInfo(game.players[1]) : null
                    ]);

                    info += `⚫ Đen: ${player1Info[game.players[0]]?.name || game.players[0]}\n`;
                    if (game.players.length > 1) {
                        info += `⚪ Trắng: ${player2Info[game.players[1]]?.name || game.players[1]}\n`;
                    }
                }

                if (game.status === 'playing') {
                    const currentPlayer = game.currentPlayer === 0 ? '⚫ Đen' : '⚪ Trắng';
                    info += `\n🎯 Lượt hiện tại: ${currentPlayer}\n🔢 Nước đi: ${game.moves.length}\n🏆 Quân bắt: ⚫${game.capturedStones.black} ⚪${game.capturedStones.white}`;
                }

                api.sendMessage(info, threadID, messageID);
                break;
            }

            case 'pass': {
                const game = gameRooms.get(threadID);
                if (!game || game.status !== 'playing') {
                    return api.sendMessage("❌ Không có game đang chơi!", threadID, messageID);
                }

                if (senderID !== game.players[game.currentPlayer]) {
                    return api.sendMessage("❌ Không phải lượt của bạn!", threadID, messageID);
                }

                const gameEnded = game.pass();

                if (gameEnded) {
                    const scores = game.endGame();
                    api.sendMessage(`🏁 GAME KẾT THÚC!\n\n📊 Điểm số:\n⚫ Đen: ${scores.blackScore}\n⚪ Trắng: ${scores.whiteScore}\n\n🏆 Người thắng: ${scores.blackScore > scores.whiteScore ? '⚫ Đen' : '⚪ Trắng'}`, threadID, messageID);

                    gameRooms.delete(threadID);
                    game.players.forEach(p => playerStates.delete(p));
                } else {
                    const currentPlayerText = game.currentPlayer === 0 ? '⚫ Đen' : '⚪ Trắng';
                    await sendBoardMessage(api, threadID, game, `⏭️ PASS! ${game.passCount}/2\n\n🎯 Lượt tiếp: ${currentPlayerText}`);
                }
                break;
            }

            case 'dauhang':
            case 'resign': {
                const game = gameRooms.get(threadID);
                if (!game || game.status !== 'playing') {
                    return api.sendMessage("❌ Không có game đang chơi!", threadID, messageID);
                }

                if (!game.players.includes(senderID)) {
                    return api.sendMessage("❌ Bạn không phải người chơi!", threadID, messageID);
                }

                const playerIndex = game.players.indexOf(senderID);
                const winner = playerIndex === 0 ? '⚪ Trắng' : '⚫ Đen';
                const userInfo = await api.getUserInfo(senderID);
                const playerName = userInfo[senderID]?.name || senderID;

                api.sendMessage(`🏳️ ĐẦU HÀNG!\n\n😢 ${playerName} đã đầu hàng\n🏆 Người thắng: ${winner}`, threadID, messageID);

                gameRooms.delete(threadID);
                game.players.forEach(p => playerStates.delete(p));
                break;
            }

            case 'end': {
                const game = gameRooms.get(threadID);
                if (!game) {
                    return api.sendMessage("❌ Không có game nào!", threadID, messageID);
                }

                if (!game.players.includes(senderID)) {
                    return api.sendMessage("❌ Chỉ người chơi mới có thể vote kết thúc game!", threadID, messageID);
                }

                if (game.status === 'waiting') {
                    if (senderID === game.creator) {
                        gameRooms.delete(threadID);
                        game.players.forEach(p => playerStates.delete(p));
                        return api.sendMessage("🏁 Game đã được kết thúc!", threadID, messageID);
                    }
                    return api.sendMessage("❌ Chỉ chủ phòng mới có thể kết thúc game khi chưa bắt đầu!", threadID, messageID);
                }

                if (game.players.length < 2) {
                    gameRooms.delete(threadID);
                    game.players.forEach(p => playerStates.delete(p));
                    return api.sendMessage("🏁 Game đã được kết thúc!", threadID, messageID);
                }

                game.endVotes.add(senderID);
                const userInfo = await api.getUserInfo(senderID);
                const playerName = userInfo[senderID]?.name || senderID;

                if (game.endVotes.size >= 2) {
                    gameRooms.delete(threadID);
                    game.players.forEach(p => playerStates.delete(p));
                    api.sendMessage("🏁 Game đã được kết thúc theo thỏa thuận của cả 2 người chơi!", threadID, messageID);
                } else {
                    api.sendMessage(`🗳️ ${playerName} đã vote kết thúc game (${game.endVotes.size}/2)\n⏳ Cần thêm 1 vote nữa để kết thúc game`, threadID, messageID);
                }
                break;
            }

            default: {
                api.sendMessage("🔥 GAME CỜ VÂY\n\n" +
                    "📋 Cách chơi:\n" +
                    "• `covay create` - Tạo game mới\n" +
                    "• `covay join` - Tham gia game (cần 2 người)\n" +
                    "• `covay start` - Bắt đầu game\n" +
                    "• `covay info` - Xem thông tin game\n" +
                    "• `covay pass` - Bỏ lượt\n" +
                    "• `covay dauhang` - Đầu hàng\n" +
                    "• `covay end` - Kết thúc game\n\n" +
                    "🎯 Khi đánh: Reply bàn cờ với tọa độ (VD: D4)", threadID, messageID);
                break;
            }
        }
    } catch (error) {
        console.error('Lỗi game cờ vây:', error);
        api.sendMessage("❌ Có lỗi xảy ra! Vui lòng thử lại sau.", threadID, messageID);
    }
};