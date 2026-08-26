export const state = {
  bpm: 120,
  isPlaying: false,
  isRecording: false,
  currentTrack: 0,
  playheadBeat: 0,

  /**
   * @typedef {Object} Track
   * @property {number} id
   * @property {string} name
   * @property {string} color
   * @property {string} type
   * @property {string} preset
   * @property {boolean} muted
   * @property {any[]} notes
   */
  tracks: [
    {
      id: 0,
      name: "Lead",
      color: "#ff6b9d",
      type: "synth",
      preset: "pluck",
      muted: false,
      notes: [],
    },
  ],

  keymap: {
    a: "C4",
    w: "C#4",
    s: "D4",
    e: "D#4",
    d: "E4",
    f: "F4",
    t: "F#4",
    g: "G4",
    y: "G#4",
    h: "A4",
    u: "A#4",
    j: "B4",
    k: "C5",
    z: "C3",
    x: "D3",
    c: "E3",
    v: "F3",
    b: "G3",
    n: "A3",
    m: "B3",
  },
};
