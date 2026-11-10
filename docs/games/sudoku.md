# 🔢 Sudoku (lab, in Juegos en prueba)

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
undo does not give the 10 back, notes never count. The score shows next to the clock and on the result,
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

## Modos

Solo (`solo`). The level is picked with **the same lever as Pintaminas' hard mode** (the owner's request, for
one way to choose easy or hard across the games): down with a green knob is easy, up with a red knob is hard;
¡A jugar! opens a new board of the level it shows. It starts on easy, and after a game it shows the last level.

## Flujo

Intro (resume panel with level and time, the level lever and ¡A jugar!, how to play in three short lines) → play (level, clock and score, the board,
the 1–9 pad with how many of each are left, ✏️ Notas, 🧽 Borrar, ↩️ Deshacer) → result (the score and how it was made, level and time,
Another sudoku of that level, Share through `compartir.js`, Change difficulty, and the exit to the lab from
`fin.js`, C-19).

- Writing a digit clears the notes of that digit in its row, column and box.
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
