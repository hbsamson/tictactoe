import { AppShell } from "./components/app-shell.js";

const app = new AppShell();
app.render("app");

const byId = (id) => document.getElementById(id);
const views = {
    lobby: app.lobbyView.container,
    waiting: app.waitingView.container,
    game: app.gameView.container
};
const cells = app.gameView.cells;
let gameStartTimer;

export const elements = {
    connectionStatus: byId("connectionStatus"),
    lobbyForm: byId("lobbyForm"), keyInput: byId("gameKey"), keyHint: byId("keyHint"),
    playerName: byId("playerName"), playerAvatar: byId("playerAvatar"), avatarPreview: byId("playerAvatarPreview"), previousAvatar: byId("previousAvatarButton"), nextAvatar: byId("nextAvatarButton"), howToPlay: byId("howToPlayButton"),
    generateKey: byId("generateKeyButton"), copyLobbyKey: byId("copyLobbyKeyButton"), create: byId("createButton"), join: byId("joinButton"),
    waitingKey: byId("waitingKey"), waitingStatus: byId("waitingStatus"),
    copyWaitingKey: byId("copyWaitingKey"), cancelWaiting: byId("cancelWaitingButton"),
    activeGameKey: byId("activeGameKey"), copyGameKey: byId("copyGameKey"), exit: byId("exitButton"),
    board: byId("board"), cells,
    cheerButtons: [...app.gameView.cheerButtons]
};

elements.gameStartOverlay = byId("gameStartOverlay");
elements.gameStartRole = byId("gameStartRole");
elements.modalOverlay = byId("modalOverlay");
elements.modalEyebrow = byId("modalEyebrow");
elements.modalSymbol = byId("modalSymbol");
elements.modalTitle = byId("modalTitle");
elements.modalMessage = byId("modalMessage");
elements.modalDetails = byId("modalDetails");
elements.modalScore = byId("modalScore");
elements.modalXScore = byId("modalXScore");
elements.modalOScore = byId("modalOScore");
elements.modalPrimaryButton = byId("modalPrimaryButton");
elements.modalSecondaryButton = byId("modalSecondaryButton");
elements.modalCloseButton = byId("modalCloseButton");
elements.modalArt = byId("modalArt");
elements.toast = byId("toast");

export function showView(name) {
    Object.entries(views).forEach(([viewName, view]) => { view.hidden = viewName !== name; });
}

export function playGameStart(tile) {
    const overlay = elements.gameStartOverlay;
    const role = elements.gameStartRole;
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 650 : 2200;

    window.clearTimeout(gameStartTimer);
    role.textContent = `You play ${tile}`;
    overlay.hidden = false;
    overlay.classList.remove("is-playing");
    document.body.classList.add("game-starting");

    requestAnimationFrame(() => {
        requestAnimationFrame(() => overlay.classList.add("is-playing"));
    });

    gameStartTimer = window.setTimeout(() => {
        overlay.classList.remove("is-playing");
        overlay.hidden = true;
        document.body.classList.remove("game-starting");
    }, duration);
}

export function setBusy(busy) {
    elements.create.disabled = busy;
    elements.join.disabled = busy;
    elements.keyInput.disabled = busy;
    elements.generateKey.disabled = busy;
    elements.copyLobbyKey.disabled = busy;
    elements.playerName.disabled = busy;
    elements.previousAvatar.disabled = busy;
    elements.nextAvatar.disabled = busy;
    const connection = elements.connectionStatus;
    if (busy) {
        connection.textContent = "Connecting…";
        connection.dataset.state = "busy";
    } else if (connection.dataset.state === "busy") {
        connection.textContent = "Server ready";
        connection.dataset.state = "ready";
    }
}

export function setOffline() {
    byId("connectionStatus").textContent = "Server offline";
    byId("connectionStatus").dataset.state = "offline";
}

export function setOnline() {
    byId("connectionStatus").textContent = "Server ready";
    byId("connectionStatus").dataset.state = "ready";
}

export function setKeyError(message = "") {
    elements.keyInput.setAttribute("aria-invalid", String(Boolean(message)));
    elements.keyHint.textContent = message || "Use 4-6 alphanumeric characters (letters and numbers only)";
    elements.keyHint.classList.toggle("error", Boolean(message));
}

export function setRoom(key, tile, spectator = false, players = {}) {
    elements.waitingKey.textContent = key;
    elements.activeGameKey.textContent = key;
    byId("gameModeLabel").textContent = spectator ? "Watching live" : "Live match";
    byId("spectatorBadge").hidden = !spectator;
    views.game.classList.toggle("is-spectator", spectator);
    setPlayer("X", players.X, spectator ? "Player X" : tile === "X" ? "You" : "Opponent");
    setPlayer("O", players.O, spectator ? "Player O" : tile === "O" ? "You" : "Opponent");
}

function setPlayer(tile, player, fallbackName) {
    byId(`player${tile}Label`).textContent = player?.name || fallbackName;
    const avatar = byId(`player${tile}Avatar`);
    avatar.hidden = !player?.avatar;
    if (player?.avatar) avatar.src = `assets/icons/${player.avatar}.png`;
    else avatar.removeAttribute("src");
    avatar.alt = player?.name ? `${player.name}'s icon` : "";
}

export function renderBoard(board, { tile, turn, finished = false, winningLine = [], spectator = false, movePending = false }) {
    const isInteractive = !spectator && tile === turn && !finished && !movePending;
    cells.forEach((cell, index) => {
        const value = board[index];
        cell.textContent = value;
        cell.dataset.value = value;
        cell.disabled = !isInteractive || Boolean(value);
        cell.classList.toggle("winning", winningLine.includes(index));
        cell.setAttribute("aria-label", `${cell.dataset.label}, ${value || "empty"}`);
    });
    byId("playerXCard").classList.toggle("active", turn === "X" && !finished && !spectator);
    byId("playerOCard").classList.toggle("active", turn === "O" && !finished && !spectator);
    byId("turnStatus").dataset.tile = turn;
    elements.board.classList.toggle("is-disabled", !isInteractive && !finished);
    elements.board.dataset.activeTile = isInteractive ? tile : "";
    elements.board.setAttribute("aria-busy", String(movePending));
}

export function setStatus(message, state = "waiting") {
    byId("statusText").textContent = message;
    byId("turnStatus").dataset.state = state;
}

export function setScores(scores) {
    byId("xScore").textContent = scores.X;
    byId("oScore").textContent = scores.O;
}
