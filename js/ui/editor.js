import { state } from "../state.js";
import { engine } from "../audio/engine.js";
import { renderTimeline } from "../timeline.js";

export class EditorModal {
  constructor() {
    this.dialog = null;
    this.contentEl = null;
    this.tabEls = [];
    this.activeTab = 0;
    this.opened = false;

    this.selectedNoteIndex = 0;
    this.selectedPresetIndex = 0;
    this.selectedCustomField = 0;
    this.selectedSettingIndex = 0;

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
        <div class="editor-layout>
            <aside class="editor-sidebar">
                <div class="editor-sidebar-title">Editor</div>
                <nav class="editor-tabs"></nav>
                <div class="editor-hint">
                    <span>W/S</span> Tabs<br>
                    <span>↑/↓</span> List <br>
                    <span>A/D</span> Adjust <br>
                    <span>Enter</span> Apply <br>
                    <span>Esc</span> Close
                </div>
            </aside>
            <main class="editor-content"></main>
        </div>
    `;

    const nav = this.dialog.querySelector(".editor-tabs");
    this._tabs.forEach((t, i) => {
      const btn = document.createElement("button");
      btn.className = "editor-tab";
      btn.dataset.index = String(i);
      btn.textContent = t.label;
      nav?.appendChild(btn);
    });

    this.tabEls = Array.from(nav?.querySelectorAll(".editor-tab"));
    this.contentEl = this.dialog.querySelector(".editor-content");
    document.appendChild(this.dialog);
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
    this.dialog?.showModal();
    window.addEventListener("keydown", this._boundKey);
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

  /** @param {KeyboardEvent} e */
  _handleTimelineKey(e) {
    const track = state.tracks[state.currentTrack];
    const notes = track.notes || [];

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
    if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
      e.preventDefault();
      const note = notes[this.selectedNoteIndex];
      if (note) {
        note.start += 0.25;
        this._renderTimeline();
        renderTimeline();
      }
      return;
    }
    if (e.key === "Delete" || e.key === "Backspace") {
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

    if (e.key === "ArrowUp" || (e.key.toLowerCase()) === "w") {
      e.preventDefault();
      this.selectedCustomField = Math.max(0, this.selectedCustomField - 1);
      this._renderCustom();
      return;
    }

    if (e.key === "ArrowDown" || (e.key.toLowerCase()) === "s") {
      e.preventDefault();
      this.selectedCustomField = Math.min(fields.length - 1, this.selectedCustomField + 1);
      this._renderCustom();
      return;
    }

    const field = fields[this.selectedCustomField];
    if (!field) return;

    if (e.key === "ArrowLeft" || (e.key.toLowerCase()) === "a") {
      e.preventDefault();
      if (field.type === "number") {
        this.customValues[field.key] = Math.max(field.min, +(this.customValues[field.key] - field.step).toFixed(3));
        this._applyCustom();
      } else if (field.type === "choice") {
        const idx = field.options?.indexOf(this.customValues[field.key]);
        this.customValues[field.key] = field.options[(idx - 1 + field.options) % field.options?.length];
        this._applyCustom();
      }
      this._renderCustom();
      return;
    }
    if (e.key === "ArrowRight" || (e.key.toLowerCase() === "d")) {
      e.preventDefault();
      if (field.type === "number") {
        this.customValues[field.key] = Math.min(field.max, +(this.customValues[field.key] + field.step).toFixed(3));
        this._applyCustom();
      }
      if (field.type === "choice") {
        const idx = field.options?.indexOf(this.customValues[field.key]);
        this.customValues[field.key] = field.options[(idx + 1) % field.options?.length];
        this._applyCustom();
      }
      this._renderCustom();
      return;
    }
  }


  
}
