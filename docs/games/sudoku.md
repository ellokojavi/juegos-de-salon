# 🧮 Sudoku (lab, in Juegos en prueba)

The classic numbers puzzle, played solo, in two levels (easy and hard), with a score. Born from `node tools/generators/new-game.mjs sudoku`
(#1249 step 9); the owner asked for it on 2026-11-10 ("un sudoku con tres dificultades: fácil, mediano y difícil",
"parte por ahí y después vamos viendo"); the same day they kept only easy and hard and set the
score ("100 por completarlo, sin errores, y cada número mal puesto es 10 menos").

## Resumen

- **Where:** `/labs/sudoku/`, behind the lab's door (D-281, D-395), `noindex`, its card in /labs/'s
  🎲 Juegos en prueba. Not in `games.js` while it is in the lab. Id `sudoku` in the usage signal and in
  `localStorage` (`juegos-de-salon:sudoku:session`). Its facts are in `game.json`.
- **For whom:** one player. In es, en and pt.

## Reglas

Fill the 9×9 board so every row, every column and every 3×3 box holds 1 to 9 once. The game ends when the
board is full and valid.

### Score

**100 for the finished board, minus 10 for every digit written that is not the solution's**, never below 0
(`score` in `engine.js`). Each wrong digit turns red at once and the line under the board says "−10";
undo does not give the 10 back, notes never count. **Giving up scores 0** (as in La Copa's puzzles). The score shows next to the clock and on the result,
and goes to the panel in `trackFinish` (`puntaje`, `errores`). It is the score La Copa will use if the
sudoku goes there. A digit that repeats in its row, column or box is red too.

### Levels and the generator (`engine.js`)

Every board is new, from a seed, with **one solution** and 180° symmetric givens. The generator fills a
solved grid and empties cells in mirrored pairs while the solution stays unique and the puzzle's
**grade** stays within the level. The grade is what a person needs to solve it by logic alone:

| Level | Givens | Grade it needs |
|---|---|---|
| 🟢 Fácil (`easy`) | 38 | singles only (a cell with one candidate, a digit with one place in a unit) |
| 🔴 Difícil (`hard`) | ~22–31 | needs locked candidates or naked/hidden pairs; never guessing |

A board takes a few milliseconds (hard ~40 ms) in the phone. `?seed=<text>` fixes the board of each level
(the tests use it).

## Look

The game's emoji is 🧮 (🔢 is Toque y Fama's). The cover's hero is a drawn icon instead of the emoji (the
owner's request): a sudoku on ruled notebook paper (no margin line, the owner asked), its digits in ink and one in pink,
as an inline SVG coloured from the tokens (`.sd-logo` in `style.css`).

## Modos

Solo (`solo`). The level is picked with **the same lever as Pintaminas' hard mode** (the owner's request, for
one way to choose easy or hard across the games): down with a green knob is easy, up with a red knob is hard;
¡A jugar! opens a new board of the level it shows. It starts on easy, and after a game it shows the last level.

## The cover

Like every cover going to production (the owner's request, 2026-11-10): the title, a **demo** that explains the
game by itself, the level lever, ¡A jugar!, **your best** on that level, how to play, and the level's **ranking**
with signing in.

- **Demo:** a small solved board with six holes, each the only one in its row, column and box. In turn each hole
  lights its row, then its column, then its box, with a line that says the rule, and then its digit pops in
  ("¡Solo cabe el 7!"). It sleeps off screen (`onScreen`) and stands solved with reduced motion.
- **The electric lever** (Pintaminas' switch, D-291): every flip sends a ring of electricity out of the plate
  (green to easy, red and yellow to hard) and jolts it. Up to hard there is a flash over the view, sparks, a glow
  that flickers like a bad contact, and the whole page turns over: `body.sd-hard`, a red-violet background, a red
  title, a red demo and board, and the browser's bar colour. The board and the result keep the game's level colour.
- **Your best:** per level on this phone (`juegos-de-salon:sudoku:best`), the highest score and, tied, the
  fastest time.
- **Ranking:** one table per level, `sudoku_easy` and `sudoku_hard` (score, then time), Week · All time · Friends,
  with signing in below; on the result, the notice that saves the game first (D-212, D-274), never with `?seed=`.
  While the rankings are in the lab it shows only where they are switched on.

## Flujo

Intro (resume panel with level and time, the level lever and ¡A jugar!, how to play in three short lines) → play (level, clock and score, the board,
the 1–9 pad with how many of each are left, ✏️ Notas, ↩️ Deshacer and 🏳️ Rendirse on the right) → result (the score and how it was made, level and time,
Another sudoku of that level, Share through `compartir.js`, Change difficulty, and the exit to the lab from
`fin.js`, C-19).

- Writing a digit clears the notes of that digit in its row, column and box. The same digit again empties
  the cell: there is no erase button (the owner swapped it for 🏳️ Rendirse; on a computer Backspace erases).
- 🏳️ Rendirse asks twice (U-15), as in Pintaminas and Dominorama: the first tap turns it into 🏳️ ¿Seguro?
  in yellow for 3 s, the second ends the game with 0 points and shows the solution on the result (givens in
  white, the rest in cyan), under the actions and the exits so they show without scrolling at 320 px (C-19),
  without Share.
- The result's detail line says how the score was made: "Sin errores: 100." or "Números mal puestos: n
  (−10 cada uno)."; after giving up there is none (the title and the 0 already say it, U-8).
- The clock runs only while the board is showing (it stops when the tab is hidden) and is saved with the game.
- On a computer: digits, arrows, Backspace, and N for notes.

## Protocolo de mensajes

None: one player, no room. The whole state (givens, solution, cells, notes, undo history, time) is saved
after every move (`createSessionStore`, C-6).

## Archivos

- `public/labs/sudoku/game.json`: the manifest (#1249), `rules.js`: levels and LOCALES, `engine.js`: the
  generator, the grader and the moves, `engine.test.mjs`, `game.js`: screens and drawing, `style.css`: the
  board and the pad, on the tokens.
- `tools/e2e/sudoku/game.mjs`: plays both levels to the result (a wrong digit in red costs 10, a note, undo, the score);
  `node tools/e2e/conformance.mjs labs/sudoku` checks the canons. The hook is `window.__sudoku`
  (`state`, `start`, `play`, `solveAllBut`).

## Excepciones a los cánones

None.

## Ideas for later

Not built yet, for the owner to choose: a hint, a daily board for everyone (One a Day), best times per level,
La Copa (the score is ready).
