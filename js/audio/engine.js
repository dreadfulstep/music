import { state } from "../state.js";

class SynthEngine {
  constructor() {
    this.initialised = false;
    this.synths = new Map(); // trackId -> PolySynth
    this.audioPlayers = new Map();
    this.audioBuffers = new Map();
    this.playingNotes = new Map(); // "tid-note" true (preventing double-triggers)
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

    for (const track of state.tracks) {
      this._initTrack(track);
    }

    Tone.Transport.bpm.value = state.bpm;
    this.initialised = true;
  }

  /** @param {import("../state.js").Track} track */
  async _initTrack(track) {
    if (track.type === "audio") {
      if (track.audioUrl)
        await this._loadAudioForTrack(track.id, track.audioUrl);
      return;
    }
    const preset = this.presets[track.preset] || this.presets.pluck;

    const minAttack = Math.max(0.003, preset.envelope.attack);
    const vol =
      track.preset === "pad" ? -16 : track.preset === "noise" ? -18 : -10;

    const synth = new Tone.PolySynth(Tone.Synth, {
      maxPolyphony: 24,
      oscillator: preset.oscillator,
      envelope: { ...preset.envelope, attack: minAttack },
      volume: vol,
    }).connect(this.toneFilter);
    this.synths.set(track.id, synth);
  }

  async _loadAudioForTrack(trackId, url) {
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
   * @param {any} note
   */
  playNote(note, trackId = null) {
    const tid = trackId ?? state.currentTrack;
    const key = `${tid}-${note}`;
    if (this.playingNotes.has(key)) return; // already sounding
    const synth = this.synths.get(tid);
    if (!synth || state.tracks[tid].muted) return;
    this.playingNotes.set(key, true);
    synth.triggerAttack(note);
  }

  /**
   * @param {any} note
   */
  stopNote(note, trackId = null) {
    const tid = trackId ?? state.currentTrack;
    const key = `${tid}-${note}`;
    const synth = this.synths.get(tid);
    if (!synth) return;
    this.playingNotes.delete(key);
    synth.triggerRelease(note);
  }

  /**
   * @param {string | number} trackId
   * @param {string} presetName
   */
  setPreset(trackId, presetName) {
    const synth = this.synths.get(trackId);
    // @ts-ignore
    const preset = this.presets[presetName];
    if (!synth || !preset) return;
    synth.set({ oscillator: preset.oscillator, envelope: preset.envelope });
    // @ts-ignore
    state.tracks[trackId].preset = presetName;
  }

  /**
   * @param {number} bpm
   */
  setBpm(bpm) {
    state.bpm = bpm;
    Tone.Transport.bpm.value = bpm;
    // @ts-ignore
    document.getElementById("bpm-display").textContent = `${bpm}`;
  }

  /**
   *
   * @param {import("../state.js").Track} track
   */
  addTrack(track) {
    if (!this.toneFilter) return;
    if (track.type === "audio") return;
    // @ts-ignore
    const preset = this.presets[track.preset] || this.presets.pluck;
    const minAttack = Math.max(0.003, preset.envelope.attack);
    const vol =
      track.preset === "pad" ? -16 : track.preset === "noise" ? -18 : -10;
    const synth = new Tone.PolySynth(Tone.Synth, {
      // @ts-ignore
      maxPolyphony: 24,
      oscillator: preset.oscillator,
      envelope: preset.envelope,
      volume: vol,
    }).connect(this.toneFilter);
    this.synths.set(track.id, synth);
  }

  startTransport() {
    if (state.isPlaying) return;

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

    Tone.Transport.start();
    state.isPlaying = true;
    // @ts-ignore
    document.getElementById("play-state").textContent = "Playing";
    document.getElementById("play-state")?.classList.add("active");
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
    // @ts-ignore
    document.getElementById("play-state").textContent = "Stopped";
    document.getElementById("play-state")?.classList.remove("active");
  }

  async uploadAudioFile(file) {
    const url = URL.createObjectURL(file);
    const id = state.tracks.length;
    const track = {
      id,
      name: file.name.replace(/\.[^/.]+$/, ""),
      color: [
        "#fff6b9d",
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
    const id = state.tracks.length;
    const track = {
      id,
      name: `Vocal ${id + 1}`,
      color: [
        "#fff6b9d",
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
    return this._exportTracks(ids, "project.webm");
  }

  /** @param {string | number} trackId */
  async exportTrack(trackId) {
    return this._exportTracks([trackId], `track-${trackId}.webm`);
  }

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

    const buffer = await Tone.Offline(async() => {
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
          
        }
      }
    })
  }

  toggleTrackLoop(trackId) {
    const track = state.tracks[trackId];
    if (track) track.loop = !track.loop;
    const player = this.audioPlayers.get(trackId);
    if (player) player.loop = !!track.loop;
  }
}

export const engine = new SynthEngine();
