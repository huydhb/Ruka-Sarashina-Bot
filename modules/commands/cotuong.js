const { createCanvas } = require('canvas');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const redPieces = ['兵', '炮', '俥', '傌', '相', '仕', '帥'];

class ChessBoard {
    constructor(width = 800, height = 900) {
        this.canvas = createCanvas(width, height);
        this.ctx = this.canvas.getContext('2d');
        this.boardWidth = 640;
        this.boardHeight = 720;
        this.startX = (width - this.boardWidth) / 2;
        this.startY = (height - this.boardHeight) / 2;
        this.cellWidth = this.boardWidth / 8;
        this.cellHeight = this.boardHeight / 9;
    }

    drawBoard() {
        const ctx = this.ctx;

        ctx.fillStyle = '#D4A574';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.startX - 10, this.startY - 10, this.boardWidth + 20, this.boardHeight + 20);

        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;

        for (let i = 0; i <= 9; i++) {
            const y = this.startY + i * this.cellHeight;
            ctx.beginPath();
            ctx.moveTo(this.startX, y);
            ctx.lineTo(this.startX + this.boardWidth, y);
            ctx.stroke();
        }

        for (let i = 0; i <= 8; i++) {
            const x = this.startX + i * this.cellWidth;
            
            ctx.beginPath();
            ctx.moveTo(x, this.startY);
            ctx.lineTo(x, this.startY + 4 * this.cellHeight);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x, this.startY + 5 * this.cellHeight);
            ctx.lineTo(x, this.startY + 9 * this.cellHeight);
            ctx.stroke();
        }

        this.drawPalace(0, 2);
        this.drawPalace(7, 2);

        this.drawRiver();

        this.drawCannonPoints();

        this.drawCoordinates();
    }

    drawPalace(startRow, width) {
        const ctx = this.ctx;
        const x1 = this.startX + 3 * this.cellWidth;
        const x2 = this.startX + 5 * this.cellWidth;
        const y1 = this.startY + startRow * this.cellHeight;
        const y2 = this.startY + (startRow + 2) * this.cellHeight;

        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x2, y1);
        ctx.lineTo(x1, y2);
        ctx.stroke();
    }

    drawRiver() {
        const ctx = this.ctx;
        const riverY = this.startY + 4.5 * this.cellHeight;

        ctx.fillStyle = '#B8860B';
        ctx.fillRect(this.startX, this.startY + 4 * this.cellHeight + 10, 
                    this.boardWidth, this.cellHeight - 20);

        ctx.fillStyle = '#8B4513';
        ctx.font = 'bold 36px serif';
        ctx.textAlign = 'center';

        const leftText = '楚河';
        const rightText = '漢界';
        const centerX = this.startX + this.boardWidth / 2;

        ctx.fillText(leftText, centerX - 80, riverY + 10);
        ctx.fillText(rightText, centerX + 80, riverY + 10);
    }

    drawCannonPoints() {
        const ctx = this.ctx;
        const points = [
            [1, 2], [7, 2],
            [1, 7], [7, 7],
            [0, 3], [2, 3], [4, 3], [6, 3], [8, 3],
            [0, 6], [2, 6], [4, 6], [6, 6], [8, 6]
        ];

        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;

        points.forEach(([col, row]) => {
            const x = this.startX + col * this.cellWidth;
            const y = this.startY + row * this.cellHeight;

            const size = 8;
            ctx.beginPath();
            ctx.moveTo(x - size, y);
            ctx.lineTo(x + size, y);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x, y - size);
            ctx.lineTo(x, y + size);
            ctx.stroke();
        });
    }

    drawCoordinates() {
        const ctx = this.ctx;
        ctx.fillStyle = '#2F1B14';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const coordOffset = 50; 

        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
        for (let i = 0; i < 9; i++) {
            const x = this.startX + i * this.cellWidth;
            
            ctx.fillText(letters[i], x, this.startY - coordOffset);
            
            ctx.fillText(letters[i], x, this.startY + this.boardHeight + coordOffset);
        }

        for (let i = 0; i < 10; i++) {
            const y = this.startY + i * this.cellHeight;
            const number = i;
            
            ctx.fillText(number.toString(), this.startX - coordOffset, y);
            
            ctx.fillText(number.toString(), this.startX + this.boardWidth + coordOffset, y);
        }
    }

    drawPiece(piece, row, col, isSelected = false) {
        const ctx = this.ctx;
        const x = this.startX + col * this.cellWidth;
        const y = this.startY + row * this.cellHeight;
        const radius = 35;

        const isRed = redPieces.includes(piece);

        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.arc(x + 3, y + 3, radius, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = isSelected ? '#FFD700' : '#F5F5DC';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();

        ctx.strokeStyle = isRed ? '#B22222' : '#000000';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = isRed ? '#B22222' : '#000000';
        ctx.font = 'bold 28px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(piece, x, y);
    }

    renderBoard(board, selectedPos = null) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawBoard();

        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 9; col++) {
                const piece = board[row][col];
                if (piece) {
                    const isSelected = selectedPos && 
                        selectedPos.row === row && selectedPos.col === col;
                    this.drawPiece(piece, row, col, isSelected);
                }
            }
        }

        return this.canvas.toBuffer('image/png');
    }

    highlightValidMoves(validMoves) {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';

        validMoves.forEach(([row, col]) => {
            const x = this.startX + col * this.cellWidth;
            const y = this.startY + row * this.cellHeight;

            ctx.beginPath();
            ctx.arc(x, y, 15, 0, 2 * Math.PI);
            ctx.fill();
        });
    }

    highlightLastMove(fromPos, toPos) {
        const ctx = this.ctx;
        ctx.strokeStyle = '#FF6B6B';
        ctx.lineWidth = 4;

        const fromX = this.startX + fromPos.col * this.cellWidth;
        const fromY = this.startY + fromPos.row * this.cellHeight;
        ctx.strokeRect(fromX - 40, fromY - 40, 80, 80);

        const toX = this.startX + toPos.col * this.cellWidth;
        const toY = this.startY + toPos.row * this.cellHeight;
        ctx.strokeRect(toX - 40, toY - 40, 80, 80);

        ctx.strokeStyle = '#FF6B6B';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        const angle = Math.atan2(toY - fromY, toX - fromX);
        const arrowLength = 20;
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - arrowLength * Math.cos(angle - Math.PI / 6), 
                  toY - arrowLength * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - arrowLength * Math.cos(angle + Math.PI / 6), 
                  toY - arrowLength * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
    }
}

module.exports.config = {
    name: "cotuong",
    version: "1.0.0", 
    hasPermission: 0,
    credits: "lechii",
    description: "Game Cờ Tướng - Chinese Chess",
    commandCategory: "Trò Chơi",
    usages: "[tạo/tham gia/bắt đầu/di chuyển]",
    cooldowns: 0
};

if (!global.coTuong) global.coTuong = new Map();

module.exports.handleReply = async function ({ api, event, handleReply }) {
    const { threadID, messageID, senderID, body } = event;
    const { type } = handleReply;

    if (type === "waiting_move") {
        const game = global.coTuong.get(threadID);
        if (!game) return;

        if (game.currentPlayer !== senderID) {
            return api.sendMessage("❌ Không phải lượt của bạn!", threadID, messageID);
        }

        const move = body.trim().toLowerCase();
        if (move.length === 4 && /^[a-i][0-9][a-i][0-9]$/.test(move)) {
            await makeMove(api, threadID, messageID, game, move);
        } else {
            return api.sendMessage("❌ Định dạng nước đi không đúng! Ví dụ: e2e4", threadID, messageID);
        }
    }
};

module.exports.run = async function ({ api, event, args, Users }) {
    const { threadID, messageID, senderID } = event;

    const action = args[0]?.toLowerCase();

    switch (action) {
        case "tạo":
            await createGame(api, threadID, messageID, senderID);
            break;
        case "tham":
            await joinGame(api, threadID, messageID, senderID, Users);
            break;
        case "bắt":
            await startGame(api, threadID, messageID, senderID);
            break;
        case "board":
            await showBoard(api, threadID, messageID);
            break;
        case "rời":
        case "roi":
            await leaveGame(api, threadID, messageID, senderID);
            break;
        case "kết":
        case "ket":
        case "end":
            await endGame(api, threadID, messageID, senderID);
            break;
        case "đầu":
        case "dau":
        case "surrender":
            await surrender(api, threadID, messageID, senderID);
            break;
        default:
            const localImagePath = path.join(__dirname, '..', '..', 'modules', 'commands', 'cache', 'cotuong.jpg');

            let attachment = null;
            try {
                await fs.promises.mkdir(path.dirname(localImagePath), { recursive: true });
                if (!fs.existsSync(localImagePath)) {
                    await fs.promises.writeFile(localImagePath, response.data);
                }
                attachment = fs.createReadStream(localImagePath);
            } catch (error) {
                console.error("Lỗi khi tải hoặc lưu ảnh Cờ Tướng:", error);
            }

            return api.sendMessage({
                body: `🏛️ GAME CỜ TƯỚNG 🏛️

🎮 Cách chơi:
• ${this.config.name} tạo - Tạo game mới
• ${this.config.name} tham - Tham gia game (2 người)
• ${this.config.name} bắt - Bắt đầu game
• ${this.config.name} board - Xem bàn cờ
• ${this.config.name} rời - Rời khỏi game
• ${this.config.name} kết - Kết thúc game
• ${this.config.name} đầu - Đầu hàng

🎯 Trong game:
• Nhập nước đi: a1b2 (từ vị trí a1 đến b2)
• Tọa độ: a-i (cột), 0-9 (hàng)

🔴 Quân Đỏ: 車馬象士將炮兵
⚫ Quân Đen: 車馬象士將炮卒`,
                attachment: attachment
            }, threadID, messageID);
    }
};

async function createGame(api, threadID, messageID, senderID) {
    if (global.coTuong.has(threadID)) {
        return api.sendMessage("❌ Đã có game đang diễn ra!", threadID, messageID);
    }

    global.coTuong.set(threadID, {
        creator: senderID,
        redPlayer: null,
        blackPlayer: null,
        currentPlayer: null,
        board: initializeBoard(),
        status: "waiting",
        turn: "red",
        endVotes: new Set()
    });

    return api.sendMessage(`🏛️ Đã tạo game Cờ Tướng!

👥 Nhập "${module.exports.config.name} tham" để tham gia
🚀 Nhập "${module.exports.config.name} bắt" để bắt đầu`, threadID, messageID);
}

async function joinGame(api, threadID, messageID, senderID, Users) {
    const game = global.coTuong.get(threadID);

    if (!game) return api.sendMessage("❌ Chưa có game nào!", threadID, messageID);
    if (game.status !== "waiting") return api.sendMessage("❌ Game đã bắt đầu!", threadID, messageID);

    const userName = await Users.getNameUser(senderID);

    if (!game.redPlayer) {
        game.redPlayer = { id: senderID, name: userName };
        return api.sendMessage(`✅ ${userName} tham gia 🔴!`, threadID, messageID);
    } else if (!game.blackPlayer && senderID !== game.redPlayer.id) {
        game.blackPlayer = { id: senderID, name: userName };
        return api.sendMessage(`✅ ${userName} tham gia ⚫!

🎮 Đủ người! Nhập "${module.exports.config.name} bắt"`, threadID, messageID);
    } else {
        return api.sendMessage("❌ Game đã đủ người!", threadID, messageID);
    }
}

async function startGame(api, threadID, messageID, senderID) {
    const game = global.coTuong.get(threadID);

    if (!game || game.creator !== senderID) return api.sendMessage("❌ Chỉ người tạo game mới bắt đầu được!", threadID, messageID);
    if (!game.redPlayer || !game.blackPlayer) return api.sendMessage("❌ Cần đủ 2 người!", threadID, messageID);
    if (game.status !== "waiting") return api.sendMessage("❌ Game đã bắt đầu hoặc đã kết thúc!", threadID, messageID);

    game.status = "playing";
    game.currentPlayer = game.redPlayer.id;
    game.chessBoard = new ChessBoard();

    const boardImage = game.chessBoard.renderBoard(game.board);
    const imagePath = `./chess-${threadID}.png`;
    fs.writeFileSync(imagePath, boardImage);

    return api.sendMessage({
        body: `🏛️ GAME BẮT ĐẦU! 🏛️

🔴 ${game.redPlayer.name}
⚫ ${game.blackPlayer.name}

🎯 Lượt: ${game.redPlayer.name}

📝 Reply và nhập nước đi (vd: e2e4)`,
        attachment: fs.createReadStream(imagePath)
    }, threadID, (err, info) => {
        fs.unlinkSync(imagePath);
        global.client.handleReply.push({
            name: module.exports.config.name,
            messageID: info.messageID,
            type: "waiting_move"
        });
    }, messageID);
}

function initializeBoard() {
    const board = Array(10).fill(null).map(() => Array(9).fill(null));

    board[0] = ['車', '馬', '象', '士', '將', '士', '象', '馬', '車'];
    board[2] = [null, '砲', null, null, null, null, null, '砲', null];
    board[3] = ['卒', null, '卒', null, '卒', null, '卒', null, '卒'];

    board[6] = ['兵', null, '兵', null, '兵', null, '兵', null, '兵'];
    board[7] = [null, '炮', null, null, null, null, null, '炮', null];
    board[9] = ['俥', '傌', '相', '仕', '帥', '仕', '相', '傌', '俥'];

    return board;
}

async function makeMove(api, threadID, messageID, game, move) {
    const fromCol = move[0].charCodeAt(0) - 97;
    const fromRow = parseInt(move[1]);
    const toCol = move[2].charCodeAt(0) - 97;
    const toRow = parseInt(move[3]);

    if (fromCol < 0 || fromCol > 8 || toCol < 0 || toCol > 8 || 
        fromRow < 0 || fromRow > 9 || toRow < 0 || toRow > 9) {
        return api.sendMessage("❌ Tọa độ không hợp lệ!", threadID, messageID);
    }

    const piece = game.board[fromRow][fromCol];
    if (!piece) return api.sendMessage("❌ Không có quân cờ!", threadID, messageID);

    const isRedPiece = redPieces.includes(piece);
    const isCurrentPlayerRed = game.currentPlayer === game.redPlayer.id;

    if (isRedPiece !== isCurrentPlayerRed) return api.sendMessage("❌ Không phải quân của bạn!", threadID, messageID);
    if (!isValidMove(game.board, fromRow, fromCol, toRow, toCol, piece)) return api.sendMessage("❌ Nước đi không hợp lệ!", threadID, messageID);

    const capturedPiece = game.board[toRow][toCol];
    game.board[toRow][toCol] = piece;
    game.board[fromRow][fromCol] = null;

    game.chessBoard.renderBoard(game.board);
    game.chessBoard.highlightLastMove(
        { row: fromRow, col: fromCol },
        { row: toRow, col: toCol }
    );
    const boardImage = game.chessBoard.canvas.toBuffer('image/png');
    const imagePath = `./chess-move-${threadID}.png`;
    fs.writeFileSync(imagePath, boardImage);

    let message = `✅ ${isCurrentPlayerRed ? game.redPlayer.name : game.blackPlayer.name} đi: ${move}`;

    if (capturedPiece) message += `\n🎯 Bắt: ${capturedPiece}`;
    if (capturedPiece === '將' || capturedPiece === '帥') {
        game.status = "finished";
        const winnerSymbol = isCurrentPlayerRed ? "🔴" : "⚫";
        message += `\n🏆 ${isCurrentPlayerRed ? game.redPlayer.name : game.blackPlayer.name} ${winnerSymbol} THẮNG!`;
        global.coTuong.delete(threadID);

        return api.sendMessage({ body: message, attachment: fs.createReadStream(imagePath) }, threadID, () => fs.unlinkSync(imagePath), messageID);
    }

    game.currentPlayer = isCurrentPlayerRed ? game.blackPlayer.id : game.redPlayer.id;
    game.turn = isCurrentPlayerRed ? "black" : "red";

    const nextPlayer = isCurrentPlayerRed ? game.blackPlayer.name : game.redPlayer.name;
    const nextColorSymbol = isCurrentPlayerRed ? "⚫ (Đen)" : "🔴 (Đỏ)";

    message += `\n\n🎯 Lượt: ${nextPlayer} ${nextColorSymbol}`;
    message += `\n📝 Reply để nhập nước đi`;

    return api.sendMessage({ body: message, attachment: fs.createReadStream(imagePath) }, threadID, (err, info) => {
        fs.unlinkSync(imagePath);
        global.client.handleReply.push({ name: module.exports.config.name, messageID: info.messageID, type: "waiting_move" });
    }, messageID);
}

function isValidMove(board, fromRow, fromCol, toRow, toCol, piece) {
    const targetPiece = board[toRow][toCol];
    const isFromRed = redPieces.includes(piece);
    if (targetPiece && isFromRed === redPieces.includes(targetPiece)) return false;

    switch (piece) {
        case '帥': case '將': return isValidGeneralMove(fromRow, fromCol, toRow, toCol, piece === '帥');
        case '仕': case '士': return isValidAdvisorMove(fromRow, fromCol, toRow, toCol, piece === '仕');
        case '相': case '象': return isValidElephantMove(board, fromRow, fromCol, toRow, toCol, piece === '相');
        case '俥': case '車': return isValidRookMove(board, fromRow, fromCol, toRow, toCol);
        case '傌': case '馬': return isValidKnightMove(board, fromRow, fromCol, toRow, toCol);
        case '炮': case '砲': return isValidCannonMove(board, fromRow, fromCol, toRow, toCol);
        case '兵': case '卒': return isValidPawnMove(fromRow, fromCol, toRow, toCol, piece === '兵');
        default: return false;
    }
}

function isValidGeneralMove(fromRow, fromCol, toRow, toCol, isRed) {
    const palace = isRed ? [7, 8, 9] : [0, 1, 2];
    if (!palace.includes(toRow) || toCol < 3 || toCol > 5) return false;

    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

function isValidAdvisorMove(fromRow, fromCol, toRow, toCol, isRed) {
    const palace = isRed ? [7, 8, 9] : [0, 1, 2];
    if (!palace.includes(toRow) || toCol < 3 || toCol > 5) return false;

    return Math.abs(toRow - fromRow) === 1 && Math.abs(toCol - fromCol) === 1;
}

function isValidElephantMove(board, fromRow, fromCol, toRow, toCol, isRed) {
    const side = isRed ? [5, 6, 7, 8, 9] : [0, 1, 2, 3, 4];
    if (!side.includes(toRow)) return false;

    if (Math.abs(toRow - fromRow) !== 2 || Math.abs(toCol - fromCol) !== 2) return false;

    const blockRow = fromRow + (toRow - fromRow) / 2;
    const blockCol = fromCol + (toCol - fromCol) / 2;
    return !board[blockRow][blockCol];
}

function isValidRookMove(board, fromRow, fromCol, toRow, toCol) {
    if (fromRow !== toRow && fromCol !== toCol) return false;

    if (fromRow === toRow) {
        const minCol = Math.min(fromCol, toCol);
        const maxCol = Math.max(fromCol, toCol);
        for (let col = minCol + 1; col < maxCol; col++) {
            if (board[fromRow][col]) return false;
        }
    } else {
        const minRow = Math.min(fromRow, toRow);
        const maxRow = Math.max(fromRow, toRow);
        for (let row = minRow + 1; row < maxRow; row++) {
            if (board[row][fromCol]) return false;
        }
    }
    return true;
}

function isValidKnightMove(board, fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);

    if (!((rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2))) return false;

    let blockRow, blockCol;
    if (rowDiff === 2) {
        blockRow = fromRow + (toRow - fromRow) / 2;
        blockCol = fromCol;
    } else {
        blockRow = fromRow;
        blockCol = fromCol + (toCol - fromCol) / 2;
    }

    return !board[blockRow][blockCol];
}

function isValidCannonMove(board, fromRow, fromCol, toRow, toCol) {
    if (fromRow !== toRow && fromCol !== toCol) return false;

    let pieceCount = 0;

    if (fromRow === toRow) {
        const minCol = Math.min(fromCol, toCol);
        const maxCol = Math.max(fromCol, toCol);
        for (let col = minCol + 1; col < maxCol; col++) {
            if (board[fromRow][col]) pieceCount++;
        }
    } else {
        const minRow = Math.min(fromRow, toRow);
        const maxRow = Math.max(fromRow, toRow);
        for (let row = minRow + 1; row < maxRow; row++) {
            if (board[row][fromCol]) pieceCount++;
        }
    }

    const targetPiece = board[toRow][toCol];
    return targetPiece ? pieceCount === 1 : pieceCount === 0;
}

function isValidPawnMove(fromRow, fromCol, toRow, toCol, isRed) {
    const forward = isRed ? -1 : 1;
    const river = isRed ? 4 : 5;

    if (toRow === fromRow + forward && toCol === fromCol) return true;

    if ((isRed && fromRow <= river) || (!isRed && fromRow >= river)) {
        if (toRow === fromRow && Math.abs(toCol - fromCol) === 1) return true;
    }

    return false;
}

async function showBoard(api, threadID, messageID) {
    const game = global.coTuong.get(threadID);

    if (!game) return api.sendMessage("❌ Không có game nào!", threadID, messageID);

    let message = "🏛️ BÀN CỜ TƯỚNG\n\n";
    if (game.status === 'playing') {
        const currentPlayerName = game.currentPlayer === game.redPlayer.id ? 
            game.redPlayer.name : game.blackPlayer.name;
        const currentColorSymbol = game.turn === 'red' ? '🔴 (Đỏ)' : '⚫ (Đen)';
        message += `🎯 Lượt: ${currentPlayerName} ${currentColorSymbol}`;
    }

    if (!game.chessBoard) game.chessBoard = new ChessBoard();

    const boardImage = game.chessBoard.renderBoard(game.board);
    const imagePath = `./chess-board-${threadID}.png`;
    fs.writeFileSync(imagePath, boardImage);

    return api.sendMessage({ body: message, attachment: fs.createReadStream(imagePath) }, threadID, () => fs.unlinkSync(imagePath), messageID);
}

async function leaveGame(api, threadID, messageID, senderID) {
    const game = global.coTuong.get(threadID);

    if (!game) return api.sendMessage("❌ Không có game nào để rời!", threadID, messageID);

    const isRedPlayer = game.redPlayer && game.redPlayer.id === senderID;
    const isBlackPlayer = game.blackPlayer && game.blackPlayer.id === senderID;
    const isCreator = game.creator === senderID;

    if (!isRedPlayer && !isBlackPlayer && !isCreator) return api.sendMessage("❌ Bạn không có trong game này!", threadID, messageID);

    let message = "";

    if (game.status === "waiting") {
        if (isRedPlayer) {
            game.redPlayer = null;
            message = "❌ Người chơi đỏ đã rời game!";
        } else if (isBlackPlayer) {
            game.blackPlayer = null;
            message = "❌ Người chơi đen đã rời game!";
        }

        if (isCreator) {
            global.coTuong.delete(threadID);
            message = "❌ Người tạo game đã rời! Game bị hủy!";
        }
    } else if (game.status === "playing") {
        const leaverName = isRedPlayer ? game.redPlayer.name : 
                          isBlackPlayer ? game.blackPlayer.name : "Người tạo";
        const winnerName = isRedPlayer ? game.blackPlayer.name : 
                          isBlackPlayer ? game.redPlayer.name : "Còn lại";
        const leaverSymbol = isRedPlayer ? "🔴" : "⚫";
        const winnerSymbol = isRedPlayer ? "⚫" : "🔴";

        message = `💔 ${leaverName} ${leaverSymbol} đã rời game và bị xử THUA!\n🏆 ${winnerName} ${winnerSymbol} THẮNG!`;

        global.coTuong.delete(threadID);
    }

    return api.sendMessage(message, threadID, messageID);
}

async function endGame(api, threadID, messageID, senderID) {
    const game = global.coTuong.get(threadID);

    if (!game) return api.sendMessage("❌ Không có game nào để kết thúc!", threadID, messageID);
    if (game.status !== "playing") return api.sendMessage("❌ Game chưa bắt đầu!", threadID, messageID);

    const isRedPlayer = game.redPlayer && game.redPlayer.id === senderID;
    const isBlackPlayer = game.blackPlayer && game.blackPlayer.id === senderID;

    if (!isRedPlayer && !isBlackPlayer) return api.sendMessage("❌ Chỉ người chơi mới có thể vote kết thúc game!", threadID, messageID);

    game.endVotes = game.endVotes || new Set();

    if (game.endVotes.has(senderID)) {
        const playerName = isRedPlayer ? game.redPlayer.name : game.blackPlayer.name;
        return api.sendMessage(`❌ ${playerName} đã đề xuất kết thúc rồi! Đang chờ người kia phản hồi...`, threadID, messageID);
    }

    game.endVotes.add(senderID);

    const playerName = isRedPlayer ? game.redPlayer.name : game.blackPlayer.name;
    const otherPlayerName = isRedPlayer ? game.blackPlayer.name : game.redPlayer.name;

    if (game.endVotes.size >= 2) {
        let message = "🏁 GAME KẾT THÚC!\n\n📊 Kết quả: Hòa (Cả 2 người đồng ý kết thúc)\n";
        if (game.redPlayer) message += `🔴 ${game.redPlayer.name}\n`;
        if (game.blackPlayer) message += `⚫ ${game.blackPlayer.name}\n`;
        message += "\n💭 Cảm ơn các bạn đã chơi!";

        global.coTuong.delete(threadID);
        return api.sendMessage(message, threadID, messageID);
    } else {
        return api.sendMessage(`🤝 ${playerName} đề xuất kết thúc game với kết quả hòa!

❓ ${otherPlayerName}, bạn có đồng ý kết thúc không?
• Nhập "${module.exports.config.name} end" để đồng ý
• Tiếp tục chơi bình thường để từ chối

⏳ Đang chờ phản hồi từ ${otherPlayerName}...`, threadID, messageID);
    }
}

async function surrender(api, threadID, messageID, senderID) {
    const game = global.coTuong.get(threadID);

    if (!game) return api.sendMessage("❌ Không có game nào!", threadID, messageID);
    if (game.status !== "playing") return api.sendMessage("❌ Game chưa bắt đầu!", threadID, messageID);

    const isRedPlayer = game.redPlayer && game.redPlayer.id === senderID;
    const isBlackPlayer = game.blackPlayer && game.blackPlayer.id === senderID;

    if (!isRedPlayer && !isBlackPlayer) return api.sendMessage("❌ Bạn không phải người chơi!", threadID, messageID);

    const surrendererName = isRedPlayer ? game.redPlayer.name : game.blackPlayer.name;
    const winnerName = isRedPlayer ? game.blackPlayer.name : game.redPlayer.name;
    const surrendererSymbol = isRedPlayer ? "🔴" : "⚫";
    const winnerSymbol = isRedPlayer ? "⚫" : "🔴";

    const message = `🏳️ ${surrendererName} ${surrendererSymbol} đầu hàng!
🏆 ${winnerName} ${winnerSymbol} THẮNG!

🎮 Game kết thúc!`;

    global.coTuong.delete(threadID);
    return api.sendMessage(message, threadID, messageID);
}