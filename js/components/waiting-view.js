import { BaseComponent } from "./base-component.js";

export class WaitingView extends BaseComponent {
    initializeElements() {
        this.container = document.createElement("section");
        this.card = document.createElement("div");
        this.radar = document.createElement("span");
        this.radarPulse = document.createElement("i");
        this.eyebrow = document.createElement("p");
        this.title = document.createElement("h1");
        this.copy = document.createElement("p");
        this.copyKey = document.createElement("button");
        this.waitingKey = document.createElement("span");
        this.copyLabel = document.createElement("small");
        this.copyIcon = document.createElement("i");
        this.status = document.createElement("p");
        this.cancel = document.createElement("button");
        this.cancelIcon = document.createElement("i");
    }

    setAttributes() {
        this.container.id = "waitingView";
        this.container.className = "waiting view";
        this.container.hidden = true;
        this.container.setAttribute("aria-labelledby", "waitingTitle");

        this.card.className = "waiting-card";
        this.radar.className = "radar";
        this.radar.setAttribute("aria-hidden", "true");
        this.eyebrow.className = "eyebrow";
        this.eyebrow.textContent = "Room created";
        this.title.id = "waitingTitle";
        this.title.textContent = "Waiting for your rival";
        this.copy.textContent = "Share this room ID with the second player";

        this.copyKey.id = "copyWaitingKey";
        this.copyKey.className = "room-key room-key-large";
        this.copyKey.type = "button";
        this.copyKey.setAttribute("aria-label", "Copy room ID");
        this.waitingKey.id = "waitingKey";
        this.copyLabel.innerHTML = " Copy";
        this.copyIcon.dataset.lucide = "copy";

        this.status.id = "waitingStatus";
        this.status.className = "waiting-status";
        this.status.setAttribute("aria-live", "polite");
        this.status.textContent = "Checking for player two...";

        this.cancel.id = "cancelWaitingButton";
        this.cancel.className = "text-button";
        this.cancel.type = "button";
        this.cancelIcon.dataset.lucide = "x";
    }

    appendElements() {
        this.container.append(this.card);
        this.card.append(this.radar, this.eyebrow, this.title, this.copy, this.copyKey, this.status, this.cancel);
        this.radar.append(this.radarPulse);
        this.copyKey.append(this.waitingKey, this.copyLabel);
        this.copyLabel.prepend(this.copyIcon);
        this.cancel.append(this.cancelIcon, document.createTextNode(" Cancel room"));
    }
}
