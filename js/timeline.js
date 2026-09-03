import { engine } from "./audio/engine.js";
import { state } from "./state.js";

const PIXELS_PER_BEAT = 40;

const SEMITONES = 25; // C3 to C5
const LANE_HEIGHT = 125;
const NOTE_NAMES = [
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

/**
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {import("tone").ToneAudioBuffer} buffer
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {string} color
 * @returns
 */
function drawWaveform(ctx, buffer, x, y, w, h, color) {
  if (!buffer) return;
  const width = Math.floor(w);
  const peaks = new Float32Array(width);
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < width; i++) {
      const start = Math.floor((i / width) * data.length);
      const end = Math.floor(((i + 1) / width) * data.length);
      let max = 0;
      for (let j = start; j < end; j++) max = Math.max(max, Math.abs(data[j]));
      peaks[i] = Math.max(peaks[i], max);
    }
  }
  ctx.fillStyle = color + "cc";
  const halfH = h / 2;
  for (let i = 0; i < width; i++) {
    const barH = peaks[i] * halfH;
    ctx.fillRect(x + i, y + halfH - barH, 1, barH * 2);
  }
}

/** @param {string} pitch */
function pitchToSemitone(pitch) {
  const m = pitch.match(/^([A-G]#?)(\d)$/);
  if (!m) return 12;
  return (parseInt(m[2]) - 3) * 12 + NOTE_NAMES.indexOf(m[1]);
}

export function renderTimeline() {
  const timeline = document.getElementById("timeline");
  if (!timeline) return;

  const playhead = document.getElementById("playhead");
  timeline.innerHTML = "";
  if (playhead) timeline.appendChild(playhead);

  let maxBeat = 16;
  state.tracks.forEach((t) => {
    t.notes.forEach((n) => (maxBeat = Math.max(maxBeat, n.start + n.duration)));
  });
  const timelineWidth = Math.max(800, maxBeat * PIXELS_PER_BEAT);

  const rulerWrap = document.createElement("div");
  rulerWrap.className = "time-ruler";
  rulerWrap.style.width = "100%";
  rulerWrap.style.minWidth = 120 + 44 + timelineWidth + "px";

  const rulerCanvas = document.createElement("canvas");
  rulerCanvas.height = 24;
  rulerCanvas.style.height = "24px";
  rulerCanvas.style.width = 120 + 44 + timelineWidth + "px";
  rulerCanvas.width =
    (120 + 44 + timelineWidth) * (window.devicePixelRatio || 1);
  rulerWrap.appendChild(rulerCanvas);
  timeline.appendChild(rulerWrap);

  const rulerCtx = rulerCanvas.getContext("2d");
  if (rulerCtx) {
    const dpr = window.devicePixelRatio || 1;
    rulerCtx.scale(dpr, dpr);
    const bpm = state.bpm;
    const secondsPerbeat = 60 / bpm;
    rulerCtx.clearRect(0, 0, 120 + 44 + timelineWidth, 24);
    rulerCtx.fillStyle =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--surface")
        .trim() || "#111";
    rulerCtx.fillRect(0, 0, 120 + 44 + timelineWidth, 24);
    rulerCtx.fillStyle =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--foreground-tertiary")
        .trim() || "#888";
    rulerCtx.font = "10px ui-monospace, monospace";
    rulerCtx.textBaseline = "middle";
    for (let i = 0; i <= maxBeat; i++) {
      const x = i * PIXELS_PER_BEAT + 164; // offset by header+piano width
      const isMeasure = i % 4 === 0;
      rulerCtx.strokeStyle = isMeasure
        ? getComputedStyle(document.documentElement)
            .getPropertyValue("--border-strong")
            .trim()
        : getComputedStyle(document.documentElement)
            .getPropertyValue("--border")
            .trim();
      rulerCtx.beginPath();
      rulerCtx.moveTo(x, isMeasure ? 0 : 12);
      rulerCtx.lineTo(x, 24);
      rulerCtx.stroke();
      if (isMeasure) {
        rulerCtx.fillText(String(i), x + 3, 10);
        rulerCtx.fillText(Math.round(i * secondsPerbeat) + "s", x + 3, 20);
      }
    }
  }

  state.tracks.forEach((track) => {
    const lane = document.createElement("div");
    lane.className =
      "track-lane" + (track.id === state.currentTrack ? " active" : "");
    lane.dataset.trackId = String(track.id);

    const header = document.createElement("div");
    header.className = "track-lane-header";
    header.innerHTML = `
            <div style="width: 3px;height:100%;background:${track.color};border-radius:2px;"></div>
            <div style="display:flex;flex-direction:column;">
                <span style="font-size:0.75rem;font-weight:500;">${track.name}</span>
                <span style="font-size:0.65rem;color:var(--foreground-tertiary);text-transform:uppercase;">${track.preset}</span>
            </div>
            ${track.muted ? '<span style="font-size:0.6rem;background:var(--accent);color:var(--background);padding:1px 4px;border-radius:3px;margin-left:auto;">M</span>' : ""}
        `;

    const pianoRoll = document.createElement("div");
    pianoRoll.className = "piano-roll";
    const pianoCanvas = document.createElement("canvas");
    pianoCanvas.width = 44 * (window.devicePixelRatio || 1);
    pianoCanvas.height = LANE_HEIGHT * (window.devicePixelRatio || 1);
    pianoCanvas.style.width = "44px";
    pianoCanvas.style.height = LANE_HEIGHT + "px";
    pianoRoll.appendChild(pianoCanvas);

    const pCtx = pianoCanvas.getContext("2d");
    if (pCtx) {
      const dpr = window.devicePixelRatio || 1;
      pCtx.scale(dpr, dpr);
      const rowH = LANE_HEIGHT / SEMITONES;
      pCtx.clearRect(0, 0, 44, LANE_HEIGHT);
      pCtx.fillStyle =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--surface")
          .trim() || "#1a1a1a";
      pCtx.fillRect(0, 0, 44, LANE_HEIGHT);
      for (let i = 0; i < SEMITONES; i++) {
        const y = i * rowH;
        const ni = i % 12;
        const isSharp =
          ni === 1 || ni === 3 || ni === 6 || ni === 8 || ni === 10;
        if (isSharp) {
          pCtx.fillStyle = "rgba(0,0,0,0.35)";
          pCtx.fillRect(0, y, 44, rowH);
        }
        if (ni === 0) {
          pCtx.fillStyle =
            getComputedStyle(document.documentElement)
              .getPropertyValue("--foreground-tertiary")
              .trim() || "#666";
          pCtx.font = "9px ui-monospace, monospace";
          pCtx.fillText("C" + (Math.floor(i / 12) + 3), 4, y + rowH - 4);
        }
        pCtx.strokeStyle = "rgba(255,255,255,0.04)";
        pCtx.beginPath();
        pCtx.moveTo(0, y);
        pCtx.lineTo(44, y);
        pCtx.stroke();
      }
    }

    const wrap = document.createElement("div");
    wrap.className = "track-lane-roll";

    wrap.style.width = timelineWidth + "px";

    const dpr = window.devicePixelRatio || 1;

    const canvas = document.createElement("canvas");
    canvas.className = "track-roll-canvas";
    canvas.width = timelineWidth * dpr;
    canvas.height = LANE_HEIGHT * dpr;
    canvas.style.width = timelineWidth + "px";
    canvas.style.height = LANE_HEIGHT + "px";

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, timelineWidth, LANE_HEIGHT);
      ctx.fillStyle =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--background")
          .trim() || "#0a0a0c";
      ctx.fillRect(0, 0, timelineWidth, LANE_HEIGHT);

      const rowH = LANE_HEIGHT / SEMITONES;

      for (let i = 0; i <= SEMITONES; i++) {
        const y = i * rowH;
        const ni = i % 12;
        const isSharp =
          ni === 1 || ni === 3 || ni === 6 || ni === 8 || ni === 10;
        ctx.strokeStyle = isSharp
          ? "rgba(255,255,255,0.06)"
          : "rgba(255,255,255,0.03)";
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(timelineWidth, y);
        ctx.stroke();
      }

      for (let i = 0; i <= maxBeat; i++) {
        const x = i * PIXELS_PER_BEAT;
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
        ctx.lineTo(x, LANE_HEIGHT);
        ctx.stroke();
      }

      if (track.type === "audio") {
        const buffer = engine.audioBuffers.get(track.id);
        if (buffer) {
          const durBeats = track.duration || buffer.duration * (state.bpm / 60);
          const drawW = durBeats * PIXELS_PER_BEAT;
          drawWaveform(ctx, buffer, 0, 0, Math.min(drawW, timelineWidth), LANE_HEIGHT, track.color);
        }
        if (track.loop) {
          ctx.fillStyle = track.color;
          ctx.font = "bold 10px ui-monospace, monospace";
          ctx.fillText("LOOP", 8, 14);
        }
      } else {
        track.notes.forEach((note) => {
          const x = note.start * PIXELS_PER_BEAT;
          const w = Math.max(4, note.duration * PIXELS_PER_BEAT);
          const semi = pitchToSemitone(note.pitch);
          const y = LANE_HEIGHT - (semi + 1) * rowH;
          const h = rowH - 1;

          ctx.fillStyle = track.color;
          ctx.globalAlpha = 0.85;

          // This is insane just to have rounded corners holy
          const r = 3;
          ctx.beginPath();
          ctx.moveTo(x + r, y);
          ctx.lineTo(x + w - r, y);
          ctx.quadraticCurveTo(x + w, y, x + w, y + r);
          ctx.lineTo(x + w, y + h - r);
          ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
          ctx.lineTo(x + r, y + h);
          ctx.quadraticCurveTo(x, y + h, x, y + h - r);
          ctx.lineTo(x, y + r);
          ctx.quadraticCurveTo(x, y, x + r, y);
          ctx.closePath();
          ctx.fill();

          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;

          // Pitch label if fwide enough
          if (w > 30) {
            ctx.fillStyle = "#0000";
            ctx.font = "bold 9px ui-monospace, monospace";
            ctx.textBaseline = "middle";
            ctx.fillText(note.pitch, x + 4, y + h / 2);
          }
        });
      }
    }

    wrap.appendChild(canvas);
    lane.appendChild(header);
    lane.appendChild(pianoRoll);
    lane.appendChild(wrap);
    timeline.appendChild(lane);
  });
}
