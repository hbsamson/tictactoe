import { BaseComponent } from "./base-component.js";

export class ToastBar extends BaseComponent {
    initializeElements() {
        this.container = document.createElement("div");
    }

    setAttributes() {
        this.container.id = "toast";
        this.container.className = "toast";
        this.container.setAttribute("role", "status");
        this.container.setAttribute("aria-live", "polite");
        this.container.hidden = true;
    }

    appendElements() {}
}
