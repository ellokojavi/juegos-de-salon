# #️⃣ ¿Te atreves con un Sudoku? (`sudoku-ya`)

An invitation to play 🧮 Sudoku, made ahead of its launch out of the lab (the owner's request, 2026-11-11:
"no lo actives hasta que lancemos el juego").

| | |
|---|---|
| Texts | kicker "¡Nuevo juego!" · title "¿Te atreves con un Sudoku?"; the card says what it offers (a 6×6 mini sudoku for a quick game or the classic 9×9; the score on the ranking) and ▶ Jugar; in es, en and pt |
| Layout | `hero`: the board as wide as the window, the card under it |
| Icon | the game's drawn icon (`labs/sudoku/icon.svg`, a 3×3: there is no sudoku emoji, #1400) above the title and before its name; `#️⃣` where only text fits |
| Item | Sudoku, its own texts and link (`labs/sudoku/`), since the game is not in `games.js` while in the lab; picture `public/assets/splash/sudoku.jpg`, the real board half solved (`?seed=SPLASH`, easy) |
| Waits for | `requires: ['sudoku']`: unseen until flags/sudoku is on for the visitor (D-517) |
| On | **off**: not in `ACTIVE`. At launch, switch it on in the panel's 📣 Campaigns (or the `launch` workflow, D-529); the launch PR points `href` at the game's new folder |
| Usability | full pass before merging (D-355) |

Screenshots at 390 px, as `node tools/e2e/look.mjs splash sudoku-ya --lang <xx>` shows it:
[es](es-390.jpg) · [en](en-390.jpg) · [pt](pt-390.jpg).

## History

- **2026-11-11:** made, kept off until the game leaves the lab.
- **2026-11-11 (clip, margins, icon):** the clip finds each digit by lines across the grid; it is exactly the grid, as big as the screen allows and flush with its card (the laptop puts it beside the texts); the game's drawn icon replaces 🧮; the text names both sizes.
