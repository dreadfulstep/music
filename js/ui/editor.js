import { state } from "../state.js";
import { engine } from "../audio/engine.js";
import { renderTimeline } from "../timeline.js";

/** @typedef {import("../state.js").Note} Note */
/** @typedef {import("../state.js").Track} Track */

/**
 * @typedef {Object} EditorField
 * @property {string} key
 * @property {string} label
 * @property {"choice"|"number"} type
 * @property {string[]} [options]
 * @property {number} [min]
 * @property {number} [max]
 * @property {number} [step]
 * @property {string} [unit]
 */

/** @type {Record<string, string>} */
const TAB_ICONS = {
  timeline: "bar-chart-2",
  preset: "sliders-horizontal",
  custom: "cpu",
  settings: "settings",
};

export class EditorModal {
  constructor() {
    /** @type {HTMLDialogElement|null} */
    this.dialog = null;
    /** @type {HTMLElement|null} */
    this.contentEl = null;
    /** @type {HTMLElement[]} */
    this.tabEls = [];
    this.activeTab = 0;
    this.opened = false;

    this.selectedNoteIndex = 0;
    this.selectedPresetIndex = 0;
    this.selectedCustomField = 0;
    this.selectedSettingIndex = 0;

    /** @type {Record<string, string|number>} */
    this.customValues = {
      oscType: "sawtooth",
      attack: 0.05,
      decay: 0.3,
      sustain: 0.5,
      release: 1.0,
    };

    this.settingsFields = [
      {
        id: "theme",
        label: "Theme",
        value: "dark",
        options: ["dark", "light"],
      },
    ];

    this._boundKey = this._handleKey.bind(this);
    this._tabs = [
      { id: "timeline", label: "Timeline" },
      { id: "preset", label: "Preset" },
      { id: "custom", label: "Custom Synth" },
      { id: "settings", label: "Settings" },
    ];
  }

  _ensureCreated() {
    if (this.dialog) return;

    this.dialog = document.createElement("dialog");
    this.dialog.classList = "editor-modal";
    this.dialog.innerHTML = `
        <div class="editor-layout">
            <aside class="editor-sidebar">
                <div class="editor-sidebar-title">Editor</div>
                <nav class="editor-tabs"></nav>
                <div class="editor-hint">
                    <div><span>Tabs</span><kbd>W/S</kbd></div>
                    <div><span>List</span><kbd>↑/↓</kbd></div>
                    <div><span>Adjust</span><kbd>A/D</kbd></div>
                    <div><span>Apply</span><kbd>Enter</kbd></div>
                    <div><span>Close</span><kbd>Esc</kbd></div>
                </div>
            </aside>
            <main class="editor-content"></main>
        </div>
    `;

    const nav = this.dialog.querySelector(".editor-tabs");
    if (!nav) return;
    this._tabs.forEach((t, i) => {
      const btn = document.createElement("button");
      btn.className = "editor-tab";
      btn.dataset.index = String(i);
      btn.innerHTML = `<i data-lucide="${TAB_ICONS[t.id]}"></i><span>${t.label}</span>`;
      nav.appendChild(btn);
    });

    this.tabEls = Array.from(nav?.querySelectorAll(".editor-tab"));
    this.contentEl = this.dialog.querySelector(".editor-content");
    document.body.appendChild(this.dialog);
  }

  open() {
    this._ensureCreated();
    this.opened = true;
    this.activeTab = 0;
    this.selectedNoteIndex = 0;
    this.selectedPresetIndex = 0;
    this.customValues;
    this.selectedSettingIndex = 0;
    this._loadCustomFromCurrent();
    this._render();
    this.dialog?.showModal();
    window.addEventListener("keydown", this._boundKey);
    // @ts-ignore
    if (window.lucide) lucide.createIcons();
  }

  close() {
    this.opened = false;
    this.dialog?.close();
    window.removeEventListener("keydown", this._boundKey);
  }

  isOpen() {
    return this.opened;
  }

  /** @param {KeyboardEvent} e */
  _handleKey(e) {
    if (e.key === "Escape" || e.key === "x" || e.key === "X") {
      e.preventDefault();
      this.close();
      return;
    }

    const tab = this._tabs[this.activeTab].id;

    const lowerKey = e.key.toLowerCase();
    if (lowerKey === "w" && !e.shiftKey) {
      e.preventDefault();
      this.activeTab =
        (this.activeTab - 1 + this._tabs.length) % this._tabs.length;
      this._render();
      return;
    }
    if (lowerKey === "s" && !e.shiftKey) {
      e.preventDefault();
      this.activeTab = (this.activeTab + 1) % this._tabs.length;
      this._render();
      return;
    }

    if (tab === "timeline") this._handleTimelineKey(e);
    else if (tab === "preset") this._handlePresetKey(e);
    else if (tab === "custom") this._handleCustomKey(e);
    else if (tab === "settings") this._handleSettingsKey(e);
  }

  /** @param {string} pitch */
  _pitchToSemitone(pitch) {
    const notes = [
      "C",
      "C#",
      "D",
      "D#",
      "E",
      "F",
      "F#",
      "G",
      "G#",
      "A",
      "A#",
      "B",
    ];
    const match = pitch.match(/^([A-G]#?)(\d)$/);
    if (!match) return 0;
    const [, name, oct] = match;
    return (parseInt(oct) - 3) * 12 + notes.indexOf(name);
  }

  /** @param {number} semitone */
  _semitoneToPitch(semitone) {
    const notes = [
      "C",
      "C#",
      "D",
      "D#",
      "E",
      "F",
      "F#",
      "G",
      "G#",
      "A",
      "A#",
      "B",
    ];
    const octave = Math.floor(semitone / 12) + 3;
    const note = notes[((semitone % 12) + 12) % 12];
    return note + octave;
  }

  /** @param {KeyboardEvent} e */
  _handleTimelineKey(e) {
    const track = state.tracks[state.currentTrack];
    const notes = track.notes || [];
    const note =
      notes.length > 0 &&
      this.selectedNoteIndex >= 0 &&
      this.selectedNoteIndex < notes.length
        ? notes[this.selectedNoteIndex]
        : null;

    if (e.key === "ArrowUp") {
      e.preventDefault();
      this.selectedNoteIndex = Math.max(0, this.selectedNoteIndex - 1);
      this._renderTimeline();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      this.selectedNoteIndex = Math.min(
        notes.length - 1,
        this.selectedNoteIndex + 1,
      );
      this._renderTimeline();
      return;
    }

    // Move a note or whatever
    if ((e.key === "ArrowLeft" || e.key.toLowerCase() === "a") && !e.shiftKey) {
      e.preventDefault();
      if (note) {
        note.start = Math.max(0, note.start - 0.25);
        this._renderTimeline();
        renderTimeline();
      }
      return;
    }

    if (
      (e.key === "ArrowRight" || e.key.toLowerCase() === "d") &&
      !e.shiftKey
    ) {
      e.preventDefault();
      if (note) {
        note.start += 0.25;
        this._renderTimeline();
        renderTimeline();
      }
      return;
    }

    if ((e.key === "Arrowleft" || e.key.toLowerCase() === "a") && e.shiftKey) {
      e.preventDefault();
      if (note) {
        note.duration = Math.max(0.0625, note.duration - 0.25);
        this._renderTimeline();
        renderTimeline();
      }
      return;
    }

    if ((e.key === "ArrowRight" || e.key.toLowerCase() === "d") && e.shiftKey) {
      e.preventDefault();
      if (note) {
        note.duration += 0.25;
        this._renderTimeline();
        renderTimeline();
      }
      return;
    }

    // change pitch
    if (e.key === "[" || e.key.toLowerCase() === "q") {
      e.preventDefault();
      if (note) {
        const s = this._pitchToSemitone(note.pitch);
        note.pitch = this._semitoneToPitch(Math.max(0, s - 1));
        this._renderTimeline();
        renderTimeline();
      }
      return;
    }

    if (e.key === "]" || e.key.toLowerCase() === "e") {
      e.preventDefault();
      if (note) {
        const s = this._pitchToSemitone(note.pitch);
        note.pitch = this._semitoneToPitch(Math.min(24, s + 1));
        this._renderTimeline();
        renderTimeline();
      }
      return;
    }

    if (e.key.toLowerCase() === "n") {
      e.preventDefault();
      const last = notes[notes.length - 1];
      const start = last ? last.start + last.duration : 0;
      track.notes.push({ pitch: "C4", start, duration: 0.5 });
      this.selectedNoteIndex = notes.length - 1;
      this._renderTimeline();
      renderTimeline();
      return;
    }

    if (e.key == "Delete" || e.key === "Backspace") {
      e.preventDefault();
      if (notes[this.selectedNoteIndex]) {
        notes.splice(this.selectedNoteIndex, 1);
        this.selectedNoteIndex = Math.min(
          this.selectedNoteIndex,
          notes.length - 1,
        );
        this._renderTimeline();
        renderTimeline();
      }
      return;
    }
  }

  /** @param {KeyboardEvent} e */
  _handlePresetKey(e) {
    const presets = Object.keys(engine.presets);
    if (e.key === "ArrowUp" || e.key.toLowerCase() === "w") {
      e.preventDefault();
      this.selectedPresetIndex = Math.max(0, this.selectedPresetIndex - 1);
      this._renderPreset();
      return;
    }
    if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") {
      e.preventDefault();
      this.selectedPresetIndex = Math.min(
        presets.length - 1,
        this.selectedPresetIndex + 1,
      );
      this._renderPreset();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const name = presets[this.selectedPresetIndex];
      if (name) {
        engine.setPreset(state.currentTrack, name);
        this._renderPreset();
      }
      return;
    }
  }

  /** @param {KeyboardEvent} e */
  _handleCustomKey(e) {
    /** @type {EditorField[]} */
    const fields = [
      {
        key: "oscType",
        label: "Oscillator",
        type: "choice",
        options: [
          "sine",
          "square",
          "sawtooth",
          "triangle",
          "fmsine",
          "fmsquare",
          "fmtriangle",
          "amsine",
        ],
      },
      {
        key: "attack",
        label: "Attack",
        type: "number",
        min: 0.001,
        max: 2,
        step: 0.01,
      },
      {
        key: "decay",
        label: "Decay",
        type: "number",
        min: 0.001,
        max: 2,
        step: 0.01,
      },
      {
        key: "sustain",
        label: "Sustain",
        type: "number",
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        key: "release",
        label: "Release",
        type: "number",
        min: 0.001,
        max: 5,
        step: 0.05,
      },
    ];

    if (e.key === "ArrowUp" || e.key.toLowerCase() === "w") {
      e.preventDefault();
      this.selectedCustomField = Math.max(0, this.selectedCustomField - 1);
      this._renderCustom();
      return;
    }

    if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") {
      e.preventDefault();
      this.selectedCustomField = Math.min(
        fields.length - 1,
        this.selectedCustomField + 1,
      );
      this._renderCustom();
      return;
    }

    const field = fields[this.selectedCustomField];
    if (!field) return;

    if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
      e.preventDefault();
      if (field.type === "number") {
        const val = /** @type {number} */ (this.customValues[field.key]);
        const min = /** @type {number} */ (field.min);
        const step = /** @type {number} */ (field.step);
        this.customValues[field.key] = Math.max(min, +(val - step).toFixed(3));
        this._applyCustom();
      } else if (field.type === "choice" && field.options) {
        const val = /** @type {string} */ (this.customValues[field.key]);
        const idx = field.options.indexOf(val);
        this.customValues[field.key] =
          field.options[
            (idx - 1 + field.options.length) % field.options.length
          ];
        this._applyCustom();
      }
      this._renderCustom();
      return;
    }
    if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
      e.preventDefault();
      if (field.type === "number") {
        const val = /** @type {number} */ (this.customValues[field.key]);
        const max = /** @type {number} */ (field.max);
        const step = /** @type {number} */ (field.step);
        this.customValues[field.key] = Math.min(max, +(val + step).toFixed(3));
        this._applyCustom();
      }
      if (field.type === "choice" && field.options) {
        const val = /** @type {string} */ (this.customValues[field.key]);
        const idx = field.options.indexOf(val);
        this.customValues[field.key] =
          field.options[(idx + 1) % field.options.length];
        this._applyCustom();
      }
      this._renderCustom();
      return;
    }
  }

  /** @param {KeyboardEvent} e */
  _handleSettingsKey(e) {
    if (e.key === "ArrowUp" || e.key.toLowerCase() === "w") {
      e.preventDefault();
      this.selectedSettingIndex = Math.max(0, this.selectedSettingIndex - 1);
      this._renderSettings();
      return;
    }
    if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") {
      e.preventDefault();
      this.selectedSettingIndex = Math.min(
        this.settingsFields.length - 1,
        this.selectedSettingIndex + 1,
      );
      this._renderSettings();
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const field = this.settingsFields[this.selectedSettingIndex];
      if (field.id === "theme") {
        const idx = field.options.indexOf(field.value);
        field.value = field.options[(idx + 1) % field.options.length];
        document.documentElement.setAttribute("data-theme", field.value);
        this._renderSettings();
      }
      return;
    }
  }

  _loadCustomFromCurrent() {
    const track = state.tracks[state.currentTrack];
    /** @type {Record<string, any>} */
    const presets = engine.presets;
    const preset = presets[track?.preset];
    if (preset) {
      this.customValues.oscType = preset.oscillator?.type || "sawtooth";
      this.customValues.attack = preset.envelope?.attack || 0.05;
      this.customValues.decay = preset.envelope?.decay || 0.3;
      this.customValues.sustain = preset.envelope?.sustain || 0.5;
      this.customValues.release = preset.envelope?.release || 1.0;
    }
  }

  _applyCustom() {
    const synth = engine.synths.get(state.currentTrack);
    if (!synth) return;
    synth.set({
      oscillator: { type: this.customValues.oscType },
      envelope: {
        attack: this.customValues.attack,
        decay: this.customValues.decay,
        sustain: this.customValues.sustain,
        release: this.customValues.release,
      },
    });
  }

  _render() {
    this.tabEls.forEach((el, i) =>
      el.classList.toggle("active", i === this.activeTab),
    );
    const tab = this._tabs[this.activeTab].id;
    if (tab === "timeline") this._renderTimeline();
    else if (tab === "preset") this._renderPreset();
    else if (tab === "custom") this._renderCustom();
    else if (tab === "settings") this._renderSettings();
  }

  /** @param {Track} track @param {Note[]} notes */
  _drawTimelineCanvas(track, notes) {
    /** @type {HTMLCanvasElement | null} */ // I actually despise jsdoc and types but i dont want so many errors holy moly
    const canvas = /** @type {any} */ (document.getElementById("editor-timeline-canvas"));
    const wrap = canvas?.parentElement;
    if (!canvas || !wrap) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = wrap.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--background")
        .trim() || "#0a0a0c";
    ctx.fillRect(0, 0, w, h);

    const semitones = 25;
    const rowH = h / semitones;
    const ppb = 60;
    let maxBeat = 16;
    notes.forEach((n) => {
      maxBeat = Math.max(maxBeat, n.start + n.duration);
    });

    ctx.strokeStyle =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--border")
        .trim() || "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= maxBeat; i++) {
      const x = i * ppb;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    const noteNames = [
      "C",
      "C#",
      "D",
      "D#",
      "E",
      "F",
      "F#",
      "G",
      "G#",
      "A",
      "A#",
      "B",
    ];
    for (let i = 0; i <= semitones; i++) {
      const y = i * rowH;
      const ni = i % 12;
      const isNatural =
        ni === 0 || ni === 2 || ni === 5 || ni === 7 || ni === 9 || ni === 11;
      ctx.strokeStyle = isNatural
        ? "rgba(255,255,255,0.04"
        : "rgba(255,255,255,0.08)";
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    notes.forEach((note, i) => {
      const x = note.start * ppb;
      const nw = Math.max(4, note.duration * ppb);
      const match = note.pitch.match(/^([A-G]#?)(\d)$/);
      let y = h / 2;
      if (match) {
        const semi =
          (parseInt(match[2]) - 3) * 12 + noteNames.indexOf(match[1]);
        y = h - (semi + 1) * rowH;
      }
      const nh = rowH - 1;

      const isSelected = i === this.selectedNoteIndex;
      ctx.fillStyle = track.color;
      ctx.globalAlpha = isSelected ? 0.95 : 0.55;
      ctx.fillRect(x + 0.5, y + 0.5, nw - 1, nh - 1);
      ctx.globalAlpha = 1;

      if (isSelected) {
        ctx.strokeStyle =
          getComputedStyle(document.documentElement)
            .getPropertyValue("--foreground")
            .trim() || "#fff";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 0.5, y + 0.5, nw - 1, nh - 1);
      }
    });
  }

  _renderTimeline() {
    if (!this.contentEl) return;
    const track = state.tracks[state.currentTrack];
    const notes = track?.notes || [];
    let html = `<div class="editor-panel-header"><h2>${track?.name || "Track"}</h2><span class="editor-panel-meta">${notes.length} notes</span></div>`;
    html += `<div class="editor-timeline-wrap"><canvas class="editor-timeline-canvas" id="editor-timeline-canvas"></canvas></div>`;
    html += `<div class="editor-footer">>↑/↓ select · ←/→ move · Shift+←/→ resize · [ ] pitch · N new · Del delete</div>`;
    this.contentEl.innerHTML = html;
    requestAnimationFrame(() => this._drawTimelineCanvas(track, notes));
  }

  _renderPreset() {
    if (!this.contentEl) return;
    const presets = Object.keys(engine.presets);
    const current = state.tracks[state.currentTrack]?.preset;
    let html = `<div class="editor-panel-title">Select Preset</div><div class="editor-list">`;
    presets.forEach((name, i) => {
      const sel = i === this.selectedPresetIndex ? " selected" : "";
      const badge =
        name === current ? `<span class="editor-row-badge">active</span>` : "";
      html += `<div class="editor-row${sel}"><span>${name}</span>${badge}</div>`;
    });
    html += `</div><div class="editor-hint-row">↑/↓ navigate · Enter apply</div>`;
    this.contentEl.innerHTML = html;
  }

  _renderCustom() {
    if (!this.contentEl) return;
    /** @type {EditorField[]} */
    const fields = [
      { key: "oscType", label: "Oscillator", type: "choice" },
      { key: "attack", label: "Attack", type: "number", unit: "s" },
      { key: "decay", label: "Decay", type: "number", unit: "s" },
      { key: "sustain", label: "Sustain", type: "number", unit: "" },
      { key: "release", label: "Release", type: "number", unit: "s" },
    ];
    let html = `<div class="editor-panel-title">Custom Synth</div><div clas="editor-list">`;
    fields.forEach((f, i) => {
      const sel = i === this.selectedCustomField ? " selected" : "";
      const val =
        f.type === "number"
          ? /** @type {number} */ (this.customValues[f.key]).toFixed(3)
          : this.customValues[f.key];
      html += `<div class="editor-row${sel}"><span>${f.label}</span><span class="editor-row-value">${val}${f.unit || ""}</span></div>`;
    });
    html += `</div><div class="editor-hint-row">↑/↓ select · A/D adjust</div>`;
    this.contentEl.innerHTML = html;
  }

  _renderSettings() {
    if (!this.contentEl) return;
    let html = `<div class="editor-panel-title">Settings</div><div class="editor-list">`;
    this.settingsFields.forEach((f, i) => {
      const sel = i === this.selectedSettingIndex ? " selected" : "";
      html += `<div class="editor-row${sel}"><span>${f.label}</span><span class="editor-row-value">${f.value}</span></div>`;
    });
    html += `</div><div class="editor-hint-row">Enter / Space to toggle</div>`;
    this.contentEl.innerHTML = html;
  }
}

export const editorModal = new EditorModal();
