import { state } from "./state.js";
import { renderTimeline } from "./timeline.js";

const LS_PROJECTS = "midia.projects.v1";
const LS_LAST = "midia.lastProject";

class ProjectManager {
    constructor() {
        this.overlay = document.getElementById("start-overlay");
        this.modal = document.getElementById("project-modal");
        /** @type {Record<string, any>} */
        this.projects = {};
        /** @type {string[]} */
        this.rows = [];
        this.sel = 0;
        this.naming = false;
        this.newName = "";
        /** @type {string|null} */
        this.current = null;
        this._baseline = "";
        /** @type {Map<number, string>} */ // trackId to dataUrl
        this._audioCache = new Map();
        this._bound = this._onKey.bind(this);
        this._fileInput = null;
    }

    isOpen() {
        return !!this.overlay && this.overlay.style.display === "flex";
    }

    _read() {
        try {
            this.projects = JSON.parse(localStorage.getItem(LS_PROJECTS) || "{})");
        } catch {
            this.projects = {};
        };
    }

    _write() {
        try {
            localStorage.setItem(LS_PROJECTS, JSON.stringify(this.projects));
        } catch(e) {
            console.warn(`Project save failed`, e)
        }
    }

    show() {
        this._read();
        this.naming = false;
        this.sel = 0;
        this._render();
        if (this.overlay) this.overlay.style.display = "flex";
        window.addEventListener("keydown", this._bound);
    }

    hide() {
        if (this.overlay) this.overlay.style.display = "none";
        window.removeEventListener("keydown", this._bound);
    }

    /** True when a project is loaded and past boot screen */
    get active() {
        return !!this.current && !this.isOpen();
    }

    _render() {
        if (!this.modal) return;
        const names = Object.keys(this.projects).sort((a, b) => (this.projects[b].updatedAt || 0) - (this.projects[a].updatedAt || 0));
        this.rows = [...names, "__new", "__import"];
        this.sel = Math.max(0, Math.min(this.sel, this.rows.length - 1));
    }
}