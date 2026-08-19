import { engine } from "./audio/engine.js";
import { initInput } from "./input.js";

const overlay = document.getElementById('start-overlay');

overlay.addEventListener('click', async () => {
    await Tone.start();
    await engine.init();
    initInput();
    overlay.style.display = 'none';
    console.log('Music Studio ready. A-K to play.');
})