import { input } from "./input.js";
import { state } from "./state.js";
import { engine } from "./audio/engine.js";
import { renderTimeline } from "./timeline.js";
import { editorModal } from "./ui/editor.js";
import { projectManager } from "./project.js";

const timeline = document.getElementById("timeline");
const playhead = document.getElementById("playhead");
/** @type {number | null | undefined} */
let countdownInterval = null;
let lastNoteCount = -1;

const THEME_KEY = "midia.theme";

(function applyTheme() {
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t === "light" || t === "dark") {
      document.documentElement.setAttribute("data-theme", t);
    }
  } catch {}
})();

// @ts-ignore
if (window.lucide) lucide.createIcons();

function updatePlayhead() {
  if (!state.isPlaying || !timeline || !playhead) return;

  const beat = Tone.Transport.seconds / (60 / state.bpm);
  const x = beat * 40 + 164;
  playhead.style.left = x + "px";

  const scrollLeft = timeline?.scrollLeft;
  const viewWidth = timeline?.clientWidth;

  if (x > scrollLeft + viewWidth - 100) timeline.scrollLeft = x - 100;

  const timeEl =
    document.getElementById("time-display") ||
    document.querySelector(".nav-readout:nth-child(2)");
  if (timeEl) {
    const s = Tone.Transport.seconds;
    const mm = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const ss = Math.floor(s % 60)
      .toString()
      .padStart(2, "0");
    const ms = Math.floor((s % 1) * 100)
      .toString()
      .padStart(2, "0");
    timeEl.textContent = `${mm}:${ss}:${ms}`;
  }

  if (state.isRecording) {
    const count = state.tracks.reduce((acc, t) => acc + t.notes.length, 0);
    if (count != lastNoteCount) {
      lastNoteCount = count;
      renderTimeline();
    }
  } else {
    lastNoteCount = -1;
  }

  requestAnimationFrame(updatePlayhead);
}

function updateTransportButtons() {
  const playBtn = document.querySelector('[data-action="play"]');
  const stopBtn = document.querySelector('[data-action="stop"]');
  const recBtn = document.querySelector('[data-action="record"]');
  if (playBtn) playBtn.classList.toggle("active", state.isPlaying);
  if (stopBtn) stopBtn.classList.remove("active");
  if (recBtn) {
    recBtn.classList.remove("active", "counting");
    if (state.isRecording) recBtn.classList.add("active");
    else if (state.isCountingIn) recBtn.classList.add("counting");
  }
  const stateEl = document.getElementById("play-state");
  if (stateEl) {
    stateEl.textContent = state.isRecording
      ? "Recording"
      : state.isCountingIn
        ? "Count-in"
        : state.isPlaying
          ? "Playing"
          : "Stopped";
    stateEl.classList.toggle("active", state.isPlaying && !state.isRecording);
    stateEl.classList.toggle("recording", state.isRecording);
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
  input.flushPendingNotes();
  engine.stopTransport();
  state.isRecording = false;
  state.isCountingIn = false;
  state.isPlaying = false;
  clearCountdown();
  updateTransportButtons();
  if (playhead) playhead.style.left = "164px";
  renderTimeline();
}

function toggleRecord() {
  if (state.isRecording || state.isCountingIn) stopAll();
  else startCountdown();
}

function togglePlay() {
  if (state.isPlaying) {
    stopAll();
  } else {
    stopAll();
    engine.startTransport();
    updatePlayhead();
    updateTransportButtons();
  }
}

function startCountdown() {
  input.clearPendingNotes();

  if (!input.audioReady) {
    input
      ._ensureAudio()
      .catch((err) => console.error("Audio init failed", err));
  }

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

      if (overlay) overlay.style.display = "none";
      updateTransportButtons();

      try {
        if (!state.isPlaying) engine.startTransport();
        if (!state.isPlaying) state.isPlaying = true;
      } catch (err) {
        console.error("Transport failed to start", err);
      }

      lastNoteCount = -1;
      updatePlayhead();
    }
  }, 1000);
}

function watchTheme() {
  const root = document.documentElement;
  new MutationObserver(() => {
    const t = root.getAttribute("data-theme") === "light" ? "light" : "dark";
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {}
    renderTimeline();
    if (editorModal.isOpen()) editorModal.refreshTheme();
  }).observe(root, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
}

/** @type {any} */
let resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    renderTimeline();
  }, 150);
});

document.addEventListener("DOMContentLoaded", async () => {
  projectManager.show();

  input.onKey(" ", togglePlay, { preventDefault: true });

  input.onCombo("shift", "1", () => {
    if (editorModal.isOpen()) return;
    editorModal.open("tracks");
  });

  input.onCombo("shift", "2", () => {
    if (editorModal.isOpen()) return;
    editorModal.open("synth");
  });

  input.onCombo("shift", "3", () => {
    if (editorModal.isOpen()) return;
    editorModal.open("tracks");
    editorModal.beginNewTrack();
  });

  // Mute
  input.onCombo("shift", "m", () => {
    const t = state.tracks[state.currentTrack];
    if (t) {
      t.muted = !t.muted;
      input._updateDisplays();
      renderTimeline();
    }
  });

  // Record
  input.onCombo("shift", "r", toggleRecord);

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
  fileInput.addEventListener("change", async (e) => {
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
  });

  input.onCombo("shift", "p", () => projectManager.exportJSON());
  input.onCombo(["ctrl", "shift"], "p", () => engine.exportProject());
  input.onCombo("shift", "o", () => engine.exportTrack(state.currentTrack));

  renderTimeline();
  watchTheme();
});
