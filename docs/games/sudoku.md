# #️⃣ Sudoku (La Copa game, launched by flag; the lab prototype stays until the cleanup)

The classic numbers puzzle, played solo, in two levels (easy and hard), with a score. Born from `node tools/generators/new-game.mjs sudoku`
(#1249 step 9); the owner asked for it on 2026-11-10 ("un sudoku con tres dificultades: fácil, mediano y difícil",
"parte por ahí y después vamos viendo"); the same day they kept only easy and hard and set the
score ("100 por completarlo, sin errores, y cada número mal puesto es 10 menos").

## Resumen

- **Where:** `/labs/sudoku/`, behind the lab's door (D-281, D-395), `noindex`, its card in /labs/'s
  🎲 Juegos en prueba. Not in `games.js` while it is in the lab. Id `sudoku` in the usage signal and in
  `localStorage` (`juegos-de-salon:sudoku:session`). Its facts are in `games.js` (it left the lab in #1404).
- **For whom:** one player. In es, en and pt.

## Reglas

Fill the board so every row, every column and every box holds each digit once. The game ends when the
board is full and valid. **🟢 Fácil is a mini sudoku** (the owner asked, 2026-11-11, "como el Mini Sudoku de
LinkedIn", so a round fits a party): **6×6, boxes of 2 rows × 3 columns, digits 1 to 6**. **🔴 Difícil stays
the classic 9×9** with 3×3 boxes. The engine reads a board's size from its length (36 or 81, `geom` in
`engine.js`); the board, the pad and the notes follow it.

### Score

**100 for the finished board, minus 10 for every digit written that is not the solution's and 15 for every hint**, never below 0
(`score` in `engine.js`). Each wrong digit turns red at once and the line under the board says "−10";
undo does not give the 10 back, notes never count. **Giving up scores 0** (as in La Copa's puzzles). The score shows next to the clock and on the result,
and goes to the panel in `trackFinish` (`puntaje`, `errores`). It is the score La Copa will use if the
sudoku goes there. A digit that repeats in its row, column or box is red too.

### Hints

**💡 Pista** (the owner asked, 2026-11-11) costs **15 points**, as a hint does in La Copa's puzzles, and asks
twice like 🏳️ Rendirse (the first tap shows «💡 ¿Seguro? −15» for 3 s). It fills the selected cell when it is
open (empty or wrong); else the easiest one left: a cell with one candidate, then a digit with one place in a
row, column or box, counted on the board without its wrong digits (`findHint` in `engine.js`). The line under
the board says why («En esa fila, el 7 solo cabe ahí. −15»). A hinted cell is fixed, in yellow, and undo does
not take it back. The result counts the hints next to the mistakes.

### The celebration

A right digit pops with a soft ring (lime; yellow for a hint), and a row, column or box it completes gets a
light that runs along it from that cell (`celebrate` in `game.js`, `.pop-ok`, `.pop-hint`, `.sweep`). Nothing
moves with reduced motion.

### Levels and the generator (`engine.js`)

Every board is new, from a seed, with **one solution** and 180° symmetric givens. The generator fills a
solved grid and empties cells in mirrored pairs while the solution stays unique and the puzzle's
**grade** stays within the level. The grade is what a person needs to solve it by logic alone:

| Level | Givens | Grade it needs |
|---|---|---|
| 🟢 Fácil (`easy`), 6×6 | 12–14 of 36 | singles only (a cell with one candidate, a digit with one place in a unit) |
| 🔴 Difícil (`hard`), 9×9 | ~22–31 of 81 | needs locked candidates or naked/hidden pairs; never guessing |

A board takes a few milliseconds (hard ~40 ms) in the phone. `?seed=<text>` fixes the board of each level
(the tests use it).

## Look

**The game's icon is drawn** (the owner, 2026-11-11: the abacus 🧮 did not look like a sudoku, and there is no sudoku
emoji): a 3×3 with digits in the hard level's dark red, its 9 in yellow (`icon.svg`). It goes wherever the game shows
its emoji on screen: the cover's hero, the chip, How to play, the countdown and its /labs/ card (its splash is
another session's work). Where only text fits (the tab's title, the share message, rankings, the panel) the
game's emoji is **#️⃣**, the owner's pick of a text stand-in (🔢 is Toque y Fama's).

## Modos

Solo (`solo`). The level is picked with **the same lever as Pintaminas' hard mode** (the owner's request, for
one way to choose easy or hard across the games): down with a green knob is easy, up with a red knob is hard;
¡A jugar! opens a new board of the level it shows. It starts on easy, and after a game it shows the last level.

## The cover

Like every cover going to production (the owner's request, 2026-11-10): the title, a **demo** that explains the
game by itself, the level lever, ¡A jugar!, **your best** on that level, how to play (folded, D-550), and the level's **ranking**
with signing in.

- **Demo:** a small solved board with six holes, each the only one in its row, column and box. In turn each hole
  lights its row, then its column, then its box, with a line that says the rule, and then its digit pops in
  ("¡Solo cabe el 7!"). It sleeps off screen (`onScreen`) and stands solved with reduced motion. It follows the lever
  (the owner, 2026-11-11): on easy it is the 6×6 board with its 2×3 boxes, on hard the 9×9, and its line names
  that board's digits and box ("Fila: del 1 al 6", "Cuadro de 2×3"). The lead and the first step of how to play
  say both sizes.
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

Intro (resume panel with level and time, the level lever and ¡A jugar!, how to play in three short lines, folded: D-550) → play (level, clock and score, the board,
the 1–9 pad with how many of each are left, ✏️ Notas · ↩️ Deshacer over 💡 Pista · 🏳️ Rendirse, two by two) → result (the score and how it was made, level and time,
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

- `public/cup/games/sudoku/`: the La Copa game since it left the lab (`engine.js`, `ui.js`, `texts.js`,
  `style.css`); its facts in `games.js`. In the lab prototype, `public/labs/sudoku/`: `rules.js`: levels and LOCALES, `engine.js`: the
  generator, the grader and the moves, `engine.test.mjs`, `game.js`: screens and drawing, `style.css`: the
  board and the pad, on the tokens.
- `tools/e2e/sudoku/game.mjs`: plays both levels to the result (a wrong digit in red costs 10, a note, undo, the score);
  `node tools/e2e/conformance.mjs labs/sudoku` checks the canons. The hook is `window.__sudoku`
  (`state`, `start`, `play`, `solveAllBut`).

## Excepciones a los cánones

None.

## Out of the lab (2026-11-11, D-517's way)

Sudoku leaves the lab as Aletazo did: a La Copa game in `public/cup/games/sudoku/` (`engine.js`, the lab's,
moved here, plus La Copa's interface `generateDay` and `card`; `ui.js`, the screen; `texts.js` in es, en and pt;
`style.css`; `icon.svg`; `engine.test.mjs`) that serves its standalone page **`/sudoku/`** (generated by `og.mjs cards`,
with its link card `assets/og/sudoku.jpg`), La Copa and Uno al día. The id stays `sudoku` (usage signal, rankings).

- **Launched by a flag** (`lanza: 'sudoku'`, D-517): hidden from the home page, the search, the filters, /records/
  and a new cup's pool until `flags/sudoku` is *all*. The `launch` workflow switches it (and the splash `sudoku-ya`)
  at 2026-11-12T05:00:00Z (21:00 Pacific on 2026-11-11, D-529). Its /labs/ card (`#seccion-sudoku`) keeps the
  switch and points to `/sudoku/`, with the prototype as a link.
- **The levels are La Copa's variants** (`VARIANTES.sudoku = ['easy', 'hard']`, D-331): 🟢 easy (6×6) is the
  default, so **a cup day and Uno al día play the 6×6 mini** (La Copa promises a few minutes a day; a 9×9 hard board
  takes 10 to 20), and a cup's admin may pick 🔴 hard for a day. The standalone page picks it with the lab's lever
  (`selector`), and remembers it.
- **Score:** already 0 to 100 (100, −10 a wrong digit, −15 a hint, 0 given up), the same in a cup, in Uno al día
  and in the final; no curve. Ties go to the faster (the cup's clock, `clock`).
- **Rankings:** one table per level, `sudoku_easy` and `sudoku_hard`, as in the lab: `RK_POR_VARIANTE` in
  `cup/game.js` keeps the default level's table suffixed too (other games rank their default variant under the bare id).
- **The trial** (D-103) is the day's level with only 6 cells open (`TRIAL_OPEN`).
- **What the cup page provides stays out of the screen:** the countdown, the clock, the result, sharing,
  the ranking, the usage signal; and the lab's local best (`juegos-de-salon:sudoku:best`), which stays in the
  prototype. The whole board is saved after every move with `ctx.guardar`, so a reloaded day resumes.
- **Pool and deck:** `copa: { pozo: 17 }`, `unoAlDia: { orden: 22, desde: '2026-11-12' }` (joining the next deck; no
  day before changes). Not in `POZO_FIJO` until the cleanup PR.
- **The look:** the drawn icon over the demo on the cover (where only text fits, #️⃣), the lever, and the
  red-violet page in hard (`body.sd-hard`, following the screen, as Pintaminas' hard).
- **Tests:** `public/cup/games/sudoku/engine.test.mjs`; end to end `tools/e2e/sudoku/page.mjs` (the page:
  cover, lever, both levels played to the result, a wrong digit, a hint, giving up, the languages at 320 px).
  The prototype's `tools/e2e/sudoku/game.mjs` stays until the cleanup.

- **What a mistake costs** (lab, flag `mistakes-rule`): while playing, one line under the title says it, from this game's `errores` text; see [cup.md](cup.md#reglas).
