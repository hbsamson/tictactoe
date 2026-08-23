const byId = (id) => document.getElementById(id);
window.lucide?.createIcons();
const views = { 
    lobby: byId("lobbyView"), 
    waiting: byId("waitingView"), 
    game: byId("gameView") 
};
const cells = [...document.querySelectorAll(".cell")];
const modal = {
    overlay: byId("modalOverlay"), eyebrow: byId("modalEyebrow"), symbol: byId("modalSymbol"),
    title: byId("modalTitle"), message: byId("modalMessage"), details: byId("modalDetails"), score: byId("modalScore"),
    xScore: byId("modalXScore"), oScore: byId("modalOScore"), primary: byId("modalPrimaryButton"),
    secondary: byId("modalSecondaryButton"), close: byId("modalCloseButton")
};
let modalHandlers = {};
let toastTimer;
let gameStartTimer;

export const elements = {
    lobbyForm: byId("lobbyForm"), keyInput: byId("gameKey"), keyHint: byId("keyHint"),
    playerName: byId("playerName"), playerAvatar: byId("playerAvatar"), avatarPreview: byId("playerAvatarPreview"), previousAvatar: byId("previousAvatarButton"), nextAvatar: byId("nextAvatarButton"), howToPlay: byId("howToPlayButton"),
    generateKey: byId("generateKeyButton"), copyLobbyKey: byId("copyLobbyKeyButton"), create: byId("createButton"), join: byId("joinButton"),
    waitingKey: byId("waitingKey"), waitingStatus: byId("waitingStatus"),
    copyWaitingKey: byId("copyWaitingKey"), cancelWaiting: byId("cancelWaitingButton"),
    activeGameKey: byId("activeGameKey"), copyGameKey: byId("copyGameKey"), exit: byId("exitButton"),
    board: byId("board"), cells,
    cheerButtons: [...document.querySelectorAll(".cheer-button")]
};

export function showView(name) {
    Object.entries(views).forEach(([viewName, view]) => { view.hidden = viewName !== name; });
}

export function playGameStart(tile) {
    const overlay = byId("gameStartOverlay");
    const role = byId("gameStartRole");
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
    const connection = byId("connectionStatus");
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

export function showModal(options) {
    modal.eyebrow.textContent = options.eyebrow || "Match update";
    modal.symbol.textContent = options.symbol || "XO";
    modal.title.textContent = options.title;
    modal.message.textContent = options.message;
    modal.details.replaceChildren();
    (options.details || []).forEach((detail) => {
        const item = document.createElement("li");
        item.textContent = detail;
        modal.details.appendChild(item);
    });
    modal.details.hidden = !options.details?.length;
    modal.details.closest(".modal").classList.toggle("modal-instructions", Boolean(options.details?.length));
    setModalScores(options.scores);
    setButtonContent(modal.primary, options.primaryLabel || "Continue", options.primaryIcon);
    modal.secondary.textContent = options.secondaryLabel || "Back";
    modal.secondary.hidden = !options.onSecondary;
    modal.close.hidden = options.dismissible === false;
    modalHandlers = options;
    modal.overlay.hidden = false;
    document.body.classList.add("modal-open");
    requestAnimationFrame(() => modal.overlay.classList.add("visible"));
    modal.primary.focus();
}

function setButtonContent(button, label, iconName) {
    button.replaceChildren();
    if (iconName) {
        const icon = document.createElement("i");
        icon.dataset.lucide = iconName;
        button.appendChild(icon);
    }
    button.append(label);
    window.lucide?.createIcons();
}

export function setModalScores(scores) {
    modal.score.hidden = !scores;
    if (!scores) return;
    modal.xScore.textContent = scores.X;
    modal.oScore.textContent = scores.O;
}

export function setModalMessage(message) {
    modal.message.textContent = message;
}

export function closeModal() {
    modal.overlay.classList.remove("visible");
    document.body.classList.remove("modal-open");
    modalHandlers = {};
    window.setTimeout(() => { modal.overlay.hidden = true; }, 180);
}

modal.primary.addEventListener("click", () => modalHandlers.onPrimary?.());
modal.secondary.addEventListener("click", () => modalHandlers.onSecondary?.());
modal.close.addEventListener("click", () => {
    if (modalHandlers.dismissible !== false) {
        modalHandlers.onDismiss?.();
        closeModal();
    }
});
modal.overlay.addEventListener("click", (event) => {
    if (event.target === modal.overlay && modalHandlers.dismissible !== false) {
        modalHandlers.onDismiss?.();
        closeModal();
    }
});

export function toast(message, options = {}) {
    const element = byId("toast");
    window.clearTimeout(toastTimer);
    const type = options.type === "chat" ? "chat" : "system";
    const side = options.side === "right" ? "right" : "left";
    element.classList.remove("toast-system", "toast-chat", "toast-left", "toast-right", "visible");
    element.classList.add(`toast-${type}`);
    if (type === "chat") element.classList.add(`toast-${side}`);
    element.textContent = message;
    element.hidden = false;
    requestAnimationFrame(() => element.classList.add("visible"));
    toastTimer = window.setTimeout(() => {
        element.classList.remove("visible");
        window.setTimeout(() => { element.hidden = true; }, 200);
    }, 2200);
}
