export class BaseComponent {
    constructor() {
        this.initializeElements();
        this.setAttributes();
        this.appendElements();
    }

    initializeElements() {}
    setAttributes() {}
    appendElements() {}

    render(target) {
        const parent = typeof target === "string" ? document.getElementById(target) : target;
        if (!parent) {
            console.error("Target element not found");
            return null;
        }
        parent.append(this.container);
        return this.container;
    }
}
