import { BaseComponent } from "./base-component.js";

export class ModalOverlay extends BaseComponent {
    initializeElements() {
        this.container = document.createElement("div");
        this.modal = document.createElement("section");
        this.art = document.createElement("img");
        this.close = document.createElement("button");
        this.closeIcon = document.createElement("i");
        this.heading = document.createElement("div");
        this.symbol = document.createElement("span");
        this.headingCopy = document.createElement("div");
        this.eyebrow = document.createElement("p");
        this.title = document.createElement("h2");
        this.message = document.createElement("p");
        this.score = document.createElement("div");
        this.scoreX = document.createElement("div");
        this.scoreXLabel = document.createElement("span");
        this.scoreXValue = document.createElement("strong");
        this.scoreVs = document.createElement("span");
        this.scoreO = document.createElement("div");
        this.scoreOLabel = document.createElement("span");
        this.scoreOValue = document.createElement("strong");
        this.details = document.createElement("ol");
        this.actions = document.createElement("div");
        this.primary = document.createElement("button");
        this.secondary = document.createElement("button");
    }

    setAttributes() {
        this.container.id = "modalOverlay";
        this.container.className = "modal-overlay";
        this.container.hidden = true;

        this.modal.className = "modal";
        this.modal.setAttribute("role", "dialog");
        this.modal.setAttribute("aria-modal", "true");
        this.modal.setAttribute("aria-labelledby", "modalTitle");
        this.modal.setAttribute("aria-describedby", "modalMessage modalDetails");

        this.art.id = "modalArt";
        this.art.className = "modal-art";
        this.art.alt = "";
        this.art.hidden = true;
        this.art.setAttribute("aria-hidden", "true");

        this.close.id = "modalCloseButton";
        this.close.className = "modal-close";
        this.close.type = "button";
        this.close.setAttribute("aria-label", "Close");
        this.closeIcon.dataset.lucide = "x";

        this.heading.className = "modal-heading";
        this.symbol.id = "modalSymbol";
        this.symbol.className = "modal-symbol";
        this.symbol.setAttribute("aria-hidden", "true");
        this.symbol.textContent = "XO";
        this.headingCopy.className = "modal-heading-copy";
        this.eyebrow.id = "modalEyebrow";
        this.eyebrow.className = "eyebrow";
        this.eyebrow.textContent = "Match update";
        this.title.id = "modalTitle";
        this.title.textContent = "Game update";

        this.message.id = "modalMessage";
        this.details.id = "modalDetails";
        this.details.className = "modal-details";
        this.details.hidden = true;

        this.score.id = "modalScore";
        this.score.className = "modal-score";
        this.score.hidden = true;
        this.score.setAttribute("aria-label", "Match score");
        this.scoreX.className = "modal-score-side modal-score-x";
        this.scoreXLabel.textContent = "X";
        this.scoreXValue.id = "modalXScore";
        this.scoreXValue.textContent = "0";
        this.scoreVs.className = "modal-score-vs";
        this.scoreVs.setAttribute("aria-hidden", "true");
        this.scoreVs.textContent = "VS";
        this.scoreO.className = "modal-score-side modal-score-o";
        this.scoreOLabel.textContent = "O";
        this.scoreOValue.id = "modalOScore";
        this.scoreOValue.textContent = "0";

        this.actions.className = "modal-actions";
        this.primary.id = "modalPrimaryButton";
        this.primary.className = "button button-primary";
        this.primary.type = "button";
        this.primary.textContent = "Continue";
        this.secondary.id = "modalSecondaryButton";
        this.secondary.className = "button button-secondary";
        this.secondary.type = "button";
        this.secondary.hidden = true;
        this.secondary.textContent = "Back";
    }

    appendElements() {
        this.container.append(this.modal);
        this.modal.append(this.art, this.close, this.heading, this.message, this.score, this.details, this.actions);
        this.close.append(this.closeIcon);
        this.heading.append(this.symbol, this.headingCopy);
        this.headingCopy.append(this.eyebrow, this.title);
        this.score.append(this.scoreX, this.scoreVs, this.scoreO);
        this.scoreX.append(this.scoreXLabel, this.scoreXValue);
        this.scoreO.append(this.scoreOLabel, this.scoreOValue);
        this.actions.append(this.primary, this.secondary);
    }
}
