import { BaseComponent } from "./base-component.js";
import { GameStartOverlay } from "./game-start-overlay.js";
import { GameView } from "./game-view.js";
import { LobbyView } from "./lobby-view.js";
import { ModalOverlay } from "./modal-overlay.js";
import { ToastBar } from "./toast-bar.js";
import { WaitingView } from "./waiting-view.js";

export class AppShell extends BaseComponent {
    initializeElements() {
        this.container = document.createElement("div");
        this.backdrop = document.createElement("div");
        this.shell = document.createElement("main");
        this.brandBar = document.createElement("header");
        this.brandLink = document.createElement("a");
        this.brandText = document.createElement("span");
        this.brandStrong = document.createElement("strong");
        this.connection = document.createElement("span");
        this.historyLink = document.createElement("a");
        this.lobbyView = new LobbyView();
        this.waitingView = new WaitingView();
        this.gameView = new GameView();
        this.gameStartOverlay = new GameStartOverlay();
        this.modalOverlay = new ModalOverlay();
        this.toast = new ToastBar();
    }

    setAttributes() {
        this.container.id = "appRoot";

        this.backdrop.className = "city";
        this.backdrop.setAttribute("aria-hidden", "true");

        this.shell.className = "app-shell";

        this.brandBar.className = "brand-bar";
        this.brandLink.className = "brand";
        this.brandLink.href = "./";
        this.brandLink.setAttribute("aria-label", "Hannah's Tic-Tac-Toe home");
        this.brandText.textContent = "Hannah";
        this.brandStrong.textContent = "Tic-Tac-Toe";
        this.connection.id = "connectionStatus";
        this.connection.className = "connection-pill";
        this.connection.dataset.state = "busy";
        this.connection.textContent = "Checking server...";
        this.historyLink.href = "history";
        this.historyLink.className = "history-link";
        this.historyLink.textContent = "History";
    }

    appendElements() {
        this.container.append(this.backdrop, this.shell, this.gameStartOverlay.container, this.modalOverlay.container, this.toast.container);
        this.shell.append(this.brandBar, this.lobbyView.container, this.waitingView.container, this.gameView.container);
        const spacer = document.createElement("span");
        spacer.className = "brand-spacer";
        this.brandBar.append(this.brandLink, spacer, this.historyLink, this.connection);
        this.brandLink.append(this.brandText, this.brandStrong);
    }

    render(target) {
        const parent = super.render(target);
        if (parent) {
            window.lucide?.createIcons();
        }
        return parent;
    }
}
