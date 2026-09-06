# Midia

An open-source music creation website controlled entirely with your keyboard.

The project is entirely static without any backend, making it easy to deploy to any serverless / static deployment service

## Features
Multi-track system
Tone.js synth engine
Recording piano input, microphone and audio uploads.
Projects autosaved to localstorage
Export projects as JSON (re-import to midia at a later date) or WAV
Dark / light theme

All keybinds available on the DAW (Digital audio workspace) are visible on the sidebar.

## Getting started
No dependencies are required, you only need a static server since ES modules dont load via `file://` imports.

VS Code: Install the Live [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension and click "Go Live" in the bottom right of the window.

### Terminal
```bash
git clone https://github.com/dreadfulstep/music.git
cd music
npx servepython3 -m http.server http.server 8000
```
Then open the printed URL (http://localhost:8080)

## Deploying
It's a static site, you can direct any deployment service towards the repository and immediately deploy it without long build times.

## Built with
- Tone.js for the audio engine, synths, and WAV exports
- Lucide for icons
- Vanilla ES modules and canvas for tracks, timelines, and any visual rendering