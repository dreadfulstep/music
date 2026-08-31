import { state } from "../state.js";
import { engine } from "../audio/engine.js";
import { renderTimeline } from "../timeline.js";

/** @type {Record<string, string>} */
const OSC_LABELS = {
  sine: "Sine",
  square: "Square",
  sawtooth: "Saw",
  triangle: "Tri",
  fmsine: "FM Sine",
  fmsquare: "FM Sq",
  fmtriangle: "FM Tri",
  amsine: "AM Sine",
  sine4: "Sine 4",
  sine8: "Sine8",
};

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
  synth: "sliders-horizontal",
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
    this.synthNavIndex = 0; // 0=preset, 1=custom toggle, 2+= paramas
    this.customEnabled = false;

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
        group: "Appearance",
        id: "theme",
        label: "Theme",
        value: "dark",
        options: ["dark", "light"],
        type: "choice",
      },
      {
        group: "Audio",
        id: "masterVolume",
        label: "Master Volume",
        value: 80,
        min: 0,
        max: 100,
        step: 5,
        type: "number",
        unit: "%",
      },
      {
        group: "Audio",
        id: "metronome",
        label: "Metronome",
        value: "off",
        options: ["off", "on"],
        type: "choice",
      },
      {
        group: "Project",
        id: "quantization",
        label: "Quantize Grid",
        value: "1/4",
        options: ["1/1", "1/2", "1/4", "1/8", "1/16"],
        type: "choice",
      },
    ];

    this._boundKey = this._handleKey.bind(this);
    this._tabs = [
      { id: "timeline", label: "Timeline" },
      { id: "synth", label: "Synth" },
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

  _applySettings() {
    const vol = this.settingsFields.find((f) => f.id === "masterVolume");
    if (vol && engine.master?.gain) {
      engine.master.gain.value = /** @type {number} */ (vol.value) / 100;
    }
  }

  open() {
    this._ensureCreated();
    this.opened = true;
    this.activeTab = 0;
    this.selectedNoteIndex = 0;
    this.selectedPresetIndex = 0;
    this.customValues;
    this.selectedSettingIndex = 0;
    this.synthNavIndex = 0;
    this.customEnabled = false;
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

  /** @param {Note} note */
  _auditionNote(note) {
    if (!note) return;
    const track = state.tracks[state.currentTrack];
    const synth = engine.synths.get(track.id);
    if (!synth) return;
    synth.triggerAttackRelease(note.pitch, "16n");
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
    else if (tab === "synth") this._handleSynthKey(e);
    else if (tab === "settings") this._handleSettingsKey(e);
  }

  /** @param {KeyboardEvent} e */
  _handleSynthKey(e) {
    const presets = Object.keys(engine.presets);
    /** @type {EditorField[]} */
    const customFields = [
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
        label: "Relase",
        type: "number",
        min: 0.001,
        max: 5,
        step: 0.05,
      },
    ];
    const maxNav = this.customEnabled ? 1 + customFields.length : 1;

    if (e.key === "ArrowUp" || e.key.toLowerCase() === "w") {
      e.preventDefault();
      if (this.synthNavIndex > 0) this.synthNavIndex--;
      this._renderSynth();
      return;
    }
    if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") {
      e.preventDefault();
      if (this.synthNavIndex < maxNav) this.synthNavIndex++;
      this._renderSynth();
      return;
    }

    const focus = this.synthNavIndex;

    if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
      e.preventDefault();
      if (focus === 0) {
        const idx = presets.indexOf(state.tracks[state.currentTrack]?.preset);
        const newIdx = (idx - 1 + presets.length) % presets.length;
        this._loadCustomFromCurrent();
        engine.setPreset(state.currentTrack, presets[newIdx]);
      } else if (focus === 1) {
        this._toggleCustom(presets);
      } else if (focus >= 2) {
        const f = customFields[focus - 2];
        if (
          f.type === "number" &&
          typeof f.min === "number" &&
          typeof f.step === "number"
        ) {
          const val = /** @type {number} */ (this.customValues[f.key]);
          this.customValues[f.key] = Math.max(
            f.min,
            +(val - f.step).toFixed(3),
          );
          this._applyCustom();
        } else if (f.type === "choice" && f.options) {
          const val = /** @type {string} */ (this.customValues[f.key]);
          const idx = f.options.indexOf(val);
          this.customValues[f.key] =
            f.options[(idx - 1 + f.options.length) % f.options.length];
          this._applyCustom();
        }
      }
      this._renderSynth();
      return;
    }

    if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
      e.preventDefault();
      if (focus === 0) {
        const idx = presets.indexOf(state.tracks[state.currentTrack]?.preset);
        const newIdx = (idx + 1) % presets.length;
        this._loadCustomFromCurrent();
        engine.setPreset(state.currentTrack, presets[newIdx]);
      } else if (focus === 1) {
        this._toggleCustom(presets);
      } else if (focus >= 2) {
        const f = customFields[focus - 2];
        if (
          f.type === "number" &&
          typeof f.max === "number" &&
          typeof f.step === "number"
        ) {
          const val = /** @type {number} */ (this.customValues[f.key]);
          this.customValues[f.key] = Math.min(
            f.max,
            +(val + f.step).toFixed(3),
          );
          this._applyCustom();
        } else if (f.type === "choice" && f.options) {
          const val = /** @type {string} */ (this.customValues[f.key]);
          const idx = f.options?.indexOf(val);
          this.customValues[f.key] = f.options[(idx + 1) % f.options?.length];
          this._applyCustom();
        }
      }
      this._renderSynth();
      return;
    }

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (focus === 1) {
        this._toggleCustom(presets);
        this._renderSynth();
      }
      return;
    }
  }

  /** @param {string[]} presets */
  _toggleCustom(presets) {
    this.customEnabled = !this.customEnabled;
    if (this.customEnabled) {
      this._loadCustomFromCurrent();
      this._applyCustom();
    } else {
      const p = state.tracks[state.currentTrack]?.preset;
      if (p) engine.setPreset(state.currentTrack, p);
    }
    if (!this.customEnabled && this.synthNavIndex > 1) this.synthNavIndex = 1;
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
        this._auditionNote(notes[this.selectedNoteIndex]);
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

    const field = this.settingsFields[this.selectedSettingIndex];
    if (!field) return;

    const isToggle = field.id === "theme" || field.id === "metronome";
    const isNumber = field.type === "number";
    const isChoice = field.type === "choice" && field.options;

    if (
      e.key === "ArrowLeft" ||
      e.key.toLowerCase() === "a" ||
      e.key === "Enter" ||
      e.key === " "
    ) {
      e.preventDefault();
      if (isToggle) {
        field.value =
          field.value === (field.id === "theme" ? "dark" : "on")
            ? field.id === "theme"
              ? "light"
              : "off"
            : field.id === "theme"
              ? "dark"
              : "on";
        if (field.id === "theme") {
          document.documentElement.setAttribute("data-theme", field.value);
        }
        this._applySettings();
        this._renderSettings();
        return;
      }

      if (
        isNumber &&
        typeof field.min === "number" &&
        typeof field.step === "number"
      ) {
        field.value = Math.max(field.min, field.value - field.step);
        this._applySettings();
        this._renderSettings();
        return;
      }

      if (isChoice) {
        const idx = field.options.indexOf(field.value);
        field.value =
          field.options[
            (idx - 1 + field.options.length) % field.options.length
          ];
        this._renderSettings();
        return;
      }
    }

    if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
      e.preventDefault();

      if (isToggle) {
        field.value =
          field.value === (field.id === "theme" ? "dark" : "on")
            ? field.id === "theme"
              ? "light"
              : "off"
            : field.id === "theme"
              ? "dark"
              : "on";
        if (field.id === "theme") {
          document.documentElement.setAttribute("data-theme", field.value);
        }
        this._applySettings();
        this._renderSettings();
        return;
      }

      if (
        isNumber &&
        typeof field.min === "number" &&
        typeof field.step === "number"
      ) {
        const val = /** @type {number} */ (field.value);
        field.value = Math.min(field.max, val + field.step);
        this._applySettings();
        this._renderSettings();
        return;
      }

      if (isChoice) {
        const idx = field.options.indexOf(field.value);
        field.value = field.options[(idx + 1) % field.options.length];
        this._renderSettings();
        return;
      }
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
    else if (tab === "synth") this._renderSynth();
    else if (tab === "settings") this._renderSettings();
  }

  /** @param {Track} track @param {Note[]} notes */
  _drawTimelineCanvas(track, notes) {
    /** @type {HTMLCanvasElement | null} */ // I actually despise jsdoc and types but i dont want so many errors holy moly
    const canvas = /** @type {any} */ (
      document.getElementById("editor-timeline-canvas")
    );
    const viewport = document.querySelector(".editor-timeline-viewport");
    if (!canvas || !viewport) return;

    const dpr = window.devicePixelRatio || 1;
    const viewRect = viewport.getBoundingClientRect();
    const viewW = viewRect.width;
    const viewH = viewRect.height;

    const ppb = 60;
    let maxBeat = 16;
    notes.forEach((n) => {
      maxBeat = Math.max(maxBeat, n.start + n.duration);
    });
    const contentW = Math.max(viewW, maxBeat * ppb);

    canvas.width = contentW * dpr;
    canvas.height = viewH * dpr;
    canvas.style.width = contentW + "px";
    canvas.style.height = viewH + "px";

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, contentW, viewH);

    ctx.fillStyle =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--background")
        .trim() || "#0a0a0c";
    ctx.fillRect(0, 0, contentW, viewH);

    const semitones = 25;
    const rowH = viewH / semitones;

    for (let i = 0; i <= semitones; i++) {
      const y = i * rowH;
      const ni = i % 12;
      const isSharp = ni === 1 || ni === 3 || ni === 6 || ni === 8 || ni === 10;
      ctx.strokeStyle = isSharp
        ? "rgba(255,255,255,0.06)"
        : "rgba(255,255,255,0.03)";
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(contentW, y);
      ctx.stroke();
    }

    for (let i = 0; i <= maxBeat; i++) {
      const x = i * ppb;
      const isMeasure = i % 4 === 0;
      ctx.lineWidth = isMeasure ? 1.5 : 0.5;
      ctx.strokeStyle = isMeasure
        ? getComputedStyle(document.documentElement)
            .getPropertyValue("--border-strong")
            .trim()
        : getComputedStyle(document.documentElement)
            .getPropertyValue("--border")
            .trim();
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, viewH);
      ctx.stroke();

      if (!isMeasure) {
        ctx.fillStyle =
          getComputedStyle(document.documentElement)
            .getPropertyValue("--foreground-tertiary")
            .trim() || "#666";
        ctx.font = "10px ui-monospace, monospace";
        ctx.textBaseline = "top";
        ctx.fillText(String(i), x + 4, 4);
      }
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
    notes.forEach((note, i) => {
      const x = note.start * ppb;
      const nw = Math.max(6, note.duration * ppb);
      const match = note.pitch.match(/^([A-G]#?)(\d)$/);
      let y = viewH / 2;
      if (match) {
        const semi =
          (parseInt(match[2]) - 3) * 12 + noteNames.indexOf(match[1]);
        y = viewH - (semi + 1) * rowH;
      }
      const nh = rowH - 1;

      const isSelected = i === this.selectedNoteIndex;

      ctx.shadowColor = track.color;
      ctx.shadowBlur = isSelected ? 12 : 6;
      ctx.fillStyle = track.color;
      ctx.globalAlpha = isSelected ? 0.95 : 0.75;

      const r = Math.min(3, nh / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + nw - r, y);
      ctx.quadraticCurveTo(x + nw, y, x + nw, y + r);
      ctx.lineTo(x + nw, y + nh - r);
      ctx.quadraticCurveTo(x + nw, y + nh, x + nw - r, y + nh);
      ctx.lineTo(x + r, y + nh);
      ctx.quadraticCurveTo(x, y + nh, x, y + nh - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      if (isSelected) {
        ctx.strokeStyle =
          getComputedStyle(document.documentElement)
            .getPropertyValue("--foreground")
            .trim() || "#fff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      if (nw > 28) {
        ctx.fillStyle = "#000";
        ctx.font = "bold 10px ui-monospace, monospace";
        ctx.textBaseline = "middle";
        ctx.fillText(note.pitch, x + 5, y + nh / 2);
      }
    });

    if (notes[this.selectedNoteIndex]) {
      const sel = notes[this.selectedNoteIndex];
      const selX = sel.start * ppb;
      if (
        selX < viewport.scrollLeft + 20 ||
        selX > viewport.scrollLeft + viewW - 80
      ) {
        viewport.scrollLeft = Math.max(0, selX - 80);
      }
    }
  }

  _renderTimeline() {
    if (!this.contentEl) return;
    const track = state.tracks[state.currentTrack];
    const notes = track?.notes || [];
    let html = `<div class="editor-panel-header"><h2>${track?.name || "Track"}</h2><span class="editor-panel-meta">${notes.length} notes</span></div>`;
    html += `<div class="editor-timeline-scroll">`;
    html += `<div class="editor-piano-roll"><canvas id="editor-piano-canvas"></canvas></div>`;
    html += `<div class="editor-timeline-viewport"><canvas id="editor-timeline-canvas"></canvas></div>`;
    html += `</div>`;
    html += `<div class="editor-footer">↑/↓ select · ←/→ move · Shift+←/→ resize · [ ] pitch · N new · Del delete</div>`;
    this.contentEl.innerHTML = html;
    requestAnimationFrame(() => {
      this._drawEditorPianoRoll();
      this._drawTimelineCanvas(track, notes);
    });
  }

  _drawEditorPianoRoll() {
    /** @type {HTMLCanvasElement | null} */
    const canvas = /** @type {any} */ (
      document.getElementById("editor-piano-canvas")
    );
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

    const semitones = 25;
    const rowH = h / semitones;
    const names = [
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

    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < semitones; i++) {
      const y = i * rowH;
      const ni = i % 12;
      const isSharp = ni === 1 || ni === 3 || ni === 6 || ni === 8 || ni === 10;

      if (isSharp) {
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillRect(0, y, w, rowH);
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.fillRect(0, y, w, rowH);
      }

      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.beginPath();
      ctx.moveTo(0, y + rowH);
      ctx.lineTo(w, y + rowH);
      ctx.stroke();

      const octave = Math.floor(i / 12) + 3;
      ctx.fillStyle = isSharp ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.8)";
      ctx.font = "9px ui-monospace, monospace";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(names[ni] + octave, w - 4, y + rowH / 2);
    }
  }

  _renderSynth() {
    if (!this.contentEl) return;
    const track = state.tracks[state.currentTrack];
    const presets = Object.keys(engine.presets);
    const current = track.preset || "pluck";

    /** @type {EditorField[]} */
    const customFields = [
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
        step: 0.001,
        unit: "s",
      },
      {
        key: "decay",
        label: "Decay",
        type: "number",
        min: 0.001,
        max: 2,
        step: 0.01,
        unit: "s",
      },
      {
        key: "sustain",
        label: "Sustain",
        type: "number",
        min: 0,
        max: 1,
        step: 0.05,
        unit: "",
      },
      {
        key: "release",
        label: "Release",
        type: "number",
        min: 0.001,
        max: 5,
        step: 0.05,
        unit: "s",
      },
    ];

    if (!this.customEnabled && this.synthNavIndex > 1) this.synthNavIndex = 1;

    let html = `<div class="editor-panel-title">Synth</div>`;
    html += `<div class="editor-card">`;

    const presetSel = this.synthNavIndex === 0 ? " selected" : "";
    html += `<div class="editor-row${presetSel}">`;
    html += `<div style="display:flex;flex-direction:column;gap:2px;"><span style="font-weight:500;">Sound</span><span style="font-size:0.7rem;color:var(--foreground-tertiary);">Select a synthesizer preset</span></div>`;
    html += `<div class="choice-strip" id="preset-strip">`;
    presets.forEach((name) => {
      const active = name === current ? " active" : "";
      html += `<div class="choice-item${active}">${name}</div>`;
    });
    html += `</div></div>`;

    html += `<div class="editor-divider"></div>`;

    const toggleSel = this.synthNavIndex === 1 ? " selected" : "";
    html += `<div class="editor-row${toggleSel}" id="custom-toggle-row">`;
    html += `<span style="font-weight:500;">Custom Sound</span>`;
    html += `<div class="toggle" data-on="${this.customEnabled}"><div class="toggle-track"></div><div class="toggle-thumb"></div></div>`;
    html += `</div>`;

    html += `<div class="editor-card-body ${this.customEnabled ? "" : "editor-locked"}" id="custom-params">`;
    customFields.forEach((f, i) => {
      const navIdx = 2 + i;
      const sel = this.synthNavIndex === navIdx ? " selected" : "";
      let control = "";
      if (f.type === "choice" && f.options) {
        control += `<div class="choice-strip">`;
        f.options.forEach((opt) => {
          const active = opt === this.customValues[f.key] ? " active" : "";
          const label = OSC_LABELS[opt] || opt;
          control += `<div class="choice-item${active}">${label}</div>`;
        });
        control += `</div>`;
      } else if (
        f.type === "number" &&
        typeof f.min === "number" &&
        typeof f.max === "number"
      ) {
        const val = /** @type {number} */ (this.customValues[f.key]);
        const pct = Math.min(
          100,
          Math.max(0, ((val - f.min) / (f.max - f.min)) * 100),
        );
        control = `
          <div class="slider">
            <div class="slider-track">
              <div class="slider-fill" style="width:${pct}%"></div>
              <span class="slider-value">${val.toFixed(3)}${f.unit || ""}</span>
            </div>
          </div>
        `;
      }
      html += `<div class="editor-row${sel}"><span>${f.label}</span>${control}</div>`;
    });
    html += `</div></div>`;
    html += `<div class="editor-hint-row">↑/↓ navigate · ←/→ adjust · Enter toggle</div>`;

    this.contentEl.innerHTML = html;
  }

  _renderSettings() {
    if (!this.contentEl) return;
    /** @type {string[]} */
    const groups = [];
    this.settingsFields.forEach((f) => {
      if (!groups.includes(f.group)) groups.push(f.group);
    });

    let html = `<div class="editor-panel-title">Settings</div>`;

    groups.forEach((g) => {
      const fields = this.settingsFields.filter((f) => f.group === g);
      html += `<div class="editor-card">`;
      html += `<div class="editor-card-title">${g}</div>`;

      fields.forEach((f, idx) => {
        const globalIdx = this.settingsFields.indexOf(f);
        const sel = globalIdx === this.selectedSettingIndex ? " selected" : "";

        let right = "";
        const isToggle = f.id === "theme" || f.id === "metronome";

        if (isToggle) {
          const on = f.value === (f.id === "theme" ? "dark" : "on");
          right = `<span class="badge">${on ? (f.id === "theme" ? "Dark" : "On") : f.id === "theme" ? "Light" : "Off"}</span>`;
        } else if (
          f.type === "number" &&
          typeof f.value === "number" &&
          typeof f.min === "number" &&
          typeof f.max === "number"
        ) {
          const pct = Math.min(
            100,
            Math.max(0, ((f.value - f.min) / (f.max - f.min)) * 100),
          );
          right = `
            <div class="slider">
              <div class="slider-track"><div class="slider-fill" style="width:${pct}%"></div></div>
              <span class="slider-value">${f.value}${f.unit || ""}</span>
            </div>
          `;
        } else if (f.type === "choice" && f.options) {
          right += `<div class="choice-strip small">`;
          f.options.forEach((opt) => {
            const active = opt === f.value ? " active" : "";
            right += `<div class="choice-item${active}">${opt}</div>`;
          });
          right += `</div>`;
        }

        html += `<div class="editor-row${sel}"><span>${f.label}</span>${right}</div>`;
        if (idx < fields.length - 1)
          html += `<div class="editor-divider"></div>`;
      });

      html += `</div>`;
    });

    html += `<div class="editor-hint-row">↑/↓ navigate · ←/→ adjust · Enter toggle</div>`;

    this.contentEl.innerHTML = html;
  }
}

export const editorModal = new EditorModal();
