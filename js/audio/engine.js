import { state} from '../state.js';

class SynthEngine {
    constructor() {
        this.synths = new Map(); // trackId -> PolySynth
        this.presets = {
            pluck: {
                oscillator: { type: 'triangle' },
                envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.15 }
            },
            subBass: {
                oscillator: { type: 'sine' },
                envelope: { attack: 0.01, decay: 0.3, sustain: 0.8, release: 0.5 }
            },
            lead: {
                oscillator: { type: 'sawtooth' },
                envelope: { attack: 0.05, decay: 0.5, sustain: 0.8, release: 1.0 }
            },
            pad: {
                oscillator: { type: 'square' },
                envelope: { attack: 0.5, decay: 0.5, sustain: 0.8, release: 1.0 } 
            },
            noise: {
                oscillator: { type: 'fmsine', modulationType: 'square', modulationIndex: 3, harmonicity: 3.01 },
                envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 }
            }
        };
        this.master = null;
        this.reverb = null;
        this.delay = null;
    };

    async init() {
        this.master = new Tone.Gain(0.8).toDestination();
        this.reverb = new Tone.Reverb({ decay: 2, wet: 0.2 }).connect(this.master);
        this.delay = new Tone.FeedbackDelay('8n', 0.15).connect(this.reverb);

        for (const track of state.tracks) {
            const preset = this.presets[track.preset] || this.presets.pluck;
            const synth = new Tone.PolySynth(Tone.Synth, {
                oscillator: preset.oscillator,
                envelope: preset.envelope,
                volume: -6
            }).connect(this.delay);

            this.synths.set(track.id, synth);
        };
        
        Tone.Transport.bpm.value = state.bpm;
        console.log('Engine initialised with', this.synths.size, 'tracks');
    }

    playNote(note, trackId = null) {
        const tid = trackId ?? state.currentTrack;
        const synth = this.synths.get(tid);
        if (!synth || state.tracks[tid].muted) return;
        synth.triggerAttack(note);
    };

    stopNote(note, trackId = null) {
        const tid = trackId ?? state.currentTrack;
        const synth = this.synths.get(tid);
        if (!synth) return;
        synth.triggerRelease(note);
    };

    setPreset(trackId, presetName) {
        const synth = this.synths.get(trackId);
        const preset = this.presets[presetName];
        if (!synth || !preset) return;
        synth.set({ oscillator: preset.oscillator, envelope: preset.envelope });
        state.tracks[trackId].preset = presetName;
    };

    setBpm(bpm) {
        state.bpm = bpm;
        Tone.Transport.bpm.value = bpm;
        document.getElementById('bpm-display').textContent = `BPM: ${bpm}`;
    };

    startTransport() {
        if (state.isPlaying) return;
        Tone.Transport.start();
        state.isPlaying = true;
        document.getElementById('play-state').textContent = 'Playing';
        document.getElementById('play-state').classList.add('active');
    };

    stopTransport() {
        Tone.Transport.stop();
        state.isPlaying = false;
        state.playheadBeat = 0;
        document.getElementById('play-state').textContent = 'Stopped';
        document.getElementById('play-state').classList.remove('active');
    }
};

export const engine = new SynthEngine();