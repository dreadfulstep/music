import { state } from "../state.js";

export class PianoRoll {
  /**
   * @param {string} canvasId
   */
  constructor(canvasId) {
    this.canvas = /** @type {HTMLCanvasElement|null} */ (
      document.getElementById(canvasId)
    );
    if (!this.canvas) return;
    this.ctx = /** @type {CanvasRenderingContext2D} */ (
      this.canvas.getContext("2d")
    );
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    if (!parent) return;
    this.canvas.width = parent.clientWidth;
    this.canvas.height = parent.clientHeight;
  }

  // Map note name to Y position (C3 bottom, C5 top)

  /**
   *
   * @param {string} note
   */
  _noteToY(note) {
    if (!this.canvas) return 0;
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
    const match = note.match(/^([A-G]#?)(\d)$/);
    if (!match) return 0;
    const [, name, oct] = match;
    const noteIdx = notes.indexOf(name);
    const octave = parseInt(oct);
    // C3 = 0, C5 = 24 semitones
    const semitone = (octave - 3) * 12 + noteIdx;
    const totalKeys = 25; // C3 to C5
    const keyHeight = this.canvas.height / totalKeys;
    return this.canvas.height - (semitone + 1) * keyHeight;
  }

  /**
   * @param {number} beat
   */
  _beatToX(beat) {
    if (!this.canvas) return 0;
    const beatsVisible = 16;
    return (beat / beatsVisible) * this.canvas.width;
  }

  draw() {
    if (!this.ctx || !this.canvas) return;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const ctx = this.ctx;

    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 16; i++) {
      const x = (i / 16) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

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
    for (let oct = 3; oct <= 5; oct++) {
      for (let i = 0; i < 12; i++) {
        if (oct === 5 && i > 0) break; // only C5
        const y = this._noteToY(notes[i] + oct);
        ctx.strokeStyle = notes[i].includes("#") ? "#151515" : "#1a1a1a";
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    const track = state.tracks[state.currentTrack];
    if (!track) return;

    ctx.fillStyle = track.color + "cc";

    track.notes.forEach((note) => {
      const x = this._beatToX(note.start);
      const w = this._beatToX(note.duration);
      const y = this._noteToY(note.pitch);
      const h = height / 25;
      ctx.fillRect(x, y, w, h);
    });

    if (state.isPlaying) {
      const beat = Tone.Transport.seconds / (60 / state.bpm);
      const x = this._beatToX(beat % 16);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  }
}
