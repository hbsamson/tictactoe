import { gameApi, ApiError } from "./api.js";
import { BOARD_PENDING, GAME_EXITED, EMPTY_BOARD, currentTurn, parseBoard, resultFor } from "./game.js";
import { closeModal, elements, renderBoard, renderCheers, setBusy, setKeyError, setOffline, setRoom, setScores, setStatus, showModal, showView, toast } from "./ui.js";

const POLL_DELAY = 800;
const KEY_PATTERN = /^[a-zA-Z0-9]{3,6}$/;
const CHEER_STORAGE_PREFIX = "tictactoe:cheers:";
const state = {
    key: "", tile: "", board: [...EMPTY_BOARD], turn: "X", phase: "lobby",
    scores: { X: 0, O: 0 }, pollTimer: null, requestInFlight: false, outcomeId: "", leaving: false,
    spectator: false, cheers: []
};

function cheerStorageKey(roomKey) {
    return `${CHEER_STORAGE_PREFIX}${roomKey}`;
}

function readStoredCheers(roomKey) {
    if (!roomKey) return [];
    try {
        const value = localStorage.getItem(cheerStorageKey(roomKey));
        const parsed = value ? JSON.parse(value) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function updateCheerFeed(entry, shouldToast = true) {
    const seen = state.cheers.some((msg) => msg.timestamp === entry.timestamp && msg.text === entry.text && msg.source === entry.source);
    if (seen) return;
    state.cheers = [...state.cheers, entry].slice(-6);
    renderCheers(state.cheers);
    if (shouldToast) toast(`${entry.source}: ${entry.text}`);
}

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
        const started = await gameApi.check(key);
        if (started) {
            if (intent !== "join") {
                showModal({ eyebrow: "Room full", symbol: "×", title: "That match has already started", message: "Only two players can enter a game. Use a different key to create a new room.", primaryLabel: "Choose another key", onPrimary: closeModal });
                return;
            }
            const payload = await gameApi.board(key);
            if (payload === BOARD_PENDING || payload === GAME_EXITED) {
                showModal({ eyebrow: "Room not found", symbol: "?", title: "No game uses that key", message: "Check the key with player one, then try joining again.", primaryLabel: "Try again", onPrimary: closeModal });
                return;
            }
            const board = parseBoard(payload);
            if (!board) {
                showModal({ eyebrow: "Room not ready", symbol: "?", title: "That room is not active yet", message: "This key belongs to a room that has not started. Try creating or joining a live match.", primaryLabel: "Try again", onPrimary: closeModal });
                return;
            }
            beginSpectatorSession(key, board);
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
    Object.assign(state, { key, tile, board: [...EMPTY_BOARD], turn: "X", phase: "waiting", scores: { X: 0, O: 0 }, outcomeId: "", leaving: false, spectator: false, cheers: [] });
    setRoom(key, tile);
    setScores(state.scores);
    renderBoard(state.board, { ...state, spectator: false });
    state.cheers = readStoredCheers(key).slice(-6);
    renderCheers(state.cheers);
}

function beginSpectatorSession(key, board) {
    stopPolling();
    const parsedBoard = [...board];
    Object.assign(state, { key, tile: "", board: parsedBoard, turn: currentTurn(parsedBoard), phase: "spectating", scores: { X: 0, O: 0 }, outcomeId: "", leaving: false, spectator: true, cheers: [] });
    setRoom(key, "", true);
    setScores(state.scores);
    state.cheers = readStoredCheers(key).slice(-6);
    renderBoard(parsedBoard, { ...state, spectator: true, finished: Boolean(resultFor(parsedBoard)) });
    renderCheers(state.cheers);
    showView("game");
    setStatus("Watching live match", "waiting");
    schedulePoll(0);
    toast("Watching this room live.");
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
        if (state.phase === "spectating") {
            stopPolling();
            showModal({ eyebrow: "Room closed", symbol: "—", title: "This match is no longer live", message: "The players have left the room. Head back to the lobby and choose another key.", primaryLabel: "Back to lobby", dismissible: false, onPrimary: () => { closeModal(); returnToLobby(); } });
            return;
        }
        if (state.phase === "finished") showSessionEndedPrompt();
        else if (state.phase === "playing") showOpponentLeftPrompt();
        return;
    }
    const board = parseBoard(payload);
    const result = resultFor(board);
    state.board = board;
    state.turn = currentTurn(board);
    renderBoard(board, { ...state, finished: Boolean(result), winningLine: result?.line || [], spectator: state.spectator });
    if (result) return handleOutcome(result, board);
    state.phase = state.spectator ? "spectating" : "playing";
    if (state.spectator) {
        setStatus("Watching live match", "waiting");
        return;
    }
    const isMyTurn = state.turn === state.tile;
    setStatus(isMyTurn ? "Your turn" : "Opponent is thinking…", isMyTurn ? "your-turn" : "waiting");
}

function handleOutcome(result, board) {
    const outcomeId = `${board.join("")}:${result.type}:${result.winner || "draw"}`;
    if (state.outcomeId === outcomeId) return;
    state.outcomeId = outcomeId;
    state.phase = state.spectator ? "spectating" : "finished";
    if (!state.spectator && result.winner) {
        state.scores[result.winner] += 1;
        setScores(state.scores);
    }
    const won = result.winner === state.tile;
    if (state.spectator) {
        setStatus(result.type === "draw" ? "Draw game" : `${result.winner} wins the round`, "finished");
        showModal({
            eyebrow: "Match complete",
            symbol: result.type === "draw" ? "XO" : result.winner,
            title: result.type === "draw" ? "A perfect draw" : `${result.winner} takes the round`,
            message: "This room has finished. Return to the lobby to find another game.",
            primaryLabel: "Back to lobby",
            dismissible: false,
            onPrimary: () => { closeModal(); returnToLobby(); }
        });
        return;
    }
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
        elements.waitingStatus.textContent = "Rematch requested - waiting for your rival…";
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
    if (state.spectator || state.phase !== "playing" || state.turn !== state.tile || state.board[index]) return;
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

function addCheer(message) {
    const text = (message || "").trim();
    if (!text || !state.key) return;
    const source = state.spectator ? "Spectator" : `Player ${state.tile || "X"}`;
    const entry = { source, text, timestamp: Date.now() };
    const roomCheerKey = cheerStorageKey(state.key);
    const existing = readStoredCheers(state.key);
    const next = [...existing, entry].slice(-10);
    localStorage.setItem(roomCheerKey, JSON.stringify(next));
    updateCheerFeed(entry, true);
}

function hydrateCheerFromStorage(event) {
    if (!state.key || !event || event.key !== cheerStorageKey(state.key)) return;
    const latest = readStoredCheers(state.key).slice(-1)[0];
    if (!latest) return;
    updateCheerFeed(latest, true);
}

async function exitGame() {
    closeModal();
    stopPolling();
    state.leaving = true;
    const key = state.key;
    const wasSpectator = state.spectator;
    returnToLobby();
    if (!key || wasSpectator) return;
    try { await gameApi.reset(key); } catch { toast("The room may already be closed."); }
}

function returnToLobby() {
    stopPolling();
    Object.assign(state, { key: "", tile: "", board: [...EMPTY_BOARD], turn: "X", phase: "lobby", outcomeId: "", leaving: false, spectator: false, cheers: [] });
    elements.keyInput.value = generateKey();
    setKeyError();
    renderCheers(state.cheers);
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
elements.generateKey.addEventListener("click", () => { elements.keyInput.value = generateKey(); setKeyError(); });
elements.keyInput.addEventListener("input", () => setKeyError());
elements.join.addEventListener("click", () => enterRoom("join"));

elements.cancelWaiting.addEventListener("click", exitGame);
elements.copyWaitingKey.addEventListener("click", copyKey);
elements.copyGameKey.addEventListener("click", copyKey);
elements.cheerButtons.forEach((button) => button.addEventListener("click", () => addCheer(button.dataset.message)));

elements.board.addEventListener("click", (event) => { const cell = event.target.closest(".cell"); if (cell) playCell(cell); });
elements.exit.addEventListener("click", () => showModal({ eyebrow: "Leave match", symbol: "?", title: "Exit this game?", message: "The room will close for both players and the current round will end.", primaryLabel: "Exit game", secondaryLabel: "Keep playing", onPrimary: exitGame, onSecondary: closeModal }));

window.addEventListener("pagehide", () => {
    if (state.key && state.phase !== "lobby" && !state.leaving && !state.spectator) fetch(gameApi.resetUrl(state.key), { keepalive: true }).catch(() => {});
});
window.addEventListener("storage", hydrateCheerFromStorage);

elements.keyInput.value = generateKey();
renderCheers(state.cheers);
showView("lobby");
