import { state } from "../state.js";

class SynthEngine {
  constructor() {
    this.initialised = false;
    this.synths = new Map(); // trackId -> PolySynth
    this.audioPlayers = new Map();
    this.audioBuffers = new Map();
    this.playingNotes = new Map(); // "tid-note" true (preventing double-triggers)
    /** @type {Record<string, { oscillator: any, envelope: any }>} */
    this.presets = {
      pluck: {
        oscillator: { type: "fattriangle", count: 2, spread: 10 },
        envelope: { attack: 0.002, decay: 0.4, sustain: 0.15, release: 1.5 },
      },
      subBass: {
        oscillator: { type: "sine" },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.8, release: 0.5 },
      },
      lead: {
        oscillator: { type: "sawtooth" },
        envelope: { attack: 0.05, decay: 0.5, sustain: 0.8, release: 1.0 },
      },
      pad: {
        oscillator: { type: "square" },
        envelope: { attack: 0.5, decay: 0.5, sustain: 0.8, release: 1.0 },
      },
      noise: {
        oscillator: {
          type: "fmsine",
          modulationType: "square",
          modulationIndex: 3,
          harmonicity: 3.01,
        },
        envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
      },
    };
    this.master = null;
    this.limiter = null;
    this.compressor = null;
    this.reverb = null;
    this.delay = null;
    this.toneFilter = null;
    this.micRecorder = null;
    this.micStream = null;
    this.mic = null;
    this.isRecordingMic = null;
  }

  async init() {
    if (this.initialised) return;

    Tone.context.lookAhead = 0.1;

    this.limiter = new Tone.Limiter(-1).toDestination();
    this.compressor = new Tone.Compressor(-20, 2.5).connect(this.limiter);
    this.master = new Tone.Gain(0.45).connect(this.limiter);
    this.reverb = new Tone.Reverb({ decay: 2.5, wet: 0.2 }).connect(
      this.master,
    );
    this.delay = new Tone.FeedbackDelay("8n", 0.12).connect(this.reverb);
    this.toneFilter = new Tone.Filter(8000, "lowpass").connect(this.delay);

    this.master.gain.value = 0.6;

    for (const track of state.tracks) {
      this._initTrack(track);
    }

    Tone.Transport.bpm.value = state.bpm;
    this.initialised = true;
  }

  /** @param {import("../state.js").Track} track */
  async _initTrack(track) {
    if (!this.toneFilter) return;
    if (track.type === "audio") {
      if (track.audioUrl)
        await this._loadAudioForTrack(track.id, track.audioUrl);
      return;
    }
    const customPresets = /** @type {Record<string, any>} */ (
      state.customPresets
    );
    const preset =
      track.presetData ||
      customPresets?.[track.preset] ||
      this.presets[track.preset] ||
      this.presets.pluck;

    const minAttack = Math.max(0.003, preset.envelope.attack);
    const vol =
      track.preset === "pad" ? -16 : track.preset === "noise" ? -18 : -10;

    const synth = new Tone.PolySynth(Tone.Synth, {
      /** @ts-ignore */
      maxPolyphony: 24,
      oscillator: preset.oscillator,
      envelope: { ...preset.envelope, attack: minAttack },
      volume: vol,
    }).connect(this.toneFilter);
    this.synths.set(track.id, synth);
  }

  /**
   * @param {number} trackId
   * @param {string} url
   */
  async _loadAudioForTrack(trackId, url) {
    if (!this.toneFilter) return;
    try {
      const buffer = await Tone.Buffer.fromUrl(url);
      this.audioBuffers.set(trackId, buffer);
      const player = new Tone.Player(buffer);
      player.fadeIn = 0.01;
      player.fadeOut = 0.01;
      player.connect(this.toneFilter);
      this.audioPlayers.set(trackId, player);
      return buffer;
    } catch (e) {
      console.log("Audio load failed", e);
    }
  }

  /**
   * @param {string} note
   * @param {number|null} [trackIdx]
   */
  playNote(note, trackIdx = null) {
    const track =
      trackIdx === null
        ? state.tracks[state.currentTrack]
        : state.tracks[trackIdx];
    if (!track) return;
    const key = `${track.id}-${note}`;
    if (this.playingNotes.has(key)) return; // already sounding
    const synth = this.synths.get(track.id);
    if (!synth || track.muted) return;
    this.playingNotes.set(key, true);
    synth.triggerAttack(note);
  }

  /**
   * @param {string} note
   * @param {number|null} [trackIdx]
   */
  stopNote(note, trackIdx = null) {
    const track =
      trackIdx === null
        ? state.tracks[state.currentTrack]
        : state.tracks[trackIdx];
    if (!track) return;
    const key = `${track.id}-${note}`;
    const synth = this.synths.get(track.id);
    if (!synth) return;
    this.playingNotes.delete(key);
    synth.triggerRelease(note);
  }

  /**
   * @param {number} trackIdx
   * @param {string} presetName
   */
  setPreset(trackIdx, presetName) {
    const track = state.tracks[trackIdx];
    if (!track || track.type === "audio") return;
    const customPresets = /** @type {Record<string, any>} */ (
      state.customPresets
    );
    const preset = customPresets?.[presetName] || this.presets[presetName];
    if (!preset) return;
    const synth = this.synths.get(track.id);
    if (synth)
      synth.set({ oscillator: preset.oscillator, envelope: preset.envelope });
    track.preset = presetName;
  }

  /**
   * @param {number} bpm
   */
  setBpm(bpm) {
    state.bpm = bpm;
    Tone.Transport.bpm.value = bpm;
    const el = document.getElementById("bpm-display");
    if (el) el.textContent = String(bpm);
  }

  /**
   *
   * @param {import("../state.js").Track} track
   */
  addTrack(track) {
    if (!this.toneFilter) return;
    if (track.type === "audio") return;
    // @ts-ignore
    const preset =
      track.presetData ||
      state.customPresets?.[track.preset] ||
      this.presets[track.preset] ||
      this.presets.pluck;
    const minAttack = Math.max(0.003, preset.envelope.attack);
    const vol =
      track.preset === "pad" ? -16 : track.preset === "noise" ? -18 : -10;
    const synth = new Tone.PolySynth(Tone.Synth, {
      // @ts-ignore
      maxPolyphony: 24,
      oscillator: preset.oscillator,
      envelope: { ...preset.envelope, attack: minAttack },
      volume: vol,
    }).connect(this.toneFilter);
    this.synths.set(track.id, synth);
  }

  startTransport() {
    if (state.isPlaying) return;

    state.isPlaying = true;

    try {
      Tone.Transport.start();
    } catch (err) {
      console.error("Failed to start transport", err);
    }

    try {
      state.tracks.forEach((track) => {
        if (track.muted) return;
        if (track.type === "audio") {
          const player = this.audioPlayers.get(track.id);
          if (!player) return;
          player.loop = !!track.loop;
          const dur = track.loop
            ? undefined
            : track.duration || player.buffer.duration;
          Tone.Transport.schedule((t) => player.start(t, 0, dur), 0);
          return;
        }
        const synth = this.synths.get(track.id);
        if (!synth) return;

        track.notes.forEach((note) => {
          if (!note.duration || note.duration <= 0) return;
          const time = note.start * (60 / state.bpm); // beats to seconds
          const dur = note.duration * (60 / state.bpm);

          Tone.Transport.schedule((t) => {
            synth.triggerAttackRelease(note.pitch, dur, t);
          }, time);
        });
      });
    } catch (err) {}

    const el = document.getElementById("play-state");
    if (el) {
      el.textContent = "Playing";
      el.classList.add("active");
    }
  }

  stopTransport() {
    this.synths.forEach((synth) => {
      try {
        synth.releaseAll();
      } catch {}
    });
    this.audioPlayers.forEach((p) => {
      try {
        p.stop();
      } catch {}
    });
    Tone.Transport.stop();
    Tone.Transport.position = 0;
    Tone.Transport.cancel();
    state.isPlaying = false;
    state.isRecording = false;
    state.playheadBeat = 0;
    const el = document.getElementById("play-state");
    if (el) {
      el.textContent = "Stopped";
      el.classList.remove("active");
    }
  }

  /** @param {File} file */
  async uploadAudioFile(file) {
    const url = URL.createObjectURL(file);
    const id = state.tracks.length
      ? Math.max(...state.tracks.map((t) => t.id)) + 1
      : 0;
    const track = {
      id,
      name: file.name.replace(/\.[^/.]+$/, ""),
      color: [
        "#ff6b9d",
        "#4ecdc4",
        "#ffe66d",
        "#a78bfa",
        "#5cBaff",
        "#ff8a5c",
        "#5cff8a",
      ][id % 7],
      type: "audio",
      preset: "audio",
      muted: false,
      loop: false,
      notes: [],
      audioUrl: url,
      duration: 0,
    };
    const buffer = await this._loadAudioForTrack(id, url);
    if (buffer) track.duration = buffer.duration * (state.bpm / 60);
    state.tracks.push(track);
    return track;
  }

  async startMicRecording() {
    if (this.isRecordingMic) return false;
    try {
      this.mic = new Tone.UserMedia();
      await this.mic.open();
      this.micRecorder = new Tone.Recorder({ mimeType: "audio/webm" });
      this.mic.connect(this.micRecorder);
      this.micRecorder.start();
      this.isRecordingMic = true;
      return true;
    } catch (e) {
      console.error("Mic denied:", e);
      return false;
    }
  }

  async stopMicRecording() {
    if (!this.isRecordingMic || !this.micRecorder) return null;
    const blob = await this.micRecorder.stop();
    this.isRecordingMic = false;
    if (this.mic) {
      this.mic.close();
      this.mic = null;
    }
    const url = URL.createObjectURL(blob);
    const id = state.tracks.length ? Math.max(...state.tracks.map((t) => t.id)) + 1 : 0;
    const track = {
      id,
      name: `Vocal ${id + 1}`,
      color: [
        "#ff6b9d",
        "#4ecdc4",
        "#ffe66d",
        "#a78bfa",
        "#5cBaff",
        "#ff8a5c",
        "#5cff8a",
      ][id % 7],
      type: "audio",
      preset: "audio",
      muted: false,
      loop: false,
      notes: [],
      audioUrl: url,
      duration: 0,
    };
    const buffer = await this._loadAudioForTrack(id, url);
    if (buffer) track.duration = buffer.duration * (state.bpm / 60);
    state.tracks.push(track);
    return track;
  }

  async exportProject() {
    const ids = state.tracks.filter((t) => !t.muted).map((t) => t.id);
    return this._exportTracks(ids, "project.wav");
  }

  /** @param {number} trackIdx */
  async exportTrack(trackIdx) {
    const track = state.tracks[trackIdx];
    if (track) return this._exportTracks([track.id], `track-${track.id}.wav`);
  }

  /**
   * @param {(string |number)[]} trackIds
   * @param {string} filename
   */
  async _exportTracks(trackIds, filename) {
    let maxBeat = 0;
    state.tracks.forEach((t) => {
      if (!trackIds.includes(t.id)) return;
      if (t.type === "audio" && t.duration)
        maxBeat = Math.max(maxBeat, t.duration);
      else
        t.notes.forEach(
          (n) => (maxBeat = Math.max(maxBeat, n.start + n.duration)),
        );
    });
    maxBeat = Math.max(maxBeat, 16);
    const duration = maxBeat * (60 / state.bpm);

    const toneBuffer = await Tone.Offline(async () => {
      const limiter = new Tone.Limiter(-1).toDestination();
      const compressor = new Tone.Compressor(-20, 2.5).connect(limiter);
      const master = new Tone.Gain(0.45).connect(compressor);
      const reverb = new Tone.Reverb({ decay: 2.5, wet: 0.2 }).connect(master);
      const delay = new Tone.FeedbackDelay("8n", 0.12).connect(reverb);
      const toneFilter = new Tone.Filter(8000, "lowpass").connect(delay);

      const synths = new Map();
      const players = new Map();

      for (const track of state.tracks) {
        if (!trackIds.includes(track.id)) continue;
        if (track.type === "audio") {
          if (track.audioUrl) {
            const buf = await Tone.Buffer.fromUrl(track.audioUrl);
            const player = new Tone.Player(buf);
            player.loop = !!track.loop;
            player.connect(toneFilter);
            const dur = track.loop ? undefined : track.duration || buf.duration;
            player.start(0, 0, dur);
            players.set(track.id, player);
          }
        } else {
          const customPresets = /** @type {Record<string, any>} */ (
            state.customPresets
          );
          const preset =
            track.presetData ||
            customPresets?.[track.preset] ||
            this.presets[track.preset] ||
            this.presets.pluck;
          const minAttack = Math.max(0.003, preset.envelope.attack);
          const vol =
            track.preset === "pad" ? -16 : track.preset === "noise" ? -18 : -10;
          const synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: preset.oscillator,
            envelope: { ...preset.envelope, attack: minAttack },
            volume: vol,
          }).connect(toneFilter);
          synth.maxPolyphony = 16;
          synths.set(track.id, synth);
        }
      }

      state.tracks.forEach((track) => {
        if (!trackIds.includes(track.id) || track.type === "audio") return;
        const synth = synths.get(track.id);
        if (!synth) return;
        track.notes.forEach((note) => {
          if (!note.duration || note.duration <= 0) return;
          const time = note.start * (60 / state.bpm);
          const dur = note.duration * (60 / state.bpm);
          synth.triggerAttackRelease(note.pitch, dur, time);
        });
      });
    }, duration);

    const buffer = toneBuffer.get ? toneBuffer.get() : toneBuffer;
    if (!buffer) return;
    const blob = this._audioBufferToWav(buffer);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** @param {any} abuffer */
  _audioBufferToWav(abuffer) {
    const numOfChan = abuffer.numberOfChannels;
    const len = abuffer.length;
    const bytesPerSample = 2;
    const blockAlign = numOfChan * bytesPerSample;
    const byteRate = abuffer.sampleRate * blockAlign;
    const dataSize = len * blockAlign;
    const headerSize = 44;
    const buffer = new ArrayBuffer(dataSize + headerSize);
    const view = new DataView(buffer);
    const channels = [];
    for (let i = 0; i < numOfChan; i++)
      channels.push(abuffer.getChannelData(i));

    let pos = 0;
    const writeString = (/** @type {string} */ s) => {
      for (let i = 0; i < s.length; i++) {
        view.setUint8(pos++, s.charCodeAt(i));
      }
    };
    const writeUnit16 = (/** @type { number} */ v) => {
      view.setUint16(pos, v, true);
      pos += 2;
    };

    const writeUint32 = (/** @type {number} */ v) => {
      view.setUint32(pos, v, true);
      pos += 4;
    };

    writeString("RIFF");
    writeUint32(36 + dataSize);
    writeString("WAVE");
    writeString("fmt ");
    writeUint32(16);
    writeUnit16(1);
    writeUnit16(numOfChan);
    writeUint32(abuffer.sampleRate);
    writeUint32(byteRate);
    writeUnit16(blockAlign);
    writeUnit16(16);
    writeString("data");
    writeUint32(dataSize);

    for (let i = 0; i < len; i++) {
      for (let c = 0; c < numOfChan; c++) {
        let sample = Math.max(-1, Math.min(1, channels[c][i]));
        sample = sample < 0 ? sample * 32768 : sample * 32767;
        view.setInt16(pos, sample | 0, true);
        pos += 2;
      }
    }

    return new Blob([buffer], { type: "audio/wav" });
  }

  /** @param {number} trackIdx */
  toggleTrackLoop(trackIdx) {
    const track = state.tracks[trackIdx];
    if (!track) return;
    track.loop = !track.loop;
    const player = this.audioPlayers.get(track.id);
    if (player) player.loop = track.loop;
  }
}

export const engine = new SynthEngine();
