import { state } from "./state.js";
import { engine } from "./audio/engine.js";

const activeNotes = new Set();

function updateTrackDisplay() {
  const t = state.tracks[state.currentTrack];
  document.getElementById("track-display").textContent =
    `Track: ${t.id + 1} ${t.name}`;
  document.getElementById("preset-display").textContent = `Preset: ${t.preset}`;
}

function highlightKey(keyChar, on) {
  const el = document.querySelector(`[data-key="${keyChar}"`);
  if (el) el.classList.toggle("pressed", on);
}

export function initInput() {
  const container = document.getElementById("keys");
  const row1 = [
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
  const row2 = ["z", "x", "c", "v", "b", "n", "m"];

  [...row2, ...row1].forEach((k) => {
    const note = state.keymap[k];
    if (!note) return;

    const div = document.createElement("div");
    const isSharp = note.includes("#");
    div.className = "key" + (isSharp ? " sharp" : "");
    div.dataset.key = k;
    div.textContent = k.toUpperCase();
    container.appendChild(div);
  });

  window.addEventListener("keydown", async (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      return;
    }

    const key = e.key.toLowerCase();

    if (activeNotes.has(key)) return;
    activeNotes.add(key);

    if (!engine.initialised) {
      await Tone.start();
      await engine.init();
    }

    const note = state.keymap[key];
    if (note) {
      engine.playNote(note);
      highlightKey(key, true);
      return;
    }

    if (key === " ") {
      e.preventDefault();
      state.isPlaying ? engine.stopTransport() : engine.startTransport();
      return;
    }

    if (key >= "1" && key <= "4") {
      state.currentTrack = parseInt(key) - 1;
      updateTrackDisplay();
      return;
    }

    if (key === "-") {
      engine.setPreset(state.currentTrack, "pluck");
      updateTrackDisplay();
    }
    if (key === "=") {
      engine.setPreset(state.currentTrack, "subBass");
      updateTrackDisplay();
    }
    if (key === "[") {
      engine.setPreset(state.currentTrack, "lead");
      updateTrackDisplay();
    }
    if (key === "]") {
      engine.setPreset(state.currentTrack, "pad");
      updateTrackDisplay();
    }

    if (key === ",") engine.setBpm(Math.max(60, state.bpm - 5));
    if (key === ".") engine.setBpm(Math.min(200, state.bpm + 5));

    if (key === "m") {
      const t = state.tracks[state.currentTrack];
      t.muted = !t.muted;
      console.log(t.name, t.muted ? "muted" : "unmuted");
    }
  });

  window.addEventListener("keyup", (e) => {
    const key = e.key.toLowerCase();
    activeNotes.delete(key);

    const note = state.keymap[key];
    if (note) {
      engine.stopNote(note);
      highlightKey(key, false);
    }
  });

  updateTrackDisplay();
}
