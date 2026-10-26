# 🚂 ¡El tren ya cruza! (`tren-en-vilo-ya`)

🚂 Tren en Vilo leaves the lab and is for everyone, also in Uno al día and La Copa. It follows the
teaser [`tren-en-vilo-pronto`](../tren-en-vilo-pronto/README.md): the train the teaser left at the edge
of the gap now crosses.

| | |
|---|---|
| Texts | kicker "¡Nuevo!" · title "¡El tren ya cruza!" ; the game's card carries the description (a bridge of beams over a gap: it holds and the train crosses, or it falls; it is in Uno al día and La Copa) and ▶ Jugar; in the four languages |
| Layout | `hero` (the owner's request, 2026-10-26): the game's scene as wide as the window at its own shape (720×730), not a thumbnail, and its card under it |
| Item | 🚂 Tren en Vilo (`puentes`, `/bridges/`), with its clip `public/assets/splash/bridges.mp4` and poster `bridges.jpg`: a level-1 wood stage built beam by beam in the neon look, then the bullet train crossing it, the strain gauge without its words so one clip serves the four languages (made by [`capture.mjs`](../../capture.mjs) `bridges` at the canvas's own shape) |
| On | from its publish, through 2026-11-09 inclusive, replacing the teaser in `ACTIVE` (D-430) |
| Usability | full pass before merging (D-355) |

Screenshots at 390 px, as `node tools/e2e/look.mjs splash tren-en-vilo-ya --lang <xx>` shows it:
[es](es-390.jpg) · [en](en-390.jpg) · [pt](pt-390.jpg) · [de](de-390.jpg).

## History

- **2026-10-26:** made for the game's launch out of the lab; the teaser goes off.
- **2026-10-26 (redesign):** the owner asked for the game's view as big as the window allows, with a building sequence and the train crossing, and the game's card with its description and Play: `hero` layout, the clip re-recorded at 720×730.
