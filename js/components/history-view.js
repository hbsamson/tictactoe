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

        this.label = document.createElement("label");
        this.input = document.createElement("input");
        this.submit = document.createElement("button");

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

        this.emptyState.innerHTML = `
            <strong>NO RECORDS FOUND</strong>
            <span>This player has no saved games yet.</span>
        `;
    }

    appendElements() {
        // Main structure
        this.container.append(this.card);

        this.card.append(
            this.heading,
            this.identity,
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
            this.identityId
        );

        // Games table
        this.games.append(this.gamesTable);

        this.gamesTable.append(
            this.gamesHead,
            this.gamesBody
        );

        // Empty state
        this.games.append(this.emptyState);
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
            this.gamesTable.hidden = true;
            this.emptyState.hidden = false;
            return;
        }

        this.gamesTable.hidden = false;
        this.emptyState.hidden = true;

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
        this.gamesTable.hidden = false;
        this.emptyState.hidden = true;
    }
}