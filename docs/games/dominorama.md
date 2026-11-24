# 🎲 Dominorama (La Copa game, launched 2026-11-19 18:54 Pacific; the lab prototype stays until the cleanup)

A dominoes puzzle for one player (D-381): lay every domino on the board so each colored zone keeps its
rule. **Inspired by [Pips](https://www.nytimes.com/games/pips), by The New York Times Games (2025)**, and
it says so on the cover and in the lab. It came from the game-ideas agent's first round (D-360,
issue #556, idea `pips-dominoes`), approved by the owner: "Hagamos una demo de Pips en Labs".

**Its name.** It was called Pips until 2026-10-28, when the owner renamed it Dominorama because Pips
is a registered mark: no "Dominorama" turned up in INAPI (Chile) nor the USPTO that day. The folder,
the id (`pips` → `dominorama`; the usage counted before stays under `pips`) and every internal name
moved with it; `/labs/pips/` is a small redirect for the links already shared. The credit to NYT's
Pips stays, as the inspiration.

## Resumen

- **Where:** `https://juegosdesalon.cl/dominorama/` (hidden until `flags/dominorama` is on), La Copa and Uno al día;
  the lab prototype stays at `/labs/dominorama/` (each person's key, D-281, D-284) until the cleanup PR. Id `dominorama`
  in the usage signal.
- **For whom:** one player. Three languages in La Copa's game (es, en, pt); the lab prototype is Spanish only.
- **Status:** active project, to try with friends. If it catches on, the idea is that it joins La Copa.

## Cover

The title with an ivory domino (6 and 3) that sways, the tagline ("Pon todas las fichas de dominó para
que cada zona cumpla su regla."), the credit, and an easy board (cells up to 52 px) that solves itself, a domino at a time,
then another (still with reduced motion). Then "📅 Los tableros de hoy son los mismos para todos." (without
`?seed=`), "🎲 Empezar" and the three steps (after the button, U-39):

1. 🎲 Pon todas las fichas: cada una cubre dos casillas.
2. 🎯 Cada zona de color cumple su regla: un número es lo que suman sus puntos; = todos iguales; ≠ todos distintos; <5 y >9, menos o más.
3. 👆 Mantén y arrastra cada ficha a su casilla; un toque la gira. Toca un rombo: se ilumina su zona.

The usability agent shortened them to fit U-18 (273 characters); that there are three boards against the
clock is said by the lab card and the heading of each board.

The 🎲 stands in for a domino: the domino characters (🁢) are not color emoji on an iPhone and could show
as an empty box.

## Reglas

- **Three boards**, easy (4 dominoes, inside 4×3), medium (6, inside 4×4) and hard (8, inside 5×5), one
  after the other, against a clock that runs from the shared 3, 2, 1 ("¡A jugar!"). The heading says
  "Tablero n de 3 · fácil|medio|difícil" and the clock shows the time so far.
- **The board:** square cells, each colored by its zone, with a dashed edge where the zone ends. A zone
  with no rule is plain. The rule sits inside the zone's last cell, in its bottom-right corner, as a
  diamond: `6`, `=`, `≠`, `<5`, `>9` (D-385: it used to hang over the corner, where it looked like any
  of four cells'). A tap on a diamond lights its zone for a moment and dims the rest.
- **The tray:** the dominoes not yet placed, ivory with dark dots, each in a square slot as big as the
  domino is long (halves of up to 42 px, four to a row even at 320 px; board cells up to 64 px, smaller on a short
  screen so the tray stays in view), so turning one or laying it moves nothing on the screen (D-385; a laid domino leaves its
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
  8 px is still a tap, so the tap way keeps working. A drag that ends anywhere on the screen, or is cut short (the board
  redrawn by Deshacer or Limpiar, a second finger, the page hidden), takes its ghost with it.
- **The zones:** once full, a kept rule's diamond gets a green ring, a broken one turns red and shakes, and
  the zone's cells get stripes and a solid edge in the zone's own color drawn over the dominoes (`.dm-mala`, no
  pointer events), so a broken zone can be seen even when dominoes cover it. A laid domino keeps square halves (2026-11-24): it leaves a 6 px gap along its long sides and 12 px at its ends, within
  its two cells, so the zone's color and dashed edge show around it; its edge is drawn inside it. The zones' colors stay away from
  red (no pink, orange or coral), so a broken rule's red stands out. A laid domino settles with a squash
  and a ring spreads from its two cells (`.dm-onda`); both calm down with reduced motion.
  With every domino down and a zone broken: "❌ Una zona no cumple su regla: mueve alguna ficha."
- **Solved:** every cell covered and every zone kept, in any arrangement (not only the engine's): the
  board glows, "✅ ¡Listo!", a little confetti, and the next board comes.
- **💡 Ayuda (−10):** a second tap ("Toca de nuevo (−10)", 3 seconds), then it lays one domino of the
  solution in its place, taking off whatever was on those cells, and marks it.
- **🏳️ Rendirse:** a second tap ("🏳️ ¿Seguro?").
- **¿Cómo se juega?:** under the buttons, a folded panel with the cover's three steps, to read them
  again without leaving the board.
- **↩️ Deshacer and 🧹 Limpiar (D-385):** a row above Ayuda and Rendirse. Deshacer takes back the last
  change to the board (a domino laid, moved or taken off, a help, a clear), one at a time, as far back as
  the board began; a help undone keeps its −10. Limpiar takes every domino off with a second tap ("🧹
  ¿Sacar todas?", 3 seconds), and can be undone. Each is greyed out when it has nothing to do.
- **Score, out of 100:** each board solved 20; with the three, up to 40 for speed (40 in 4 minutes or
  less, 0 in 12, straight between); each help −10; never below 0.
- **The result:** the stamp (¡Los tres! or Te rendiste), the score, the breakdown, the time, sharing,
  other boards, today's (if played with a seed), back to the lab and, after a line, the comment form.
- **Sharing:** one mark per board ("✅✅⬜ 2 de 3") and the helps, never the boards.

## Modos

One player. In La Copa (a day plays the three boards; the trial, the easy one), in Uno al día from its launch
date, and on its page `/dominorama/` (today's boards, or `?seed=`). The lab prototype `/labs/dominorama/`
plays the same engine until the cleanup PR.

## Flujo

- `engine.js`: `generar(semilla, nivel)` builds a board from a solution: dominoes laid next to each
  other make a compact shape (a new one goes where it touches more of the shape), each gets a different
  domino of a double-six set, the cells are split into zones of 1 to 4 (growing first into a neighbor
  with the same pips, and never holding both halves of a domino with two different numbers, D-386), and
  each zone gets a rule its pips keep and the player could break with this board's dominoes
  (`puedeFallar`: no `>-1`, no `>0` without a blank, no `<13` on two cells, issue #1656). `resolver(t, max, limite)` counts the solutions (layouts that
  leave the same pips on every cell count once); while there are two, a zone that differs gets a stricter
  rule, `=`, `≠` or the tightest `<`/`>` before an exact sum, or, when only the order inside a zone
  differs, a cell moves to a neighboring zone (only if the zone it leaves stays in one piece); a board too loose to prove within `limite` steps gets one
  more exact sum. Then each one-cell zone tries to join a neighbor while the board keeps one answer.
  Every board has exactly one answer (engine.test.mjs checks it for several seeds and the three levels,
  and the rule mix). Building the three boards takes about 25 ms on a computer (rarely a few hundred).
- `cumple(zona, valores)` decides a rule (and prunes the solver while a zone is partial); `lugar`,
  `poner`, `sacar`, `estadoZonas`, `resuelto`, `ayudar`, `puntaje` and `tarjeta` are the game.
- `game.js` draws the board with a CSS grid (cells, edges, diamonds) and the dominoes over it; the
  end-to-end hook is `window.__dominorama` (`P`, and `solucion()` of the board on screen).
- Today's boards: without `?seed=`, `dia:<date>`, the same for everyone.

## To tune

D-386 cut the exact sums from 86% of the cells to about 60%, and the one-cell zones from three in four
to under half. The real Pips still has more `=` zones and bigger zones; worth looking at again once
friends have played it.

## Tests

`public/cup/games/dominorama/engine.test.mjs` (rules, one solution per board, laying, help, score) and
`tools/e2e/dominorama/lab.mjs` (the lab card, the cover, choosing, turning and laying with taps, the three
boards solved by taps, the help, the result, giving up).

## Protocolo de mensajes

None: one player, no room. La Copa's shared screen sends the result (`cup/game.js`).

## Archivos

`public/cup/games/dominorama/` (`engine.js`, `engine.test.mjs`, `ui.js`, `texts.js`, `style.css`, `icon.svg`),
`public/dominorama/index.html` (generated), the lab prototype `public/labs/dominorama/` (`game.js`, `style.css`,
`engine.js` a re-export), `tools/e2e/dominorama/` (`page.mjs`, `lab.mjs`), `marketing/splash/dominorama-clip.mjs`.

## Excepciones a los cánones

The lab prototype keeps those of every lab prototype (D-304): Spanish only, reached only with a lab key.
La Copa's game has none: three languages, in La Copa and Uno al día, hidden until `flags/dominorama`.

## Migrated to the design system (D-533, #1193)

The lab's stylesheet, `public/labs/dominorama/style.css`, lost its copy of the shell's `.link-btn` (identical to `base.css`'s) and writes the rest on the tokens: 37 lint hits to 0, with no escape. The dominoes' ivory, edge, middle line and dots are the game's own tokens (`--dm-*`); black shadows at an alpha are `rgb(var(--well-rgb) / a)`. What changed for the player, all intended: a cell's and a rule diamond's corner is 8 px (was 6), the rule's number takes the nearer text step and the dots' ink, a broken rule and a wrong placement are `--red` (was `#ff3b3b`), the "wrong" notice and the given-up stamp are `--pink` (was a pale pink of their own), and the stamp is one step larger (1.4 rem, was 1.3).

## Out of the lab (D-517's way, 2026-11-19)

Prepared the way Sudoku was (commit 3f60e2d8). Launch: the `launch` workflow (D-529) switches `flags/dominorama` to *all*
at 18:54 Pacific on 2026-11-19 (with Memorice, splash `dominorama-memorice`); Uno al día and ✨ Nuevo start 2026-11-20.

- **La Copa's screen** in `public/cup/games/dominorama/`: the engine moved there (the lab's `engine.js` is a
  re-export, so the prototype plays on it), plus `generateDay` (the three boards from `dominorama:code:day`;
  the trial plays the easy one) and `card` (`✅✅⬜ 2/3 · 💡 1`, the same in every language); `ui.js` (the
  waiting room with the swaying domino, the credit to NYT's Pips and the demo board; the game; the result's
  breakdown), `texts.js` in es, en and pt (keys prefixed `dm`), `style.css` (prefixed `dm-`) and `icon.svg`
  (the drawn domino; 🎲 is its text stand-in).
- **Its page** `/dominorama/` (generated by `og.mjs cards`, with the bridges `/minigames/dominorama/` and
  `/minijuegos/dominorama/`) and its link card `assets/og/dominorama.jpg`.
- **`games.js`**: a SUELTOS entry with `lanza: 'dominorama'` (so `oculto` until the flag), `copa: { pozo: 20 }`,
  `unoAlDia: { orden: 25, desde: '2026-11-20' }` and `nuevoDesde: '2026-11-20'`, the day after the launch (Uno al día reads the date, never the flag). Its row in `flag-list.js`.
  Rankings get its tab on their own (a SUELTOS id, table `dominorama`, D-559).
- **The score** is the lab's, 0 to 100 already; the cup's clock (`clock`) gives the time for the speed part.
  The state (board, dominoes laid, helps) is saved after every move with `ctx.guardar`.
- **What changed from the lab:** the cup provides the countdown, the clock, sharing, the ranking and the
  comment; the lab's "¿Cómo se juega?" fold is the cup's rules panel; the lab's own clock is gone.
- **The hook** for the e2e scripts: `window.__dominorama` (`state()`, `board()`, `solveBoard()`).
- **Splash media** for the `dominorama-memorice` campaign: `assets/splash/dominorama.mp4`,
  `dominorama-start.jpg` and `dominorama.jpg`, recorded by `marketing/splash/dominorama-clip.mjs`.
- **Tests:** `public/cup/games/dominorama/engine.test.mjs` and `tools/e2e/dominorama/page.mjs`.
