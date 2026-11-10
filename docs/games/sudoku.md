# 🔢 Sudoku (lab, in Juegos en prueba)

The classic numbers puzzle, played solo, in three levels. Born from `node tools/generators/new-game.mjs sudoku`
(#1249 step 9); the owner asked for it on 2026-11-10 ("un sudoku con tres dificultades: fácil, mediano y difícil",
"parte por ahí y después vamos viendo").

## Resumen

- **Where:** `/labs/sudoku/`, behind the lab's door (D-281, D-395), `noindex`, its card in /labs/'s
  🎲 Juegos en prueba. Not in `games.js` while it is in the lab. Id `sudoku` in the usage signal and in
  `localStorage` (`juegos-de-salon:sudoku:session`). Its facts are in `game.json`.
- **For whom:** one player. In es, en and pt.

## Reglas

Fill the 9×9 board so every row, every column and every 3×3 box holds 1 to 9 once. A digit that repeats
in its row, column or box turns red (the rule, never the solution: the game does not tell you a digit is
wrong until it clashes). The game ends when the board is full and valid.

### Levels and the generator (`engine.js`)

Every board is new, from a seed, with **one solution** and 180° symmetric givens. The generator fills a
solved grid and empties cells in mirrored pairs while the solution stays unique and the puzzle's
**grade** stays within the level. The grade is what a person needs to solve it by logic alone:

| Level | Givens | Grade it needs |
|---|---|---|
| 🟢 Fácil (`easy`) | 38 | singles only (a cell with one candidate, a digit with one place in a unit) |
| 🟡 Mediano (`medium`) | 28–32 | singles only, with far fewer givens to scan |
| 🔴 Difícil (`hard`) | ~22–31 | needs locked candidates or naked/hidden pairs; never guessing |

A board takes a few milliseconds (hard ~40 ms) in the phone. `?seed=<text>` fixes the board of each level
(the tests use it).

## Modos

Solo (`solo`): the cover lists the three levels as modes; tapping one opens a new board.

## Flujo

Intro (resume panel with level and time, the three levels, how to play) → play (level and clock, the board,
the 1–9 pad with how many of each are left, ✏️ Notas, 🧽 Borrar, ↩️ Deshacer) → result (level and time,
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
- `tools/e2e/sudoku/game.mjs`: plays each level to the result (a clash in red, a note, undo);
  `node tools/e2e/conformance.mjs labs/sudoku` checks the canons. The hook is `window.__sudoku`
  (`state`, `start`, `play`, `solveAllBut`).

## Excepciones a los cánones

None.

## Ideas for later

Not built yet, for the owner to choose: a hint, a daily board for everyone (One a Day), best times per level,
highlighting a wrong digit against the solution as an option.
