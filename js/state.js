/**
 * @typedef {Object} Note
 * @property {string} pitch
 * @property {number} start
 * @property {number} duration
 */

/**
 * @typedef {Object} Track
 * @property {number} id
 * @property {string} name
 * @property {string} color
 * @property {string} type
 * @property {string} preset
 * @property {boolean} loop
 * @property {boolean} muted
 * @property {Note[]} notes
 * @property {string} [audioUrl]
 * @property {number} [duration]
 */
export const state = {
  bpm: 120,
  isPlaying: false,
  isRecording: false,
  isCountingIn: false,
  currentTrack: 0,
  playheadBeat: 0,

  /** @type {Track[]} */
tracks: [
  {
    "id": 0,
    "name": "Pad",
    "color": "#a78bfa",
    "type": "synth",
    "loop": false,
    "preset": "pad",
    "muted": false,
    "notes": [
      {
        "pitch": "C3",
        "start": 0,
        "duration": 4
      },
      {
        "pitch": "D#3",
        "start": 0,
        "duration": 4
      },
      {
        "pitch": "G3",
        "start": 0,
        "duration": 4
      },
      {
        "pitch": "C3",
        "start": 4,
        "duration": 4
      },
      {
        "pitch": "D#3",
        "start": 4,
        "duration": 4
      },
      {
        "pitch": "G3",
        "start": 4,
        "duration": 4
      },
      {
        "pitch": "C3",
        "start": 8,
        "duration": 4
      },
      {
        "pitch": "D#3",
        "start": 8,
        "duration": 4
      },
      {
        "pitch": "G3",
        "start": 8,
        "duration": 4
      },
      {
        "pitch": "C3",
        "start": 12,
        "duration": 4
      },
      {
        "pitch": "D#3",
        "start": 12,
        "duration": 4
      },
      {
        "pitch": "G3",
        "start": 12,
        "duration": 4
      },
      {
        "pitch": "G#3",
        "start": 16,
        "duration": 4
      },
      {
        "pitch": "C4",
        "start": 16,
        "duration": 4
      },
      {
        "pitch": "D#4",
        "start": 16,
        "duration": 4
      },
      {
        "pitch": "G#3",
        "start": 20,
        "duration": 4
      },
      {
        "pitch": "C4",
        "start": 20,
        "duration": 4
      },
      {
        "pitch": "D#4",
        "start": 20,
        "duration": 4
      },
      {
        "pitch": "D#3",
        "start": 24,
        "duration": 4
      },
      {
        "pitch": "G3",
        "start": 24,
        "duration": 4
      },
      {
        "pitch": "A#3",
        "start": 24,
        "duration": 4
      },
      {
        "pitch": "D#3",
        "start": 28,
        "duration": 4
      },
      {
        "pitch": "G3",
        "start": 28,
        "duration": 4
      },
      {
        "pitch": "A#3",
        "start": 28,
        "duration": 4
      },
      {
        "pitch": "A#3",
        "start": 32,
        "duration": 4
      },
      {
        "pitch": "D4",
        "start": 32,
        "duration": 4
      },
      {
        "pitch": "F4",
        "start": 32,
        "duration": 4
      },
      {
        "pitch": "A#3",
        "start": 36,
        "duration": 4
      },
      {
        "pitch": "D4",
        "start": 36,
        "duration": 4
      },
      {
        "pitch": "F4",
        "start": 36,
        "duration": 4
      },
      {
        "pitch": "C3",
        "start": 40,
        "duration": 4
      },
      {
        "pitch": "D#3",
        "start": 40,
        "duration": 4
      },
      {
        "pitch": "G3",
        "start": 40,
        "duration": 4
      },
      {
        "pitch": "C3",
        "start": 44,
        "duration": 4
      },
      {
        "pitch": "D#3",
        "start": 44,
        "duration": 4
      },
      {
        "pitch": "G3",
        "start": 44,
        "duration": 4
      },
      {
        "pitch": "G#3",
        "start": 48,
        "duration": 4
      },
      {
        "pitch": "C4",
        "start": 48,
        "duration": 4
      },
      {
        "pitch": "D#4",
        "start": 48,
        "duration": 4
      },
      {
        "pitch": "G#3",
        "start": 52,
        "duration": 4
      },
      {
        "pitch": "C4",
        "start": 52,
        "duration": 4
      },
      {
        "pitch": "D#4",
        "start": 52,
        "duration": 4
      },
      {
        "pitch": "D#3",
        "start": 56,
        "duration": 4
      },
      {
        "pitch": "G3",
        "start": 56,
        "duration": 4
      },
      {
        "pitch": "A#3",
        "start": 56,
        "duration": 4
      },
      {
        "pitch": "D#3",
        "start": 60,
        "duration": 4
      },
      {
        "pitch": "G3",
        "start": 60,
        "duration": 4
      },
      {
        "pitch": "A#3",
        "start": 60,
        "duration": 4
      },
      {
        "pitch": "C3",
        "start": 64,
        "duration": 4
      },
      {
        "pitch": "D#3",
        "start": 64,
        "duration": 4
      },
      {
        "pitch": "G3",
        "start": 64,
        "duration": 4
      },
      {
        "pitch": "G3",
        "start": 68,
        "duration": 4
      },
      {
        "pitch": "A#3",
        "start": 68,
        "duration": 4
      },
      {
        "pitch": "D4",
        "start": 68,
        "duration": 4
      },
      {
        "pitch": "G#3",
        "start": 72,
        "duration": 4
      },
      {
        "pitch": "C4",
        "start": 72,
        "duration": 4
      },
      {
        "pitch": "D#4",
        "start": 72,
        "duration": 4
      },
      {
        "pitch": "A#3",
        "start": 76,
        "duration": 4
      },
      {
        "pitch": "D4",
        "start": 76,
        "duration": 4
      },
      {
        "pitch": "F4",
        "start": 76,
        "duration": 4
      },
      {
        "pitch": "C3",
        "start": 80,
        "duration": 4
      },
      {
        "pitch": "D#3",
        "start": 80,
        "duration": 4
      },
      {
        "pitch": "G3",
        "start": 80,
        "duration": 4
      },
      {
        "pitch": "C3",
        "start": 84,
        "duration": 4
      },
      {
        "pitch": "D#3",
        "start": 84,
        "duration": 4
      },
      {
        "pitch": "G3",
        "start": 84,
        "duration": 4
      },
      {
        "pitch": "G#3",
        "start": 88,
        "duration": 4
      },
      {
        "pitch": "C4",
        "start": 88,
        "duration": 4
      },
      {
        "pitch": "D#4",
        "start": 88,
        "duration": 4
      },
      {
        "pitch": "A#3",
        "start": 92,
        "duration": 4
      },
      {
        "pitch": "D4",
        "start": 92,
        "duration": 4
      },
      {
        "pitch": "F4",
        "start": 92,
        "duration": 4
      },
      {
        "pitch": "C3",
        "start": 96,
        "duration": 4
      },
      {
        "pitch": "D#3",
        "start": 96,
        "duration": 4
      },
      {
        "pitch": "G3",
        "start": 96,
        "duration": 4
      },
      {
        "pitch": "C3",
        "start": 100,
        "duration": 4
      },
      {
        "pitch": "D#3",
        "start": 100,
        "duration": 4
      },
      {
        "pitch": "G3",
        "start": 100,
        "duration": 4
      },
      {
        "pitch": "D#3",
        "start": 104,
        "duration": 4
      },
      {
        "pitch": "G3",
        "start": 104,
        "duration": 4
      },
      {
        "pitch": "A#3",
        "start": 104,
        "duration": 4
      },
      {
        "pitch": "D#3",
        "start": 108,
        "duration": 4
      },
      {
        "pitch": "G3",
        "start": 108,
        "duration": 4
      },
      {
        "pitch": "A#3",
        "start": 108,
        "duration": 4
      },
      {
        "pitch": "C3",
        "start": 112,
        "duration": 4
      },
      {
        "pitch": "D#3",
        "start": 112,
        "duration": 4
      },
      {
        "pitch": "G3",
        "start": 112,
        "duration": 4
      },
      {
        "pitch": "C3",
        "start": 116,
        "duration": 4
      },
      {
        "pitch": "D#3",
        "start": 116,
        "duration": 4
      },
      {
        "pitch": "G3",
        "start": 116,
        "duration": 4
      },
      {
        "pitch": "C4",
        "start": 0,
        "duration": 8
      },
      {
        "pitch": "D#4",
        "start": 0,
        "duration": 8
      },
      {
        "pitch": "G4",
        "start": 0,
        "duration": 8
      },
      {
        "pitch": "C4",
        "start": 8,
        "duration": 8
      },
      {
        "pitch": "D#4",
        "start": 8,
        "duration": 8
      },
      {
        "pitch": "G4",
        "start": 8,
        "duration": 8
      },
      {
        "pitch": "G#4",
        "start": 16,
        "duration": 8
      },
      {
        "pitch": "C5",
        "start": 16,
        "duration": 8
      },
      {
        "pitch": "D#4",
        "start": 24,
        "duration": 8
      },
      {
        "pitch": "G4",
        "start": 24,
        "duration": 8
      },
      {
        "pitch": "A#4",
        "start": 24,
        "duration": 8
      },
      {
        "pitch": "A#4",
        "start": 32,
        "duration": 8
      },
      {
        "pitch": "C4",
        "start": 40,
        "duration": 8
      },
      {
        "pitch": "D#4",
        "start": 40,
        "duration": 8
      },
      {
        "pitch": "G4",
        "start": 40,
        "duration": 8
      },
      {
        "pitch": "G#4",
        "start": 48,
        "duration": 8
      },
      {
        "pitch": "C5",
        "start": 48,
        "duration": 8
      },
      {
        "pitch": "D#4",
        "start": 56,
        "duration": 8
      },
      {
        "pitch": "G4",
        "start": 56,
        "duration": 8
      },
      {
        "pitch": "A#4",
        "start": 56,
        "duration": 8
      },
      {
        "pitch": "C4",
        "start": 64,
        "duration": 8
      },
      {
        "pitch": "D#4",
        "start": 64,
        "duration": 8
      },
      {
        "pitch": "G4",
        "start": 64,
        "duration": 8
      },
      {
        "pitch": "G#4",
        "start": 72,
        "duration": 8
      },
      {
        "pitch": "C5",
        "start": 72,
        "duration": 8
      },
      {
        "pitch": "C4",
        "start": 80,
        "duration": 8
      },
      {
        "pitch": "D#4",
        "start": 80,
        "duration": 8
      },
      {
        "pitch": "G4",
        "start": 80,
        "duration": 8
      },
      {
        "pitch": "G#4",
        "start": 88,
        "duration": 8
      },
      {
        "pitch": "C5",
        "start": 88,
        "duration": 8
      },
      {
        "pitch": "C4",
        "start": 96,
        "duration": 8
      },
      {
        "pitch": "D#4",
        "start": 96,
        "duration": 8
      },
      {
        "pitch": "G4",
        "start": 96,
        "duration": 8
      },
      {
        "pitch": "D#4",
        "start": 104,
        "duration": 8
      },
      {
        "pitch": "G4",
        "start": 104,
        "duration": 8
      },
      {
        "pitch": "A#4",
        "start": 104,
        "duration": 8
      },
      {
        "pitch": "C4",
        "start": 112,
        "duration": 8
      },
      {
        "pitch": "D#4",
        "start": 112,
        "duration": 8
      },
      {
        "pitch": "G4",
        "start": 112,
        "duration": 8
      }
    ]
  },
  {
    "id": 1,
    "name": "Bass",
    "color": "#4ecdc4",
    "type": "synth",
    "preset": "subBass",
    "muted": false,
    "notes": [
      {
        "pitch": "C3",
        "start": 0,
        "duration": 3.5
      },
      {
        "pitch": "C3",
        "start": 4,
        "duration": 3.5
      },
      {
        "pitch": "C3",
        "start": 8,
        "duration": 3.5
      },
      {
        "pitch": "C3",
        "start": 12,
        "duration": 3.5
      },
      {
        "pitch": "G#3",
        "start": 16,
        "duration": 1.5
      },
      {
        "pitch": "G#3",
        "start": 18,
        "duration": 1.5
      },
      {
        "pitch": "G#3",
        "start": 20,
        "duration": 1.5
      },
      {
        "pitch": "G#3",
        "start": 22,
        "duration": 1.5
      },
      {
        "pitch": "D#3",
        "start": 24,
        "duration": 1.5
      },
      {
        "pitch": "D#3",
        "start": 26,
        "duration": 1.5
      },
      {
        "pitch": "D#3",
        "start": 28,
        "duration": 1.5
      },
      {
        "pitch": "D#3",
        "start": 30,
        "duration": 1.5
      },
      {
        "pitch": "A#3",
        "start": 32,
        "duration": 0.75
      },
      {
        "pitch": "A#3",
        "start": 33,
        "duration": 0.75
      },
      {
        "pitch": "F3",
        "start": 34,
        "duration": 0.75
      },
      {
        "pitch": "A#3",
        "start": 35,
        "duration": 0.75
      },
      {
        "pitch": "A#3",
        "start": 36,
        "duration": 0.75
      },
      {
        "pitch": "A#3",
        "start": 37,
        "duration": 0.75
      },
      {
        "pitch": "F3",
        "start": 38,
        "duration": 0.75
      },
      {
        "pitch": "A#3",
        "start": 39,
        "duration": 0.75
      },
      {
        "pitch": "C3",
        "start": 40,
        "duration": 0.75
      },
      {
        "pitch": "C3",
        "start": 41,
        "duration": 0.75
      },
      {
        "pitch": "G3",
        "start": 42,
        "duration": 0.75
      },
      {
        "pitch": "C3",
        "start": 43,
        "duration": 0.75
      },
      {
        "pitch": "C3",
        "start": 44,
        "duration": 0.75
      },
      {
        "pitch": "C3",
        "start": 45,
        "duration": 0.75
      },
      {
        "pitch": "G3",
        "start": 46,
        "duration": 0.75
      },
      {
        "pitch": "C3",
        "start": 47,
        "duration": 0.75
      },
      {
        "pitch": "G#3",
        "start": 48,
        "duration": 0.75
      },
      {
        "pitch": "G#3",
        "start": 49,
        "duration": 0.75
      },
      {
        "pitch": "D#3",
        "start": 50,
        "duration": 0.75
      },
      {
        "pitch": "G#3",
        "start": 51,
        "duration": 0.75
      },
      {
        "pitch": "G#3",
        "start": 52,
        "duration": 0.75
      },
      {
        "pitch": "G#3",
        "start": 53,
        "duration": 0.75
      },
      {
        "pitch": "D#3",
        "start": 54,
        "duration": 0.75
      },
      {
        "pitch": "G#3",
        "start": 55,
        "duration": 0.75
      },
      {
        "pitch": "D#3",
        "start": 56,
        "duration": 0.75
      },
      {
        "pitch": "D#3",
        "start": 57,
        "duration": 0.75
      },
      {
        "pitch": "A#3",
        "start": 58,
        "duration": 0.75
      },
      {
        "pitch": "D#3",
        "start": 59,
        "duration": 0.75
      },
      {
        "pitch": "D#3",
        "start": 60,
        "duration": 0.75
      },
      {
        "pitch": "D#3",
        "start": 61,
        "duration": 0.75
      },
      {
        "pitch": "A#3",
        "start": 62,
        "duration": 0.75
      },
      {
        "pitch": "D#3",
        "start": 63,
        "duration": 0.75
      },
      {
        "pitch": "C3",
        "start": 64,
        "duration": 3.5
      },
      {
        "pitch": "G3",
        "start": 68,
        "duration": 3.5
      },
      {
        "pitch": "G#3",
        "start": 72,
        "duration": 3.5
      },
      {
        "pitch": "A#3",
        "start": 76,
        "duration": 3.5
      },
      {
        "pitch": "C3",
        "start": 80,
        "duration": 1.5
      },
      {
        "pitch": "G3",
        "start": 82,
        "duration": 1.5
      },
      {
        "pitch": "C3",
        "start": 84,
        "duration": 1.5
      },
      {
        "pitch": "G3",
        "start": 86,
        "duration": 1.5
      },
      {
        "pitch": "G#3",
        "start": 88,
        "duration": 1.5
      },
      {
        "pitch": "D#3",
        "start": 90,
        "duration": 1.5
      },
      {
        "pitch": "A#3",
        "start": 92,
        "duration": 1.5
      },
      {
        "pitch": "F3",
        "start": 94,
        "duration": 1.5
      },
      {
        "pitch": "C3",
        "start": 96,
        "duration": 0.5
      },
      {
        "pitch": "C3",
        "start": 96.75,
        "duration": 0.5
      },
      {
        "pitch": "C4",
        "start": 97.5,
        "duration": 0.5
      },
      {
        "pitch": "G3",
        "start": 98.5,
        "duration": 0.5
      },
      {
        "pitch": "C3",
        "start": 99.25,
        "duration": 0.75
      },
      {
        "pitch": "C3",
        "start": 100,
        "duration": 0.5
      },
      {
        "pitch": "C3",
        "start": 100.75,
        "duration": 0.5
      },
      {
        "pitch": "C4",
        "start": 101.5,
        "duration": 0.5
      },
      {
        "pitch": "G3",
        "start": 102.5,
        "duration": 0.5
      },
      {
        "pitch": "C3",
        "start": 103.25,
        "duration": 0.75
      },
      {
        "pitch": "D#3",
        "start": 104,
        "duration": 0.5
      },
      {
        "pitch": "D#3",
        "start": 104.75,
        "duration": 0.5
      },
      {
        "pitch": "D#4",
        "start": 105.5,
        "duration": 0.5
      },
      {
        "pitch": "A#3",
        "start": 106.5,
        "duration": 0.5
      },
      {
        "pitch": "D#3",
        "start": 107.25,
        "duration": 0.75
      },
      {
        "pitch": "D#3",
        "start": 108,
        "duration": 0.5
      },
      {
        "pitch": "D#3",
        "start": 108.75,
        "duration": 0.5
      },
      {
        "pitch": "D#4",
        "start": 109.5,
        "duration": 0.5
      },
      {
        "pitch": "A#3",
        "start": 110.5,
        "duration": 0.5
      },
      {
        "pitch": "D#3",
        "start": 111.25,
        "duration": 0.75
      },
      {
        "pitch": "C3",
        "start": 112,
        "duration": 0.5
      },
      {
        "pitch": "C3",
        "start": 112.75,
        "duration": 0.5
      },
      {
        "pitch": "C4",
        "start": 113.5,
        "duration": 0.5
      },
      {
        "pitch": "G3",
        "start": 114.5,
        "duration": 0.5
      },
      {
        "pitch": "C3",
        "start": 115.25,
        "duration": 0.75
      },
      {
        "pitch": "C3",
        "start": 116,
        "duration": 0.5
      },
      {
        "pitch": "C3",
        "start": 116.75,
        "duration": 0.5
      },
      {
        "pitch": "C4",
        "start": 117.5,
        "duration": 0.5
      },
      {
        "pitch": "G3",
        "start": 118.5,
        "duration": 0.5
      },
      {
        "pitch": "C3",
        "start": 119.25,
        "duration": 0.75
      }
    ]
  },
  {
    "id": 2,
    "name": "Arp",
    "color": "#ffe66d",
    "type": "synth",
    "preset": "pluck",
    "muted": false,
    "notes": [
      {
        "pitch": "C4",
        "start": 8,
        "duration": 0.25
      },
      {
        "pitch": "G4",
        "start": 9,
        "duration": 0.25
      },
      {
        "pitch": "D#4",
        "start": 10,
        "duration": 0.25
      },
      {
        "pitch": "G4",
        "start": 11,
        "duration": 0.25
      },
      {
        "pitch": "C4",
        "start": 12,
        "duration": 0.25
      },
      {
        "pitch": "G4",
        "start": 13,
        "duration": 0.25
      },
      {
        "pitch": "D#4",
        "start": 14,
        "duration": 0.25
      },
      {
        "pitch": "G4",
        "start": 15,
        "duration": 0.25
      },
      {
        "pitch": "G#4",
        "start": 16.0,
        "duration": 0.15
      },
      {
        "pitch": "C5",
        "start": 16.5,
        "duration": 0.15
      },
      {
        "pitch": "G#4",
        "start": 17.0,
        "duration": 0.15
      },
      {
        "pitch": "C5",
        "start": 17.5,
        "duration": 0.15
      },
      {
        "pitch": "G#4",
        "start": 18.0,
        "duration": 0.15
      },
      {
        "pitch": "C5",
        "start": 18.5,
        "duration": 0.15
      },
      {
        "pitch": "G#4",
        "start": 19.0,
        "duration": 0.15
      },
      {
        "pitch": "C5",
        "start": 19.5,
        "duration": 0.15
      },
      {
        "pitch": "G#4",
        "start": 20.0,
        "duration": 0.15
      },
      {
        "pitch": "C5",
        "start": 20.5,
        "duration": 0.15
      },
      {
        "pitch": "G#4",
        "start": 21.0,
        "duration": 0.15
      },
      {
        "pitch": "C5",
        "start": 21.5,
        "duration": 0.15
      },
      {
        "pitch": "G#4",
        "start": 22.0,
        "duration": 0.15
      },
      {
        "pitch": "C5",
        "start": 22.5,
        "duration": 0.15
      },
      {
        "pitch": "G#4",
        "start": 23.0,
        "duration": 0.15
      },
      {
        "pitch": "C5",
        "start": 23.5,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 24.0,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 24.25,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 24.5,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 24.75,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 25.0,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 25.25,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 25.5,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 25.75,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 26.0,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 26.25,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 26.5,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 26.75,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 27.0,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 27.25,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 27.5,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 27.75,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 28.0,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 28.25,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 28.5,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 28.75,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 29.0,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 29.25,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 29.5,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 29.75,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 30.0,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 30.25,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 30.5,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 30.75,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 31.0,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 31.25,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 31.5,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 31.75,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 32.0,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 33.0,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 34.0,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 35.0,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 36.0,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 37.0,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 38.0,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 39.0,
        "duration": 0.15
      },
      {
        "pitch": "C4",
        "start": 40.0,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 40.25,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 40.5,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 40.75,
        "duration": 0.15
      },
      {
        "pitch": "C4",
        "start": 41.0,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 41.25,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 41.5,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 41.75,
        "duration": 0.15
      },
      {
        "pitch": "C4",
        "start": 42.0,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 42.25,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 42.5,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 42.75,
        "duration": 0.15
      },
      {
        "pitch": "C4",
        "start": 43.0,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 43.25,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 43.5,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 43.75,
        "duration": 0.15
      },
      {
        "pitch": "C4",
        "start": 44.0,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 44.25,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 44.5,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 44.75,
        "duration": 0.15
      },
      {
        "pitch": "C4",
        "start": 45.0,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 45.25,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 45.5,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 45.75,
        "duration": 0.15
      },
      {
        "pitch": "C4",
        "start": 46.0,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 46.25,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 46.5,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 46.75,
        "duration": 0.15
      },
      {
        "pitch": "C4",
        "start": 47.0,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 47.25,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 47.5,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 47.75,
        "duration": 0.15
      },
      {
        "pitch": "G#4",
        "start": 48.0,
        "duration": 0.15
      },
      {
        "pitch": "C5",
        "start": 48.5,
        "duration": 0.15
      },
      {
        "pitch": "G#4",
        "start": 49.0,
        "duration": 0.15
      },
      {
        "pitch": "C5",
        "start": 49.5,
        "duration": 0.15
      },
      {
        "pitch": "G#4",
        "start": 50.0,
        "duration": 0.15
      },
      {
        "pitch": "C5",
        "start": 50.5,
        "duration": 0.15
      },
      {
        "pitch": "G#4",
        "start": 51.0,
        "duration": 0.15
      },
      {
        "pitch": "C5",
        "start": 51.5,
        "duration": 0.15
      },
      {
        "pitch": "G#4",
        "start": 52.0,
        "duration": 0.15
      },
      {
        "pitch": "C5",
        "start": 52.5,
        "duration": 0.15
      },
      {
        "pitch": "G#4",
        "start": 53.0,
        "duration": 0.15
      },
      {
        "pitch": "C5",
        "start": 53.5,
        "duration": 0.15
      },
      {
        "pitch": "G#4",
        "start": 54.0,
        "duration": 0.15
      },
      {
        "pitch": "C5",
        "start": 54.5,
        "duration": 0.15
      },
      {
        "pitch": "G#4",
        "start": 55.0,
        "duration": 0.15
      },
      {
        "pitch": "C5",
        "start": 55.5,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 56.0,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 56.25,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 56.5,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 56.75,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 57.0,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 57.25,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 57.5,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 57.75,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 58.0,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 58.25,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 58.5,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 58.75,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 59.0,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 59.25,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 59.5,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 59.75,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 60.0,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 60.25,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 60.5,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 60.75,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 61.0,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 61.25,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 61.5,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 61.75,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 62.0,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 62.25,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 62.5,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 62.75,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 63.0,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 63.25,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 63.5,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 63.75,
        "duration": 0.15
      },
      {
        "pitch": "C4",
        "start": 64,
        "duration": 0.25
      },
      {
        "pitch": "D#4",
        "start": 66,
        "duration": 0.25
      },
      {
        "pitch": "G4",
        "start": 68,
        "duration": 0.25
      },
      {
        "pitch": "A#4",
        "start": 70,
        "duration": 0.25
      },
      {
        "pitch": "G#4",
        "start": 72,
        "duration": 0.25
      },
      {
        "pitch": "C5",
        "start": 74,
        "duration": 0.25
      },
      {
        "pitch": "A#4",
        "start": 76,
        "duration": 0.25
      },
      {
        "pitch": "C4",
        "start": 80.0,
        "duration": 0.25
      },
      {
        "pitch": "G4",
        "start": 80.5,
        "duration": 0.25
      },
      {
        "pitch": "D#4",
        "start": 81.0,
        "duration": 0.25
      },
      {
        "pitch": "G4",
        "start": 81.5,
        "duration": 0.25
      },
      {
        "pitch": "C4",
        "start": 82.0,
        "duration": 0.25
      },
      {
        "pitch": "G4",
        "start": 82.5,
        "duration": 0.25
      },
      {
        "pitch": "D#4",
        "start": 83.0,
        "duration": 0.25
      },
      {
        "pitch": "G4",
        "start": 83.5,
        "duration": 0.25
      },
      {
        "pitch": "C4",
        "start": 84.0,
        "duration": 0.25
      },
      {
        "pitch": "G4",
        "start": 84.5,
        "duration": 0.25
      },
      {
        "pitch": "D#4",
        "start": 85.0,
        "duration": 0.25
      },
      {
        "pitch": "G4",
        "start": 85.5,
        "duration": 0.25
      },
      {
        "pitch": "C4",
        "start": 86.0,
        "duration": 0.25
      },
      {
        "pitch": "G4",
        "start": 86.5,
        "duration": 0.25
      },
      {
        "pitch": "D#4",
        "start": 87.0,
        "duration": 0.25
      },
      {
        "pitch": "G4",
        "start": 87.5,
        "duration": 0.25
      },
      {
        "pitch": "G#4",
        "start": 88.0,
        "duration": 0.25
      },
      {
        "pitch": "C5",
        "start": 89.0,
        "duration": 0.25
      },
      {
        "pitch": "G#4",
        "start": 90.0,
        "duration": 0.25
      },
      {
        "pitch": "C5",
        "start": 91.0,
        "duration": 0.25
      },
      {
        "pitch": "A#4",
        "start": 92.0,
        "duration": 0.25
      },
      {
        "pitch": "A#4",
        "start": 94.0,
        "duration": 0.25
      },
      {
        "pitch": "C4",
        "start": 96.0,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 96.25,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 96.5,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 96.75,
        "duration": 0.15
      },
      {
        "pitch": "C4",
        "start": 97.0,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 97.25,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 97.5,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 97.75,
        "duration": 0.15
      },
      {
        "pitch": "C4",
        "start": 98.0,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 98.25,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 98.5,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 98.75,
        "duration": 0.15
      },
      {
        "pitch": "C4",
        "start": 99.0,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 99.25,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 99.5,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 99.75,
        "duration": 0.15
      },
      {
        "pitch": "C4",
        "start": 100.0,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 100.25,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 100.5,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 100.75,
        "duration": 0.15
      },
      {
        "pitch": "C4",
        "start": 101.0,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 101.25,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 101.5,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 101.75,
        "duration": 0.15
      },
      {
        "pitch": "C4",
        "start": 102.0,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 102.25,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 102.5,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 102.75,
        "duration": 0.15
      },
      {
        "pitch": "C4",
        "start": 103.0,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 103.25,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 103.5,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 103.75,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 104.0,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 104.25,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 104.5,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 104.75,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 105.0,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 105.25,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 105.5,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 105.75,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 106.0,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 106.25,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 106.5,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 106.75,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 107.0,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 107.25,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 107.5,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 107.75,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 108.0,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 108.25,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 108.5,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 108.75,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 109.0,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 109.25,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 109.5,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 109.75,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 110.0,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 110.25,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 110.5,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 110.75,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 111.0,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 111.25,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 111.5,
        "duration": 0.15
      },
      {
        "pitch": "A#4",
        "start": 111.75,
        "duration": 0.15
      },
      {
        "pitch": "C4",
        "start": 112.0,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 112.25,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 112.5,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 112.75,
        "duration": 0.15
      },
      {
        "pitch": "C4",
        "start": 113.0,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 113.25,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 113.5,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 113.75,
        "duration": 0.15
      },
      {
        "pitch": "C4",
        "start": 114.0,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 114.25,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 114.5,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 114.75,
        "duration": 0.15
      },
      {
        "pitch": "C4",
        "start": 115.0,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 115.25,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 115.5,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 115.75,
        "duration": 0.15
      },
      {
        "pitch": "C4",
        "start": 116.0,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 116.25,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 116.5,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 116.75,
        "duration": 0.15
      },
      {
        "pitch": "C4",
        "start": 117.0,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 117.25,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 117.5,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 117.75,
        "duration": 0.15
      },
      {
        "pitch": "C4",
        "start": 118.0,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 118.25,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 118.5,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 118.75,
        "duration": 0.15
      },
      {
        "pitch": "C4",
        "start": 119.0,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 119.25,
        "duration": 0.15
      },
      {
        "pitch": "D#4",
        "start": 119.5,
        "duration": 0.15
      },
      {
        "pitch": "G4",
        "start": 119.75,
        "duration": 0.15
      }
    ]
  },
  {
    "id": 3,
    "name": "Lead",
    "color": "#ff6b9d",
    "type": "synth",
    "preset": "lead",
    "muted": false,
    "notes": [
      {
        "pitch": "D#4",
        "start": 16,
        "duration": 1
      },
      {
        "pitch": "D#4",
        "start": 17,
        "duration": 1
      },
      {
        "pitch": "F4",
        "start": 18,
        "duration": 1
      },
      {
        "pitch": "G4",
        "start": 19,
        "duration": 1
      },
      {
        "pitch": "D#4",
        "start": 20,
        "duration": 1
      },
      {
        "pitch": "D#4",
        "start": 21,
        "duration": 1
      },
      {
        "pitch": "F4",
        "start": 22,
        "duration": 1
      },
      {
        "pitch": "G4",
        "start": 23,
        "duration": 1
      },
      {
        "pitch": "D#4",
        "start": 24,
        "duration": 1
      },
      {
        "pitch": "D#4",
        "start": 25,
        "duration": 1
      },
      {
        "pitch": "F4",
        "start": 26,
        "duration": 1
      },
      {
        "pitch": "G4",
        "start": 27,
        "duration": 1
      },
      {
        "pitch": "D#4",
        "start": 28,
        "duration": 1
      },
      {
        "pitch": "D#4",
        "start": 29,
        "duration": 1
      },
      {
        "pitch": "F4",
        "start": 30,
        "duration": 1
      },
      {
        "pitch": "G4",
        "start": 31,
        "duration": 1
      },
      {
        "pitch": "G4",
        "start": 32,
        "duration": 0.5
      },
      {
        "pitch": "G#4",
        "start": 32.5,
        "duration": 0.5
      },
      {
        "pitch": "G4",
        "start": 33,
        "duration": 0.5
      },
      {
        "pitch": "F4",
        "start": 33.5,
        "duration": 0.5
      },
      {
        "pitch": "D#4",
        "start": 34,
        "duration": 1
      },
      {
        "pitch": "G4",
        "start": 35,
        "duration": 1
      },
      {
        "pitch": "G4",
        "start": 36,
        "duration": 0.5
      },
      {
        "pitch": "G#4",
        "start": 36.5,
        "duration": 0.5
      },
      {
        "pitch": "G4",
        "start": 37,
        "duration": 0.5
      },
      {
        "pitch": "F4",
        "start": 37.5,
        "duration": 0.5
      },
      {
        "pitch": "D#4",
        "start": 38,
        "duration": 1
      },
      {
        "pitch": "G4",
        "start": 39,
        "duration": 1
      },
      {
        "pitch": "A#4",
        "start": 40,
        "duration": 0.5
      },
      {
        "pitch": "G#4",
        "start": 40.5,
        "duration": 0.5
      },
      {
        "pitch": "G4",
        "start": 41,
        "duration": 0.5
      },
      {
        "pitch": "F4",
        "start": 41.5,
        "duration": 0.5
      },
      {
        "pitch": "D#4",
        "start": 42,
        "duration": 0.5
      },
      {
        "pitch": "F4",
        "start": 42.5,
        "duration": 0.5
      },
      {
        "pitch": "G4",
        "start": 43,
        "duration": 1
      },
      {
        "pitch": "A#4",
        "start": 44,
        "duration": 0.5
      },
      {
        "pitch": "G#4",
        "start": 44.5,
        "duration": 0.5
      },
      {
        "pitch": "G4",
        "start": 45,
        "duration": 0.5
      },
      {
        "pitch": "F4",
        "start": 45.5,
        "duration": 0.5
      },
      {
        "pitch": "D#4",
        "start": 46,
        "duration": 0.5
      },
      {
        "pitch": "F4",
        "start": 46.5,
        "duration": 0.5
      },
      {
        "pitch": "G4",
        "start": 47,
        "duration": 1
      },
      {
        "pitch": "G4",
        "start": 48,
        "duration": 0.5
      },
      {
        "pitch": "G#4",
        "start": 48.5,
        "duration": 0.5
      },
      {
        "pitch": "G4",
        "start": 49,
        "duration": 0.5
      },
      {
        "pitch": "F4",
        "start": 49.5,
        "duration": 0.5
      },
      {
        "pitch": "D#4",
        "start": 50,
        "duration": 1
      },
      {
        "pitch": "G4",
        "start": 51,
        "duration": 1
      },
      {
        "pitch": "G4",
        "start": 52,
        "duration": 0.5
      },
      {
        "pitch": "G#4",
        "start": 52.5,
        "duration": 0.5
      },
      {
        "pitch": "G4",
        "start": 53,
        "duration": 0.5
      },
      {
        "pitch": "F4",
        "start": 53.5,
        "duration": 0.5
      },
      {
        "pitch": "D#4",
        "start": 54,
        "duration": 1
      },
      {
        "pitch": "G4",
        "start": 55,
        "duration": 1
      },
      {
        "pitch": "A#4",
        "start": 56,
        "duration": 0.5
      },
      {
        "pitch": "G#4",
        "start": 56.5,
        "duration": 0.5
      },
      {
        "pitch": "G4",
        "start": 57,
        "duration": 0.5
      },
      {
        "pitch": "F4",
        "start": 57.5,
        "duration": 0.5
      },
      {
        "pitch": "D#4",
        "start": 58,
        "duration": 0.5
      },
      {
        "pitch": "F4",
        "start": 58.5,
        "duration": 0.5
      },
      {
        "pitch": "G4",
        "start": 59,
        "duration": 1
      },
      {
        "pitch": "A#4",
        "start": 60,
        "duration": 0.5
      },
      {
        "pitch": "G#4",
        "start": 60.5,
        "duration": 0.5
      },
      {
        "pitch": "G4",
        "start": 61,
        "duration": 0.5
      },
      {
        "pitch": "F4",
        "start": 61.5,
        "duration": 0.5
      },
      {
        "pitch": "D#4",
        "start": 62,
        "duration": 0.5
      },
      {
        "pitch": "F4",
        "start": 62.5,
        "duration": 0.5
      },
      {
        "pitch": "G4",
        "start": 63,
        "duration": 1
      },
      {
        "pitch": "C4",
        "start": 64,
        "duration": 2
      },
      {
        "pitch": "D#4",
        "start": 66,
        "duration": 2
      },
      {
        "pitch": "C4",
        "start": 68,
        "duration": 2
      },
      {
        "pitch": "D#4",
        "start": 70,
        "duration": 2
      },
      {
        "pitch": "C4",
        "start": 72,
        "duration": 2
      },
      {
        "pitch": "D#4",
        "start": 74,
        "duration": 2
      },
      {
        "pitch": "C4",
        "start": 76,
        "duration": 2
      },
      {
        "pitch": "D#4",
        "start": 78,
        "duration": 2
      },
      {
        "pitch": "D#4",
        "start": 80,
        "duration": 0.5
      },
      {
        "pitch": "F4",
        "start": 80.5,
        "duration": 0.5
      },
      {
        "pitch": "G4",
        "start": 81,
        "duration": 0.5
      },
      {
        "pitch": "G#4",
        "start": 81.5,
        "duration": 0.5
      },
      {
        "pitch": "A#4",
        "start": 82,
        "duration": 0.5
      },
      {
        "pitch": "C5",
        "start": 82.5,
        "duration": 0.5
      },
      {
        "pitch": "A#4",
        "start": 83,
        "duration": 0.5
      },
      {
        "pitch": "G4",
        "start": 83.5,
        "duration": 0.5
      },
      {
        "pitch": "D#4",
        "start": 84,
        "duration": 0.5
      },
      {
        "pitch": "F4",
        "start": 84.5,
        "duration": 0.5
      },
      {
        "pitch": "G4",
        "start": 85,
        "duration": 0.5
      },
      {
        "pitch": "G#4",
        "start": 85.5,
        "duration": 0.5
      },
      {
        "pitch": "A#4",
        "start": 86,
        "duration": 0.5
      },
      {
        "pitch": "C5",
        "start": 86.5,
        "duration": 0.5
      },
      {
        "pitch": "A#4",
        "start": 87,
        "duration": 0.5
      },
      {
        "pitch": "G4",
        "start": 87.5,
        "duration": 0.5
      },
      {
        "pitch": "D#4",
        "start": 88,
        "duration": 0.5
      },
      {
        "pitch": "F4",
        "start": 88.5,
        "duration": 0.5
      },
      {
        "pitch": "G4",
        "start": 89,
        "duration": 0.5
      },
      {
        "pitch": "G#4",
        "start": 89.5,
        "duration": 0.5
      },
      {
        "pitch": "A#4",
        "start": 90,
        "duration": 0.5
      },
      {
        "pitch": "C5",
        "start": 90.5,
        "duration": 0.5
      },
      {
        "pitch": "A#4",
        "start": 91,
        "duration": 0.5
      },
      {
        "pitch": "G4",
        "start": 91.5,
        "duration": 0.5
      },
      {
        "pitch": "D#4",
        "start": 92,
        "duration": 0.5
      },
      {
        "pitch": "F4",
        "start": 92.5,
        "duration": 0.5
      },
      {
        "pitch": "G4",
        "start": 93,
        "duration": 0.5
      },
      {
        "pitch": "G#4",
        "start": 93.5,
        "duration": 0.5
      },
      {
        "pitch": "A#4",
        "start": 94,
        "duration": 0.5
      },
      {
        "pitch": "C5",
        "start": 94.5,
        "duration": 0.5
      },
      {
        "pitch": "A#4",
        "start": 95,
        "duration": 0.5
      },
      {
        "pitch": "G4",
        "start": 95.5,
        "duration": 0.5
      },
      {
        "pitch": "G4",
        "start": 96,
        "duration": 0.5
      },
      {
        "pitch": "G#4",
        "start": 96.5,
        "duration": 0.5
      },
      {
        "pitch": "G4",
        "start": 97,
        "duration": 0.5
      },
      {
        "pitch": "F4",
        "start": 97.5,
        "duration": 0.5
      },
      {
        "pitch": "D#4",
        "start": 98,
        "duration": 0.5
      },
      {
        "pitch": "C4",
        "start": 98.5,
        "duration": 0.5
      },
      {
        "pitch": "D#4",
        "start": 99,
        "duration": 0.5
      },
      {
        "pitch": "G4",
        "start": 99.5,
        "duration": 0.5
      },
      {
        "pitch": "G4",
        "start": 100,
        "duration": 0.5
      },
      {
        "pitch": "G#4",
        "start": 100.5,
        "duration": 0.5
      },
      {
        "pitch": "G4",
        "start": 101,
        "duration": 0.5
      },
      {
        "pitch": "F4",
        "start": 101.5,
        "duration": 0.5
      },
      {
        "pitch": "D#4",
        "start": 102,
        "duration": 0.5
      },
      {
        "pitch": "C4",
        "start": 102.5,
        "duration": 0.5
      },
      {
        "pitch": "D#4",
        "start": 103,
        "duration": 0.5
      },
      {
        "pitch": "G4",
        "start": 103.5,
        "duration": 0.5
      },
      {
        "pitch": "G4",
        "start": 104,
        "duration": 0.5
      },
      {
        "pitch": "G#4",
        "start": 104.5,
        "duration": 0.5
      },
      {
        "pitch": "G4",
        "start": 105,
        "duration": 0.5
      },
      {
        "pitch": "F4",
        "start": 105.5,
        "duration": 0.5
      },
      {
        "pitch": "D#4",
        "start": 106,
        "duration": 0.5
      },
      {
        "pitch": "C4",
        "start": 106.5,
        "duration": 0.5
      },
      {
        "pitch": "D#4",
        "start": 107,
        "duration": 0.5
      },
      {
        "pitch": "G4",
        "start": 107.5,
        "duration": 0.5
      },
      {
        "pitch": "G4",
        "start": 108,
        "duration": 0.5
      },
      {
        "pitch": "G#4",
        "start": 108.5,
        "duration": 0.5
      },
      {
        "pitch": "G4",
        "start": 109,
        "duration": 0.5
      },
      {
        "pitch": "F4",
        "start": 109.5,
        "duration": 0.5
      },
      {
        "pitch": "D#4",
        "start": 110,
        "duration": 0.5
      },
      {
        "pitch": "C4",
        "start": 110.5,
        "duration": 0.5
      },
      {
        "pitch": "D#4",
        "start": 111,
        "duration": 0.5
      },
      {
        "pitch": "G4",
        "start": 111.5,
        "duration": 0.5
      },
      {
        "pitch": "D#4",
        "start": 112,
        "duration": 2
      },
      {
        "pitch": "C4",
        "start": 114,
        "duration": 2
      },
      {
        "pitch": "D#4",
        "start": 116,
        "duration": 2
      },
      {
        "pitch": "C4",
        "start": 118,
        "duration": 2
      },
      {
        "pitch": "C5",
        "start": 97,
        "duration": 0.25
      },
      {
        "pitch": "G4",
        "start": 97.5,
        "duration": 0.25
      },
      {
        "pitch": "Eb4",
        "start": 98,
        "duration": 0.5
      },
      {
        "pitch": "Bb4",
        "start": 101,
        "duration": 0.25
      },
      {
        "pitch": "G4",
        "start": 101.5,
        "duration": 0.25
      },
      {
        "pitch": "D4",
        "start": 102,
        "duration": 0.5
      },
      {
        "pitch": "C5",
        "start": 105,
        "duration": 0.25
      },
      {
        "pitch": "G4",
        "start": 105.5,
        "duration": 0.25
      },
      {
        "pitch": "Eb4",
        "start": 106,
        "duration": 0.5
      },
      {
        "pitch": "Bb4",
        "start": 109,
        "duration": 0.25
      },
      {
        "pitch": "G4",
        "start": 109.5,
        "duration": 0.25
      },
      {
        "pitch": "D4",
        "start": 110,
        "duration": 0.5
      }
    ]
  },
  {
    "id": 4,
    "name": "Perc",
    "color": "#ff8a5c",
    "type": "synth",
    "preset": "noise",
    "muted": false,
    "notes": [
      {
        "pitch": "C5",
        "start": 32.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 33.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 34.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 35.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 36.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 37.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 38.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 39.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 40.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 41.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 42.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 43.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 44.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 45.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 46.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 47.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 48.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 49.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 50.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 51.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 52.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 53.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 54.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 55.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 56.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 57.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 58.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 59.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 60.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 61.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 62.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 63.5,
        "duration": 0.08
      },
      {
        "pitch": "G4",
        "start": 81.0,
        "duration": 0.1
      },
      {
        "pitch": "G4",
        "start": 83.0,
        "duration": 0.1
      },
      {
        "pitch": "G4",
        "start": 85.0,
        "duration": 0.1
      },
      {
        "pitch": "G4",
        "start": 87.0,
        "duration": 0.1
      },
      {
        "pitch": "G4",
        "start": 89.0,
        "duration": 0.1
      },
      {
        "pitch": "G4",
        "start": 91.0,
        "duration": 0.1
      },
      {
        "pitch": "G4",
        "start": 93.0,
        "duration": 0.1
      },
      {
        "pitch": "G4",
        "start": 95.0,
        "duration": 0.1
      },
      {
        "pitch": "C5",
        "start": 96.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 97.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 98.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 99.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 100.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 101.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 102.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 103.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 104.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 105.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 106.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 107.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 108.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 109.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 110.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 111.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 112.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 113.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 114.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 115.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 116.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 117.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 118.5,
        "duration": 0.08
      },
      {
        "pitch": "C5",
        "start": 119.5,
        "duration": 0.08
      }
    ]
  }
],

  keymap: {
    // Lower octaves (C3-B3)
    z: "C3",
    1: "C#3",
    x: "D3",
    2: "D#3",
    c: "E3",
    v: "F3",
    3: "F#3",
    b: "G3",
    4: "G#3",
    n: "A3",
    5: "A#3",
    m: "B3",
    // Upper octaves (C4-C5)
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
  },
};
