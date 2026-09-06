import { engine } from "./audio/engine.js";
import { state } from "./state.js";

const PIXELS_PER_BEAT = 40;
const HEADER_W = 120;
const PIANO_W = 44;
const ROLL_X = HEADER_W + PIANO_W; // 164

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
 * @type {any[]}
 */
let liveNotes = [];

/** @param {any} notes */
export function setLiveNotes(notes) {
  liveNotes = Array.isArray(notes) ? notes : [];
}

/** @param {string} name @param {string} fb */
const css = (name, fb) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
  fb;

const dpr = () => Math.min(window.devicePixelRatio || 1, 2);

function transportBeat() {
  // @ts-ignore
  if (typeof Tone === "undefined" || !Tone.Transport) return 0;
  // @ts-ignore
  return Tone.Transport.seconds / (60 / state.bpm);
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {any} x
 * @param {any} y
 * @param {number} w
 * @param {number} h
 * @param {number} r
 */
function roundRect(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + r, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

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

  const prevLeft = timeline.scrollLeft;
  const prevTop = timeline.scrollTop;

  const playhead = document.getElementById("playhead");
  timeline.innerHTML = "";
  if (playhead) timeline.appendChild(playhead);

  let maxBeat = 16;
  state.tracks.forEach((t) => {
    t.notes.forEach((n) => (maxBeat = Math.max(maxBeat, n.start + n.duration)));
  });
  const avail = timeline.clientWidth > 0 ? timeline.clientWidth - (HEADER_W + PIANO_W) : 0;
  const timelineWidth = Math.max(800, maxBeat * PIXELS_PER_BEAT, avail);
  const totalWidth = HEADER_W + PIANO_W + timelineWidth;

  const rulerWrap = document.createElement("div");
  rulerWrap.className = "time-ruler";
  rulerWrap.style.width = "100%";
  rulerWrap.style.minWidth = totalWidth + "px";

  const rulerCanvas = document.createElement("canvas");
  const rdpr = dpr();
  rulerCanvas.width = totalWidth * rdpr;
  rulerCanvas.height = 24 * rdpr;
  rulerCanvas.style.height = "24px";
  rulerCanvas.style.width = totalWidth + "px";

  rulerWrap.appendChild(rulerCanvas);
  timeline.appendChild(rulerWrap);

  const rulerCtx = rulerCanvas.getContext("2d");
  if (rulerCtx) {
    rulerCtx.setTransform(rdpr, 0, 0, rdpr, 0, 0);

    const secondsPerbeat = 60 / state.bpm;

    rulerCtx.fillStyle = css("--surface", "#111");
    rulerCtx.fillRect(0, 0, totalWidth, 24);

    rulerCtx.fillStyle = css("--foreground-tertiary", "#666");
    rulerCtx.font = "10px ui-monospace, monospace";
    rulerCtx.textBaseline = "middle";

    for (let i = 0; i <= maxBeat; i++) {
      const x = i * PIXELS_PER_BEAT + ROLL_X; // offset by header+piano width
      const isMeasure = i % 4 === 0;
      rulerCtx.strokeStyle = isMeasure
        ? css("--border-strong", "rgba(128,128,128,0.3)")
        : css("--border", "rgba(128,128,128,0.15)");
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

  state.tracks.forEach((track, trackIdx) => {
    const lane = document.createElement("div");
    lane.className =
      "track-lane" + (track.id === state.currentTrack ? " active" : "");
    lane.dataset.trackId = String(track.id);

    const header = document.createElement("div");
    header.className = "track-lane-header";
    header.innerHTML = `
            <div style="width:3px;height:100%;background:${track.color};border-radius:2px;"></div>
            <div style="display:flex;flex-direction:column;">
                <span style="font-size:0.75rem;font-weight:500;">${track.name}</span>
                <span style="font-size:0.65rem;color:var(--foreground-tertiary);text-transform:uppercase;">${track.preset}</span>
            </div>
            ${track.muted ? '<span style="font-size:0.6rem;background:var(--border);color:var(--foreground-secondary);padding:1px 4px;border-radius:3px;margin-left:auto;">M</span>' : ""}
        `;

    const pianoRoll = document.createElement("div");
    pianoRoll.className = "piano-roll";
    const pianoCanvas = document.createElement("canvas");
    const pdpr = dpr();
    pianoCanvas.width = PIANO_W * pdpr;
    pianoCanvas.height = LANE_HEIGHT * pdpr;
    pianoCanvas.style.width = PIANO_W + "px";
    pianoCanvas.style.height = LANE_HEIGHT + "px";
    pianoRoll.appendChild(pianoCanvas);

    const pCtx = pianoCanvas.getContext("2d");
    if (pCtx) {
      pCtx.setTransform(pdpr, 0, 0, pdpr, 0, 0);
      const rowH = LANE_HEIGHT / SEMITONES;
      pCtx.fillStyle = "#f2f2f5";
      pCtx.fillRect(0, 0, PIANO_W, LANE_HEIGHT);
      for (let i = 0; i < SEMITONES; i++) {
        const y = i * rowH;
        const ni = i % 12;
        const isSharp =
          ni === 1 || ni === 3 || ni === 6 || ni === 8 || ni === 10;
        if (isSharp) {
          pCtx.fillStyle = "#17171d";
          pCtx.fillRect(0, y, PIANO_W, rowH);
        }
        pCtx.strokeStyle = "rgba(0,0,0,0.18)";
        pCtx.beginPath();
        pCtx.moveTo(0, y);
        pCtx.lineTo(PIANO_W, y);
        pCtx.stroke();
      }
    }

    const wrap = document.createElement("div");
    wrap.className = "track-lane-roll";

    wrap.style.width = timelineWidth + "px";
    wrap.style.minWidth = timelineWidth + "px";
    wrap.style.flex = "1 0 auto";

    const canvas = document.createElement("canvas");
    const cpdr = dpr();
    canvas.className = "track-roll-canvas";
    canvas.width = timelineWidth * cpdr;
    canvas.height = LANE_HEIGHT * cpdr;
    canvas.style.width = timelineWidth + "px";
    canvas.style.height = LANE_HEIGHT + "px";

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.setTransform(cpdr, 0, 0, cpdr, 0, 0);
      ctx.fillStyle = css("--background", "#0a0a0c");
      ctx.fillRect(0, 0, timelineWidth, LANE_HEIGHT);

      const rowH = LANE_HEIGHT / SEMITONES;

      for (let i = 0; i <= SEMITONES; i++) {
        const y = i * rowH;
        const ni = i % 12;
        const isSharp =
          ni === 1 || ni === 3 || ni === 6 || ni === 8 || ni === 10;
        ctx.globalAlpha = isSharp ? 0.7 : 0.35;
        ctx.strokeStyle = css("--border", "rgba(128,128,128,0.15)");
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(timelineWidth, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      for (let i = 0; i <= maxBeat; i++) {
        const x = i * PIXELS_PER_BEAT;
        const isMeasure = i % 4 === 0;
        ctx.lineWidth = isMeasure ? 1.5 : 0.5;
        ctx.strokeStyle = isMeasure
          ? css("--border-strong", "rgba(128,128,128,0.3)")
          : css("--border", "rgba(128,128,128,0.15)");
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, LANE_HEIGHT);
        ctx.stroke();
      }
      ctx.lineWidth = 1;

      if (track.type === "audio") {
        const buffer = engine.audioBuffers.get(track.id);
        if (buffer) {
          const durBeats = track.duration || buffer.duration * (state.bpm / 60);
          const drawW = durBeats * PIXELS_PER_BEAT;
          drawWaveform(
            ctx,
            buffer,
            0,
            0,
            Math.min(drawW, timelineWidth),
            LANE_HEIGHT,
            track.color,
          );
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

          roundRect(ctx, x, y, w, h, 3);
          ctx.fill();
          ctx.globalAlpha = 1;

          // Pitch label if fwide enough
          if (w > 30) {
            ctx.fillStyle = css("--background", "#000");
            ctx.font = "bold 9px ui-monospace, monospace";
            ctx.textBaseline = "middle";
            ctx.fillText(note.pitch, x + 4, y + h / 2);
          }

          liveNotes
            .filter((n) => n.trackIdx === trackIdx)
            .forEach((n) => {
              const semi = pitchToSemitone(n.pitch);
              const y = LANE_HEIGHT - (semi + 1) * rowH;
              const x = n.start * PIXELS_PER_BEAT;
              const w = Math.max(
                8,
                (transportBeat() - n.start) * PIXELS_PER_BEAT,
              );
              ctx.globalAlpha = 0.35;
              ctx.fillStyle = track.color;
              roundRect(ctx, x, y, w, rowH - 1, 3);
              ctx.fill();
              ctx.globalAlpha = 0.9;
              ctx.strokeStyle = track.color;
              ctx.lineWidth = 1;
              roundRect(ctx, x, y, w, rowH - 1, 3);
              ctx.stroke();
              ctx.globalAlpha = 1;
            });
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
