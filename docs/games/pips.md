# 🎲 Pips (lab prototype, in Juegos en prueba)

A dominoes puzzle for one player (D-381): lay every domino on the board so each colored zone keeps its
rule. **Inspired by [Pips](https://www.nytimes.com/games/pips), by The New York Times Games (2025)**, and
it says so on the cover and in the lab. It came from the game-ideas agent's first round (D-360,
issue #556, idea `pips-dominoes`), approved by the owner: "Hagamos una demo de Pips en Labs".

## Summary

- **Where:** `https://juegosdesalon.cl/labs/pips/`, in the lab (each person's key, D-281, D-284). Id `pips`
  in the usage signal.
- **For whom:** one player. Spanish only (a prototype).
- **Status:** active project, to try with friends. If it catches on, the idea is that it joins La Copa.

## Cover

The title with an ivory domino (6 and 3) that sways, the tagline ("Pon todas las fichas de dominó para
que cada zona cumpla su regla."), the credit, and an easy board that solves itself, a domino at a time,
then another (still with reduced motion). Then "📅 Los tableros de hoy son los mismos para todos." (without
`?seed=`), "🎲 Empezar" and the three steps (after the button, U-39):

1. 🎲 Pon todas las fichas: cada una cubre dos casillas.
2. 🎯 Cada zona de color cumple su regla: un número es lo que suman sus puntos; = todos iguales; ≠ todos distintos; <5 y >9, menos o más.
3. 👆 Mantén y arrastra cada ficha a su casilla; un toque la gira. Toca un rombo: se ilumina su zona.

The usability agent shortened them to fit U-18 (273 characters); that there are three boards against the
clock is said by the lab card and the heading of each board.

The 🎲 stands in for a domino: the domino characters (🁢) are not color emoji on an iPhone and could show
as an empty box.

## How it is played

- **Three boards**, easy (4 dominoes, inside 4×3), medium (6, inside 4×4) and hard (8, inside 5×5), one
  after the other, against a clock that runs from the shared 3, 2, 1 ("¡A jugar!"). The heading says
  "Tablero n de 3 · fácil|medio|difícil" and the clock shows the time so far.
- **The board:** square cells, each colored by its zone, with a dashed edge where the zone ends. A zone
  with no rule is plain. The rule sits inside the zone's last cell, in its bottom-right corner, as a
  diamond: `6`, `=`, `≠`, `<5`, `>9` (D-385: it used to hang over the corner, where it looked like any
  of four cells'). A tap on a diamond lights its zone for a moment and dims the rest.
- **The tray:** the dominoes not yet placed, ivory with dark dots, each in a square slot as big as the
  domino is long, so turning one or laying it moves nothing on the screen (D-385; a laid domino leaves its
  slot empty). A tap turns it a quarter (x|y, x over y, y|x, y over x) and chooses it (it lifts and
  shines); a tap on a cell then lays its first half there and the other to the right or below. Where it
  does not fit: "Así no cabe: gírala o prueba otra casilla." On a taken cell: "Ahí ya hay una ficha:
  sácala primero." A placed domino comes off with a tap.
- **Drag and drop (D-385):** a domino from the tray, or one already placed, can be dragged: moving it,
  or holding it still for a quarter of a second, lifts it. It follows
  the finger a little above it (so the finger does not hide it), with the orientation it has, and the
  half that was grabbed lands on the cell under it. While dragging, the two cells it would take are
  outlined (red if taken) and the zone under it lights up. Dropped where it does not fit, it stays where
  it was and the cell shakes; a placed domino dropped off the board goes back to the tray. A move under
  8 px is still a tap, so the tap way keeps working.
- **The zones:** once full, a kept rule's diamond gets a green ring, a broken one turns red and shakes.
  With every domino down and a zone broken: "❌ Una zona no cumple su regla: mueve alguna ficha."
- **Solved:** every cell covered and every zone kept, in any arrangement (not only the engine's): the
  board glows, "✅ ¡Listo!", a little confetti, and the next board comes.
- **💡 Ayuda (−10):** a second tap ("Toca de nuevo (−10)", 3 seconds), then it lays one domino of the
  solution in its place, taking off whatever was on those cells, and marks it.
- **🏳️ Rendirse:** a second tap ("🏳️ ¿Seguro?").
- **↩️ Deshacer and 🧹 Limpiar (D-385):** a row above Ayuda and Rendirse. Deshacer takes back the last
  change to the board (a domino laid, moved or taken off, a help, a clear), one at a time, as far back as
  the board began; a help undone keeps its −10. Limpiar takes every domino off with a second tap ("🧹
  ¿Sacar todas?", 3 seconds), and can be undone. Each is greyed out when it has nothing to do.
- **Score, out of 100:** each board solved 20; with the three, up to 40 for speed (40 in 4 minutes or
  less, 0 in 12, straight between); each help −10; never below 0.
- **The result:** the stamp (¡Los tres! or Te rendiste), the score, the breakdown, the time, sharing,
  other boards, today's (if played with a seed), back to the lab and, after a line, the comment form.
- **Sharing:** one mark per board ("✅✅⬜ 2 de 3") and the helps, never the boards.

## How it works

- `engine.js`: `generar(semilla, nivel)` builds a board from a solution: dominoes laid next to each
  other make a compact shape (a new one goes where it touches more of the shape), each gets a different
  domino of a double-six set, the cells are split into zones of 1 to 4 (growing first into a neighbor
  with the same pips, and never holding both halves of a domino with two different numbers, D-386), and
  each zone gets a rule its pips keep. `resolver(t, max, limite)` counts the solutions (layouts that
  leave the same pips on every cell count once); while there are two, a zone that differs gets a stricter
  rule, `=`, `≠` or the tightest `<`/`>` before an exact sum, or, when only the order inside a zone
  differs, a cell moves to a neighboring zone; a board too loose to prove within `limite` steps gets one
  more exact sum. Then each one-cell zone tries to join a neighbor while the board keeps one answer.
  Every board has exactly one answer (engine.test.mjs checks it for several seeds and the three levels,
  and the rule mix). Building the three boards takes about 25 ms on a computer (rarely a few hundred).
- `cumple(zona, valores)` decides a rule (and prunes the solver while a zone is partial); `lugar`,
  `poner`, `sacar`, `estadoZonas`, `resuelto`, `ayudar`, `puntaje` and `tarjeta` are the game.
- `game.js` draws the board with a CSS grid (cells, edges, diamonds) and the dominoes over it; the
  end-to-end hook is `window.__pips` (`P`, and `solucion()` of the board on screen).
- Today's boards: without `?seed=`, `dia:<date>`, the same for everyone.

## To tune

D-386 cut the exact sums from 86% of the cells to about 60%, and the one-cell zones from three in four
to under half. The real Pips still has more `=` zones and bigger zones; worth looking at again once
friends have played it.

## Tests

`public/labs/pips/engine.test.mjs` (rules, one solution per board, laying, help, score) and
`tools/e2e/pips/lab.mjs` (the lab card, the cover, choosing, turning and laying with taps, the three
boards solved by taps, the help, the result, giving up).

## Exceptions to the canons

Those of every lab prototype (D-304): Spanish only, outside La Copa and Uno al día, reached only with a
lab key.
