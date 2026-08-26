import { input } from "./input.js";
import { state } from "./state.js";
import { engine } from "./audio/engine.js";
import { modal } from "./ui/modal.js";

document.addEventListener("DOMContentLoaded", async () => {
  input.onKey(
    " ",
    () => {
      state.isPlaying ? engine.stopTransport() : engine.startTransport();
    },
    { preventDefault: true },
  );

  input.onCombo("shift", "1", () => {}); // Open track modal
  input.onCombo("shift", "2", () => {}); // Open preset modal
  input.onCombo("shift", "3", () => {
        console.log("Click!")
        modal.open("New Track")
  }); // Open new track modal

  // Mute
  input.onCombo("shift", "m", () => {
    const t = state.tracks[state.currentTrack];
    if (t) {
      t.muted = !t.muted;
      input._updateDisplays();
    }
  });

  // BPM
  input.onCombo("shift", ",", () => input._startBpm(-1));
  input.onCombo("shift", ".", () => input._startBpm(1));

  input.mount();
});
