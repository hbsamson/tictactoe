import { BaseComponent } from "./base-component.js";

const BOARD_CELLS = [
    { index: 0, x: 0, y: 0, label: "Top left" },
    { index: 1, x: 1, y: 0, label: "Top center" },
    { index: 2, x: 2, y: 0, label: "Top right" },
    { index: 3, x: 0, y: 1, label: "Middle left" },
    { index: 4, x: 1, y: 1, label: "Center" },
    { index: 5, x: 2, y: 1, label: "Middle right" },
    { index: 6, x: 0, y: 2, label: "Bottom left" },
    { index: 7, x: 1, y: 2, label: "Bottom center" },
    { index: 8, x: 2, y: 2, label: "Bottom right" }
];

export class GameView extends BaseComponent {
    initializeElements() {
        this.container = document.createElement("section");
        this.topbar = document.createElement("div");
        this.matchMode = document.createElement("div");
        this.gameModeLabel = document.createElement("strong");
        this.spectatorBadge = document.createElement("span");
        this.roomActions = document.createElement("div");
        this.copyKey = document.createElement("button");
        this.activeGameKey = document.createElement("strong");
        this.copyKeyLabel = document.createElement("small");
        this.copyKeyIcon = document.createElement("i");
        this.exitButton = document.createElement("button");
        this.exitIcon = document.createElement("i");
        this.layout = document.createElement("div");
        this.scoreboard = document.createElement("div");
        this.playerXCard = document.createElement("aside");
        this.playerXSymbol = document.createElement("span");
        this.playerXAvatar = document.createElement("img");
        this.playerXMarker = document.createElement("span");
        this.playerXMeta = document.createElement("div");
        this.playerXLabelSmall = document.createElement("small");
        this.playerXLabel = document.createElement("strong");
        this.xScore = document.createElement("b");
        this.scoreDivider = document.createElement("span");
        this.playerOCard = document.createElement("aside");
        this.playerOSymbol = document.createElement("span");
        this.playerOAvatar = document.createElement("img");
        this.playerOMarker = document.createElement("span");
        this.playerOMeta = document.createElement("div");
        this.playerOLabelSmall = document.createElement("small");
        this.playerOLabel = document.createElement("strong");
        this.oScore = document.createElement("b");
        this.boardColumn = document.createElement("div");
        this.turnStatus = document.createElement("div");
        this.turnMessage = document.createElement("span");
        this.turnDot = document.createElement("span");
        this.statusText = document.createElement("strong");
        this.board = document.createElement("div");
        this.cells = BOARD_CELLS.map(() => document.createElement("button"));
        this.cheerPanel = document.createElement("div");
        this.cheerHeader = document.createElement("div");
        this.cheerEyebrow = document.createElement("p");
        this.cheerButtons = BOARD_CELLS.slice(0, 4).map(() => document.createElement("button"));
        this.cheerButtonsWrap = document.createElement("div");
    }

    setAttributes() {
        this.container.id = "gameView";
        this.container.className = "game view";
        this.container.hidden = true;
        this.container.setAttribute("aria-label", "Tic-Tac-Toe match");

        this.topbar.className = "game-topbar";
        this.matchMode.className = "match-mode";
        this.gameModeLabel.id = "gameModeLabel";
        this.gameModeLabel.className = "game-mode-label";
        this.gameModeLabel.textContent = "Live match";
        this.spectatorBadge.id = "spectatorBadge";
        this.spectatorBadge.className = "spectator-badge";
        this.spectatorBadge.hidden = true;
        this.spectatorBadge.textContent = "Spectator | reactions only";

        this.roomActions.className = "room-actions";
        this.copyKey.id = "copyGameKey";
        this.copyKey.className = "room-key";
        this.copyKey.type = "button";
        this.copyKey.setAttribute("aria-label", "Copy room ID");
        this.activeGameKey.id = "activeGameKey";
        this.copyKeyLabel.innerHTML = " Copy";
        this.copyKeyIcon.dataset.lucide = "copy";
        this.exitButton.id = "exitButton";
        this.exitButton.className = "button button-ghost";
        this.exitButton.type = "button";
        this.exitIcon.dataset.lucide = "log-out";

        this.layout.className = "game-layout";
        this.scoreboard.className = "scoreboard";
        this.scoreboard.setAttribute("aria-label", "Scoreboard");
        this.playerXCard.id = "playerXCard";
        this.playerXCard.className = "player-card player-x";
        this.playerXSymbol.className = "player-symbol";
        this.playerXAvatar.id = "playerXAvatar";
        this.playerXAvatar.alt = "";
        this.playerXMarker.textContent = "X";
        this.playerXLabelSmall.textContent = "Player X";
        this.playerXLabel.id = "playerXLabel";
        this.playerXLabel.textContent = "Opponent";
        this.xScore.id = "xScore";
        this.xScore.className = "score";
        this.xScore.textContent = "0";
        this.scoreDivider.className = "score-divider";
        this.scoreDivider.setAttribute("aria-hidden", "true");
        this.scoreDivider.textContent = "VS";
        this.playerOCard.id = "playerOCard";
        this.playerOCard.className = "player-card player-o";
        this.playerOSymbol.className = "player-symbol";
        this.playerOAvatar.id = "playerOAvatar";
        this.playerOAvatar.alt = "";
        this.playerOMarker.textContent = "O";
        this.playerOLabelSmall.textContent = "Player O";
        this.playerOLabel.id = "playerOLabel";
        this.playerOLabel.textContent = "Opponent";
        this.oScore.id = "oScore";
        this.oScore.className = "score";
        this.oScore.textContent = "0";

        this.boardColumn.className = "board-column";
        this.turnStatus.id = "turnStatus";
        this.turnStatus.className = "turn-status";
        this.turnStatus.setAttribute("role", "status");
        this.turnStatus.setAttribute("aria-live", "polite");
        this.turnMessage.className = "turn-message";
        this.turnDot.className = "turn-dot";
        this.statusText.id = "statusText";
        this.statusText.textContent = "Preparing match...";

        this.board.id = "board";
        this.board.className = "board";
        this.board.setAttribute("role", "grid");
        this.board.setAttribute("aria-label", "Tic-Tac-Toe board");
        this.cells.forEach((cell, index) => {
            const boardCell = BOARD_CELLS[index];
            cell.className = "cell";
            cell.type = "button";
            cell.setAttribute("role", "gridcell");
            cell.dataset.index = String(boardCell.index);
            cell.dataset.x = String(boardCell.x);
            cell.dataset.y = String(boardCell.y);
            cell.dataset.label = boardCell.label;
            cell.setAttribute("aria-label", `${boardCell.label}, empty`);
            cell.disabled = true;
        });

        this.cheerPanel.className = "cheer-panel";
        this.cheerPanel.setAttribute("aria-live", "polite");
        this.cheerHeader.className = "cheer-header";
        this.cheerEyebrow.className = "eyebrow";
        this.cheerEyebrow.textContent = "Call out";
        this.cheerButtonsWrap.className = "cheer-buttons";
        this.cheerButtonsWrap.setAttribute("aria-label", "Call-out messages");
        this.cheerButtons[0].className = "cheer-button";
        this.cheerButtons[1].className = "cheer-button";
        this.cheerButtons[2].className = "cheer-button";
        this.cheerButtons[3].className = "cheer-button";
        this.cheerButtons[0].type = "button";
        this.cheerButtons[1].type = "button";
        this.cheerButtons[2].type = "button";
        this.cheerButtons[3].type = "button";
        this.cheerButtons[0].dataset.message = "Woah!";
        this.cheerButtons[1].dataset.message = "Nice move!";
        this.cheerButtons[2].dataset.message = "Clutch play!";
        this.cheerButtons[3].dataset.message = "Ouch!";
        this.cheerButtons[0].textContent = "Woah!";
        this.cheerButtons[1].textContent = "Nice move!";
        this.cheerButtons[2].textContent = "Clutch play!";
        this.cheerButtons[3].textContent = "Ouch!";
    }

    appendElements() {
        this.container.append(this.topbar, this.layout);

        this.topbar.append(this.matchMode, this.roomActions);
        this.matchMode.append(this.gameModeLabel, this.spectatorBadge);
        this.roomActions.append(this.copyKey, this.exitButton);
        this.copyKey.append(this.activeGameKey, this.copyKeyLabel);
        this.copyKeyLabel.prepend(this.copyKeyIcon);
        this.exitButton.prepend(this.exitIcon, document.createTextNode(" Exit"));

        this.layout.append(this.scoreboard, this.boardColumn);
        this.scoreboard.append(this.playerXCard, this.scoreDivider, this.playerOCard);
        this.playerXCard.append(this.playerXSymbol, this.playerXMeta, this.xScore);
        this.playerXSymbol.append(this.playerXAvatar, this.playerXMarker);
        this.playerXMeta.append(this.playerXLabelSmall, this.playerXLabel);
        this.playerOCard.append(this.playerOSymbol, this.playerOMeta, this.oScore);
        this.playerOSymbol.append(this.playerOAvatar, this.playerOMarker);
        this.playerOMeta.append(this.playerOLabelSmall, this.playerOLabel);

        this.boardColumn.append(this.turnStatus, this.board, this.cheerPanel);
        this.turnStatus.append(this.turnMessage);
        this.turnMessage.append(this.turnDot, this.statusText);
        this.cheerPanel.append(this.cheerHeader);
        this.cheerHeader.append(this.cheerEyebrow, this.cheerButtonsWrap);
        this.cheerButtonsWrap.append(...this.cheerButtons);
        this.board.append(...this.cells);
    }
}
