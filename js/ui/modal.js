import { input } from "../input.js";

// @ts-ignore
class Modal {
    constructor() {
        this.dialog = null;
        this.titleEl = null;
        this.bodyEl = null;
    }

    _ensureCreated() {
        if (this.dialog) return;

        this.dialog = document.createElement("dialog");
        this.dialog.className = "modal";

        this.dialog.innerHTML = `
            <div class="modal-header">
                <span class="modal-title"></span>
                <button class="modal-close" tabindex="-1">&times;</button>
            </div>
            <div class="modal-body"></div>
        `;

        this.titleEl = this.dialog.querySelector('.modal-title');
        this.bodyEl = this.dialog.querySelector('.modal-body');

        input.onKey("x", () => { this.close(); });
        input.onKey("escape", () => { this.close(); });

        document.body.appendChild(this.dialog);
    };

    /**
     * @param {string} title
     * @param {(arg0: Element | null) => void} renderFn
     */
    open(title, renderFn) {
        this._ensureCreated();
        if (this.titleEl) this.titleEl.textContent = title || '';
        if (this.bodyEl) this.bodyEl.innerHTML = '';
        if (renderFn) renderFn(this.bodyEl);
        this.dialog?.showModal();
    };

    close() {
        if (!this.dialog) return;
        this.dialog.close();
    };

    isOpen() {
        return this.dialog?.open;
    };
}

export const modal = new Modal();