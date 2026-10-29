level: patch

- **The room chat no longer covers buttons**: in every room game the 💬 bubble now sits in a strip of its own at the bottom of the screen, and the screen ends above it, so it never hides the right end of ¡CALZO!, ¡A JUGAR!, Me paso or ¡Zarpar! (one shared rule in `base.css` replaces each game's own padding; Julepe's sticky bar stops above the bubble).
- **Tools:** `look.mjs --chat` mounts the room chat on any screen and names the buttons its bubble covers; `liars-dice/rooms-classic.mjs` with `SICILIANA=1` now always doubts the game's first bid, and checks that every phone shows the siciliana line and the same two-dice loss.
