import { BaseComponent } from "./base-component.js";

export class GameStartOverlay extends BaseComponent {
    initializeElements() {
        this.container = document.createElement("div");
        this.speedlines = document.createElement("div");
        this.art = document.createElement("div");
        this.copy = document.createElement("div");
        this.kicker = document.createElement("span");
        this.word = document.createElement("strong");
        this.filled = document.createElement("span");
        this.outline = document.createElement("span");
        this.role = document.createElement("span");
    }

    setAttributes() {
        this.container.id = "gameStartOverlay";
        this.container.className = "game-start-overlay";
        this.container.hidden = true;
        this.container.setAttribute("aria-hidden", "true");
        this.speedlines.className = "game-start-speedlines";
        this.art.className = "game-start-art";
        this.art.setAttribute("aria-hidden", "true");
        this.copy.className = "game-start-copy";
        this.copy.setAttribute("aria-hidden", "true");
        this.kicker.className = "game-start-kicker";
        this.kicker.textContent = "Room locked | Rival found";
        this.word.className = "game-start-word";
        this.filled.className = "game-start-filled";
        this.filled.textContent = "Game";
        this.outline.className = "game-start-outline";
        this.outline.textContent = "Start!";
        this.role.id = "gameStartRole";
        this.role.className = "game-start-role";
        this.role.textContent = "You play X";
    }

    appendElements() {
        this.container.append(this.speedlines, this.art, this.copy);
        this.copy.append(this.kicker, this.word, this.role);
        this.word.append(this.filled, document.createTextNode(" "), this.outline);
    }
}
