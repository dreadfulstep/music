UI should have a sidebar of buttons for different layouts or something, not sure yet
Navbar with things such as settings, keybinds, export etc whatever else is important
Main area with a "tracks" sort of thing, just like garage band
Navbar should have BPM etc
Settings to loop a track / mute it etc etc
Track recording, maybe SHIFT + R? Or F3 im not sure yet.

The layout should be with a fixed looking nav, 100% height around 175px width. (Imma die trying to support mobile if i evevn do lmao)
Navbar floating and stuff with the BPM, + - icons to decrease / increase, icons for play stop record and uhh yeah. Maybe a settings thing too or a settings shortcut
The piano at the bottom, either 3d or flat keys idk, linear gradient on active

When focused on a track, you have a timeline at the bottom (esc to close timeline), you then use arrow keys to navigate through notes and up/down arrows to move them, and maybe shift + right/left arrow key to make it longer / shorter

im just gonna use this as a journal at this point, but styling this with just css is something i never thought to be this difficult holy moly

I've actually made something thats usable (albeit my headphones have a huge delay lmfao)

Current to-do:
Tracks (yeah very detailed, i know)
The navbar is lacking, same with bottombar
Settings modal for like volume, and anything else (potentially light mode?)

Bug i've noticed: If you spam SHIFT + R it ends up being really weird, my brain is too tired to explain so imma go sleep and i forgot what it was but it reset the countdown or something (make it like toggle recording including when counting down probably)

New plan: Edit timeline, settings etc etc all in a large modal that has a sidebar with tabs for settings (light mode, etc), tracks (change all tracks presets, their bpm etc),
uhh timeline to view a specific track timeline and edit it. Potentially i will replace the existing modals with this since it would look far cleaner, and a tab to see all the keybinds (and edit them maybe?)

Issue to fix: holding down a key then leaving window focus causes it to be held down (very annoying and bad)

Very cool progress, the UI is actually really pretty even though its designed for keyboard only but i really need a popup modal that is shown on load, probably one to like load a project from a file or recents since that makes a user enable audio iirc

I really did lack programming yesterday, but im back maybe? I need to add beats for specific tracks, specific track volume control, improve main layout, add a projects modal on load and whatnot. Im sure theres more but i got voice recording, audio file uploading, and exporting down so most of the stuff i wanted is complete

Seems to be a crackling issue, need to fix soon but oh well