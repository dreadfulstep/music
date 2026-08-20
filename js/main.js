import { engine } from "./audio/engine.js";
import { initInput } from "./input.js";

const overlay = document.getElementById('start-overlay');

document.addEventListener('DOMContentLoaded', async () => {
        initInput();

});

overlay?.addEventListener('click', async () => {
    await Tone.start();
    await engine.init();
    console.log('Music Studio ready. A-K to play.');
})