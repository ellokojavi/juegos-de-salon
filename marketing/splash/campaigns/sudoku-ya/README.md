# 🧮 ¿Te atreves con un Sudoku? (`sudoku-ya`)

An invitation to play 🧮 Sudoku, made ahead of its launch out of the lab (the owner's request, 2026-11-11:
"no lo actives hasta que lancemos el juego").

| | |
|---|---|
| Texts | kicker "¡Nuevo juego!" · title "¿Te atreves con un Sudoku?"; the card says how it plays (1 to 9 without repeating in a row, column or box; easy or hard; the score on the ranking) and ▶ Jugar; in es, en and pt |
| Layout | `hero`: the board as wide as the window, the card under it |
| Item | 🧮 Sudoku, its own texts and link (`labs/sudoku/`), since the game is not in `games.js` while in the lab; picture `public/assets/splash/sudoku.jpg`, the real board half solved (`?seed=SPLASH`, easy) |
| Waits for | `requires: ['sudoku']`: unseen until flags/sudoku is on for the visitor (D-517) |
| On | **off**: not in `ACTIVE`. At launch, switch it on in the panel's 📣 Campaigns (or the `launch` workflow, D-529); the launch PR points `href` at the game's new folder |
| Usability | full pass before merging (D-355) |

Screenshots at 390 px, as `node tools/e2e/look.mjs splash sudoku-ya --lang <xx>` shows it:
[es](es-390.jpg) · [en](en-390.jpg) · [pt](pt-390.jpg).

## History

- **2026-11-11:** made, kept off until the game leaves the lab.
