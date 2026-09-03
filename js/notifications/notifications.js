import { elements } from "../ui.js";

const modal = {
    overlay: elements.modalOverlay, eyebrow: elements.modalEyebrow, symbol: elements.modalSymbol,
    title: elements.modalTitle, message: elements.modalMessage, details: elements.modalDetails, score: elements.modalScore,
    xScore: elements.modalXScore, oScore: elements.modalOScore, primary: elements.modalPrimaryButton,
    secondary: elements.modalSecondaryButton, close: elements.modalCloseButton, art: elements.modalArt
};
let modalHandlers = {};
let toastTimer;

export function showModal(options) {
    modal.eyebrow.textContent = options.eyebrow || "Match update";
    modal.symbol.textContent = options.symbol || "XO";
    modal.title.textContent = options.title;
    modal.message.textContent = options.message;
    modal.details.replaceChildren();
    (options.details || []).forEach((detail) => {
        const item = document.createElement("li");
        item.textContent = detail;
        modal.details.appendChild(item);
    });
    modal.details.hidden = !options.details?.length;
    modal.details.closest(".modal").classList.toggle("modal-instructions", Boolean(options.details?.length));
    setModalArt(options.art);
    setModalScores(options.scores);
    setButtonContent(modal.primary, options.primaryLabel || "Continue", options.primaryIcon);
    modal.secondary.textContent = options.secondaryLabel || "Back";
    modal.secondary.hidden = !options.onSecondary;
    modal.close.hidden = options.dismissible === false;
    modalHandlers = options;
    modal.overlay.hidden = false;
    document.body.classList.add("modal-open");
    requestAnimationFrame(() => modal.overlay.classList.add("visible"));
    modal.primary.focus();
}

function setModalArt(source) {
    modal.art.hidden = !source;
    if (source) modal.art.src = source;
    else modal.art.removeAttribute("src");
}

function setButtonContent(button, label, iconName) {
    button.replaceChildren();
    if (iconName) {
        const icon = document.createElement("i");
        icon.dataset.lucide = iconName;
        button.appendChild(icon);
    }
    button.append(label);
    window.lucide?.createIcons();
}

export function setModalScores(scores) {
    modal.score.hidden = !scores;
    if (!scores) return;
    modal.xScore.textContent = scores.X;
    modal.oScore.textContent = scores.O;
}

export function setModalMessage(message) {
    modal.message.textContent = message;
}

export function closeModal() {
    modal.overlay.classList.remove("visible");
    document.body.classList.remove("modal-open");
    modalHandlers = {};
    window.setTimeout(() => { modal.overlay.hidden = true; }, 180);
}

modal.primary.addEventListener("click", () => modalHandlers.onPrimary?.());
modal.secondary.addEventListener("click", () => modalHandlers.onSecondary?.());
modal.close.addEventListener("click", () => {
    if (modalHandlers.dismissible !== false) {
        closeModal();
    }
});
modal.overlay.addEventListener("click", (event) => {
    if (event.target === modal.overlay && modalHandlers.dismissible !== false) {
        closeModal();
    }
});

export function toast(message, options = {}) {
    const element = elements.toast;
    window.clearTimeout(toastTimer);
    const type = options.type === "chat" ? "chat" : "system";
    const side = options.side === "right" ? "right" : "left";
    element.classList.remove("toast-system", "toast-chat", "toast-left", "toast-right", "visible");
    element.classList.add(`toast-${type}`);
    if (type === "chat") element.classList.add(`toast-${side}`);
    element.textContent = message;
    element.hidden = false;
    requestAnimationFrame(() => element.classList.add("visible"));
    toastTimer = window.setTimeout(() => {
        element.classList.remove("visible");
        window.setTimeout(() => { element.hidden = true; }, 200);
    }, 2200);
}
