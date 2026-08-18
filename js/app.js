import { gameApi, ApiError } from "./api.js";
import { BOARD_PENDING, GAME_EXITED, EMPTY_BOARD, currentTurn, parseBoard, resultFor } from "./game.js";
import { closeModal, elements, renderBoard, setBusy, setKeyError, setOffline, setRoom, setScores, setStatus, showModal, showView, toast } from "./ui.js";

const POLL_DELAY = 800;
const KEY_PATTERN = /^[a-zA-Z0-9]{3,6}$/;
const state = {
    key: "", tile: "", board: [...EMPTY_BOARD], turn: "X", phase: "lobby",
    scores: { X: 0, O: 0 }, pollTimer: null, requestInFlight: false, outcomeId: "", leaving: false
};

function generateKey() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    return [...bytes].map((byte) => alphabet[byte % alphabet.length]).join("");
}

function validateKey(key) {
    if (!KEY_PATTERN.test(key)) {
        setKeyError("Enter 3-6 alphanumeric characters (letters and numbers only)");
        elements.keyInput.focus();
        return false;
    }
    setKeyError();
    return true;
}

async function enterRoom(intent) {
    const key = elements.keyInput.value.trim();
    if (!validateKey(key)) return;
    setBusy(true);
    try {
        if (await gameApi.check(key)) {
            showModal({ eyebrow: "Room full", symbol: "×", title: "That match has already started", message: "Only two players can enter a game. Use a different key to create a new room.", primaryLabel: "Choose another key", onPrimary: closeModal });
            return;
        }
        const tile = (await gameApi.create(key)).toUpperCase();
        if (tile !== "X" && tile !== "O") throw new Error("The server did not assign a player.");
        if (intent === "join" && tile === "X") {
            await gameApi.reset(key);
            showModal({ eyebrow: "Room not found", symbol: "?", title: "No game uses that key", message: "Check the key with player one, then try joining again.", primaryLabel: "Try again", onPrimary: closeModal });
            return;
        }

        beginSession(key, tile);
        if (tile === "X") {
            state.phase = "waiting";
            showView("waiting");
            elements.waitingStatus.textContent = "Checking for player two…";
            schedulePoll(0);
        } else {
            state.phase = "playing";
            showView("game");
            setStatus("X takes the first move", "waiting");
            schedulePoll(0);
            if (intent === "create") toast("That key existed, so you joined as O.");
        }
    } catch (error) {
        handleError(error, "We couldn't enter that game.");
    } finally {
        setBusy(false);
    }
}

function beginSession(key, tile) {
    stopPolling();
    Object.assign(state, { key, tile, board: [...EMPTY_BOARD], turn: "X", phase: "waiting", scores: { X: 0, O: 0 }, outcomeId: "", leaving: false });
    setRoom(key, tile);
    setScores(state.scores);
    renderBoard(state.board, state);
}

function schedulePoll(delay = POLL_DELAY) {
    stopPolling();
    state.pollTimer = window.setTimeout(pollServer, delay);
}

function stopPolling() {
    window.clearTimeout(state.pollTimer);
    state.pollTimer = null;
}

async function pollServer() {
    if (state.phase === "lobby" || state.leaving || state.requestInFlight) return;
    state.requestInFlight = true;
    try {
        if (state.phase === "waiting") {
            const started = await gameApi.check(state.key);
            if (started) {
                state.phase = "playing";
                showView("game");
                setStatus(state.tile === "X" ? "Your turn" : "Opponent's turn", state.tile === "X" ? "your-turn" : "waiting");
                toast("Player two joined. Game on!");
            }
        }
        if (state.phase !== "waiting") await refreshBoard();
    } catch (error) {
        handleError(error, "Connection lost. Retrying…", false);
    } finally {
        state.requestInFlight = false;
        if (state.phase !== "lobby" && !state.leaving) schedulePoll();
    }
}

async function refreshBoard() {
    const payload = await gameApi.board(state.key);
    if (payload === BOARD_PENDING || payload === GAME_EXITED) {
        if (state.phase === "finished") showSessionEndedPrompt();
        else if (state.phase === "playing") showOpponentLeftPrompt();
        return;
    }
    const board = parseBoard(payload);
    const result = resultFor(board);
    state.board = board;
    state.turn = currentTurn(board);
    renderBoard(board, { ...state, finished: Boolean(result), winningLine: result?.line || [] });
    if (result) return handleOutcome(result, board);
    state.phase = "playing";
    const isMyTurn = state.turn === state.tile;
    setStatus(isMyTurn ? "Your turn — make your mark" : "Opponent is thinking…", isMyTurn ? "your-turn" : "waiting");
}

function handleOutcome(result, board) {
    const outcomeId = `${board.join("")}:${result.type}:${result.winner || "draw"}`;
    if (state.outcomeId === outcomeId) return;
    state.outcomeId = outcomeId;
    state.phase = "finished";
    if (result.winner) {
        state.scores[result.winner] += 1;
        setScores(state.scores);
    }
    const won = result.winner === state.tile;
    setStatus(result.type === "draw" ? "Draw game" : `${result.winner} wins the round`, "finished");
    showModal({
        eyebrow: result.type === "draw" ? "No square left" : won ? "Victory" : "Round complete",
        symbol: result.type === "draw" ? "XO" : result.winner,
        title: result.type === "draw" ? "A perfect draw" : won ? "You own the grid" : "Your rival takes it",
        message: "Play another round with the same rival, or leave this room", primaryLabel: "Rematch", secondaryLabel: "Exit game", dismissible: false,
        onPrimary: requestRematch, onSecondary: exitGame
    });
}

async function requestRematch() {
    closeModal();
    stopPolling();
    try {
        await gameApi.reset(state.key);
        const tile = (await gameApi.create(state.key)).toUpperCase();
        Object.assign(state, { tile, board: [...EMPTY_BOARD], turn: "X", phase: "waiting", outcomeId: "" });
        setRoom(state.key, tile);
        renderBoard(state.board, state);
        showView("waiting");
        elements.waitingStatus.textContent = "Rematch requested — waiting for your rival…";
        schedulePoll();
    } catch (error) {
        handleError(error, "The rematch could not be created.");
        schedulePoll();
    }
}

function showSessionEndedPrompt() {
    stopPolling();
    state.leaving = true;
    showModal({
        eyebrow: "Room reset", symbol: "↻", title: "Your rival wants a rematch",
        message: "Try joining the same room. If they left, we'll return you safely to the lobby.", primaryLabel: "Join rematch", secondaryLabel: "Exit game", dismissible: false,
        onPrimary: joinRematch, onSecondary: exitGame
    });
}

async function joinRematch() {
    try {
        const tile = (await gameApi.create(state.key)).toUpperCase();
        if (tile === "X") {
            await gameApi.reset(state.key);
            closeModal();
            returnToLobby();
            toast("Your opponent left the room.");
            return;
        }
        closeModal();
        Object.assign(state, { tile: "O", board: [...EMPTY_BOARD], turn: "X", phase: "playing", outcomeId: "", leaving: false });
        setRoom(state.key, state.tile);
        renderBoard(state.board, state);
        showView("game");
        setStatus("Opponent's turn", "waiting");
        schedulePoll(0);
    } catch (error) {
        handleError(error, "The rematch could not be joined.");
    }
}

function showOpponentLeftPrompt() {
    if (state.leaving) return;
    stopPolling();
    state.leaving = true;
    renderBoard(state.board, { ...state, finished: true });
    showModal({ eyebrow: "Session ended", symbol: "—", title: "Your opponent left", message: "This room has closed. Return to the lobby to start another match.", primaryLabel: "Back to lobby", dismissible: false, onPrimary: () => { closeModal(); returnToLobby(); } });
}

async function playCell(cell) {
    const index = Number(cell.dataset.index);
    if (state.phase !== "playing" || state.turn !== state.tile || state.board[index]) return;
    state.requestInFlight = true;
    renderBoard(state.board, { ...state, finished: true });
    setStatus("Sending move…", "waiting");
    try {
        await gameApi.move(state.key, state.tile, Number(cell.dataset.x), Number(cell.dataset.y));
        await refreshBoard();
    } catch (error) {
        handleError(error, "That move could not be placed.");
        renderBoard(state.board, state);
    } finally {
        state.requestInFlight = false;
        if (state.phase !== "lobby" && !state.leaving) schedulePoll();
    }
}

async function exitGame() {
    closeModal();
    stopPolling();
    state.leaving = true;
    const key = state.key;
    returnToLobby();
    if (!key) return;
    try { await gameApi.reset(key); } catch { toast("The room may already be closed."); }
}

function returnToLobby() {
    stopPolling();
    Object.assign(state, { key: "", tile: "", board: [...EMPTY_BOARD], turn: "X", phase: "lobby", outcomeId: "", leaving: false });
    elements.keyInput.value = generateKey();
    setKeyError();
    showView("lobby");
}

async function copyKey() {
    try { await navigator.clipboard.writeText(state.key); toast("Game key copied!"); }
    catch { toast(`Game key: ${state.key}`); }
}

function handleError(error, fallback, modalError = true) {
    console.error(error);
    if (error instanceof ApiError) setOffline();
    if (!modalError) return setStatus(fallback, "offline");
    showModal({ eyebrow: "Something went wrong", symbol: "!", title: fallback, message: error?.message || fallback, primaryLabel: "OK", onPrimary: closeModal });
}

elements.lobbyForm.addEventListener("submit", (event) => { event.preventDefault(); enterRoom("create"); });
elements.join.addEventListener("click", () => enterRoom("join"));
elements.generateKey.addEventListener("click", () => { elements.keyInput.value = generateKey(); setKeyError(); });
elements.keyInput.addEventListener("input", () => setKeyError());
elements.cancelWaiting.addEventListener("click", exitGame);
elements.exit.addEventListener("click", () => showModal({ eyebrow: "Leave match", symbol: "?", title: "Exit this game?", message: "The room will close for both players and the current round will end.", primaryLabel: "Exit game", secondaryLabel: "Keep playing", onPrimary: exitGame, onSecondary: closeModal }));
elements.copyWaitingKey.addEventListener("click", copyKey);
elements.copyGameKey.addEventListener("click", copyKey);
elements.board.addEventListener("click", (event) => { const cell = event.target.closest(".cell"); if (cell) playCell(cell); });

window.addEventListener("pagehide", () => {
    if (state.key && state.phase !== "lobby" && !state.leaving) fetch(gameApi.resetUrl(state.key), { keepalive: true }).catch(() => {});
});

elements.keyInput.value = generateKey();
showView("lobby");
