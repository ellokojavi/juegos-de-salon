# 🔢 Twins (Gemelos; lab, in Juegos en prueba)

Born from `node tools/generators/new-game.mjs twins`. The first try of decision 2 of the ideas round of
2026-11-25 (https://github.com/ellokojavi/juegos-de-salon/issues/1900, the owner's «Yes, in Labs»): a daily
numbers puzzle inspired by Sumbreak, LinkedIn's ninth game (https://www.linkedin.com/games/sumbreak).
**Gemelos is a working name:** the final name is the owner's pick, as with Pintaminas and Loteo; a rename
renames the folder, id and keys with it (C-20).

## Resumen

- **Where:** `/labs/twins/`, behind the lab's door (D-281, D-395), `noindex`, its card first in /labs/'s
  🎲 Juegos en prueba. Not in `games.js` (only its name in `LAB_NAMES`), not in La Copa, not in Uno al día,
  not on the home page. Id `twins` in the usage signal and in `localStorage`
  (`juegos-de-salon:twins:session` for the board in progress, `juegos-de-salon:twins:days` for each day's
  result). Its facts are in `game.json`.
- **For whom:** one player, solo, 1 to 3 minutes. The idea asked for Spanish only; the screens are in es,
  en and pt anyway, because the lab's entry gate (D-579) asks every lab game for C-3, and the game has
  almost no words.
- **Credit:** the cover ends with «Inspirado en Sumbreak, de LinkedIn.» linking to its page; never on the
  result screen.

## Reglas

- A 5 × 5 grid with 11 to 13 numbers and gaps. Drag a number onto an **equal** number right beside it (up,
  down, left or right, never across a gap or on a diagonal): they merge into their sum on the cell it was
  dropped on, 8 + 8 = 16, and the cell it came from is left empty. A tap on a number and then on its twin
  does the same. A number dropped anywhere else goes back.
- The board is solved when **one number** is left. A merge can strand a number with no twin it can ever
  reach: a dead end. With no merge left the board says so.
- **↩ Deshacer** is free, as many times as wanted.
- **💡 Pista (−10)** (D-292): the number to drag pulses and its twin is ringed, a merge that keeps the board
  solvable. If the board can no longer be solved, the hint first undoes the merges since the last board
  that could, and says how many.
- **Score, 0 to 100, by time like Queens** (D-107): 100 up to 30 s, then down evenly to 10 at 5 min; minus
  10 per hint, never below 0. The time runs only while the board is on screen and the page is visible.
- **One board a day**, the same for everyone on a date (the player's own midnight): board n.º 1 is
  2026-11-26. Once solved, the cover shows its score and today opens on its result. `?seed=<text>` opens
  the board of that seed instead, outside the day (it keeps no day's result).
- Rankings: none yet (D-212: whether it keeps a score is the owner's call).

## The generator (`engine.js`)

Each board is built **backwards** from its last number (`generate(seed)`): one of 48, 64, 80, 96, 112,
128, 160 or 192 (an odd base times a power of two) sits near the middle; then, until the board has its
count, a number that can still be halved splits into two halves on two cells side by side (a bigger
number splits more often, so several sizes stay on the board). Undoing the splits in reverse is a
solution, so **every board is solvable**. Of 30 tries with the same seed it keeps the first that has a
dead end among its first merges, but no more dead ends than good ones. The seed of a day is
`twins:<date>`, through `rng.js` (mulberry32), so the board is the same on every device.

`solve(cells)` is a depth-first search that remembers the hopeless boards; it gives the hint and, in the
tests, proves every board solvable.

## Modos

Solo (`solo`): today's board (the yellow start button), or the board of `?seed=`.

## Flujo

Cover («🔢 Jugar hoy», under it the board's number or today's score, how to play, the credit, the footer)
→ play (the board's number, the numbers left and the clock, the board, a notice line, ↩ Deshacer and 💡
Pista) → result (the score out of 100, the time and the hints' cost, «Mañana hay otro tablero.», Share,
the exit to the lab from `fin.js`, C-19).

## Protocolo de mensajes

None: one phone, no room. The game is saved after every merge (`createSessionStore`, C-6).

## Archivos

- `public/labs/twins/game.json`: the manifest; `rules.js`: LOCALES and the credit's link; `engine.js`: the
  pure rules (dates, the grid, merges, the solver, the generator, undo, hints, score); `engine.test.mjs`:
  the rules, the solver, and 60 generated boards (30 days and 30 seeds) each solved by the solver and
  played to its last number; `game.js`: screens, the drag and the clock; `style.css`: only its own, on
  the tokens.
- `tools/e2e/twins/game.mjs`: plays today's board at 390 px with real drags and taps (a drop on a different
  number, a drag merge, a tap merge, undo, a dead end, the hint that undoes it, a reload), to the result,
  and again to the result at 320 px; then `?seed=`. `node tools/e2e/conformance.mjs labs/twins` checks
  the canons.
- Hook: `window.__twins` (`state()`, `solve()`, `merge(from, to)`, `hinted()`).

## Excepciones a los cánones

None.
