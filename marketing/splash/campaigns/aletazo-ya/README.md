# 🐤 ¡A volar con Aletazo! (`aletazo-ya`)

🐤 Aletazo leaves the lab and is for everyone, also in La Copa and, from its next deck, Uno al día. It
follows the teaser [`flap-soon`](../flap-soon/README.md): the bird that glided over the city now plays.

| | |
|---|---|
| Texts | kicker "¡Nuevo juego!" · title "¡A volar con Aletazo!"; the game's card carries the description (one tap, one flap, through hoops and the gaps in walls; in La Copa and coming to Uno al día) and ▶ Jugar; in es, en and pt |
| Layout | `hero`, as Tren en Vilo's launch: the game's scene as wide as the window, its card under it |
| Item | 🐤 Aletazo (`aletazo`, `/flap/?play`), with its clip `public/assets/splash/flap.mp4` (360×234, 9 s: the cover's own demo flying the course by night, recorded by [`capture.mjs`](../../capture.mjs) `flap`), its first frame `flap-start.jpg` as the poster and `flap.jpg` as the still for reduced motion |
| Waits for | `requires: ['aletazo']`: unseen until flags/aletazo is on for the visitor (D-517) |
| On | switched on with the game by the `launch` workflow at 2026-11-09T08:00:00Z (00:00 Pacific, D-529), first in the queue, through 2026-11-16 |
| Usability | full pass before merging (D-355) |

Screenshots at 390 px, as `node tools/e2e/look.mjs splash aletazo-ya --lang <xx>` shows it:
[es](es-390.jpg) · [en](en-390.jpg) · [pt](pt-390.jpg).

## History

- **2026-11-08:** made for the game's launch out of the lab, the day the teaser `flap-soon` ends.
