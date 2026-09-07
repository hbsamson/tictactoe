import { BaseComponent } from "./base-component.js";

const WIN_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];
const LOCATION_NAMES = [
    "Top left [1,1]", "Top center [1,2]", "Top right [1,3]",
    "Middle left [2,1]", "Center [2,2]", "Middle right [2,3]",
    "Bottom left [3,1]", "Bottom center [3,2]", "Bottom right [3,3]"
];

export class ReplayView extends BaseComponent {
    initializeElements() {
        this.container = document.createElement("section");
        this.card = document.createElement("div");
        this.topbar = document.createElement("div");
        this.heading = document.createElement("div");
        this.eyebrow = document.createElement("p");
        this.title = document.createElement("h1");
        this.subtitle = document.createElement("p");
        this.playerInfo = document.createElement("div");
        this.backButton = document.createElement("button");
        this.board = document.createElement("div");
        this.cells = Array.from({ length: 9 }, () => document.createElement("div"));
        this.status = document.createElement("p");
        this.result = document.createElement("p");
        this.replayButton = document.createElement("button");
        this.movesPanel = document.createElement("div");
        this.movesTable = document.createElement("table");
        this.movesBody = document.createElement("tbody");
    }

    setAttributes() {
        this.container.className = "replay view";
        this.container.hidden = true;
        this.container.setAttribute("aria-labelledby", "replayTitle");
        this.card.className = "replay-card lobby-card";
        this.topbar.className = "replay-topbar";
        this.heading.className = "replay-heading";
        this.eyebrow.className = "eyebrow";
        this.eyebrow.textContent = "Saved match replay";
        this.title.id = "replayTitle";
        this.title.textContent = "Watch the showdown";
        this.subtitle.className = "replay-subtitle";
        this.playerInfo.className = "replay-player-info";
        this.backButton.className = "button button-ghost";
        this.backButton.type = "button";
        this.backButton.textContent = "Back to history";
        this.board.className = "replay-board";
        this.cells.forEach((cell, index) => {
            cell.className = "replay-cell";
            cell.dataset.index = String(index);
        });
        this.status.className = "replay-status";
        this.status.setAttribute("aria-live", "polite");
        this.result.className = "replay-result";
        this.result.hidden = true;
        this.replayButton.className = "button button-primary replay-action";
        this.replayButton.type = "button";
        this.replayButton.textContent = "Replay animation";
        this.movesPanel.className = "replay-moves";
        this.movesTable.className = "replay-moves-table";
        const caption = this.movesTable.createCaption();
        caption.textContent = "Recorded moves";
        const header = this.movesTable.createTHead().insertRow();
        ["#", "Player", "Tile", "Location", "Date & time"].forEach((label) => {
            const cell = document.createElement("th");
            cell.scope = "col";
            cell.textContent = label;
            header.append(cell);
        });
    }

    appendElements() {
        this.container.append(this.card);
        this.card.append(this.topbar, this.board, this.status, this.replayButton);
        this.card.append(this.movesPanel);
        this.movesPanel.append(this.movesTable);
        this.movesTable.append(this.movesBody);
        this.movesPanel.append(this.result);
        this.topbar.append(this.heading, this.backButton);
        this.heading.append(this.eyebrow, this.title);
        this.topbar.append(this.subtitle, this.playerInfo);
        this.board.append(...this.cells);
    }

    bind(onBack, onReplay) {
        this.backButton.addEventListener("click", onBack);
        this.replayButton.addEventListener("click", onReplay);
    }

    show(game, moves) {
        this.stop();
        this.game = game;
        this.moves = [...moves].sort((a, b) =>
            String(a.dateSaved || "").localeCompare(String(b.dateSaved || ""))
        );
        this.step = 0;
        this.title.textContent = "Watch the showdown";
        const playerNames = { X: "Unknown player", O: "Unknown player" };
        this.moves.forEach((move) => {
            if ((move.symbol === "X" || move.symbol === "O") && move.playerName) {
                playerNames[move.symbol] = move.playerName;
            }
        });
        const info = [
            `Game ID ${game.id}`,
            game.roomKey ? `Room Key ${game.roomKey}` : "Room Key unavailable"
        ].filter(Boolean);
        this.subtitle.replaceChildren();
        info.forEach((line, index) => {
            const span = document.createElement("span");
            span.className = "replay-info-line";
            span.textContent = line;
            this.subtitle.append(span);
        });
        this.playerInfo.replaceChildren();
        ["X", "O"].forEach((symbol) => {
            const move = this.moves.find((entry) => entry.symbol === symbol && entry.playerId);
            const playerCard = document.createElement("div");
            playerCard.className = "replay-contender";
            playerCard.dataset.tile = symbol;
            const tile = document.createElement("span");
            tile.className = "replay-contender-tile";
            tile.textContent = symbol;
            const body = document.createElement("div");
            body.className = "replay-contender-body";
            const name = document.createElement("strong");
            name.textContent = playerNames[symbol];
            const line = document.createElement("div");
            const id = document.createElement("small");
            const copy = document.createElement("button");
            line.className = "replay-player-info-line";
            id.textContent = move?.playerId || "Player ID unavailable";
            copy.type = "button";
            copy.className = "replay-copy-id";
            copy.title = `Copy Player ${symbol} ID`;
            copy.setAttribute("aria-label", `Copy Player ${symbol} ID`);
            copy.hidden = !move;
            const feedback = document.createElement("span");
            feedback.className = "replay-copy-feedback";
            feedback.setAttribute("role", "status");
            copy.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
            copy.addEventListener("click", async () => {
                try {
                    await navigator.clipboard.writeText(move.playerId);
                    feedback.textContent = "Copied!";
                } catch {
                    feedback.textContent = "Copy unavailable. Select the ID to copy it.";
                }
            });
            line.append(id, copy);
            body.append(name, line, feedback);
            playerCard.append(tile, body);
            this.playerInfo.append(playerCard);
        });
        this.movesBody.replaceChildren();
        this.result.hidden = true;
        this.moveRows = this.moves.map((move, index) => {
            const row = document.createElement("tr");
            const date = new Date(move.dateSaved);
            const timestamp = move.dateSaved && !Number.isNaN(date.getTime())
                ? date.toLocaleString() : "-";
            [index + 1, move.playerName || move.playerId || "Player", move.symbol || "?",
                this.formatLocation(move.location), timestamp].forEach((value) => {
                const cell = document.createElement("td");
                cell.textContent = String(value);
                row.append(cell);
            });
            this.movesBody.append(row);
            return row;
        });
        this.container.hidden = false;
        this.renderStep();
        if (this.moves.length > 0) {
            this.timer = window.setInterval(() => {
                this.step += 1;
                this.renderStep();
                if (this.step >= this.moves.length) this.stop();
            }, 2000);
        }
    }

    replay() {
        if (!this.moves) return;
        this.stop();
        this.step = 0;
        this.renderStep();
        if (this.moves.length > 0) {
            this.timer = window.setInterval(() => {
                this.step += 1;
                this.renderStep();
                if (this.step >= this.moves.length) this.stop();
            }, 2000);
        }
    }

    renderStep() {
        this.moveRows.forEach((row, index) => {
            const active = index === this.step - 1;
            row.classList.toggle("is-current", active);
            if (active) row.setAttribute("aria-current", "step");
            else row.removeAttribute("aria-current");
        });
        const currentRow = this.moveRows[this.step - 1];
        if (currentRow && window.matchMedia("(min-width: 901px)").matches) {
            const panelBounds = this.movesPanel.getBoundingClientRect();
            const rowBounds = currentRow.getBoundingClientRect();
            if (rowBounds.top < panelBounds.top) {
                this.movesPanel.scrollTop -= panelBounds.top - rowBounds.top;
            } else if (rowBounds.bottom > panelBounds.bottom) {
                this.movesPanel.scrollTop += rowBounds.bottom - panelBounds.bottom;
            }
        }
        if (this.step >= this.moves.length) {
            this.result.hidden = false;
            this.result.textContent = this.getResult(this.moves);
            this.movesPanel.scrollTop = this.movesPanel.scrollHeight;
        } else {
            this.result.hidden = true;
        }
        const board = Array.from({ length: 9 }, () => "");
        this.moves.slice(0, this.step).forEach((move) => {
            const location = Number(move.location);
            const symbol = move.symbol === "X" || move.symbol === "O" ? move.symbol : "";
            if (symbol && Number.isInteger(location) && location >= 0 && location < 9) {
                board[location] = symbol;
            }
        });
        this.cells.forEach((cell, index) => {
            cell.textContent = board[index];
            cell.className = `replay-cell${board[index] ? ` replay-${board[index].toLowerCase()}` : ""}`;
        });
        const latest = this.moves[this.step - 1];
        this.status.textContent = this.moves.length
            ? this.step >= this.moves.length
                ? "Final board"
                : latest
                    ? `Move ${this.step} of ${this.moves.length}`
                    : "Starting position"
            : "No moves were recorded for this game.";
        const winningLine = this.getWinningLine(board);
        winningLine.forEach((index) => this.cells[index].classList.add("replay-winning"));
    }

    getWinningLine(board) {
        return WIN_LINES.find(([a, b, c]) => board[a] && board[a] === board[b] && board[a] === board[c]) || [];
    }

    getResult(moves) {
        const board = Array.from({ length: 9 }, () => "");
        moves.forEach((move) => {
            const location = Number(move.location);
            if ((move.symbol === "X" || move.symbol === "O") && Number.isInteger(location) && location >= 0 && location < 9) {
                board[location] = move.symbol;
            }
        });
        const winningLine = this.getWinningLine(board);
        if (winningLine.length) {
            const winner = board[winningLine[0]];
            const move = [...moves].reverse().find((entry) => entry.symbol === winner);
            const name = move?.playerName || "Player";
            return `Player ${winner} (${name}) wins!`;
        }
        return board.every(Boolean) ? "Draw" : "Game Incomplete";
    }

    stop() {
        window.clearInterval(this.timer);
        this.timer = null;
    }

    hide() {
        this.stop();
        this.container.hidden = true;
    }

    shortId(value) {
        return value.length > 8 ? `${value.slice(0, 8)}...` : value;
    }

    formatLocation(value) {
        const location = Number(value);
        return Number.isInteger(location) && LOCATION_NAMES[location]
            ? LOCATION_NAMES[location]
            : "Unknown position";
    }
}
