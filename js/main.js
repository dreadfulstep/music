import { engine } from "./audio/engine.js";
import { initInput } from "./input.js";

document.addEventListener('DOMContentLoaded', async () => {
        initInput();
});

document.body?.addEventListener('keydown', async () => {
    await Tone.start();
    await engine.init();
    console.log('Music Studio ready. A-K to play.');
});