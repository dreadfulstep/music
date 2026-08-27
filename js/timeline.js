import { state } from "./state.js";

const PIXELS_PER_BEAT = 40;

export function renderTimeline() {
    const timeline = document.getElementById("timeline");
    if (!timeline) return;

    const playhead = document.getElementById("playhead");
    timeline.innerHTML = "";
    if (playhead) timeline.appendChild(playhead);

    let maxBeat = 16;
    state.tracks.forEach(t => {
        t.notes.forEach(n => maxBeat = Math.max(maxBeat, n.start + n.duration));
    });
    const timelineWidth = Math.max(800, maxBeat * PIXELS_PER_BEAT);

    state.tracks.forEach(track => {
        const lane = document.createElement("div");
        lane.className = "track-lane" + (track.id === state.currentTrack ? " active" : "");
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

        const wrap = document.createElement("div");
        wrap.className = "track-lane-roll";

        wrap.style.width = timelineWidth + "px";

        const canvas = document.createElement("canvas");
        canvas.className = "track-roll-canvas";
        canvas.width = timelineWidth;
        canvas.height = 64;

        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.clearRect(0, 0, timelineWidth, 64);

            ctx.strokeStyle = "#1a1a1a";
            ctx.lineWidth = 1;
            for (let i = 0; i <= maxBeat; i++) {
                const x = i * PIXELS_PER_BEAT;
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, 64);
                ctx.stroke();
            };

            ctx.fillStyle = track.color + "cc";
            const notesArr = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
            track.notes.forEach(note => {
                const x = note.start * PIXELS_PER_BEAT;
                const w = Math.max(2, note.duration * PIXELS_PER_BEAT);
                const match = note.pitch.match(/^([A-G]#?)(\d)$/);
                let y = 32;
                if (match) {
                    const semitone = (parseInt(match[2]) -3 ) * 12 + notesArr.indexOf(match[1]);
                    y = 64 - ((semitone + 1) * (64 / 25));
                }
                const h = 64/25;
                ctx.fillRect(x, y, w, h);
            });
        };

        wrap.appendChild(canvas);
        lane.appendChild(header);
        lane.appendChild(wrap);
        timeline.appendChild(lane);
    });
};