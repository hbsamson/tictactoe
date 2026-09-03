import { EMPTY_BOARD, currentTurn, resultFor } from "../game/game.js";
import { getLobbyProfile } from "../lobby/lobby.js";

export class GameSession {
    constructor(elements, roomService, ui) {
        this.elements = elements;
        this.roomService = roomService;
        this.ui = ui;
        this.resetState();
    }

    resetState() {
        this.state = {
            key: "", gameId: "", tile: "", board: [...EMPTY_BOARD], turn: "X",
            view: "lobby", scores: { X: 0, O: 0 }, pollTimer: null,
            isLoading: false, movePending: false, pendingIndex: null,
            outcomeId: "", leaving: false, spectator: false, profile: null,
            players: {}, spectatorExitSince: null, autoRematch: false,
            autoRematchReady: false, skipGameStart: false
        };
    }

    beginPlayer(key, tile, stopPolling) {
        stopPolling();
        const lobbyProfile = getLobbyProfile(this.elements);
        this.roomService.saveProfile(key, tile, lobbyProfile);
        const players = this.roomService.readProfiles(key);
        const profile = players[tile] || lobbyProfile;
        const gameId = tile === "X"
            ? this.roomService.createRoundId(key)
            : this.roomService.readRoundId(key) || this.roomService.createRoundId(key);
        Object.assign(this.state, {
            key, gameId, tile, board: [...EMPTY_BOARD], turn: "X", view: "waiting",
            scores: this.roomService.readScores(key), outcomeId: "", leaving: false,
            spectator: false, spectatorExitSince: null, profile, players,
            movePending: false, pendingIndex: null, autoRematch: false,
            autoRematchReady: false, skipGameStart: false
        });
        this.ui.setRoom(key, tile, false, players);
        this.ui.setScores(this.state.scores);
        this.ui.renderBoard(this.state.board, { ...this.state, spectator: false });
    }

    beginSpectator(key, board, stopPolling) {
        stopPolling();
        const parsedBoard = [...board];
        const profile = getLobbyProfile(this.elements);
        const players = this.roomService.readProfiles(key);
        Object.assign(this.state, {
            key, gameId: this.roomService.readRoundId(key), tile: "", board: parsedBoard,
            turn: currentTurn(parsedBoard), view: "spectating",
            scores: this.roomService.readScores(key), outcomeId: "", leaving: false,
            spectator: true, spectatorExitSince: null, profile, players,
            movePending: false, pendingIndex: null, autoRematch: false,
            autoRematchReady: false, skipGameStart: false
        });
        this.ui.setRoom(key, "", true, players);
        this.ui.setScores(this.state.scores);
        this.ui.renderBoard(parsedBoard, {
            ...this.state, spectator: true, finished: Boolean(resultFor(parsedBoard))
        });
    }

    prepareRematch(tile, gameId, view) {
        Object.assign(this.state, {
            gameId, tile, board: [...EMPTY_BOARD], turn: "X", view,
            outcomeId: "", leaving: false, movePending: false, pendingIndex: null,
            autoRematch: false, autoRematchReady: false, skipGameStart: true
        });
    }

    startRematch(tile, gameId, view) {
        this.prepareRematch(tile, gameId, view);
        this.roomService.saveProfile(this.state.key, tile, this.state.profile);
        this.state.players = this.roomService.readProfiles(this.state.key);
        this.state.profile = this.state.players[tile] || this.state.profile;
        this.ui.setRoom(this.state.key, tile, false, this.state.players);
        this.ui.setScores(this.state.scores);
        this.ui.renderBoard(this.state.board, this.state);
    }

    returnToLobby() {
        this.resetState();
        this.elements.keyInput.value = crypto.randomUUID();
        this.ui.setKeyError();
        this.ui.showView("lobby");
    }

    async saveMoveSnapshot(location) {
        if (!this.state.key || !this.state.gameId || !this.state.profile?.id || this.state.spectator) return;
        const pad = (value) => String(value).padStart(2, "0");
        const date = new Date();
        const dateSaved = [
            date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())
        ].join("-") + " " + [pad(date.getHours()), pad(date.getMinutes()), pad(date.getSeconds())].join(":");
        try {
            await this.roomService.saveMove({
                gameId: this.state.gameId, playerId: this.state.profile.id,
                symbol: this.state.tile, location: String(location), dateSaved
            });
        } catch (error) {
            console.warn("Unable to save game move.", error);
        }
    }
}
