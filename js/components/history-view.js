import { BaseComponent } from "./base-component.js";

export class HistoryView extends BaseComponent {
    initializeElements() {
        this.container = document.createElement("section");
        this.card = document.createElement("div");
        this.heading = document.createElement("div");
        this.eyebrow = document.createElement("p");
        this.title = document.createElement("h1");
        this.description = document.createElement("p");
        this.form = document.createElement("form");
        this.identity = document.createElement("div");
        this.identityAvatar = document.createElement("img");
        this.identityBody = document.createElement("div");
        this.identityLabel = document.createElement("span");
        this.identityName = document.createElement("strong");
        this.identityId = document.createElement("small");
        this.label = document.createElement("label");
        this.input = document.createElement("input");
        this.submit = document.createElement("button");
        this.status = document.createElement("p");
        this.games = document.createElement("div");
    }

    setAttributes() {
        this.container.id = "historyView";
        this.container.className = "history view";
        this.container.setAttribute("aria-labelledby", "historyTitle");
        this.card.className = "history-card";
        this.heading.className = "history-heading";
        this.eyebrow.className = "eyebrow";
        this.eyebrow.textContent = "Match archive";
        this.title.id = "historyTitle";
        this.title.textContent = "Game History";
        this.description.className = "history-description";
        this.description.textContent = "description here";
        this.form.className = "history-search";
        this.identity.className = "history-identity";
        this.identity.hidden = true;
        this.identityAvatar.className = "history-identity-avatar";
        this.identityAvatar.alt = "";
        this.identityBody.className = "history-identity-body";
        this.identityLabel.className = "history-identity-label";
        this.identityLabel.textContent = "Current player";
        this.identityName.className = "history-identity-name";
        this.identityId.className = "history-identity-id";
        this.label.setAttribute("for", "historyPlayerId");
        this.label.textContent = "Player ID";
        this.input.id = "historyPlayerId";
        this.input.name = "playerId";
        this.input.type = "text";
        this.input.autocomplete = "off";
        this.input.placeholder = "Enter player ID";
        this.input.required = true;
        this.submit.className = "button button-primary";
        this.submit.type = "submit";
        this.submit.textContent = "Load games";
        this.status.className = "history-status";
        this.status.setAttribute("role", "status");
        this.status.setAttribute("aria-live", "polite");
        this.games.className = "history-games";
    }

    appendElements() {
        this.container.append(this.card);
        this.card.append(this.heading, this.identity, this.form, this.status, this.games);
        this.heading.append(this.eyebrow, this.title, this.description);
        this.identity.append(this.identityAvatar, this.identityBody);
        this.identityBody.append(this.identityLabel, this.identityName, this.identityId);
        this.form.append(this.label, this.input, this.submit);
    }

    showPlayer(profile) {
        this.identity.hidden = false;
        this.identityAvatar.src = `assets/icons/${profile.avatar}.png`;
        this.identityAvatar.alt = `${profile.name} avatar`;
        this.identityName.textContent = profile.name;
        this.identityId.textContent = profile.id;
    }
}
