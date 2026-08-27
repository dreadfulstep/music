import { input } from "./input.js";
import { state } from "./state.js";
import { engine } from "./audio/engine.js";
import { modal } from "./ui/modal.js";
import { PianoRoll } from "./ui/piano-roll.js";
import { renderTimeline } from "./timeline.js";

const roll = new PianoRoll("piano-roll");

const timeline = document.getElementById("timeline");
const playhead = document.getElementById("playhead");

function updatePlayhead() {
  if (!state.isPlaying || !timeline || !playhead) return;

  const beat = Tone.Transport.seconds / (60 / state.bpm);
  const x = beat * 40 + 120;
  playhead.style.left = x + "px";

  const scrollLeft = timeline?.scrollLeft;
  const viewWidth = timeline?.clientWidth;

  if (x > scrollLeft + viewWidth - 100) {
    timeline.scrollLeft = x - 100;
  }

  requestAnimationFrame(updatePlayhead);
}

function loop() {
  roll.draw();
  requestAnimationFrame(loop);
}
loop();

document.addEventListener("DOMContentLoaded", async () => {
  input.onKey(
    " ",
    () => {
      if (state.isPlaying) {
        engine.stopTransport();
      } else {
        state.isRecording = false; // ensures not recording
        engine.startTransport();
        updatePlayhead();
      }
    },
    { preventDefault: true },
  );

  input.onCombo("shift", "1", () => {
    modal.open(
      "Select Track",
      state.tracks.map((t) => ({
        label: t.name,
        value: t.id,
        color: t.color,
        meta: t.preset,
      })),
      (item) => {
        state.currentTrack = item.value;
        input._updateDisplays();
        renderTimeline();
      },
    );
  });

  input.onCombo("shift", "2", () => {
    modal.open(
      "Select Preset",
      Object.keys(engine.presets).map((name) => ({
        label: name,
        value: name,
        meta:
          state.tracks[state.currentTrack]?.preset === name ? "current" : "",
      })),
      (item) => {
        engine.setPreset(state.currentTrack, item.value);
        input._updateDisplays();
        renderTimeline();
      },
    );
  });

  input.onCombo("shift", "3", () => {
    modal.open(
      "New Track",
      Object.keys(engine.presets).map((name) => ({
        label: name,
        value: name,
      })),
      (item) => {
        const id = state.tracks.length;
        const colors = [
          "#ff6b9d",
          "#4ecdc4",
          "#ffe66d",
          "#a78bfa",
          "#5c8aff",
          "#ff8a5c",
          "#5cff8a",
        ];

        const newTrack = {
          id,
          name: `Track ${id + 1}`,
          color: colors[id % colors.length],
          type: "synth",
          preset: item.value,
          muted: false,
          notes: [],
        };
        state.tracks.push(newTrack);
        engine.addTrack(newTrack);
        state.currentTrack = id;
        input._updateDisplays();
        renderTimeline();
      },
    );
  });

  // Mute
  input.onCombo("shift", "m", () => {
    const t = state.tracks[state.currentTrack];
    if (t) {
      t.muted = !t.muted;
      input._updateDisplays();
    }
  });

  // Record
  input.onCombo("shift", "r", () => {
    if (state.isRecording) {
      engine.stopTransport();
      state.isRecording = false;
    } else {
      state.isCountingIn = true;
      engine.startTransport();
      updatePlayhead();
      setTimeout(() => {
        if (state.isCountingIn) {
          state.isCountingIn = false;
          state.isRecording = true;
        }
      }, 3000)
    }
  });

  // BPM
  input.onCombo("shift", "<", () => input._startBpm(-1, input.lastComboCode));
  input.onCombo("shift", ">", () => input._startBpm(1, input.lastComboCode));

  input.mount();
  renderTimeline();
});
