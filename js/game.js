export const EMPTY_BOARD = Array(9).fill("");
export const BOARD_PENDING = "[GAME NOT YET STARTED]";
export const BOARD_PLAYING = "[GAME ALREADY STARTED]";
export const GAME_EXITED = "[EXIT]";

export const WINNING_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

export function parseBoard(payload) {
    if (payload === BOARD_PENDING || payload === GAME_EXITED) return null;
    const cells = payload.split(":").slice(0, 9).map((cell) => cell.trim().toUpperCase());
    if (cells.length !== 9 || cells.some((cell) => cell !== "" && cell !== "X" && cell !== "O")) {
        throw new Error("The server returned an invalid board.");
    }
    return cells;
}

export function currentTurn(board) {
    const xMoves = board.filter((cell) => cell === "X").length;
    const oMoves = board.filter((cell) => cell === "O").length;
    return xMoves === oMoves ? "X" : "O";
}

export function resultFor(board) {
    for (const line of WINNING_LINES) {
        const [a, b, c] = line;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) return { type: "win", winner: board[a], line };
    }
    return board.every(Boolean) ? { type: "draw", winner: null, line: [] } : null;
}
