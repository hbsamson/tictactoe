import { gameApi, ApiError } from "./api.js";
import { BOARD_PENDING, GAME_EXITED, EMPTY_BOARD, currentTurn, parseBoard, resultFor } from "./game.js";
import { closeModal, 
    elements, 
    renderBoard,
    setBusy, setKeyError, setOffline, setOnline, setRoom, setScores, setStatus, 
    playGameStart, setModalMessage, showModal, showView,
    toast } from "./ui.js";

const POLL_DELAY = 800;
const CONNECTION_POLL_DELAY = 5000;
const KEY_PATTERN = /^[a-z0-9]{4,6}$/i;
const CHEER_STORAGE_PREFIX = "tictactoe:cheers:";
const SCORE_STORAGE_PREFIX = "tictactoe:scores:";
const PLAYER_STORAGE_PREFIX = "tictactoe:players:";
const SHARED_KEY_STORAGE = "tictactoe:shared-room-key";
const PLAYER_AVATARS = ["ann", "makoto", "morgana", "ren", "ryuji", "yusuke"];
const state = {
    key: "", 
    tile: "", 
    board: [...EMPTY_BOARD], 
    turn: "X", 
    view: "lobby",
    scores: { X: 0, O: 0 }, 
    pollTimer: null, 
    isLoading: false, 
    movePending: false,
    pendingIndex: null,
    outcomeId: "", 
    leaving: false,
    spectator: false,
    profile: null,
    players: {},
    spectatorExitSince: null,
    autoRematch: false,
    autoRematchReady: false,
    skipGameStart: false
};
let drawRematchTimer = null;
let connectionPollTimer = null;

async function pollConnectionStatus() {
    window.clearTimeout(connectionPollTimer);
    const enteredKey = elements.keyInput.value.trim();
    const probeKey = state.key || (KEY_PATTERN.test(enteredKey) ? enteredKey : generateKey());
    try {
        await gameApi.check(probeKey);
        setOnline();
    } catch {
        setOffline();
    } finally {
        connectionPollTimer = window.setTimeout(pollConnectionStatus, CONNECTION_POLL_DELAY);
    }
}

function generateKey() {
    return crypto.randomUUID().slice(0, 6).toUpperCase();
}

function validateKey(key) {
    if (!KEY_PATTERN.test(key)) {
        setKeyError("Invalid key pattern. Enter 3-6 alphanumeric characters (letters and numbers only)");
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
            const boardInfo = await gameApi.board(key);
            if (boardInfo === BOARD_PENDING || boardInfo === GAME_EXITED) {
                showModal({ eyebrow: "Room not found", symbol: "?", title: "No game uses that key", message: "Check the key with player one, then try joining again.", primaryLabel: "Try again", onPrimary: closeModal });
                return;
            }
            const board = parseBoard(boardInfo);
            if (!board) {
                showModal({ eyebrow: "Room not ready", symbol: "?", title: "That room is not active yet", message: "This key belongs to a room that has not started. Try creating or joining a live match.", primaryLabel: "Try again", onPrimary: closeModal });
                return;
            }
            beginSpectatorSession(key, board);
            return;
        }

        const playerTile = (await gameApi.create(key)).toUpperCase();
        if (playerTile !== "X" && playerTile !== "O") throw new Error("The server did not assign a player with a valid tile (X or O).");
        if (intent === "join" && playerTile === "X") { // error state, player X should create game, not join it, req 1e player 1 (X) goes first
            await gameApi.reset(key);
            showModal({ eyebrow: "Room not found", symbol: "?", title: "No game uses that key", message: "Check the key with player one, then try joining again.", primaryLabel: "Try again", onPrimary: closeModal });
            return;
        }

        if (playerTile === "X" && intent === "create") {
            saveStoredScores(key, { X: 0, O: 0 });
            savePlayerProfiles(key, {});
        }
        beginSession(key, playerTile);
        if (playerTile === "X") {
            state.view = "waiting";
            showView("waiting");
            elements.waitingStatus.textContent = "Checking for player two…";
            schedulePoll(0);
        } else if (playerTile === "O") {
            state.view = "playing";
            showView("game");
            playGameStart(state.tile);
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
    const profile = getLobbyProfile();
    savePlayerProfile(key, tile, profile);
    const players = readPlayerProfiles(key);
    Object.assign(state, { key, tile, board: [...EMPTY_BOARD], turn: "X", view: "waiting", scores: readStoredScores(key), outcomeId: "", leaving: false, spectator: false, spectatorExitSince: null, profile, players, movePending: false, pendingIndex: null, autoRematch: false, autoRematchReady: false, skipGameStart: false });
    setRoom(key, tile, false, players);
    setScores(state.scores);
    renderBoard(state.board, { ...state, spectator: false });
}

function beginSpectatorSession(key, board) {
    stopPolling();
    const parsedBoard = [...board];
    const profile = getLobbyProfile();
    const players = readPlayerProfiles(key);
    Object.assign(state, { key, tile: "", board: parsedBoard, turn: currentTurn(parsedBoard), view: "spectating", scores: readStoredScores(key), outcomeId: "", leaving: false, spectator: true, spectatorExitSince: null, profile, players, movePending: false, pendingIndex: null, autoRematch: false, autoRematchReady: false, skipGameStart: false });
    setRoom(key, "", true, players);
    setScores(state.scores);
    renderBoard(parsedBoard, { ...state, spectator: true, finished: Boolean(resultFor(parsedBoard)) });
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
    if (state.view === "lobby" || state.leaving || state.isLoading) { 
        return;
    }
    state.isLoading = true;
    try {
        if (state.view === "waiting") {
            const started = await gameApi.check(state.key);
            if (started) {
                state.view = "playing";
                showView("game");
                if (!state.skipGameStart) playGameStart(state.tile);
                state.skipGameStart = false;
                setStatus(state.tile === "X" ? "Your turn" : "Opponent's turn", state.tile === "X" ? "your-turn" : "waiting");
                toast("Player two joined. Game on!");
            }
        }
        if (state.view !== "waiting") {
            await refreshBoard();
        }
    } catch (error) {
        handleError(error, "Connection lost. Retrying…", false);
    } finally {
        state.isLoading = false;
        if (state.view !== "lobby" && !state.leaving) {
            schedulePoll();
        }
    }
}

async function refreshBoard() {
    const boardInfo = await gameApi.board(state.key);
    if (boardInfo === BOARD_PENDING) {
        state.spectatorExitSince = null;
        if (state.view === "spectating") {
            setStatus("Waiting for the rematch…", "waiting");
            return;
        }
        if (state.view === "finished") {
            if (state.autoRematch && state.autoRematchReady) joinRematch();
            else if (state.autoRematch) {
                state.autoRematch = false;
                showOpponentLeftPrompt();
            } else showGameEndModal();
        }
        else if (state.view === "playing") showOpponentLeftPrompt();
        return;
    }
    if (boardInfo === GAME_EXITED) {
        if ((state.view === "spectating" || state.view === "finished") && state.outcomeId) {
            if (!state.spectatorExitSince) {
                state.spectatorExitSince = Date.now();
                setStatus("Checking room status…", "waiting");
                return;
            }
            if (Date.now() - state.spectatorExitSince < 3000) return;
        }
        disconnectFromClosedRoom();
        return;
    }
    const board = parseBoard(boardInfo);
    state.spectatorExitSince = null;
    const result = resultFor(board);
    if (state.movePending && board[state.pendingIndex] === state.tile) {
        state.movePending = false;
        state.pendingIndex = null;
    }
    state.board = board;
    state.turn = currentTurn(board);
    renderBoard(board, { ...state, finished: Boolean(result), winningLine: result?.line || [], spectator: state.spectator });
    if (result) {
        return handleOutcome(result, board);
    }

    const isMyTurn = state.turn === state.tile;
    setStatus(isMyTurn ? "Your turn" : "Opponent is thinking…", isMyTurn ? "your-turn" : "waiting");

    state.view = state.spectator ? "spectating" : "playing";
    if (state.spectator) {
        if (!result) state.outcomeId = "";
        setStatus("Watching live match", "waiting");
        return;
    }
}

function handleOutcome(result, board) {
    const outcomeId = `${board.join("")}:${result.type}:${result.winner || "draw"}`;
    if (state.outcomeId === outcomeId) return;
    state.outcomeId = outcomeId;
    state.view = state.spectator ? "spectating" : "finished";
    if (!state.spectator && result.winner === state.tile) {
        state.scores = readStoredScores(state.key);
        state.scores[result.winner] += 1;
        saveStoredScores(state.key, state.scores);
        setScores(state.scores);
    }
    const won = result.winner === state.tile;
    if (state.spectator) {
        setStatus(result.type === "draw" ? "Draw game" : `${result.winner} wins the round`, "finished");
        toast(result.type === "draw" ? "The round ended in a draw." : `${result.winner} won the round.`);
        return;
    }
    setStatus(result.type === "draw" ? "Draw game" : `${result.winner} wins the round`, "finished");
    if (result.type === "draw") {
        startDrawRematch();
        return;
    }
    showModal({
        eyebrow: result.type === "draw" ? "No square left" : won ? "Victory" : "Round complete",
        symbol: result.type === "draw" ? "XO" : result.winner,
        title: result.type === "draw" ? "A perfect draw" : won ? "You own the grid" : "Your rival takes it",
        message: `Score: X ${state.scores.X} - ${state.scores.O} O. Play another round with the same rival, or leave this room.`, primaryLabel: "Rematch", secondaryLabel: "Exit game", dismissible: false,
        onPrimary: requestRematch, onSecondary: exitGame
    });
}

function startDrawRematch() {
    clearDrawRematchTimer();
    state.autoRematch = true;
    state.autoRematchReady = false;
    let seconds = 7;
    showModal({
        eyebrow: "No square left",
        symbol: "XO",
        title: "A perfect draw",
        message: `Next round starts in ${seconds} seconds.`,
        primaryLabel: "Exit game",
        dismissible: false,
        onPrimary: exitGame
    });
    drawRematchTimer = window.setInterval(() => {
        seconds -= 1;
        if (seconds > 0) {
            setModalMessage(`Next round starts in ${seconds} seconds.`);
            return;
        }
        clearDrawRematchTimer();
        state.autoRematchReady = true;
        setModalMessage(state.tile === "X" ? "Starting the next round…" : "Waiting for the next round…");
        if (state.tile === "X") requestRematch();
    }, 1000);
}

function clearDrawRematchTimer() {
    window.clearInterval(drawRematchTimer);
    drawRematchTimer = null;
}

async function requestRematch() {
    clearDrawRematchTimer();
    closeModal();
    stopPolling();
    try {
        await gameApi.reset(state.key);
        const tile = (await gameApi.create(state.key)).toUpperCase();
        Object.assign(state, { tile, board: [...EMPTY_BOARD], turn: "X", view: "waiting", outcomeId: "", movePending: false, pendingIndex: null, autoRematch: false, autoRematchReady: false, skipGameStart: true });
        savePlayerProfile(state.key, tile, state.profile);
        state.players = readPlayerProfiles(state.key);
        setRoom(state.key, tile, false, state.players);
        renderBoard(state.board, state);
        showView("waiting");
        elements.waitingStatus.textContent = "Rematch requested - waiting for your rival…";
        schedulePoll();
    } catch (error) {
        handleError(error, "The rematch could not be created.");
        schedulePoll();
    }
}

function showGameEndModal() {
    stopPolling();
    state.leaving = true;
    showModal({
        eyebrow: "Room reset", symbol: "↻", title: "Your rival wants a rematch",
        message: "Try joining the same room. If they left, we'll return you safely to the lobby.", 
        primaryLabel: "Join rematch", secondaryLabel: "Exit game", dismissible: false,
        onPrimary: joinRematch, 
        onSecondary: exitGame
    });
}

async function joinRematch() {
    clearDrawRematchTimer();
    stopPolling();
    state.leaving = true;
    try {
        const tile = (await gameApi.create(state.key)).toUpperCase();
        if (tile === "X") {
            if (state.autoRematch) {
                closeModal();
                Object.assign(state, { tile: "X", board: [...EMPTY_BOARD], turn: "X", view: "waiting", outcomeId: "", leaving: false, movePending: false, pendingIndex: null, autoRematch: false, autoRematchReady: false, skipGameStart: true });
                savePlayerProfile(state.key, state.tile, state.profile);
                state.players = readPlayerProfiles(state.key);
                setRoom(state.key, state.tile, false, state.players);
                renderBoard(state.board, state);
                showView("waiting");
                elements.waitingStatus.textContent = "Waiting for your rival…";
                schedulePoll(0);
                return;
            }
            await gameApi.reset(state.key);
            closeModal();
            returnToLobby();
            toast("Your opponent left the room");
            return;
        }
        closeModal();
        Object.assign(state, { tile: "O", board: [...EMPTY_BOARD], turn: "X", view: "playing", outcomeId: "", leaving: false, movePending: false, pendingIndex: null, autoRematch: false, autoRematchReady: false, skipGameStart: true });
        savePlayerProfile(state.key, state.tile, state.profile);
        state.players = readPlayerProfiles(state.key);
        setRoom(state.key, state.tile, false, state.players);
        renderBoard(state.board, state);
        showView("game");
        setStatus("Opponent's turn", "waiting");
        schedulePoll(0);
    } catch (error) {
        handleError(error, "The rematch could not be joined.");
    }
}

function showOpponentLeftPrompt() {
    disconnectFromClosedRoom();
}

function disconnectFromClosedRoom() {
    if (state.leaving) return;
    state.leaving = true;
    closeModal();
    returnToLobby();
    toast("A player left. The room was closed.");
}

function confirmExit() {
    if (state.spectator) {
        showModal({
            eyebrow: "Leave spectator view",
            symbol: "?",
            title: "Stop watching?",
            message: "You will be returned to the lobby. The players and their current game will not be affected.",
            primaryLabel: "Leave room",
            secondaryLabel: "Keep watching",
            onPrimary: exitGame,
            onSecondary: closeModal
        });
        return;
    }
    showModal({
        eyebrow: "Leave match",
        symbol: "?",
        title: "Exit this game?",
        message: "The room will close for both players and the current round will end.",
        primaryLabel: "Exit game",
        secondaryLabel: "Keep playing",
        onPrimary: exitGame,
        onSecondary: closeModal
    });
}

async function playCell(cell) {
    const index = Number(cell.dataset.index);
    if (state.spectator || state.view !== "playing" || state.turn !== state.tile || state.board[index] || state.isLoading || state.movePending) {
        return;
    }
    let moveSubmitted = false;
    state.movePending = true;
    state.pendingIndex = index;
    state.isLoading = true;
    renderBoard(state.board, state);
    setStatus("Sending move…", "waiting");
    try {
        await gameApi.move(state.key, state.tile, Number(cell.dataset.x), Number(cell.dataset.y));
        moveSubmitted = true;
        await refreshBoard();
    } catch (error) {
        if (!moveSubmitted) {
            state.movePending = false;
            state.pendingIndex = null;
        }
        handleError(error, moveSubmitted ? "Move sent. Waiting for the board to update…" : "That move could not be placed.", !moveSubmitted);
        renderBoard(state.board, state);
    } finally {
        state.isLoading = false;
        if (state.view !== "lobby" && !state.leaving) schedulePoll();
    }
}

function addCheer(message) {
    const text = (message || "").trim();
    if (!text || !state.key) return;
    const source = state.profile?.name || (state.spectator ? "Spectator" : `Player ${state.tile || "X"}`);
    const entry = { source, text, timestamp: Date.now() };
    localStorage.setItem(cheerStorageKey(state.key), JSON.stringify(entry));
    toast(`${source}: ${text}`);
}

function hydrateCheerFromStorage(event) {
    if (!state.key || !event || event.key !== cheerStorageKey(state.key)) return;
    try {
        const entry = JSON.parse(event.newValue);
        toast(`${entry.source}: ${entry.text}`);
    } catch {}
}

async function exitGame() {
    clearDrawRematchTimer();
    closeModal();
    stopPolling();
    state.leaving = true;
    const key = state.key;
    const wasSpectator = state.spectator;
    returnToLobby();
    if (!key || wasSpectator) return;
    try { 
        await gameApi.reset(key); 
    } catch { 
        toast("The room may already be closed."); 
    }
}

function returnToLobby() {
    clearDrawRematchTimer();
    stopPolling();
    Object.assign(state, { key: "", tile: "", board: [...EMPTY_BOARD], turn: "X", view: "lobby", outcomeId: "", leaving: false, spectator: false, spectatorExitSince: null, profile: null, players: {}, movePending: false, pendingIndex: null, autoRematch: false, autoRematchReady: false, skipGameStart: false });
    elements.keyInput.value = generateKey();
    setKeyError();
    showView("lobby");
}

async function copyKey() {
    try { 
        await navigator.clipboard.writeText(state.key); toast("Game key copied!"); 
    } catch { 
        toast(`Game key: ${state.key}`); 
    }
}

async function copyLobbyKey() {
    const key = elements.keyInput.value.trim().toUpperCase();
    if (!validateKey(key)) return;
    elements.keyInput.value = key;
    try { localStorage.setItem(SHARED_KEY_STORAGE, key); } catch {}
    try {
        await navigator.clipboard.writeText(key);
        toast("Game key copied!");
    } catch {
        toast(`Game key: ${key}`);
    }
}

function hydrateSharedKey(event) {
    if (state.view !== "lobby" || event.key !== SHARED_KEY_STORAGE || !KEY_PATTERN.test(event.newValue || "")) return;
    elements.keyInput.value = event.newValue.toUpperCase();
    setKeyError();
    toast("Game key received.");
}

function handleError(error, fallback, modalError = true) {
    console.error(error);
    if (error instanceof ApiError) setOffline();
    if (!modalError) return setStatus(fallback, "offline");
    showModal({ eyebrow: "Something went wrong", symbol: "!", title: fallback, message: error?.message || fallback, primaryLabel: "OK", onPrimary: closeModal });
}

function cheerStorageKey(roomKey) {
    return `${CHEER_STORAGE_PREFIX}${roomKey}`;
}

function scoreStorageKey(roomKey) {
    return `${SCORE_STORAGE_PREFIX}${roomKey}`;
}

function playerStorageKey(roomKey) {
    return `${PLAYER_STORAGE_PREFIX}${roomKey}`;
}

function getLobbyProfile() {
    const avatar = elements.playerAvatar.value || "ren";
    const defaultName = avatar.charAt(0).toUpperCase() + avatar.slice(1);
    return { name: elements.playerName.value.trim().slice(0, 10) || defaultName, avatar };
}

function changeAvatar(direction) {
    const previousAvatar = elements.playerAvatar.value;
    const previousName = previousAvatar.charAt(0).toUpperCase() + previousAvatar.slice(1);
    const currentIndex = PLAYER_AVATARS.indexOf(previousAvatar);
    const avatar = PLAYER_AVATARS[(currentIndex + direction + PLAYER_AVATARS.length) % PLAYER_AVATARS.length];
    const name = avatar.charAt(0).toUpperCase() + avatar.slice(1);
    const usesDefaultName = !elements.playerName.value.trim() || elements.playerName.value.trim() === previousName;
    elements.playerAvatar.value = avatar;
    elements.avatarPreview.src = `assets/icons/${avatar}.png`;
    elements.avatarPreview.alt = name;
    if (usesDefaultName) elements.playerName.value = name;
}

function readPlayerProfiles(roomKey) {
    try {
        const players = JSON.parse(localStorage.getItem(playerStorageKey(roomKey))) || {};
        return Object.fromEntries(["X", "O"].flatMap((tile) => {
            const player = players[tile];
            if (typeof player?.name !== "string" || !PLAYER_AVATARS.includes(player.avatar)) return [];
            return [[tile, { name: player.name.slice(0, 10), avatar: player.avatar }]];
        }));
    } catch {
        return {};
    }
}

function savePlayerProfiles(roomKey, players) {
    try { localStorage.setItem(playerStorageKey(roomKey), JSON.stringify(players)); } catch {}
}

function savePlayerProfile(roomKey, tile, profile) {
    if (!roomKey || !tile || !profile) return;
    savePlayerProfiles(roomKey, { ...readPlayerProfiles(roomKey), [tile]: profile });
}

function hydratePlayerProfiles(event) {
    if (!state.key || event.key !== playerStorageKey(state.key)) return;
    state.players = readPlayerProfiles(state.key);
    setRoom(state.key, state.tile, state.spectator, state.players);
}

function readStoredScores(roomKey) {
    try {
        const scores = JSON.parse(localStorage.getItem(scoreStorageKey(roomKey)));
        if (Number.isInteger(scores?.X) && Number.isInteger(scores?.O)) return scores;
    } catch {}
    return { X: 0, O: 0 };
}

function saveStoredScores(roomKey, scores) {
    try {
        localStorage.setItem(scoreStorageKey(roomKey), JSON.stringify(scores));
    } catch {}
}

function hydrateScoresFromStorage(event) {
    if (!state.key || event.key !== scoreStorageKey(state.key)) return;
    state.scores = readStoredScores(state.key);
    setScores(state.scores);
    if (state.view === "finished" && state.outcomeId.includes(":win:")) {
        setModalMessage(`Score: X ${state.scores.X} - ${state.scores.O} O. Play another round with the same rival, or leave this room.`);
    }
}

elements.lobbyForm.addEventListener("submit", (event) => { event.preventDefault(); enterRoom("create"); });
elements.generateKey.addEventListener("click", () => { elements.keyInput.value = generateKey(); setKeyError(); });
elements.copyLobbyKey.addEventListener("click", copyLobbyKey);
elements.keyInput.addEventListener("input", () => setKeyError());
elements.previousAvatar.addEventListener("click", () => changeAvatar(-1));
elements.nextAvatar.addEventListener("click", () => changeAvatar(1));
elements.join.addEventListener("click", () => enterRoom("join"));

elements.cancelWaiting.addEventListener("click", exitGame);
elements.copyWaitingKey.addEventListener("click", copyKey);
elements.copyGameKey.addEventListener("click", copyKey);
elements.cheerButtons.forEach((button) => button.addEventListener("click", () => addCheer(button.dataset.message)));

elements.board.addEventListener("click", (event) => { const cell = event.target.closest(".cell"); if (cell) playCell(cell); });
elements.exit.addEventListener("click", confirmExit);

window.addEventListener("pagehide", () => {
    if (state.key && state.view !== "lobby" && !state.leaving && !state.spectator) {
        fetch(gameApi.resetUrl(state.key), { keepalive: true }).catch(() => {});
    }
});
window.addEventListener("storage", hydrateCheerFromStorage);
window.addEventListener("storage", hydrateScoresFromStorage);
window.addEventListener("storage", hydrateSharedKey);
window.addEventListener("storage", hydratePlayerProfiles);

elements.keyInput.value = generateKey();
showView("lobby");
pollConnectionStatus();
