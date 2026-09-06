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
      this.projects = JSON.parse(localStorage.getItem(LS_PROJECTS) || "{}");
    } catch {
      this.projects = {};
    }
  }

  _write() {
    try {
      localStorage.setItem(LS_PROJECTS, JSON.stringify(this.projects));
    } catch (e) {
      console.warn(`Project save failed`, e);
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
    const names = Object.keys(this.projects).sort(
      (a, b) =>
        (this.projects[b].updatedAt || 0) - (this.projects[a].updatedAt || 0),
    );
    this.rows = [...names, "__new", "__import"];

    const last = localStorage.getItem(LS_LAST);
    if (!this._touched) {
        const li = last ? names.indexOf(last) : 0;
        this.sel = li >= 0 ? li : 0;
        this._touched = true;
    }
    this.sel = Math.max(0, Math.min(this.sel, this.rows.length - 1));

    let html = `
            <div class="modal-header">
                <span class="modal-title"><i data-lucide="audio-lines" style="width:16px;height:16px;vertical-align:-3px;"></i>Midia</span>
                <span class="modal-meta">${names.length} project${names.length === 1 ? "" :"s"}</span>
            </div>
            <div class="modal-body project-body">`;

    if (names.length === 0) {
        html += `<div class="project-empty">No projects yet.<br/>Press <kbd>N</kbd> to create your first one.</div>`
    }

    names.forEach((n, i) => {
      const p = this.projects[n];
      const bpm = typeof p.bpm === "number" ? ` · ${p.bpm} BPM` : "";
      const meta = `${(p.tracks || []).length} tracks · ${p.updatedAt ? new Date(p.updatedAt).toLocaleString() : "—"}`;
      const sel = i === this.sel ? " selected" : "";
      const badge = n === last ? `<span class="project-badge">last</span>` : ""
      html += `
        <div class="modal-row${sel}">
            <i data-lucide="folder" class="project-icon"></i>
            <span class="modal-label">${n}${badge}</span>
            <span class="modal-meta">${meta}</span>
        </div>`;
      if (i < names.length - 1) html += `<div class="editor-divider"></div>`;
    });

    if (names.length) html += `<div class="editor-divider"></div>`
    const newSel = this.sel === names.length ? " selected" : "";
    const impSel = this.sel === names.length + 1 ? " selected" : "";
    html += `<div class="modal-row${newSel} project-action"><i data-lucide="plus" class="project-icon"></i><span class="modal-label">New Project</span></div>`;
    html += `<div class="modal-row${impSel}"><i data-lucide="upload" class="project-icon"></i><span class="modal-label">Import JSON...</span></div>`;

    if (this.naming) {
      html += `<div class="editor-divider"></div>`;
      html += `<div class="modal-row selected"><i data-lucide="file-pen" class="project-icon"></i><span class="modal-label">Name</span><span class="editor-row-value">${this.newName}▌</span></div>`;
    }

    html += `</div>`;
    html += `<div class="project-hint"><kbd>↑</kbd><kbd>↓</kbd> select · <kbd>Enter</kbd> open · <kbd>N</kbd> new · <kbd>I</kbd> import · <kbd>Del</kbd> delete</div>`;
    this.modal.innerHTML = html;
    // @ts-ignore
    if (window.lucide) lucide.createIcons();
  }

  /** @param {KeyboardEvent} e */
  _onKey(e) {
    e.preventDefault();
    e.stopPropagation();

    if (this.naming) {
      if (e.key === "Escape") {
        this.naming = false;
        this._render();
        return;
      }
      if (e.key === "Backspace") {
        this.newName = this.newName.slice(0, -1);
        this._render();
        return;
      }
      if (e.key === "Enter") {
        const name = this._unique(this.newName.trim() || "Untitled Project");
        const data = this._fresh(name);
        this.projects[name] = { ...data, updatedAt: Date.now() };
        this._write();
        this._apply(data, name);
        return;
      }
      if (/^[a-zA-Z0-9_\- ]$/.test(e.key) && e.key.length === 1) {
        this.newName += e.key;
        this._render();
      }
      return;
    }

    if (e.key === "ArrowUp" || e.key.toLowerCase() === "w") {
      if (this.sel > 0) this.sel--;
      this._render();
      return;
    }
    if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") {
      if (this.sel < this.rows.length - 1) this.sel++;
      this._render();
      return;
    }
    if (e.key.toLowerCase() === "n") {
      this.naming = true;
      this.newName = `Project ${Object.keys(this.projects).length + 1}`;
      this._render();
      return;
    }
    if (e.key.toLowerCase() === "i") {
      this._pickFile();
      return;
    }
    if (e.key === "Delete" || e.key === "Backspace") {
      const row = this.rows[this.sel];
      if (row && !row.startsWith("__")) {
        delete this.projects[row];
        if (localStorage.getItem(LS_LAST) === row)
          localStorage.removeItem(LS_LAST);
        this._write();
        this.sel = Math.max(0, this.sel - 1);
        this._render();
      }
      return;
    }
    if (e.key === "Enter") {
      const row = this.rows[this.sel];
      if (row === "__new") {
        this.naming = true;
        this.newName = `Project ${Object.keys(this.projects).length + 1}`;
        this._render();
      } else if (row === "__import") {
        this._pickFile();
      } else if (row) {
        this._apply(this.projects[row], row);
      }
    }
  }

  _pickFile() {
    if (!this._fileInput) {
      const fi = document.createElement("input");
      fi.type = "file";
      fi.accept = ".json,application/json";
      fi.style.display = "none";
      document.body.appendChild(fi);
      fi.addEventListener("change", async () => {
        const file = fi.files?.[0];
        if (!file) return;
        try {
          const data = await JSON.parse(await file.text());
          const name = this._unique(
            (typeof data.name === "string" && data.name.trim()) ||
              file.name.replace(/\.[^/.]+$/, ""),
          );
          const clean = this._sanitize(data, name);
          this.projects[name] = { ...clean, updatedAt: Date.now() };
          this._write();
          fi.value = "";
          this._apply(clean, name);
        } catch (err) {
          console.error("Import failed", err);
        }
      });
      this._fileInput = fi;
    }
    this._fileInput.click();
  }

  /** @param {string} name */
  _unique(name) {
    let n = name;
    let i = 2;
    while (this.projects[n]) n = `${name} ${i++}`;
    return n;
  }

  /** @param {string} name */
  _fresh(name) {
    return {
      version: 1,
      name,
      bpm: 128,
      customPresets: {},
      tracks: [],
    };
  }

  /** @param {any} data @param {string} name */
  _sanitize(data, name) {
    // @ts-ignore
    const tracks = Array.isArray(data.tracks) ? data.tracks.filter((t) => t && typeof t === "object" && typeof t.id === "number" && typeof t.name === "string",).map((t) => ({
        ...t, notes: Array.isArray(t.notes) ? t.notes : [],
        muted: !!t.muted,
        loop: !!t.loop,
        type: t.type === "audio" ? "audio" : "synth",
        color: typeof t.color === "string" ? t.color : "#4ecdc4",
        preset: typeof t.preset === "string"? t.preset : "pluck",
    })) : [];
    return {
      version: 1,
      name,
      bpm: typeof data.bpm === "number" ? data.bpm : 128,
      customPresets: data.customPresets || {},
      tracks,
    };
  }

  /** @param {boolean} [syncOnly] skip uncached blob to dataUrl conversions */
  _snapshot(syncOnly = false) {
    return {
      version: 1,
      name: this.current,
      bpm: state.bpm,
      customPresets: state.customPresets,
      tracks: state.tracks.map((t) => {
        const cached = this._audioCache.get(t.id);
        if (cached) return { ...t, audioUrl: cached };
        if (syncOnly && t.audioUrl && t.audioUrl.startsWith("blob:"))
          return { ...t, audioUrl: "" };
        return { ...t };
      }),
    };
  }

  /** @param {any} data @param {string} name */
  _apply(data, name) {
    const clean = this._sanitize(data, name);
    state.bpm = clean.bpm;
    state.tracks = clean.tracks;
    state.customPresets = clean.customPresets;
    state.currentTrack = 0;
    state.isPlaying = false;
    state.isRecording = false;
    state.isCountingIn = false;

    this._audioCache.clear();
    state.tracks.forEach((t) => {
      if (t.type === "audio" && t.audioUrl && t.audioUrl.startsWith("data:"))
        this._audioCache.set(t.id, t.audioUrl);
    });

    // @ts-ignore
    if (window.Tone) window.Tone.Transport.bpm.value = state.bpm;
    const bpmEl = document.getElementById("bpm-display");
    if (bpmEl) bpmEl.textContent = String(state.bpm);
    const verEl = document.querySelector(".version");
    if (verEl) verEl.textContent = `v1.0.0 · ${name}`;
    document.title = `${name} — Midia`;

    this.current = name;
    localStorage.setItem(LS_LAST, name);
    this.hide();
    renderTimeline();
    this._updateDisplays();
    this.save(true); // persist immediately, converts audio blobs in background
    this._startAutosave();
  }

  _updateDisplays() {
    const t = state.tracks[state.currentTrack];
    const trackEl = document.getElementById("track-display");
    const presetEl = document.getElementById("preset-display");
    if (trackEl) trackEl.textContent = t ? `${t.id + 1}. ${t.name}` : "-";
    if (presetEl) presetEl.textContent = t ? t.preset : "-";
  }

  _startAutosave() {
    if (this._autosave) return;
    this._autosave = setInterval(() => this._maybeAutosave(), 4000);
    window.addEventListener("beforeunload", () => {
      if (!this.current) return;
      const prev = this.projects[this.current];
      const data = this._snapshot(true);
      const tracks = data.tracks.map((t, i) =>
        t.audioUrl ? t : { ...t, audioUrl: (prev?.tracks?.[i] || t).audioUrl },
      );
      this.projects[this.current] = { ...data, tracks, updatedAt: Date.now() };
      this._write();
    });
  }

  _maybeAutosave() {
    if (!this.current || this.isOpen()) return;
    const snap = JSON.stringify(this._snapshot(true));
    if (snap === this._baseline) return;
    this.save(true);
  }

  /** @param {boolean} [silent] */
  async save(silent = false) {
    if (!this.current) return;
    for (const t of state.tracks) {
      if (t.type !== "audio" || !t.audioUrl) continue;
      if (t.audioUrl.startsWith("data:")) {
        this._audioCache.set(t.id, t.audioUrl);
        continue;
      }
      if (this._audioCache.has(t.id) || !t.audioUrl.startsWith("blob:")) {
        continue;
      }
      try {
        const blob = await (await fetch(t.audioUrl)).blob();
        this._audioCache.set(t.id, await this._toDataURL(blob));
      } catch (e) {
        console.warn(`Could not persist audio for track`, t.name, e);
      }
    }
    const prev = this.projects[this.current];
    const data = this._snapshot(true);
    const tracks = data.tracks.map((t, i) =>
      t.audioUrl ? t : { ...t, audioUrl: (prev?.tracks?.[i] || t).audioUrl },
    );
    this.projects[this.current] = { ...data, tracks, updatedAt: Date.now() };
    this._write();
    this._baseline = JSON.stringify({ ...data, tracks });
    if (!silent) console.log("Project saved:", this.current);
  }

  /** @param {Blob} blob */
  _toDataURL(blob) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(/** @type {string} */ (r.result));
      r.onerror = rej;
      r.readAsDataURL(blob);
    });
  }

  async exportJSON() {
    await this.save(true);
    // @ts-ignore
    const data = this.projects[this.current] || this._snapshot(true);
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${this.current || "project"}.midia.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const projectManager = new ProjectManager();
