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
    title: byId("modalTitle"), message: byId("modalMessage"), primary: byId("modalPrimaryButton"),
    secondary: byId("modalSecondaryButton"), close: byId("modalCloseButton")
};
let modalHandlers = {};
let toastTimer;
let gameStartTimer;

export const elements = {
    lobbyForm: byId("lobbyForm"), keyInput: byId("gameKey"), keyHint: byId("keyHint"),
    generateKey: byId("generateKeyButton"), create: byId("createButton"), join: byId("joinButton"),
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
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 650 : 2250;

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

export function setRoom(key, tile, spectator = false) {
    elements.waitingKey.textContent = key;
    elements.activeGameKey.textContent = key;
    byId("playerTile").textContent = spectator ? "Viewer" : tile || "—";
    byId("playerTileMobile").textContent = spectator ? "Viewer" : tile || "—";
    byId("playerXLabel").textContent = spectator ? "Player X" : tile === "X" ? "You" : "Opponent";
    byId("playerOLabel").textContent = spectator ? "Player O" : tile === "O" ? "You" : "Opponent";
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
    elements.board.classList.toggle("is-disabled", !isInteractive && !finished);
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
    modal.primary.textContent = options.primaryLabel || "Continue";
    modal.secondary.textContent = options.secondaryLabel || "Back";
    modal.secondary.hidden = !options.onSecondary;
    modal.close.hidden = options.dismissible === false;
    modalHandlers = options;
    modal.overlay.hidden = false;
    document.body.classList.add("modal-open");
    requestAnimationFrame(() => modal.overlay.classList.add("visible"));
    modal.primary.focus();
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

export function toast(message) {
    const element = byId("toast");
    window.clearTimeout(toastTimer);
    element.textContent = message;
    element.hidden = false;
    requestAnimationFrame(() => element.classList.add("visible"));
    toastTimer = window.setTimeout(() => {
        element.classList.remove("visible");
        window.setTimeout(() => { element.hidden = true; }, 200);
    }, 2200);
}
