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

1. 🎲 Pon todas las fichas en el tablero: cada una ocupa dos casillas.
2. 🎯 Cada zona de color cumple su regla: 6 suman 6, = todas iguales, ≠ todas distintas, <5 suman menos de 5, >9 suman más de 9.
3. 👆 Toca una ficha para elegirla, otra vez para girarla, y toca la casilla donde va. Una ficha puesta se saca con un toque. Son 3 tableros contra el reloj.

The 🎲 stands in for a domino: the domino characters (🁢) are not color emoji on an iPhone and could show
as an empty box.

## How it is played

- **Three boards**, easy (4 dominoes, inside 4×3), medium (6, inside 4×4) and hard (8, inside 5×5), one
  after the other, against a clock that runs from the shared 3, 2, 1 ("¡A jugar!"). The heading says
  "Tablero n de 3 · fácil|medio|difícil" and the clock shows the time so far.
- **The board:** square cells, each colored by its zone, with a dashed edge where the zone ends. A zone
  with no rule is plain. The rule hangs on the zone's last cell as a diamond: `6`, `=`, `≠`, `<5`, `>9`.
- **The tray:** the dominoes not yet placed, ivory with dark dots. A tap chooses one (it lifts and
  shines); another tap turns it a quarter (x|y, x over y, y|x, y over x); a tap on a cell lays its first
  half there and the other to the right or below. Where it does not fit: "Así no cabe: gírala o prueba
  otra casilla." On a taken cell: "Ahí ya hay una ficha: sácala primero." A placed domino comes off with
  a tap.
- **The zones:** once full, a kept rule's diamond gets a green ring, a broken one turns red and shakes.
  With every domino down and a zone broken: "❌ Una zona no cumple su regla: mueve alguna ficha."
- **Solved:** every cell covered and every zone kept, in any arrangement (not only the engine's): the
  board glows, "✅ ¡Listo!", a little confetti, and the next board comes.
- **💡 Ayuda (−10):** a second tap ("Toca de nuevo (−10)", 3 seconds), then it lays one domino of the
  solution in its place, taking off whatever was on those cells, and marks it.
- **🏳️ Rendirse:** a second tap ("🏳️ ¿Seguro?").
- **Score, out of 100:** each board solved 20; with the three, up to 40 for speed (40 in 4 minutes or
  less, 0 in 12, straight between); each help −10; never below 0.
- **The result:** the stamp (¡Los tres! or Te rendiste), the score, the breakdown, the time, sharing,
  other boards, today's (if played with a seed), back to the lab and, after a line, the comment form.
- **Sharing:** one mark per board ("✅✅⬜ 2 de 3") and the helps, never the boards.

## How it works

- `engine.js`: `generar(semilla, nivel)` builds a board from a solution: dominoes laid next to each
  other make a compact shape (a new one goes where it touches more of the shape), each gets a different
  domino of a double-six set, the cells are split into zones of 1 to 4, and each zone gets a rule its
  pips keep. `resolver(t, max, limite)` counts the solutions (layouts that leave the same pips on every
  cell count once); while there are two, a zone that differs gets its exact sum, or a cell where only the
  order differs (2 and 4 against 4 and 2) becomes a zone of its own; a board too loose to prove within
  `limite` steps gets one more exact sum. Every board has exactly one answer (engine.test.mjs checks it
  for several seeds and the three levels). A phone builds a hard board in a few tens of milliseconds.
- `cumple(zona, valores)` decides a rule (and prunes the solver while a zone is partial); `lugar`,
  `poner`, `sacar`, `estadoZonas`, `resuelto`, `ayudar`, `puntaje` and `tarjeta` are the game.
- `game.js` draws the board with a CSS grid (cells, edges, diamonds) and the dominoes over it; the
  end-to-end hook is `window.__pips` (`P`, and `solucion()` of the board on screen).
- Today's boards: without `?seed=`, `dia:<date>`, the same for everyone.

## To tune

Most zones end up with an exact sum (the tightening favors them), so the boards lean on adding up; the
real Pips has more `=`, `≠`, `<` and `>`. Worth looking at once friends have played it.

## Tests

`public/labs/pips/engine.test.mjs` (rules, one solution per board, laying, help, score) and
`tools/e2e/pips/lab.mjs` (the lab card, the cover, choosing, turning and laying with taps, the three
boards solved by taps, the help, the result, giving up).

## Exceptions to the canons

Those of every lab prototype (D-304): Spanish only, outside La Copa and Uno al día, reached only with a
lab key.
