import { input } from "./input.js";
import { state } from "./state.js";
import { engine } from "./audio/engine.js";
import { modal } from "./ui/modal.js";
import { renderTimeline } from "./timeline.js";
import { editorModal } from "./ui/editor.js";

const timeline = document.getElementById("timeline");
const playhead = document.getElementById("playhead");
/**
 * @type {number | null | undefined}
 */
let countdownInterval = null;

// @ts-ignore
lucide.createIcons();

function updatePlayhead() {
  if (!state.isPlaying || !timeline || !playhead) return;

  const beat = Tone.Transport.seconds / (60 / state.bpm);
  const x = beat * 40 + 164;
  playhead.style.left = x + "px";

  const scrollLeft = timeline?.scrollLeft;
  const viewWidth = timeline?.clientWidth;

  if (x > scrollLeft + viewWidth - 100) {
    timeline.scrollLeft = x - 100;
  }

  const timeEl = document.querySelector(".nav-readout:nth-child(2)");
  if (timeEl) {
    const s = Tone.Transport.seconds;
    const mm = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = Math.floor(s%60).toString().padStart(2, "0");
    const ms = Math.floor((s % 1) * 100).toString().padStart(2, "0");
    timeEl.textContent = `${mm}:${ss}:${ms}`;
  }

  requestAnimationFrame(updatePlayhead);
}

function updateTransportButtons() {
  const playBtn = document.querySelector('[data-action="play"]');
  const stopBtn = document.querySelector('[data-action="stop"]');
  const recBtn = document.querySelector('[data-action="record"]');
  if (playBtn) playBtn.classList.toggle("active", state.isPlaying);
  if (stopBtn) stopBtn.classList.toggle("active", !state.isPlaying);
  if (recBtn) {
    recBtn.classList.remove("active", "counting");
    if (state.isRecording) recBtn.classList.add("active");
    else if (state.isCountingIn) recBtn.classList.add("counting");
  }
}

function clearCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  const el = document.getElementById("countdown");
  if (el) el.style.display = "none";
}

function stopAll() {
  engine.stopTransport();
  state.isRecording = false;
  state.isCountingIn = false;
  state.isPlaying = false;
  clearCountdown();
  updateTransportButtons();
}

function startCountdown() {
  state.isCountingIn = true;
  updateTransportButtons();
  let count = 3;
  const overlay = document.getElementById("countdown");
  const numberEl = overlay?.querySelector(".countdown-number");
  if (overlay) overlay.style.display = "flex";
  if (numberEl) numberEl.textContent = String(count);
  countdownInterval = setInterval(() => {
    count--;
    if (numberEl) numberEl.textContent = count > 0 ? String(count) : "●";
    if (count <= 0) {
      // @ts-ignore
      clearInterval(countdownInterval);
      countdownInterval = null;
      state.isCountingIn = false;
      state.isRecording = true;
      engine.startTransport();
      updatePlayhead();
      updateTransportButtons();
      if (overlay) overlay.style.display = "none";
    }
  }, 1000);
}

document.addEventListener("DOMContentLoaded", async () => {
  input.onKey(
    " ",
    () => {
      if (state.isPlaying) {
        stopAll();
      } else {
        stopAll(); // clear all
        engine.startTransport();
        updatePlayhead();
        updateTransportButtons();
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
          loop: false,
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
      stopAll();
    } else {
      startCountdown();
    }
  });

  // BPM
  input.onCombo("shift", "<", () => input._startBpm(-1, input.lastComboCode));
  input.onCombo("shift", ">", () => input._startBpm(1, input.lastComboCode));

  input.onCombo("shift", "e", () => {
    if (!editorModal.isOpen()) editorModal.open();
  });

  input.onCombo("shift", "arrowleft", () => {
    if (timeline) timeline.scrollLeft -= timeline.clientWidth / 2;
  });
  input.onCombo("shift", "arrowright", () => {
    if (timeline) timeline.scrollLeft += timeline.clientWidth / 2;
  });
  input.onCombo("shift", "arrowup", () => {
    if (timeline) timeline.scrollTop -= 200;
  });
  input.onCombo("shift", "arrowdown", () => {
    if (timeline) timeline.scrollTop += 200;
  });

  input.mount();

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "audio/*";
  fileInput.style.display = "none";
  document.body.append(fileInput);
  fileInput.addEventListener("change", async(e) => {
    const target = /** @type {HTMLInputElement} */ (e.target);
    const file = target.files?.[0];
    if (file) {
      await engine.uploadAudioFile(file);
      input._updateDisplays();
      renderTimeline();
    }
  });

  input.onCombo("shift", "u", () => fileInput.click());

  input.onCombo("shift", "v", async () => {
    if (engine.isRecordingMic) {
      await engine.stopMicRecording();
      input._updateDisplays();
      renderTimeline();
    } else {
      const ok = await engine.startMicRecording();
      if (ok) {
        const recBtn = document.querySelector('[data-action="record"]');
        if (recBtn) recBtn.classList.add("active");
      }
    }
  });

  input.onCombo("shift", "l", () => {
    engine.toggleTrackLoop(state.currentTrack);
    renderTimeline();
  })

  input.onCombo("shift", "p", () => engine.exportProject());
  input.onCombo("shift", "o", () => engine.exportTrack(state.currentTrack));

  renderTimeline();
});
