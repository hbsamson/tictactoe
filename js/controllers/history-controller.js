import { gameRecordApi, ApiError } from "../api.js";
import { AppShell } from "../components/app-shell.js";
import { HistoryView } from "../components/history-view.js";

const HISTORY_PLAYER_KEY = "tictactoe:history-player-id";

class HistoryController {
    constructor() {
        this.app = new AppShell();
        this.history = new HistoryView();
        this.app.render("app");
        this.app.shell.append(this.history.container);
        this.app.lobbyView.container.hidden = true;
        this.app.waitingView.container.hidden = true;
        this.app.gameView.container.hidden = true;
        this.history.input.value = localStorage.getItem(HISTORY_PLAYER_KEY) || "";
        this.history.form.addEventListener("submit", (event) => {
            event.preventDefault();
            this.load(this.history.input.value);
        });
        this.loadFromUrl();
    }

    loadFromUrl() {
        const playerId = new URLSearchParams(window.location.search).get("playerId");
        if (playerId) {
            this.history.input.value = playerId;
            this.load(playerId);
        } else {
            this.setStatus("Enter a player ID to load saved games.");
        }
    }

    async load(value) {
        const playerId = value.trim();
        if (!playerId) {
            this.setStatus("Enter a player ID to continue.", true);
            this.history.input.focus();
            return;
        }
        localStorage.setItem(HISTORY_PLAYER_KEY, playerId);
        this.history.submit.disabled = true;
        this.setStatus("Loading saved games...");
        this.history.games.replaceChildren();
        try {
            const response = await gameRecordApi.listGames(playerId);
            this.renderGames(this.parseGames(response));
        } catch (error) {
            console.error(error);
            const message = error instanceof ApiError ? error.message : "The saved games could not be loaded.";
            this.setStatus(message, true);
        } finally {
            this.history.submit.disabled = false;
        }
    }

    parseGames(response) {
        if (Array.isArray(response)) return response;
        if (typeof response !== "string" || !response) return [];
        const parsed = JSON.parse(response);
        if (Array.isArray(parsed)) return parsed;
        return parsed?.games || parsed?.records || [];
    }

    renderGames(records) {
        const groups = new Map();
        records.forEach((record) => {
            const gameId = record.gameId || "Unknown game";
            if (!groups.has(gameId)) groups.set(gameId, []);
            groups.get(gameId).push(record);
        });
        if (!groups.size) {
            this.setStatus("No saved games found for this player.");
            return;
        }
        this.setStatus(groups.size + " saved game" + (groups.size === 1 ? "" : "s") + " found.");
        groups.forEach((moves, gameId) => this.renderGame(gameId, moves));
    }

    renderGame(gameId, moves) {
        const card = document.createElement("article");
        const heading = document.createElement("div");
        const title = document.createElement("h2");
        const count = document.createElement("span");
        const list = document.createElement("ol");
        card.className = "history-game";
        heading.className = "history-game-heading";
        title.textContent = "Game " + gameId;
        count.textContent = moves.length + " move" + (moves.length === 1 ? "" : "s");
        count.className = "history-game-count";
        list.className = "history-moves";
        moves.forEach((move) => {
            const item = document.createElement("li");
            const date = move.dateSaved ? " - " + move.dateSaved : "";
            item.textContent = (move.symbol || "?") + " placed at " + (move.location || "unknown") + date;
            list.append(item);
        });
        heading.append(title, count);
        card.append(heading, list);
        this.history.games.append(card);
    }

    setStatus(message, isError = false) {
        this.history.status.textContent = message;
        this.history.status.classList.toggle("error", isError);
    }
}

new HistoryController();
