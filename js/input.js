import { state } from "./state.js";
import { engine } from "./audio/engine.js";
import { modal } from "./ui/modal.js";
import { renderTimeline } from "./timeline.js";

class InputManager {
  constructor() {
    this.activeNotes = new Set();
    this.handlers = new Map(); // key -> { cb, opts }
    /**
     * @type {{ mods: any[]; key: any; cb: any; }[]}
     */
    this.comboHandlers = []; // { mods, key, cb }
    this.audioReady = false;

    this.bpmInterval = null;
    this.bpmDelay = null;
    this.bpmDirection = 0; // -1 or +1;
    this.bpmSpeed = 25; // ms between ticks
    this.bpmOwner = null; // what key owns active bpm adjustment

    this.pendingNotes = new Map(); // KV, { pitch, start }
  }

  /**
   * @param {string} key
   * @param {any} cb
   */
  onKey(key, cb, opts = {}) {
    this.handlers.set(key.toLowerCase(), {
      cb,
      // @ts-ignore
      preventDefault: opts.preventDefault !== false,
    });
    return this;
  }

  /**
   * @param {any} mods
   * @param {string} key
   * @param {any} cb
   */
  onCombo(mods, key, cb) {
    const arr = Array.isArray(mods) ? mods : [mods];
    this.comboHandlers.push({
      mods: arr.map((m) => m.toLowerCase()),
      key: key.toLowerCase(),
      cb,
    });
    return this;
  }

  /**
   * @param {KeyboardEvent} e
   * @param {{ mods: any; key: any; cb?: any; }} combo
   */
  _matchCombo(e, combo) {
    const keyFromCode = e.code.toLowerCase().replace(/^(key|digit|numpad)/, "");

    const keyMatch =
      e.key.toLowerCase() === combo.key || keyFromCode === combo.key;

    return (
      keyMatch &&
      combo.mods.includes("shift") === e.shiftKey &&
      combo.mods.includes("ctrl") === e.ctrlKey &&
      combo.mods.includes("alt") === e.altKey
    );
  }

  async _ensureAudio() {
    if (this.audioReady) return;
    await Tone.start();
    await engine.init();
    this.audioReady = true;
  }

  _buildKeys() {
    const container = document.getElementById("keys");
    if (!container) return;
    container.innerHTML = "";
    const order = [
      // Lower octave
      "z",
      "1",
      "x",
      "2",
      "c",
      "v",
      "3",
      "b",
      "4",
      "n",
      "5",
      "m",
      // Upper octave
      "a",
      "w",
      "s",
      "e",
      "d",
      "f",
      "t",
      "g",
      "y",
      "h",
      "u",
      "j",
      "k",
    ];
    order.forEach((k) => {
      // @ts-ignore
      const note = state.keymap[k];
      if (!note) return;
      const div = document.createElement("div");
      div.className = "key" + (note.includes("#") ? " sharp" : "");
      div.dataset.key = k;
      div.textContent = k.toUpperCase();
      container.appendChild(div);
    });
  }

  /**
   * @param {any} key
   * @param {boolean | undefined} on
   */
  _highlight(key, on) {
    const el = document.querySelector(`[data-key="${key}"]`);
    if (el) el.classList.toggle("pressed", on);
  }

  _updateDisplays() {
    const t = state.tracks[state.currentTrack];
    const trackEl = document.getElementById("track-display");
    const presetEl = document.getElementById("preset-display");
    if (trackEl) trackEl.textContent = t ? `${t.id + 1}. ${t.name}` : "-";
    if (presetEl) presetEl.textContent = t ? t.preset : "-";
    this._renderTrackList();
  }

  _renderTrackList() {
    const list = document.getElementById("track-list");
    if (!list) return;
    list.innerHTML = "";
    state.tracks.forEach((t) => {
      const div = document.createElement("div");
      div.className =
        "track-row" +
        (t.id === state.currentTrack ? " active" : "") +
        (t.muted ? " muted" : "");
      div.innerHTML = `
        <div class="track-color" style="background:${t.color}"></div>
        <div class="track-info">
          <span class="track-name">${t.name}</span>
          <span class="track-preset">${t.preset}</span>
        </div>
      `;
      list.appendChild(div);
    });
  }

  /**
   * @param {number} dir
   * @param {string | number | undefined} code
   */
  _startBpm(dir, code) {
    this._stopBpm();

    this.bpmOwner = code; // "comma" or "period"
    // @ts-ignore
    this.bpmDirection = dir;
    this.bpmSpeed = 150;

    const tick = () => {
      const next = state.bpm + this.bpmDirection;
      if (next > 0 && next <= 999) {
        engine.setBpm(next);
      }
    };

    tick();

    this.bpmDelay = setTimeout(() => {
      this.bpmInterval = setInterval(() => {
        tick();
        this.bpmSpeed = Math.max(20, this.bpmSpeed * 0.92); // accelerate
        clearInterval(this.bpmInterval);
        this.bpmInterval = setInterval(tick, this.bpmSpeed);
      }, this.bpmSpeed);
    }, 300); // 300ms before start the acceleration
  }

  /**
   * @param {string | undefined} [code]
   */
  _stopBpm(code) {
    if (code && this.bpmOwner && this.bpmOwner !== code) return; // ignore wrong key
    // @ts-ignore
    clearTimeout(this.bpmDelay);
    clearInterval(this.bpmInterval);
    this.bpmInterval = null;
    this.bpmDelay = null;
    this.bpmDirection = 0;
  }

  mount() {
    this._buildKeys();
    this._updateDisplays();

    window.addEventListener("keydown", async (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        return;
      }

      if (modal.isOpen()) return;

      if (e.repeat) return;

      const key = e.key.toLowerCase();

      // @ts-ignore
      if (!this.audioReady && state.keymap[key]) {
        await this._ensureAudio();
      }

      if (this.activeNotes.has(key)) return;

      for (const combo of this.comboHandlers) {
        if (this._matchCombo(e, combo)) {
          e.preventDefault();
          this.lastComboCode = e.code.toLowerCase();
          combo.cb();
          return;
        }
      }

      const h = this.handlers.get(key);
      if (h) {
        if (h.preventDefault) e.preventDefault();
        h.cb();
        return;
      }

      // @ts-ignore
      const note = state.keymap[key];
      if (note) {
        this.activeNotes.add(key);
        engine.playNote(note);
        this._highlight(key, true);
        if (state.isRecording && !state.isCountingIn) {
          const beat = Tone.Transport.seconds / (60 / state.bpm);
          this.pendingNotes.set(`${state.currentTrack}-${note}`, {
            pitch: note,
            start: beat,
          });
        }
      }
    });

    window.addEventListener("keyup", (e) => {
      const key = e.key.toLowerCase();
      this.activeNotes.delete(key);

      const code = e.code.toLowerCase();
      if (code === "comma" || code === "period") this._stopBpm(code);

      // @ts-ignore
      const note = state.keymap[key];
      if (note) {
        engine.stopNote(note);
        this._highlight(key, false);
        const keyRef = `${state.currentTrack}-${note}`;
        const pending = this.pendingNotes.get(keyRef);
        if (pending && state.isRecording && !state.isCountingIn) {
          const endBeat = Tone.Transport.seconds / (60 / state.bpm);
          pending.duration = Math.max(0.01, endBeat - pending.start); // min 1/16 note
          state.tracks[state.currentTrack].notes.push(pending);
          this.pendingNotes.delete(keyRef);
          renderTimeline();
        }
      }
    });
  }
}

export const input = new InputManager();