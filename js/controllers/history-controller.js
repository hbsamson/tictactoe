import { gameRecordApi, ApiError } from "../api.js";
import { AppShell } from "../components/app-shell.js";
import { HistoryView } from "../components/history-view.js";
import { RoomService } from "../room/room-service.js";

const HISTORY_PLAYER_KEY = "tictactoe:history-player-id";
const SHORT_ID_LENGTH = 8;
const WIN_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

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
        this.activePlayerId = playerId;
        this.history.submit.disabled = true;
        this.setStatus("Loading saved games…");
        this.history.gamesBody.replaceChildren();
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
        const entries = items.map((item) => ({ item, ...this.createGameRow(item) }));
        entries.forEach((entry) => this.history.gamesBody.append(entry.row, entry.detailRow));
        for (const entry of entries) {
            try {
                const detail = await gameRecordApi.getGame(entry.item.id);
                this.fillGameRow(entry, this.parseMoveList(detail), this.activePlayerId);
            } catch (error) {
                console.error(error);
                this.failGameRow(entry, this.errorMessage(error));
            }
        }
    }

    createGameRow(item) {
        const row = document.createElement("tr");
        const detailRow = document.createElement("tr");
        const idCell = document.createElement("td");
        const tileCell = document.createElement("td");
        const resultCell = document.createElement("td");
        const badge = document.createElement("span");
        const actionCell = document.createElement("td");
        const replay = document.createElement("button");
        const detailCell = document.createElement("td");
        const detail = document.createElement("div");
        const detailTitle = document.createElement("p");
        const detailTable = document.createElement("table");
        const detailHead = document.createElement("thead");
        const detailBody = document.createElement("tbody");

        row.className = "history-game-row";
        idCell.className = "history-game-id";
        idCell.textContent = this.shortId(item.id);
        idCell.title = item.id;
        tileCell.className = "history-tile";
        tileCell.textContent = "…";
        badge.className = "history-result history-result-unknown";
        badge.textContent = "…";
        replay.type = "button";
        replay.className = "history-replay";
        replay.textContent = "Replay Game";
        replay.setAttribute("aria-expanded", "false");
        replay.setAttribute("aria-controls", "history-detail-" + item.id);
        resultCell.append(badge);
        actionCell.append(replay);

        detailRow.className = "history-detail-row";
        detailRow.id = "history-detail-" + item.id;
        detailRow.hidden = true;
        detailCell.colSpan = 4;
        detail.className = "history-detail";
        detailTitle.className = "history-detail-title";
        detailTitle.textContent = "Move by move";
        detailTable.className = "history-detail-table";
        const headRow = document.createElement("tr");
        ["#", "Player", "Move", "Location", "Date & Time"].forEach((text) => {
            const cell = document.createElement("th");
            cell.scope = "col";
            cell.textContent = text;
            headRow.append(cell);
        });
        detailHead.append(headRow);
        detailTable.append(detailHead, detailBody);
        detail.append(detailTitle, detailTable);
        detailCell.append(detail);
        detailRow.append(detailCell);

        const toggle = () => {
            const open = detailRow.hidden;
            detailRow.hidden = !open;
            replay.setAttribute("aria-expanded", open ? "true" : "false");
            row.classList.toggle("is-open", open);
        };
        row.addEventListener("click", toggle);
        replay.addEventListener("click", (event) => {
            event.stopPropagation();
            toggle();
        });

        row.append(idCell, tileCell, resultCell, actionCell);
        return { row, detailRow, tileCell, badge, detailTitle, detailBody, item };
    }

    fillGameRow(entry, moves, playerId) {
        const sorted = [...moves].sort((a, b) =>
            String(a.dateSaved || "").localeCompare(String(b.dateSaved || ""))
        );
        const analysis = this.analyzeGame(sorted, playerId, entry.item.playerName);
        entry.tileCell.textContent = analysis.tile;
        entry.badge.className = "history-result history-result-" + analysis.outcome;
        entry.badge.textContent = analysis.label;
        entry.detailTitle.textContent =
            (moves.length === 1 ? "1 move" : moves.length + " moves") +
            (entry.item.playerName ? " · " + entry.item.playerName : "");
        entry.detailBody.replaceChildren();
        if (!sorted.length) {
            entry.detailBody.append(this.detailMessageRow("No moves were recorded for this game.", 5));
            return;
        }
        sorted.forEach((move, index) => {
            const row = document.createElement("tr");
            const num = document.createElement("td");
            const player = document.createElement("td");
            const symbol = document.createElement("td");
            const location = document.createElement("td");
            const when = document.createElement("td");
            num.className = "history-detail-num";
            num.textContent = String(index + 1);
            player.textContent = move.playerName || "Player";
            symbol.className = "history-tile";
            symbol.textContent = move.symbol || "?";
            location.className = "history-detail-location";
            location.textContent = String(move.location ?? "?");
            when.textContent = this.formatDateTime(move.dateSaved);
            row.append(num, player, symbol, location, when);
            entry.detailBody.append(row);
        });
    }

    analyzeGame(sortedMoves, playerId, playerName) {
        const board = Array.from({ length: 9 }, () => "");
        let tile = "";
        let fallbackTile = "";
        for (const move of sortedMoves) {
            const symbol = move.symbol === "X" || move.symbol === "O" ? move.symbol : "";
            const location = Number(move.location);
            if (symbol && !tile && playerId && move.playerId === playerId) tile = symbol;
            if (symbol && !fallbackTile && playerName && move.playerName === playerName) {
                fallbackTile = symbol;
            }
            if (symbol && Number.isInteger(location) && location >= 0 && location < 9 && !board[location]) {
                board[location] = symbol;
            }
        }
        if (!tile) tile = fallbackTile;
        let winner = "";
        for (const [a, b, c] of WIN_LINES) {
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                winner = board[a];
                break;
            }
        }
        if (winner) {
            if (!tile) return { tile: "—", outcome: "unknown", label: winner + " won" };
            return winner === tile
                ? { tile, outcome: "win", label: "Win" }
                : { tile, outcome: "loss", label: "Loss" };
        }
        if (board.every(Boolean)) return { tile: tile || "—", outcome: "draw", label: "Draw" };
        return { tile: tile || "—", outcome: "unknown", label: "In progress" };
    }

    formatDateTime(value) {
        if (!value) return "—";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return date.toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
        });
    }

    detailMessageRow(message, span) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = span;
        cell.className = "history-detail-empty";
        cell.textContent = message;
        row.append(cell);
        return row;
    }

    failGameRow(entry, message) {
        entry.tileCell.textContent = "—";
        entry.badge.className = "history-result history-result-unknown";
        entry.badge.textContent = "N/A";
        entry.detailTitle.textContent = "Move records unavailable";
        entry.detailBody.replaceChildren();
        entry.detailBody.append(this.detailMessageRow(message, 5));
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
