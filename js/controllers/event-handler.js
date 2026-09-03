export class EventHandler {
    constructor(elements) {
        this.elements = elements;
    }

    bind(callbacks) {
        const { elements } = this;
        elements.lobbyForm.addEventListener("submit", (event) => {
            event.preventDefault();
            callbacks.submitLobby();
        });
        elements.howToPlay.addEventListener("click", callbacks.showHowToPlay);
        elements.generateKey.addEventListener("click", callbacks.generateKey);
        elements.copyLobbyKey.addEventListener("click", callbacks.copyLobbyKey);
        elements.keyInput.addEventListener("input", callbacks.clearKeyError);
        elements.previousAvatar.addEventListener("click", callbacks.previousAvatar);
        elements.nextAvatar.addEventListener("click", callbacks.nextAvatar);
        elements.join.addEventListener("click", callbacks.joinRoom);
        elements.cancelWaiting.addEventListener("click", callbacks.exitGame);
        elements.copyWaitingKey.addEventListener("click", callbacks.copyKey);
        elements.copyGameKey.addEventListener("click", callbacks.copyKey);
        elements.cheerButtons.forEach((button) => {
            button.addEventListener("click", () => callbacks.addCheer(button.dataset.message));
        });
        elements.board.addEventListener("click", (event) => {
            const cell = event.target.closest(".cell");
            if (cell) callbacks.playCell(cell);
        });
        elements.exit.addEventListener("click", callbacks.confirmExit);
        window.addEventListener("pagehide", callbacks.onPageHide);
        window.addEventListener("storage", callbacks.onStorage);
    }
}
