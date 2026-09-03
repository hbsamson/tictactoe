import { ApiError } from "../api.js";
import { CONNECTION_POLL_DELAY, POLL_DELAY } from "../config.js";
import { BOARD_PENDING, GAME_EXITED, EMPTY_BOARD, currentTurn, parseBoard, resultFor } from "../game/game.js";
import { changeAvatar, generateKey, isValidKey } from "../lobby/lobby.js";
import { closeModal, setModalMessage, setModalScores, showModal, toast } from "../notifications/notifications.js";
import { GameSession } from "../session/game-session.js";
import { RoomService } from "../room/room-service.js";
import { EventHandler } from "./event-handler.js";
import { elements,
    renderBoard,
    setBusy, setKeyError, setOffline, setOnline, setRoom, setScores, setStatus, 
    playGameStart, showView } from "../ui.js";

const room = new RoomService();
const session = new GameSession(elements, room, {
    renderBoard,
    setKeyError,
    setRoom,
    setScores,
    showView
});
const state = session.state;
let drawRematchTimer = null;
let connectionPollTimer = null;

async function pollConnectionStatus() {
    window.clearTimeout(connectionPollTimer);
    const enteredKey = elements.keyInput.value.trim();
    const probeKey = state.key || (isValidKey(enteredKey) ? enteredKey : generateKey());
    try {
        await room.check(probeKey);
        setOnline();
    } catch {
        setOffline();
    } finally {
        connectionPollTimer = window.setTimeout(pollConnectionStatus, CONNECTION_POLL_DELAY);
    }
}

function validateKey(key) {
    if (!isValidKey(key)) {
        setKeyError("Invalid room ID. Use a UUID such as 123e4567-e89b-12d3-a456-426614174000.");
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
        const started = await room.check(key);
        if (started) {
            if (intent !== "join") {
                showModal({ eyebrow: "Room full", symbol: "×", title: "That match has already started", message: "Only two players can enter a game. Use a different key to create a new room.", primaryLabel: "Choose another key", onPrimary: closeModal });
                return;
            }
            const boardInfo = await room.board(key);
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

        const playerTile = (await room.create(key)).toUpperCase();
        if (playerTile !== "X" && playerTile !== "O") throw new Error("The server did not assign a player with a valid tile (X or O).");
        if (intent === "join" && playerTile === "X") { // error state, player X should create game, not join it, req 1e player 1 (X) goes first
            await room.reset(key);
            showModal({ eyebrow: "Room not found", symbol: "?", title: "No game uses that key", message: "Check the key with player one, then try joining again.", primaryLabel: "Try again", onPrimary: closeModal });
            return;
        }

        if (playerTile === "X" && intent === "create") {
            room.saveScores(key, { X: 0, O: 0 });
            room.saveProfiles(key, {});
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
            setStatus("Player X's turn — waiting", "waiting");
            schedulePoll(0);
            if (intent === "create") toast("That key existed, so you joined as O.");
        }
    } catch (error) {
        handleError(error, "We couldn't enter that game");
    } finally {
        setBusy(false);
    }
}

function beginSession(key, tile) {
    session.beginPlayer(key, tile, stopPolling);
}

function beginSpectatorSession(key, board) {
    session.beginSpectator(key, board, stopPolling);
}

function schedulePoll(delay = POLL_DELAY) {
    stopPolling();
    state.pollTimer = window.setTimeout(pollServer, delay);
}

function stopPolling() {
    window.clearTimeout(state.pollTimer);
    state.pollTimer = null;
}

const saveMoveSnapshot = (location) => session.saveMoveSnapshot(location);

async function pollServer() {
    if (state.view === "lobby" || state.leaving || state.isLoading) { 
        return;
    }
    state.isLoading = true;
    try {
        if (state.view === "waiting") {
            const started = await room.check(state.key);
            if (started) {
                state.view = "playing";
                showView("game");
                if (!state.skipGameStart) playGameStart(state.tile);
                state.skipGameStart = false;
                setStatus(state.tile === "X" ? "Your turn — place X" : "Player X's turn — waiting", state.tile === "X" ? "your-turn" : "waiting");
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
    const boardInfo = await room.board(state.key);
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
                disconnectFromClosedRoom();
            } else showGameEndModal();
        }
        else if (state.view === "playing") disconnectFromClosedRoom();
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
    setStatus(isMyTurn ? `Your turn — place ${state.tile}` : `Player ${state.turn}'s turn — waiting`, isMyTurn ? "your-turn" : "waiting");

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
        state.scores = room.readScores(state.key);
        state.scores[result.winner] += 1;
        room.saveScores(state.key, state.scores);
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
        eyebrow: won ? "Victory" : "Defeat",
        symbol: result.winner,
        title: won ? "You now own the grid" : "Your rival takes it",
        message: "Play another round with the same rival, or leave this room", scores: state.scores,
        art: won ? "assets/victory.png" : "assets/lost.png",
        primaryLabel: "Rematch", primaryIcon: "refresh-cw", secondaryLabel: "Exit game", dismissible: false,
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
        await room.reset(state.key);
        const gameId = room.createRoundId(state.key);
        const tile = (await room.create(state.key)).toUpperCase();
        session.startRematch(tile, gameId, "waiting");
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
        primaryLabel: "Join rematch", primaryIcon: "refresh-cw", secondaryLabel: "Exit game", dismissible: false,
        onPrimary: joinRematch, 
        onSecondary: exitGame
    });
}

async function joinRematch() {
    clearDrawRematchTimer();
    stopPolling();
    state.leaving = true;
    try {
        const tile = (await room.create(state.key)).toUpperCase();
        if (tile === "X") {
            if (state.autoRematch) {
                closeModal();
                const gameId = room.createRoundId(state.key);
                session.startRematch("X", gameId, "waiting");
                showView("waiting");
                elements.waitingStatus.textContent = "Waiting for your rival…";
                schedulePoll(0);
                return;
            }
            await room.reset(state.key);
            closeModal();
            returnToLobby();
            toast("Your opponent left the room");
            return;
        }
        closeModal();
        const gameId = room.readRoundId(state.key) || room.createRoundId(state.key);
        session.startRematch("O", gameId, "playing");
        showView("game");
        setStatus("Player X's turn — waiting", "waiting");
        schedulePoll(0);
    } catch (error) {
        handleError(error, "The rematch could not be joined.");
    }
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
        await room.move(state.key, state.tile, Number(cell.dataset.x), Number(cell.dataset.y));
        moveSubmitted = true;
        void saveMoveSnapshot(index);
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
    room.publishCheer(state.key, entry);
    toast(`${source}: ${text}`, { type: "chat", side: "right" });
}

function hydrateCheerFromStorage(event) {
    const entry = room.cheerFromStorageEvent(event, state.key);
    if (entry) toast(`${entry.source}: ${entry.text}`, { type: "chat" });
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
        await room.reset(key); 
    } catch { 
        toast("The room may already be closed."); 
    }
}

function returnToLobby() {
    clearDrawRematchTimer();
    stopPolling();
    session.returnToLobby();
}

async function copyKey() {
    try { 
        await navigator.clipboard.writeText(state.key); toast("Room ID copied!"); 
    } catch { 
        toast(`Room ID: ${state.key}`); 
    }
}

async function copyLobbyKey() {
    const key = elements.keyInput.value.trim();
    if (!validateKey(key)) return;
    elements.keyInput.value = key;
    try { room.publishSharedKey(key); } catch {}
    try {
        await navigator.clipboard.writeText(key);
        toast("Room ID copied!");
    } catch {
        toast(`Room ID: ${key}`);
    }
}

function hydrateSharedKey(event) {
    const key = room.sharedKeyFromStorageEvent(event);
    if (state.view !== "lobby" || !key) return;
    elements.keyInput.value = key;
    setKeyError();
    toast("Room ID received.");
}

function handleError(error, fallback, modalError = true) {
    console.error(error);
    if (error instanceof ApiError) setOffline();
    if (!modalError) return setStatus(fallback, "offline");
    showModal({ eyebrow: "Something went wrong", symbol: "!", title: fallback, message: error?.message || fallback, primaryLabel: "OK", onPrimary: closeModal });
}

function showHowToPlay() {
    showModal({
        eyebrow: "How to play",
        symbol: "XO",
        title: "Match three to win",
        message: "Create or join a room, then take turns claiming the grid.",
        details: [
            "Create a room and share its six-character key, or join using a key from another player.",
            "X moves first. Select one empty cell when the turn indicator says it is your turn.",
            "Connect three tiles horizontally, vertically, or diagonally to win. A full board is a draw.",
            "Spectators use the same room key to watch and send reactions, but cannot place tiles."
        ],
        primaryLabel: "Got it",
        onPrimary: closeModal
    });
}

function hydratePlayerProfiles(event) {
    if (!room.isProfilesEvent(event, state.key)) return;
    state.players = room.readProfiles(state.key);
    setRoom(state.key, state.tile, state.spectator, state.players);
}

function hydrateScoresFromStorage(event) {
    if (!room.isScoresEvent(event, state.key)) return;
    state.scores = room.readScores(state.key);
    setScores(state.scores);
    if (state.view === "finished" && state.outcomeId.includes(":win:")) {
        setModalScores(state.scores);
    }
}

new EventHandler(elements).bind({
    submitLobby: () => enterRoom("create"),
    showHowToPlay,
    generateKey: () => {
        elements.keyInput.value = generateKey();
        setKeyError();
    },
    copyLobbyKey,
    clearKeyError: () => setKeyError(),
    previousAvatar: () => changeAvatar(elements, -1),
    nextAvatar: () => changeAvatar(elements, 1),
    joinRoom: () => enterRoom("join"),
    exitGame,
    copyKey,
    addCheer,
    playCell,
    confirmExit,
    onPageHide: () => {
        if (state.key && state.view !== "lobby" && !state.leaving && !state.spectator) {
            fetch(room.resetUrl(state.key), { keepalive: true }).catch(() => {});
        }
    },
    onStorage: (event) => {
        hydrateCheerFromStorage(event);
        hydrateScoresFromStorage(event);
        hydrateSharedKey(event);
        hydratePlayerProfiles(event);
    }
});

elements.keyInput.value = generateKey();
showView("lobby");
pollConnectionStatus();

