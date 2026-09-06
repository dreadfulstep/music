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
  tracks: "list-music",
  timeline: "bar-chart-2",
  synth: "sliders-horizontal",
  presets: "audio-lines",
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

    this._ro = null;

    this.tracksNavIndex = 0;
    this.presetsNavIndex = 0;
    this.creatingTrack = false;
    this.creatingPreset = false;
    ((this.newTrackName = "Track"), (this.newTrackPreset = "pluck"));
    this.newPresetName = "Custom";
    /** @type {Record<string, any>} */
    this.newPresetsValue = {
      oscType: "sawtooth",
      attack: 0.05,
      decay: 0.3,
      sustain: 0.5,
      release: 1.0,
    };

    /** @type {Record<string, any>} */
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
        value: 60,
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
      { id: "tracks", label: "Tracks" },
      { id: "timeline", label: "Timeline" },
      { id: "synth", label: "Synth" },
      { id: "presets", label: "Presets" },
      { id: "settings", label: "Settings" },
    ];
  }

  /**
   * @param {string} name
   * @param {string} fallback
   */
  _css(name, fallback) {
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
    return v || fallback;
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

  /** @param {"tracks"|"timeline"|"synth"|"presets"|"settings"} [tab] */
  open(tab = "tracks") {
    this._ensureCreated();
    this.opened = true;
    const idx = this._tabs.findIndex((t) => t.id === tab);
    this.activeTab = idx >= 0 ? idx : 0;
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
    this.creatingTrack = false;
    this.creatingPreset = false;
    this._ro?.disconnect();
    this._ro = null;
    this.dialog?.close();
    window.removeEventListener("keydown", this._boundKey);
  }

  isOpen() {
    return this.opened;
  }

  beginNewTrack() {
    this.creatingTrack = true;
    this.tracksNavIndex = 0;
    this.newTrackName = `Track ${state.tracks.length + 1}`;
    this.newTrackPreset = "pluck";
    this._renderTracks();
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
      if (this.creatingTrack || this.creatingPreset) return; // let those handlers deal with it
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

    if (tab === "tracks") this._handleTracksKey(e);
    else if (tab === "timeline") this._handleTimelineKey(e);
    else if (tab === "synth") this._handleSynthKey(e);
    else if (tab === "presets") this._handlePresetsKey(e);
    else if (tab === "settings") this._handleSettingsKey(e);
  }

  /** @param {KeyboardEvent} e */
  _handleTracksKey(e) {
    if (this.creatingTrack) {
      if (e.key === "Escape") {
        e.preventDefault();
        this.creatingTrack = false;
        this.tracksNavIndex = state.tracks.length;
        this._renderTracks();
        return;
      }

      const maxnav = 3;
      if (e.key === "ArrowUp" || e.key.toLowerCase() === "w") {
        e.preventDefault();
        if (this.tracksNavIndex > 0) this.tracksNavIndex--;
        this._renderTracks();
        return;
      }
      if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (this.tracksNavIndex < maxnav) this.tracksNavIndex++;
        this._renderTracks();
        return;
      }

      if (this.tracksNavIndex === 0) {
        if (e.key === "Backspace") {
          e.preventDefault();
          this.newTrackName = this.newTrackName.slice(0, -1);
          this._renderTracks();
          return;
        }
        if (/^[a-zA-Z0-9_\- ]$/.test(e.key) && e.key.length === 1) {
          e.preventDefault();
          this.newTrackName += e.key;
          this._renderTracks();
        }
      }

      if (this.tracksNavIndex === 1) {
        const customPresets = /** @type {Record<string, any>} */ (
          state.customPresets
        );
        const presets = [
          ...Object.keys(engine.presets),
          ...Object.keys(customPresets || {}),
        ];
        const idx = presets.indexOf(this.newTrackPreset);
        if ((e.key === "ArrowLeft" || e.key.toLowerCase() === "a") && idx > 0) {
          e.preventDefault();
          this.newTrackPreset = presets[idx - 1];
          this._renderTracks();
          return;
        }
        if (
          (e.key === "ArrowRight" || e.key.toLowerCase() === "d") &&
          idx < presets.length - 1
        ) {
          e.preventDefault();
          this.newTrackPreset = presets[idx + 1];
          this._renderTracks();
          return;
        }
      }

      if (e.key === "Enter") {
        e.preventDefault();
        if (this.tracksNavIndex === 2) {
          const id =
            state.tracks.length > 0
              ? Math.max(...state.tracks.map((t) => t.id)) + 1
              : 0;
          const colors = [
            "#ff6b9d",
            "#4ecdcc",
            "#ffe66d",
            "#a78bfa",
            "#5c8aff",
            "#ff8a5c",
            "#5cff8a",
          ];
          const newTrack = {
            id,
            name: this.newTrackName.trim() || `Track ${id + 1}`,
            color: colors[id % colors.length],
            type: "synth",
            preset: this.newTrackPreset,
            muted: false,
            loop: false,
            notes: [],
          };
          state.tracks.push(newTrack);
          engine.addTrack(newTrack);
          state.currentTrack = state.tracks.length - 1;
          this.creatingTrack = false;
          ((this.newTrackName = "Track"), (this.newTrackPreset = "pluck"));
          this.tracksNavIndex = state.tracks.length - 1;
          this._updateTrackDisplay();
          renderTimeline();
          this._renderTracks();
        }
        return;
      }
      return;
    }

    const maxIdx = state.tracks.length;
    if (e.key === "ArrowUp" || e.key.toLowerCase() === "w") {
      e.preventDefault();
      if (this.tracksNavIndex > 0) this.tracksNavIndex--;
      this._renderTracks();
      return;
    }
    if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") {
      e.preventDefault();
      if (this.tracksNavIndex < maxIdx) this.tracksNavIndex++;
      this._renderTracks();
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (this.tracksNavIndex < state.tracks.length) {
        state.currentTrack = this.tracksNavIndex;
        this._updateTrackDisplay();
        renderTimeline();
        this._renderTracks();
      } else {
        this.creatingTrack = true;
        this.tracksNavIndex = 0;
        this.newTrackName = `Track ${state.tracks.length + 1}`;
        this.newTrackPreset = "pluck";
        this._renderTracks();
      }
      return;
    }

    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      if (
        this.tracksNavIndex < state.tracks.length &&
        state.tracks.length > 0
      ) {
        state.tracks.splice(this.tracksNavIndex, 1);
        if (state.currentTrack >= state.tracks.length) {
          state.currentTrack = Math.max(0, state.tracks.length - 1);
        }
        this.tracksNavIndex = Math.min(
          this.tracksNavIndex,
          state.tracks.length,
        );
        this._updateTrackDisplay();
        this._renderTracks();
        this._renderTimeline();
      }
      return;
    }
  }

  /** @param {KeyboardEvent} e */
  _handlePresetsKey(e) {
    const customPresets = /** @type {Record<string, any>} */ (
      state.customPresets
    );
    const presetNames = Object.keys(customPresets || {});

    if (this.creatingPreset) {
      const fields = [
        { key: "name", label: "Name" },
        {
          key: "oscType",
          label: "Oscillator Type",
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
      const maxNav = fields.length + 1; // +1 for cancel

      if (e.key === "Escape") {
        e.preventDefault();
        this.creatingPreset = false;
        this.presetsNavIndex = presetNames.length;
        this._renderPresets();
        return;
      }

      if (e.key === "ArrowUp" || e.key.toLowerCase() === "w") {
        e.preventDefault();
        if (this.presetsNavIndex > 0) this.presetsNavIndex--;
        this._renderPresets();
        return;
      }
      if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (this.presetsNavIndex < maxNav) this.presetsNavIndex++;
        this._renderPresets();
        return;
      }

      const f = fields[this.presetsNavIndex];

      if (this.presetsNavIndex === 0) {
        if (e.key === "Backspace") {
          e.preventDefault();
          this.newPresetName = this.newPresetName.slice(0, -1);
          this._renderPresets();
          return;
        }
        if (/^[a-zA-Z0-9_\- ]$/.test(e.key) && e.key.length === 1) {
          e.preventDefault();
          this.newPresetName += e.key;
          this._renderPresets();
          return;
        }
      } else if (f?.type === "choice" && f.options) {
        const val = this.newPresetsValue[f.key];
        const idx = f.options.indexOf(val);
        if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
          e.preventDefault();
          this.newPresetsValue[f.key] =
            f.options[(idx - 1 + f.options.length) % f.options.length];
          this._renderPresets();
          return;
        }
        if (e.key === "ArrowRight" || e.key.toLowerCase() === "a") {
          e.preventDefault();
          this.newPresetsValue[f.key] = f.options[(idx + 1) % f.options.length];
          this._renderPresets();
          return;
        }
      } else if (
        f?.type === "number" &&
        typeof f.min === "number" &&
        typeof f.step === "number"
      ) {
        if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
          e.preventDefault();
          this.newPresetsValue[f.key] = Math.max(
            f.min,
            +(this.newPresetsValue[f.key] - f.step).toFixed(3),
          );
          this._renderPresets();
          return;
        }
        if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
          e.preventDefault();
          this.newPresetsValue[f.key] = Math.min(
            f.max,
            +(this.newPresetsValue[f.key] + f.step).toFixed(3),
          );
          this._renderPresets();
          return;
        }
      }

      if (e.key === "Enter") {
        e.preventDefault();
        if (this.presetsNavIndex === maxNav) {
          this.creatingPreset = false;
          this.presetsNavIndex = presetNames.length;
          this._renderPresets();
        } else if (this.presetsNavIndex === maxNav - 1) {
          const name = this.newPresetName.trim() || "custom";
          if (!state.customPresets) state.customPresets = {};
          state.customPresets[name] = {
            oscillator: { type: this.newPresetsValue.oscType },
            envelope: {
              attack: this.newPresetsValue.attack,
              decay: this.newPresetsValue.decay,
              sustain: this.newPresetsValue.sustain,
              release: this.newPresetsValue.release,
            },
          };
          this.creatingPreset = false;
          this.presetsNavIndex = Object.keys(state.customPresets).length;
          this._renderPresets();
        }
        return;
      }
      return;
    }

    const maxIdx = presetNames.length;
    if (e.key === "ArrowUp" || e.key.toLowerCase() === "w") {
      e.preventDefault();
      if (this.presetsNavIndex > 0) this.presetsNavIndex--;
      this._renderPresets();
      return;
    }
    if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") {
      e.preventDefault();
      if (this.presetsNavIndex < maxIdx) this.presetsNavIndex++;
      this._renderPresets();
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (this.presetsNavIndex < presetNames.length) {
        const name = presetNames[this.presetsNavIndex];
        engine.setPreset(state.currentTrack, name);
        this._updateTrackDisplay();
        renderTimeline();
        this._renderPresets();
      } else {
        this.creatingPreset = true;
        this.presetsNavIndex = 0;
        this.newPresetName = "Custom";
        this.newPresetsValue = {
          oscType: "sawtooth",
          attack: 0.05,
          decay: 0.3,
          sustain: 0.5,
          release: 1.0,
        };
        this._renderPresets();
      }
      return;
    }

    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      if (this.presetsNavIndex < presetNames.length) {
        const name = presetNames[this.presetsNavIndex];
        delete state.customPresets[name];
        this.presetsNavIndex = Math.min(
          this.presetsNavIndex,
          Object.keys(state.customPresets).length,
        );
        this._renderPresets();
      }
      return;
    }
  }

  /** @param {KeyboardEvent} e */
  _handleSynthKey(e) {
    const track = state.tracks[state.currentTrack];
    if (!track) return;

    const customPresets = /** @type {Record<string, any>} */ (
      state.customPresets
    );
    const presets = [
      ...Object.keys(engine.presets),
      ...Object.keys(customPresets || {}),
    ];
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

    if ((e.key === "ArrowLeft" || e.key.toLowerCase() === "a") && e.shiftKey) {
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
          this._render();
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
    const customPresets = /** @type {Record<string, any>} */ (
      state.customPresets
    );
    const preset =
      engine.presets[track?.preset] || customPresets?.[track?.preset];
    if (preset) {
      this.customValues.oscType = preset.oscillator?.type || "sawtooth";
      this.customValues.attack = preset.envelope?.attack || 0.05;
      this.customValues.decay = preset.envelope?.decay || 0.3;
      this.customValues.sustain = preset.envelope?.sustain || 0.5;
      this.customValues.release = preset.envelope?.release || 1.0;
    }
  }

  _applyCustom() {
    const track = state.tracks[state.currentTrack];
    if (!track) return;
    const synth = engine.synths.get(track.id);
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
    if (tab === "tracks") this._renderTracks();
    else if (tab === "timeline") this._renderTimeline();
    else if (tab === "synth") this._renderSynth();
    else if (tab === "presets") this._renderPresets();
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

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const viewRect = viewport.getBoundingClientRect();
    const viewW = viewRect.width;
    const viewH = viewRect.height;

    const ppb = viewW < 640 ? 44 : 60;
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
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, contentW, viewH);

    const bg = this._css("--background", "#0a0a0c");
    const border = this._css("--border", "rgba(128,128,128,0.15)");
    const borderStrong = this._css("--border-strong", "rgba(128,128,128,0.3)");
    const fgTertiary = this._css("--foreground-tertiary", "#777");
    const fg = this._css("--foreground", "#fff");
    const ink = this._css("--background", "#000");

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, contentW, viewH);

    const semitones = 25;
    const rowH = viewH / semitones;

    for (let i = 0; i <= semitones; i++) {
      const y = i * rowH;
      const ni = i % 12;
      const isSharp = ni === 1 || ni === 3 || ni === 6 || ni === 8 || ni === 10;
      ctx.globalAlpha = isSharp ? 0.7 : 0.4;
      ctx.strokeStyle = border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(contentW, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    for (let i = 0; i <= maxBeat; i++) {
      const x = i * ppb;
      const isMeasure = i % 4 === 0;
      ctx.lineWidth = isMeasure ? 1.5 : 0.5;
      ctx.strokeStyle = isMeasure ? borderStrong : border;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, viewH);
      ctx.stroke();

      ctx.fillStyle = fgTertiary;
      ctx.font = "10px ui-monospace, monospace";
      ctx.textBaseline = "top";
      ctx.fillText(String(i), x + 4, 4);
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
        ctx.strokeStyle = fg;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      if (nw > 28) {
        ctx.fillStyle = ink;
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
    this._ro?.disconnect();
    const viewport = document.querySelector(".editor-timeline-viewport");
    if (viewport) {
      this._ro = new ResizeObserver(() => {
        this._drawEditorPianoRoll();
        this._drawTimelineCanvas(track, notes);
      });
      this._ro.observe(viewport);
    }
  }

  _drawEditorPianoRoll() {
    /** @type {HTMLCanvasElement | null} */
    const canvas = /** @type {any} */ (
      document.getElementById("editor-piano-canvas")
    );
    const wrap = canvas?.parentElement;
    if (!canvas || !wrap) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = wrap.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const white = this._css("--surface-raised", "#e8e8ec");
    const black = this._css("--tertiary", "#2a2a32");
    const line = this._css("--border-strong", "rgba(128,128,128,0.3)");
    const fgOnWhite = this._css("--foreground", "#111");
    const fgOnBlack = this._css("--foreground-secondary", "#ccc");

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

      ctx.fillStyle = isSharp ? black : white;
      ctx.fillRect(0, y, w, rowH);

      ctx.strokeStyle = line;
      ctx.beginPath();
      ctx.moveTo(0, y + rowH);
      ctx.lineTo(w, y + rowH);
      ctx.stroke();

      const octave = Math.floor(i / 12) + 3;
      ctx.fillStyle = isSharp ? fgOnBlack : fgOnWhite;
      ctx.font = "9px ui-monospace, monospace";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(names[ni] + octave, w - 4, y + rowH / 2);
    }
  }

  _renderTracks() {
    if (!this.contentEl) return;

    if (this.creatingTrack) {
      const customPresets = /** @type {Record<string, any>} */ (
        state.customPresets
      );
      const presets = [
        ...Object.keys(engine.presets),
        ...Object.keys(customPresets || {}),
      ];

      let html = `<div class="editor-panel-title">New Track</div>`;
      html += `<div class="editor-card">`;

      const nameSel = this.tracksNavIndex === 0 ? " selected" : "";
      html += `<div class="editor-row${nameSel}"><span>Name</span><span class="editor-row-value">${this.newTrackName}</span></div>`;
      html += `<div class="editor-divider"></div>`;

      const presetSel = this.tracksNavIndex === 1 ? " selected" : "";
      html += `<div class="editor-row${presetSel}"><span>Preset</span><div class="choice-strip">`;
      presets.forEach((p) => {
        const active = p === this.newTrackPreset ? " active" : "";
        html += `<div class="choice-item${active}">${p}</div>`;
      });
      html += `</div></div>`;
      html += `<div class="editor-divider"></div>`;

      const createSel = this.tracksNavIndex === 2 ? " selected" : "";
      html += `<div class="editor-row${createSel}"><span style="font-weight:600;color:var(--accent-text);">Create Track</span></div>`;
      html += `<div class="editor-divider"></div>`;

      const cancelSel = this.tracksNavIndex === 3 ? " selected" : "";
      html += `<div class="editor-row${cancelSel}"><span>Cancel</span></div>`;
      html += `</div>`;
      html += `<div class="editor-hint-row">↑/↓ navigate · ←/→ change preset · Type name · Enter confirm · Esc cancel</div>`;
      this.contentEl.innerHTML = html;
      return;
    }

    let html = `<div class="editor-panel-title">Tracks</div>`;
    html += `<div class="editor-list">`;

    state.tracks.forEach((t, i) => {
      const sel = i === this.tracksNavIndex ? " selected" : "";
      const activeTrack = i === state.currentTrack ? " ●" : "";
      const mutedBadge = t.muted
        ? `<span class="editor-row-badge" style="background:#ff4757;">MUTE</span>`
        : "";
      html += `
        <div class="editor-row${sel}">
            <div style="display:flex;align-items:center;gap:10px;">
                <span class="modal-dot" style="background:${t.color};"></span>
                <span style="font-weight:500;">${t.name}${activeTrack}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
                <span class="editor-row-meta">${t.preset}</span>
                ${mutedBadge}  
            </div>
        </div>`;
    });

    const newSel =
      this.tracksNavIndex === state.tracks.length ? " selected" : "";
    html += `<div class="editor-row${newSel}" style="color:var(--accent-text);font-weight:600;"><span>+ New Track</span></div>`;
    html += `</div>`;
    html += `<div class="editor-hint-row">↑/↓ navigate · Enter select/create · Del remove · W/S tabs</div>`;
    this.contentEl.innerHTML = html;
  }

  _renderSynth() {
    if (!this.contentEl) return;
    const track = state.tracks[state.currentTrack];

    if (!track) {
      this.contentEl.innerHTML = `
        <div class="editor-panel-title">Synths</div>
        <div class="editor-empty">No active track. Create one in the Tracks tab.</div>
        <div class="editor-hint-row">↑/↓ navigate · ←/→ adjust · Enter toggle</div>
      `;
      return;
    }

    const customPreset = /** @type {Record<string, any>} */ (
      state.customPresets
    );
    const presets = [
      ...Object.keys(engine.presets),
      ...Object.keys(customPreset || {}),
    ];
    const current = track?.preset || "pluck";

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

  _renderPresets() {
    if (!this.contentEl) return;
    const customPresets = /** @type {Record<string, any>} */ (
      state.customPresets
    );
    const presetNames = Object.keys(customPresets || {});

    if (this.creatingPreset) {
      const fields = [
        { key: "name", label: "Name" },
        {
          key: "oscType",
          label: "Oscillator Type",
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
          step: 0.05,
        },
        {
          key: "decay",
          label: "Decay",
          type: "number",
          min: 0.001,
          max: 2,
          step: 0.05,
          unit: "s",
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
          unit: "s",
        },
      ];
      const maxNav = fields.length + 1;

      let html = `<div class="editor-panel-title">New Preset</div>`;
      html += `<div class="editor-card">`;

      fields.forEach((f, i) => {
        const sel = this.presetsNavIndex === i ? " selected" : "";
        let right = "";
        if (f.key === "name") {
          right = `<span class="editor-row-value">${this.newPresetName}</span>`;
        } else if (f.type === "choice" && f.options) {
          right = `<div class="choice-strip">`;
          f.options.forEach((opt) => {
            const active = opt === this.newPresetsValue[f.key] ? " active" : "";
            const label = OSC_LABELS[opt] || opt;
            right += `<div class="choice-item${active}">${label}</div>`;
          });
          right += `</div>`;
        } else if (f.type === "number" && typeof f.min === "number") {
          const val = this.newPresetsValue[f.key];
          const pct = Math.min(
            100,
            Math.max(0, ((val - f.min) / (f.max - f.min)) * 100),
          );
          right = `
            <div class="slider">
                <div class="slider-track"><div class="slider-fill" style="width:${pct}%"></div></div>
                <span class="slider-value">${val.toFixed(3)}${f.unit || ""}</span>  
            </div>`;
        }
        html += `<div class="editor-row${sel}"><span>${f.label}</span>${right}</div>`;
        if (i < fields.length - 1) html += `<div class="editor-divider"></div>`;
      });

      html += `<div class="editor-divider"></div>`;
      const saveSel = this.presetsNavIndex === maxNav - 1 ? " selected" : "";
      html += `<div class="editor-row${saveSel}" style="color:var(--accent-text);font-weight:600;"><span>Save Preset</span></div>`;
      html += `<div class="editor-divider"></div>`;
      const cancelSel = this.presetsNavIndex === maxNav ? " selected" : "";
      html += `<div class="editor-row${cancelSel}"><span>Cancel</span></div>`;
      html += `</div>`;
      html += `<div class="editor-hint-row">↑/↓ navigate · ←/→ adjust · Type name · Enter save · Esc cancel</div>`;
      this.contentEl.innerHTML = html;
      return;
    }

    let html = `<div class="editor-panel-title">Presets</div>`;
    html += `<div class="editor-list">`;

    presetNames.forEach((name, i) => {
      const sel = i === this.presetsNavIndex ? " selected" : "";
      const p = customPresets[name];
      const osc = p?.oscillator?.type || "sine";
      html += `
        <div class="editor-row${sel}">
            <span style="font-weight:500;">${name}</span>
            <span class="editor-row-meta">${OSC_LABELS[osc] || osc}</span>
        </div>`;
    });

    const newSel =
      this.presetsNavIndex === presetNames.length ? " selected" : "";
    html += `<div class="editor-row${newSel}" style="color:var(--accent-text);font-weight:600;>+ New Preset</div>`;
    html += `</div>`;
    html += `<div class="editor-hint-row">↑/↓ navigate · ←/→ adjust · Type name · Enter save · Esc cancel</div>`;
    this.contentEl.innerHTML = html;
  }

  _updateTrackDisplay() {
    const t = state.tracks[state.currentTrack];
    const trackEl = document.getElementById("track-display");
    const presetEl = document.getElementById("preset-display");
    if (trackEl) trackEl.textContent = t ? `${t.id + 1}. ${t.name}` : "-";
    if (presetEl) presetEl.textContent = t ? t.preset : "-";
  }
}

export const editorModal = new EditorModal();
