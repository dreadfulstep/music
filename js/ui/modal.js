/**
 * @typedef {Object} ModalItem
 * @property {string} label
 * @property {any} [value]
 * @property {string} [meta]
 * @property {string} [color]
 */
class Modal {
  constructor() {
    this.dialog = null;
    this.titleEl = null;
    this.bodyEl = null;
    /** @type {ModalItem[]} */
    this.items = [];
    this.selectedIndex = 0;
    /** @type {((item: ModalItem ) => void)|null} */
    this.onSelect = null;
    this._boundKey = this._handleKey.bind(this);
  }

  _ensureCreated() {
    if (this.dialog) return;

    this.dialog = document.createElement("dialog");
    this.dialog.className = "modal";

    this.dialog.innerHTML = `
            <div class="modal-header">
                <span class="modal-title"></span>
                <button class="modal-close" tabindex="-1">ESC</button>
            </div>
            <div class="modal-body"></div>
        `;

    this.titleEl = this.dialog.querySelector(".modal-title");
    this.bodyEl = this.dialog.querySelector(".modal-body");

    document.body.appendChild(this.dialog);
  }

  /**
   * 
   * @param {KeyboardEvent} e 
   * @returns 
   */
  _handleKey(e) {
    if (e.key === "Escape") {
      this.close();
      return;
    };

    if (e.key === "ArrowDown") {
      e.preventDefault();
      this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
      this._updateSelection();
      return;
    };

    if (e.key === "ArrowUp") {
      e.preventDefault();
      this.selectedIndex = (this.selectedIndex - 1 + this.items.length) % this.items.length;
      this._updateSelection();
      return;
    };

    if (e.key === "Enter") {
      e.preventDefault();
      if (this.items[this.selectedIndex]) {
        this.onSelect?.(this.items[this.selectedIndex]);
        this.close();
      };
      return;
    }
  };

  _updateSelection() {
    const rows = this.dialog?.querySelectorAll(".modal-row");
    rows?.forEach((row, i) => {
      row.classList.toggle("selected", i === this.selectedIndex);
    });
  };

  /**
   * @param {string} title
   * @param {ModalItem[]} items
   * @param {((item: ModalItem) => void)|null} onSelect
   */
  open(title, items, onSelect) {
    this._ensureCreated();
    this.items = items;
    this.selectedIndex = 0;
    this.onSelect = onSelect;

    if (this.titleEl) this.titleEl.textContent = title || "";
    if (this.bodyEl) this.bodyEl.innerHTML = "";
    
    items.forEach((item, i) => {
      const row = document.createElement("div");
      row.className = "modal-row" + (i === 0 ? " selected" : "");

      if (item.color) {
        const dot = document.createElement("span");
        dot.className = "modal-dot";
        dot.style.background = item.color;
        row.appendChild(dot);
      };

      const label = document.createElement("span");
      label.className = "modal-label";
      label.textContent = item.label;
      row.appendChild(label);

      if (item.meta) {
        const meta = document.createElement("span");
        meta.className = "modal-meta";
        meta.textContent = item.meta;
        row.appendChild(meta);
      };

      this.bodyEl?.appendChild(row);
    });

    this.dialog?.showModal();
    window.addEventListener("keydown", this._boundKey);
  }

  close() {
    this.dialog?.close();
    window.removeEventListener("keydown", this._boundKey);
  }

  isOpen() {
    return this.dialog?.open || false;
  }
}

export const modal = new Modal();
