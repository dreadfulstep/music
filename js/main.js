import { input } from "./input.js";
import { state } from "./state.js";
import { engine } from "./audio/engine.js";
import { modal } from "./ui/modal.js";
import { PianoRoll } from "./ui/piano-roll.js";

const roll = new PianoRoll("piano-roll");

function loop() {
  roll.draw();
  requestAnimationFrame(loop);
}
loop();

document.addEventListener("DOMContentLoaded", async () => {
  input.onKey(
    " ",
    () => {
      if (state.isPlaying) {
        engine.stopTransport();
      } else {
        state.isRecording = false; // ensures not recording
        engine.startTransport();
      }
    },
    { preventDefault: true },
  );

  input.onCombo("shift", "1", () => {
    modal.open("Select Track", (body) => {
      const div = document.createElement("div");
      div.textContent = "hey!";
      body?.appendChild(div);
    });
  });
  input.onCombo("shift", "2", () => {
    modal.open("Select Preset", (body) => {
      const div = document.createElement("div");
      div.textContent = "hey!";
      body?.appendChild(div);
    });
  });
  input.onCombo("shift", "3", () => {
    modal.open("New Track", (body) => {
      const div = document.createElement("div");
      div.textContent = "hey!";
      body?.appendChild(div);
    });
  });

  // Mute
  input.onCombo("shift", "m", () => {
    const t = state.tracks[state.currentTrack];
    if (t) {
      t.muted = !t.muted;
      input._updateDisplays();
    }
  });

  // Record
  input.onCombo("shift", "r", () => {
    if (state.isRecording) {
      engine.stopTransport();
    } else {
      state.isRecording = true;
      engine.startTransport();
    }
  });

  // BPM
  input.onCombo("shift", "<", () => input._startBpm(-1, input.lastComboCode));
  input.onCombo("shift", ">", () => input._startBpm(1, input.lastComboCode));

  input.mount();
});
