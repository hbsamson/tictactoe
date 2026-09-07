import { gameRecordApi, roomRecordApi, ApiError } from "../api.js";
import { AppShell } from "../components/app-shell.js";
import { HistoryView } from "../components/history-view.js";
import { ReplayView } from "../components/replay-view.js";
import { RoomService } from "../room/room-service.js";
import { CONNECTION_POLL_DELAY } from "../config.js";
import { generateKey } from "../lobby/lobby.js";

const HISTORY_PLAYER_KEY = "tictactoe:history-player-id";
const SHORT_ID_LENGTH = 8;
const SHORT_SUFFIX_LENGTH = 6;
const WIN_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

class HistoryController {
    constructor() {
        this.app = new AppShell();
        this.history = new HistoryView();
        this.replay = new ReplayView();
        this.roomService = new RoomService();
        this.historyView = "room";
        this.app.render("app");
        this.app.shell.append(this.history.container);
        this.app.shell.append(this.replay.container);
        this.app.lobbyView.container.hidden = true;
        this.app.waitingView.container.hidden = true;
        this.app.gameView.container.hidden = true;
        this.showCurrentPlayer();
        this.history.form.addEventListener("submit", (event) => {
            event.preventDefault();
            this.load(this.history.input.value);
        });
        this.history.searchToggle.addEventListener("click", () => this.history.toggleSearch());
        this.history.roomViewButton.addEventListener("click", () => {
            this.historyView = "room";
            this.history.setHistoryView("room");
            if (this.entries) this.renderHistoryRows(this.entries);
        });
        this.history.gameViewButton.addEventListener("click", () => {
            this.historyView = "game";
            this.history.setHistoryView("game");
            if (this.entries) this.renderHistoryRows(this.entries);
        });
        this.history.copyPlayerId.addEventListener("click", async () => {
            const playerId = this.history.identityId.textContent.trim();
            if (!playerId) return;
            try {
                await navigator.clipboard.writeText(playerId);
                this.history.copyPlayerId.dataset.copied = "true";
                window.setTimeout(() => delete this.history.copyPlayerId.dataset.copied, 1400);
            } catch {
                this.history.copyPlayerId.title = "Select the ID to copy it";
            }
        });
        this.replay.bind(
            () => this.closeReplay(),
            () => this.replay.replay()
        );
        this.loadFromUrl();
        this.connectionPaused = false;
        void this.pollConnection();
        window.addEventListener("pagehide", () => {
            this.connectionPaused = true;
            window.clearTimeout(this.connectionTimer);
            this.replay.stop();
        });
        window.addEventListener("pageshow", (event) => {
            if (event.persisted) {
                this.connectionPaused = false;
                void this.pollConnection();
            }
        });
    }

    async pollConnection() {
        window.clearTimeout(this.connectionTimer);
        try {
            await this.roomService.check(generateKey());
            this.app.connection.dataset.state = "ready";
            this.app.connection.textContent = "Server ready";
        } catch {
            this.app.connection.dataset.state = "offline";
            this.app.connection.textContent = "Server offline";
        } finally {
            if (!this.connectionPaused) {
                this.connectionTimer = window.setTimeout(
                    () => void this.pollConnection(), CONNECTION_POLL_DELAY
                );
            }
        }
    }

    showCurrentPlayer() {
        const current = this.roomService.readCurrentPlayer();
        if (!current) {
            return;
        }
        this.history.showPlayer(current);
    }

    loadFromUrl() {
        const urlPlayerId = new URLSearchParams(window.location.search).get("playerId");
        if (urlPlayerId && urlPlayerId.trim()) {
            this.history.showSearch();
            this.history.input.value = urlPlayerId;
            this.load(urlPlayerId);
            return;
        }
        const current = this.roomService.readCurrentPlayer();
        const lastPlayerId = sessionStorage.getItem(HISTORY_PLAYER_KEY) || "";
        const playerId = current?.id || lastPlayerId;
        this.history.input.value = playerId || "";
        if (playerId) {
            this.load(playerId);
        } else {
            this.history.showEmptyState(
                "Play your first game to start your history, or search for a player ID to view their games."
            );
        }
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
        this.history.clearGames();
        this.setStatus("Loading saved games...");
        try {
            const response = await gameRecordApi.listGames(playerId);
            const items = this.parseGameList(response);
            await this.attachRoomKeys(items);
            if (!items.length) {
                this.history.clearStatus();
                this.history.showEmptyState(
                    "This player has no saved games yet. Completed games will appear here."
                );
                return;
            }
            this.setStatus(items.length + " saved game" + (items.length === 1 ? "" : "s") + " found");
            this.history.hideEmptyState();
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
                playerName: item?.playerName || item?.name || "",
                roomKey: item?.roomKey || item?.roomId || ""
            }))
            .filter((item) => item.id);
    }

    async attachRoomKeys(items) {
        try {
            const roomsResponse = await roomRecordApi.listRooms();
            const roomIds = this.parseJson(roomsResponse);
            if (!Array.isArray(roomIds) || !roomIds.length) return;
            const roomLists = await Promise.all(roomIds.map(async (roomId) => {
                try {
                    const response = await roomRecordApi.listGames(roomId);
                    return { roomId, games: this.parseJson(response) };
                } catch {
                    return { roomId, games: [] };
                }
            }));
            const roomByGame = new Map();
            roomLists.forEach(({ roomId, games }) => {
                if (!Array.isArray(games)) return;
                games.forEach((game) => {
                    const gameId = game?.gameId || game?.id;
                    if (gameId) roomByGame.set(gameId, game?.roomId || roomId);
                });
            });
            items.forEach((item) => {
                if (!item.roomKey && roomByGame.has(item.id)) item.roomKey = roomByGame.get(item.id);
            });
        } catch (error) {
            console.warn("Room history could not be resolved.", error);
        }
    }

    async renderGames(items) {
        const entries = items.map((item) => ({ item, ...this.createGameRow(item) }));
        this.entries = entries;
        entries.forEach((entry) => {
            entry.row.addEventListener("click", () => void this.openReplay(entry));
            entry.replay.addEventListener("click", (event) => {
                event.stopPropagation();
                void this.openReplay(entry);
            });
        });
        this.renderHistoryRows(entries);
        for (const entry of entries) {
            try {
                const detail = await gameRecordApi.getGame(entry.item.id);
                this.fillGameRow(entry, this.parseMoveList(detail), this.activePlayerId);
            } catch (error) {
                console.error(error);
                this.failGameRow(entry, this.errorMessage(error));
            }
        }
        if (this.historyView === "room") this.renderHistoryRows(entries);
    }

    renderHistoryRows(entries) {
        this.history.gamesBody.replaceChildren();
        if (this.historyView !== "room") {
            entries.forEach((entry) => this.history.gamesBody.append(entry.row, entry.detailRow));
            return;
        }
        const groups = new Map();
        entries.forEach((entry) => {
            const key = entry.item.roomKey || "unassigned";
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(entry);
        });
        groups.forEach((group, roomKey) => {
            const groupRow = document.createElement("tr");
            const cell = document.createElement("td");
            const button = document.createElement("button");
            const chevron = document.createElement("span");
            const label = document.createElement("span");
            const count = document.createElement("small");
            groupRow.className = "history-room-row";
            cell.colSpan = 4;
            button.type = "button";
            button.className = "history-room-toggle";
            chevron.className = "history-room-chevron";
            chevron.textContent = "▾";
            label.textContent = roomKey === "unassigned" ? "Room unavailable" : `Room ${this.shortRoomKey(roomKey)}`;
            count.textContent = `${group.length} game${group.length === 1 ? "" : "s"}`;
            button.setAttribute("aria-expanded", "false");
            groupRow.classList.add("is-collapsed");
            button.addEventListener("click", () => {
                const open = button.getAttribute("aria-expanded") === "true";
                button.setAttribute("aria-expanded", String(!open));
                button.closest("tr").classList.toggle("is-collapsed", open);
                group.forEach((entry) => {
                    entry.row.hidden = open;
                    entry.detailRow.hidden = true;
                });
            });
            button.append(chevron, label, count);
            cell.append(button);
            groupRow.append(cell);
            this.history.gamesBody.append(groupRow);
            group.forEach((entry) => {
                entry.row.hidden = true;
                entry.detailRow.hidden = true;
                this.history.gamesBody.append(entry.row, entry.detailRow);
            });
        });
    }

    createGameRow(item) {
        const row = document.createElement("tr");
        const detailRow = document.createElement("tr");
        const idCell = document.createElement("td");
        const idValue = document.createElement("span");
        const roomValue = document.createElement("small");
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
        idValue.className = "history-game-id-value";
        idValue.textContent = item.id;
        idValue.title = item.id;
        roomValue.className = "history-room-key";
        roomValue.hidden = !item.roomKey;
        roomValue.textContent = item.roomKey ? `Room ${this.shortRoomKey(item.roomKey)}` : "";
        roomValue.title = item.roomKey || "";
        idCell.title = item.id + (item.roomKey ? ` | Room ${item.roomKey}` : "");
        idCell.append(idValue, roomValue);

        tileCell.className = "history-tile";
        tileCell.textContent = "...";
        badge.className = "history-result history-result-unknown";
        badge.textContent = "...";
        replay.type = "button";
        replay.className = "history-replay";
        replay.textContent = "Watch replay";
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

        row.append(idCell, tileCell, resultCell, actionCell);
        return { row, detailRow, tileCell, badge, detailTitle, detailBody, roomValue, replay, item };
    }

    fillGameRow(entry, moves, playerId) {
        const sorted = [...moves].sort((a, b) =>
            String(a.dateSaved || "").localeCompare(String(b.dateSaved || ""))
        );
        const roomKey = this.extractRoomKey(sorted) || entry.item.roomKey || "";
        if (roomKey) {
            entry.item.roomKey = roomKey;
            entry.row.dataset.roomKey = roomKey;
            entry.roomValue.hidden = false;
            entry.roomValue.textContent = `Room ${this.shortRoomKey(roomKey)}`;
            entry.roomValue.title = roomKey;
            entry.row.title = entry.item.id + " | Room " + roomKey;
        }
        const analysis = this.analyzeGame(sorted, playerId, entry.item.playerName);
        entry.moves = sorted;
        entry.tileCell.textContent = analysis.tile;
        entry.badge.className = "history-result history-result-" + analysis.outcome;
        entry.badge.textContent = analysis.label;
        entry.detailTitle.textContent =
            (moves.length === 1 ? "1 move" : moves.length + " moves") +
            (roomKey ? " | Room " + this.shortRoomKey(roomKey) : "") +
            (entry.item.playerName ? " | " + entry.item.playerName : "");
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
            player.textContent = this.formatPlayerName(move.playerName, move.playerId);
            symbol.className = "history-tile";
            symbol.textContent = move.symbol || "?";
            location.className = "history-detail-location";
            location.textContent = this.formatLocation(move.location);
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
            if (!tile) return { tile: "-", outcome: "unknown", label: winner + " won" };
            return winner === tile
                ? { tile, outcome: "win", label: "Win" }
                : { tile, outcome: "loss", label: "Loss" };
        }
        if (board.every(Boolean)) return { tile: tile || "-", outcome: "draw", label: "Draw" };
        return { tile: tile || "-", outcome: "unknown", label: "Incomplete" };
    }

    extractRoomKey(moves) {
        const entry = moves.find((move) => typeof move.roomKey === "string" && move.roomKey.trim());
        return entry?.roomKey || "";
    }

    formatPlayerName(playerName, playerId) {
        const name = typeof playerName === "string" && playerName.trim() ? playerName.trim() : "Player";
        const suffix = this.shortSuffix(playerId);
        return suffix ? `${name} [${suffix}]` : name;
    }

    shortSuffix(value) {
        if (typeof value !== "string" || !value) return "";
        return value.length > SHORT_SUFFIX_LENGTH ? value.slice(-SHORT_SUFFIX_LENGTH) : value;
    }

    formatDateTime(value) {
        if (!value) return "-";
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
        entry.tileCell.textContent = "-";
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
        return gameId.length > SHORT_ID_LENGTH ? gameId.slice(0, SHORT_ID_LENGTH) + "..." : gameId;
    }

    shortRoomKey(roomKey) {
        return this.roomService.shortRoomKey(roomKey);
    }

    formatLocation(value) {
        const locations = [
            "Top left [1,1]", "Top center [1,2]", "Top right [1,3]",
            "Middle left [2,1]", "Center [2,2]", "Middle right [2,3]",
            "Bottom left [3,1]", "Bottom center [3,2]", "Bottom right [3,3]"
        ];
        const location = Number(value);
        return Number.isInteger(location) && locations[location]
            ? locations[location]
            : "Unknown position";
    }

    errorMessage(error) {
        return error instanceof ApiError ? error.message : "The saved games could not be loaded.";
    }

    async openReplay(entry) {
        let moves = entry.moves;
        if (!moves) {
            try {
                const detail = await gameRecordApi.getGame(entry.item.id);
                moves = this.parseMoveList(detail);
                entry.moves = moves;
            } catch (error) {
                this.setStatus(this.errorMessage(error), true);
                return;
            }
        }
        this.history.container.hidden = true;
        this.replay.show(entry.item, moves);
    }

    closeReplay() {
        this.replay.hide();
        this.history.container.hidden = false;
    }

    setStatus(message, isError = false) {
        this.history.status.textContent = message;
        this.history.status.classList.toggle("error", isError);
    }
}

new HistoryController();
