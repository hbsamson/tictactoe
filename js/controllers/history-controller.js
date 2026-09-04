import { gameRecordApi, ApiError } from "../api.js";
import { AppShell } from "../components/app-shell.js";
import { HistoryView } from "../components/history-view.js";
import { RoomService } from "../room/room-service.js";

const HISTORY_PLAYER_KEY = "tictactoe:history-player-id";
const SHORT_ID_LENGTH = 8;

class HistoryController {
    constructor() {
        this.app = new AppShell();
        this.history = new HistoryView();
        this.roomService = new RoomService();
        this.app.render("app");
        this.app.shell.append(this.history.container);
        this.app.lobbyView.container.hidden = true;
        this.app.waitingView.container.hidden = true;
        this.app.gameView.container.hidden = true;
        this.showCurrentPlayer();
        this.history.form.addEventListener("submit", (event) => {
            event.preventDefault();
            this.load(this.history.input.value);
        });
        this.loadFromUrl();
    }

    showCurrentPlayer() {
        const current = this.roomService.readCurrentPlayer();
        if (!current) {
            this.setStatus("No player profile found in this browser yet. Play a game in this window first, or enter any player ID below.");
            return;
        }
        this.history.showPlayer(current);
    }

    loadFromUrl() {
        const urlPlayerId = new URLSearchParams(window.location.search).get("playerId");
        if (urlPlayerId && urlPlayerId.trim()) {
            this.history.input.value = urlPlayerId;
            this.load(urlPlayerId);
            return;
        }
        const current = this.roomService.readCurrentPlayer();
        const lastPlayerId = sessionStorage.getItem(HISTORY_PLAYER_KEY) || "";
        const playerId = current?.id || lastPlayerId;
        this.history.input.value = playerId || "";
        if (playerId) this.load(playerId);
    }

    async load(value) {
        const playerId = value.trim();
        if (!playerId) {
            this.setStatus("Enter a player ID to continue.", true);
            this.history.input.focus();
            return;
        }
        sessionStorage.setItem(HISTORY_PLAYER_KEY, playerId);
        this.history.submit.disabled = true;
        this.setStatus("Loading saved games…");
        this.history.games.replaceChildren();
        try {
            const response = await gameRecordApi.listGames(playerId);
            const items = this.parseGameList(response);
            if (!items.length) {
                this.setStatus("No saved games found for this player.");
                return;
            }
            this.setStatus(items.length + " saved game" + (items.length === 1 ? "" : "s") + " found");
            void this.renderGames(items);
        } catch (error) {
            console.error(error);
            this.setStatus(this.errorMessage(error), true);
        } finally {
            this.history.submit.disabled = false;
        }
    }

    parseGameList(response) {
        const data = this.parseJson(response);
        if (!data) return [];
        const items = Array.isArray(data) ? data : data.list;
        if (!Array.isArray(items)) return [];
        return items
            .map((item) => ({
                id: item?.id || item?.gameId || "",
                playerName: item?.playerName || item?.name || ""
            }))
            .filter((item) => item.id);
    }

    async renderGames(items) {
        const entries = items.map((item) => ({ item, ...this.createGameCard(item) }));
        entries.forEach((entry) => this.history.games.append(entry.card));
        for (const entry of entries) {
            try {
                const detail = await gameRecordApi.getGame(entry.item.id);
                this.fillGameCard(entry, this.parseMoveList(detail));
            } catch (error) {
                console.error(error);
                this.failGameCard(entry, this.errorMessage(error));
            }
        }
    }

    createGameCard(item) {
        const card = document.createElement("article");
        const heading = document.createElement("div");
        const title = document.createElement("h2");
        const count = document.createElement("span");
        const meta = document.createElement("p");
        const moves = document.createElement("ol");
        card.className = "history-game";
        heading.className = "history-game-heading";
        title.textContent = "Game " + this.shortId(item.id);
        title.title = item.id;
        count.className = "history-game-count";
        count.textContent = "…";
        meta.className = "history-game-meta";
        meta.textContent = item.playerName ? `Played by ${item.playerName}` : item.id;
        moves.className = "history-moves";
        moves.textContent = "Loading moves…";
        heading.append(title, count);
        card.append(heading, meta, moves);
        return { card, count, meta, moves };
    }

    fillGameCard(entry, moves) {
        const sorted = [...moves].sort((a, b) =>
            String(a.dateSaved || "").localeCompare(String(b.dateSaved || ""))
        );
        entry.count.textContent = moves.length + " move" + (moves.length === 1 ? "" : "s");
        entry.meta.textContent = this.gameMeta(entry.item, sorted);
        entry.moves.replaceChildren();
        sorted.forEach((move) => {
            const item = document.createElement("li");
            item.textContent = `${move.symbol || "?"} placed at cell ${move.location || "?"} · ${move.dateSaved || "date not recorded"}`;
            entry.moves.append(item);
        });
    }

    gameMeta(item, moves) {
        const parts = [];
        if (item.playerName) parts.push(`Played by ${item.playerName}`);
        const lastDate = moves.length ? moves[moves.length - 1].dateSaved : "";
        if (lastDate) parts.push(`Last recorded ${lastDate}`);
        return parts.join(" · ");
    }

    failGameCard(entry, message) {
        entry.count.textContent = "unavailable";
        entry.moves.replaceChildren();
        const item = document.createElement("li");
        item.textContent = message;
        entry.moves.append(item);
    }

    parseMoveList(response) {
        const data = this.parseJson(response);
        if (!data) return [];
        const list = Array.isArray(data) ? data : data.list;
        return Array.isArray(list) ? list : [];
    }

    parseJson(response) {
        if (response == null) return null;
        if (typeof response === "string") {
            try { return JSON.parse(response); } catch { return null; }
        }
        return response;
    }

    shortId(gameId) {
        return gameId.length > SHORT_ID_LENGTH ? gameId.slice(0, SHORT_ID_LENGTH) + "…" : gameId;
    }

    errorMessage(error) {
        return error instanceof ApiError ? error.message : "The saved games could not be loaded.";
    }

    setStatus(message, isError = false) {
        this.history.status.textContent = message;
        this.history.status.classList.toggle("error", isError);
    }
}

new HistoryController();
