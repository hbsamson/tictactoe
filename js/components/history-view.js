import { BaseComponent } from "./base-component.js";

const TABLE_HEADERS = ["Game ID", "Tile", "Result", "Action"];

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
        this.identityIdLine = document.createElement("div");
        this.copyPlayerId = document.createElement("button");

        this.label = document.createElement("label");
        this.input = document.createElement("input");
        this.submit = document.createElement("button");
        this.searchToggle = document.createElement("button");

        this.status = document.createElement("p");

        this.games = document.createElement("div");
        this.gamesTable = document.createElement("table");
        this.gamesHead = document.createElement("thead");
        this.gamesBody = document.createElement("tbody");

        this.emptyState = document.createElement("div");
    }

    setAttributes() {
        // Main container
        this.container.id = "historyView";
        this.container.className = "history view";
        this.container.setAttribute(
            "aria-labelledby",
            "historyTitle"
        );

        // Card
        this.card.className = "history-card";

        // Heading
        this.heading.className = "history-heading";

        this.eyebrow.className = "eyebrow";
        this.eyebrow.textContent = "Match archive";

        this.title.id = "historyTitle";
        this.title.textContent = "Game History";

        this.description.className = "history-description";
        this.description.textContent =
            "Every saved match — pick a game to replay it move by move.";


        this.form.className = "history-search";
        this.form.hidden = true;
        this.searchToggle.className = "history-search-toggle button button-ghost";
        this.searchToggle.type = "button";
        this.searchToggle.textContent = "Search another player";
        this.label.setAttribute("for", "historyPlayerId");
        this.label.textContent = "Search another player ID";
        this.input.id = "historyPlayerId";
        this.input.name = "playerId";
        this.input.type = "text";
        this.input.autocomplete = "off";
        this.input.placeholder = "Enter player ID";
        this.input.required = true;
        this.submit.className = "button button-primary";
        this.submit.type = "submit";
        this.submit.textContent = "Load games";

        // Player identity
        this.identity.className = "history-identity";
        this.identity.hidden = true;

        this.identityAvatar.className =
            "history-identity-avatar";
        this.identityAvatar.alt = "";

        this.identityBody.className =
            "history-identity-body";

        this.identityLabel.className =
            "history-identity-label";
        this.identityLabel.textContent = "Current player";

        this.identityName.className =
            "history-identity-name";

        this.identityId.className =
            "history-identity-id";
        this.identityIdLine.className = "history-identity-id-line";
        this.copyPlayerId.className = "history-copy-id";
        this.copyPlayerId.type = "button";
        this.copyPlayerId.title = "Copy player ID";
        this.copyPlayerId.setAttribute("aria-label", "Copy current player ID");
        this.copyPlayerId.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
       
        // Status
        this.status.className = "history-status";
        this.status.setAttribute("role", "status");
        this.status.setAttribute(
            "aria-live",
            "polite"
        );

        // Games section
        this.games.className = "history-games";

        // Games table
        this.gamesTable.className = "history-table";
        this.gamesTable.hidden = true;
        this.gamesTable.setAttribute(
            "aria-label",
            "Saved games"
        );

        // Table header
        const headerRow = document.createElement("tr");

        TABLE_HEADERS.forEach((text) => {
            const cell = document.createElement("th");

            cell.scope = "col";

            const textSpan = document.createElement("span");
            textSpan.className = "history-th-text";
            textSpan.textContent = text;

            cell.append(textSpan);
            headerRow.append(cell);
        });

        this.gamesHead.append(headerRow);

        // Empty state
        this.emptyState.className =
            "history-empty";

        this.emptyState.hidden = true;
        this.emptyState.setAttribute("role", "status");

        this.emptyState.innerHTML = `
            <strong>No recorded games yet</strong>
            <span>This player has no saved games yet.</span>
        `;
    }

    appendElements() {
        // Main structure
        this.container.append(this.card);

        this.card.append(
            this.heading,
            this.identity,
            this.searchToggle,
            this.form,
            this.status,
            this.games
        );

        // Heading
        this.heading.append(
            this.eyebrow,
            this.title,
            this.description
        );

        // Player identity
        this.identity.append(
            this.identityAvatar,
            this.identityBody
        );

        this.identityBody.append(
            this.identityLabel,
            this.identityName,
            this.identityIdLine
        );
        this.identityIdLine.append(this.identityId, this.copyPlayerId);

        this.form.append(this.label, this.input, this.submit);

        // Games table
        this.games.append(this.gamesTable);

        this.gamesTable.append(
            this.gamesHead,
            this.gamesBody
        );

        // Empty state
        this.games.append(this.emptyState);
    }

    toggleSearch() {
        this.form.hidden = !this.form.hidden;
        this.searchToggle.textContent = this.form.hidden
            ? "Search another player"
            : "Close player search";
        if (!this.form.hidden) this.input.focus();
    }

    showSearch() {
        if (this.form.hidden) this.toggleSearch();
    }

    showPlayer(profile) {
        this.identity.hidden = false;

        this.identityAvatar.src =
            `assets/icons/${profile.avatar}.png`;

        this.identityAvatar.alt =
            `${profile.name} avatar`;

        this.identityName.textContent =
            profile.name;

        this.identityId.textContent =
            profile.id;
    }

    showGames(games) {
        this.gamesBody.innerHTML = "";

        if (!games || games.length === 0) {
            this.showEmptyState("This player has no saved games yet.");
            return;
        }

        this.hideEmptyState();

        games.forEach((game) => {
            const row = document.createElement("tr");

            row.className = "history-game-row";
            row.dataset.gameId = game.id;

            // Game ID
            const gameIdCell = document.createElement("td");

            const gameId = document.createElement("span");
      
            gameId.textContent = game.id;

            gameIdCell.append(gameId);

            // Tile
            const tileCell = document.createElement("td");

            const tile = document.createElement("span");
            tile.className = "history-tile";
            tile.textContent = game.tile ?? "-";

            tileCell.append(tile);

            // Result
            const resultCell = document.createElement("td");

            const result = document.createElement("span");
            result.className = "history-result";

            const resultValue =
                String(game.result ?? "Unknown")
                    .toLowerCase();

            result.textContent =
                game.result ?? "Unknown";

            if (resultValue === "win") {
                result.classList.add(
                    "history-result-win"
                );
            } else if (resultValue === "loss") {
                result.classList.add(
                    "history-result-loss"
                );
            } else if (resultValue === "draw") {
                result.classList.add(
                    "history-result-draw"
                );
            } else {
                result.classList.add(
                    "history-result-unknown"
                );
            }

            resultCell.append(result);

            // Replay action
            const actionCell = document.createElement("td");

            const replayButton =
                document.createElement("button");

            replayButton.type = "button";
            replayButton.className =
                "history-replay";

            replayButton.textContent =
                "▶ Replay";

            replayButton.dataset.gameId =
                game.id;

            // Prevent the row click from firing twice
            replayButton.addEventListener(
                "click",
                (event) => {
                    event.stopPropagation();

                    this.dispatchEvent(
                        new CustomEvent(
                            "replay-game",
                            {
                                detail: {
                                    gameId: game.id
                                }
                            }
                        )
                    );
                }
            );

            actionCell.append(replayButton);

            // Build row
            row.append(
                gameIdCell,
                tileCell,
                resultCell,
                actionCell
            );

            // Clicking the row also opens replay
            row.addEventListener(
                "click",
                () => {
                    this.dispatchEvent(
                        new CustomEvent(
                            "replay-game",
                            {
                                detail: {
                                    gameId: game.id
                                }
                            }
                        )
                    );
                }
            );

            this.gamesBody.append(row);
        });
    }

    showEmptyState(message, title = "No recorded games yet") {
        const heading = this.emptyState.querySelector("strong");
        const body = this.emptyState.querySelector("span");

        if (heading) heading.textContent = title;
        if (body) body.textContent = message;

        this.gamesTable.hidden = true;
        this.emptyState.hidden = false;
        this.games.classList.add("history-games-empty");
    }

    hideEmptyState() {
        this.gamesTable.hidden = false;
        this.emptyState.hidden = true;
        this.games.classList.remove("history-games-empty");
    }

    showStatus(message, isError = false) {
        this.status.textContent = message;

        this.status.classList.toggle(
            "error",
            isError
        );
    }

    clearStatus() {
        this.status.textContent = "";
        this.status.classList.remove("error");
    }

    clearGames() {
        this.gamesBody.innerHTML = "";
        this.gamesTable.hidden = true;
        this.emptyState.hidden = true;
        this.games.classList.remove("history-games-empty");
    }
}
