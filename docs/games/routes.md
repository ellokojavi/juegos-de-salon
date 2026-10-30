# 🚇 Rutas rotas (Broken Routes)

Nine pieces of a subway map in a 3×3 board (D-293). A move turns any rectangle of the board half a
turn; you win by joining every line, and the challenge is doing it fast and in the fewest turns, in
five stages that get harder, against a 7-minute clock (D-294, D-295). **Inspired by
[Junction Nine](https://bricksandchips.co/junction-nine), by Bricks and Chips**, and the game says so
in its how-to.

## Summary

- **Where:** its own page, `https://juegosdesalon.cl/routes/` (generated from `public/cup/suelto/index.html`),
  on the home page, and as a La Copa game: a cup week can pick it (it is in `POZO`, D-332). A week that
  picks it plays it again whole in the Grand Final (D-418). Id `rutas` (cups, rankings, the usage signal); folder `routes`. In Uno al
  día's deck since the deck shuffled on October 23, 2026 (D-334).
- **Names (C-3):** Rutas rotas · Broken Routes · Rotas Quebradas · Kaputte Linien.
- **For whom:** one player. No variants.
- **History:** a lab prototype from v0.164.0, Spanish only, played with friends at `/labs/routes/`. It was
  called *Rutas* until v0.167.3, when the owner renamed it **Rutas rotas** (the lines start broken and have
  to be joined, D-293). It left the lab with Loteo and Pintaminas (D-332): the lab page is now a bridge to
  `/routes/`, and the lab's own page (`game.js`, `style.css`), its comment form (D-265, D-268), "back to
  the lab" and "today's board" went away. The engine moved to `public/cup/games/routes/`.

## Waiting room

The cup's waiting room (D-109), the same for a cup day and for `/routes/`:

- **On top** (`portada`): a small board that starts scrambled and solves itself in 5 or 6 moves,
  alternating the two kinds of move: one piece alone (it turns in its place) and two neighbours (they swap
  places). Before each one the rectangle is marked, as when dragging; solved, the route lights up and it
  starts again with another scramble (the owner's request in the lab). With reduced motion it stays solved.
- **The drawing** (`ejemplo`, also in the rules panel while playing): the same board twice, one move
  apart: ❌ before, with the rectangle marked and the lines broken; ✅ after its half turn, all joined. Under
  it, the credit: «Inspirado en Junction Nine, de Bricks and Chips.», with the link.
- **The steps** (U-18):
  1. Une cada color en una sola línea, sin cortes entre piezas.
     (In the lab it said «Une todas las líneas, sin cortes»; a player did not realize the colour had to
     match, [#385](https://github.com/ellokojavi/juegos-de-salon/issues/385).)
  2. Arrastra de una pieza a otra: el rectángulo entre ellas da media vuelta y sus piezas quedan al revés. Un toque gira una sola.
  3. Son 5 etapas en 7 minutos. Deshacer y reiniciar son gratis.
- **Scoring:** «Cada etapa vale 17 puntos. Con las cinco, hasta 10 más por rapidez, y hasta 5 por usar
  el mínimo de giros.» In a cup, the tiebreak: whoever took less time.

Empezar goes through the cup's 3, 2, 1 countdown (D-105).

## How it plays

- **Stages** (D-294): five boards, each harder: 3 lines and minimum 2; 4 and 3; 4 and 4; 5 and 4; 5 and 5.
  On top, «Etapa n de 5» and five dots in one row (green: done at the minimum; yellow: done with extra
  turns; white: the current one), like the share card. Below, «⏳ 6:42» (the 7-minute countdown, red in
  the last minute) and «Giros: n · Mínimo: m».
- **Turning:** drag from one piece to another and the rectangle between them is marked in white (yellow
  was confused with the yellow line); on release it turns half a turn **as one block**, around its centre:
  each piece orbits to its mirror place and so ends up flipped. A tap turns a single piece in its place.
  Releasing is the move: an exception to "dragging chooses, never confirms" (C-8, below).
- **The goal:** every line goes on with no break from piece to piece. Any order where every edge fits
  counts, even if it is not the original one (the whole board turned is a solution too). **The board does
  not mark which edges already fit** ([#359](https://github.com/ellokojavi/juegos-de-salon/issues/359), the
  owner's request): the lines themselves show where they go on or break, and reading them is the game.
- **Under the board, three equal buttons in one row**, in this order: **↩ Deshacer** (undoes the last turn,
  which does not count; off with no turns), **↺ Reiniciar** (back to the stage's start with 0 turns, free;
  the restarts are counted in the breakdown) and **🏳️ Rendirse** (asks for a second tap, «🏳️ ¿Seguro?», like
  Clear all in Zip, and the stages already done count). The game's title is not repeated over the board:
  the cup's bar already has it, and the three buttons fit in view at 320 × 568 (#360). On a short screen
  the board shrinks (down to 220 px) so they stay in view.
- **Stage done:** the lines glow, the board is outlined green («🚇 ¡Etapa 2 lista!», or «🚇 ¡Etapa 2 en el
  mínimo!»), the stage's dot is painted and the next stage arrives.
- **The end:** after the fifth stage, when the 7 minutes run out or on giving up. The cup's clock stops
  right then (D-130), the last board stays with a stamp (¡Todas en el mínimo!, ¡Rutas unidas!, Se acabó el
  tiempo or Te rendiste) and «Ver resultado» opens the cup's result screen: the score, the share card, the
  breakdown and, on `/routes/`, sharing, another board, the rankings and "report a problem".
- **Score by layers** (D-295): 17 per stage done (85 for the five) + up to 10 for speed (only with the
  five: 10 in a minute or less, 0 when the clock runs out, linear in between) + up to 5 for turns (5 at the
  minimum, 0 with double or more). Doing more stages always wins. 0–100 (D-113).
- **The breakdown** (`desglose`): «🚇 Etapas (5 de 5): +85.», «⏱ Rapidez (2:10): +8.» (without the five,
  «⏱ Rapidez: +0 (faltaron etapas).»), «🔄 Giros (24, mínimo 18): +3.», then each stage («🟨 Etapa 3: 5 giros
  (mínimo 4).») and how many times you restarted.
- **Share card:** one line per stage, the turns against the minimum without giving the boards away:
  «🟩 1: 2/2», «🟨 3: 5/4», and «⬛ 4: —» for the stages not reached.

## In La Copa

- **The day's boards:** the same for every player of a cup: the stages come from `<code>:<day>`. The
  standalone page gets a random code each time, like the other standalone games; `?seed=<CODE>` repeats one.
- **Resuming:** the moves are the whole game (`{ etapa, hechas, giros, reinicios, fin, seg }`, `giros` as
  indices into `RECTANGULOS`), saved with `ctx.guardar` on each turn, undo and restart; a reloaded day
  rebuilds the stage and its board from the seed and the moves. The 7 minutes are counted against the
  cup's clock (`ctx.tiempo()`), which pauses with the screen hidden (D-95) and survives a reload: a day
  reopened after its 7 minutes ends at once, with the stages done.
- **The trial session** (D-103): the same mechanics with other boards (`sal: 'ensayo'` and another code),
  only the first two stages and 2 minutes, scored on the same layers scaled to two stages.

## How it works

- `public/cup/games/routes/engine.js`: each piece has 8 doors (two per side) and segments that join two
  doors with a colour; a state is, per place, the piece and whether it is flipped (`{ p, v }`).
  `girar(estado, rect)` turns a rectangle (there are 36, in `RECTANGULOS`); `resuelto` checks that every
  edge between pieces fits door by door (flipped, door N0 becomes S1). `generar(semilla, { lineas, minimo })`
  builds a map of lines from edge to edge (no empty or repeated pieces, not even one flipped), scrambles it
  with one turn more than the minimum asked (`revuelta`) and redoes it until `minimo` gives exactly that
  number. `minimo` searches from both ends at once, and backwards it starts from the two solutions: the
  goal and the whole board flipped (`TODO`). `ETAPAS` gives the lines and minimum of each stage,
  `generarEtapa(semilla, n)` builds stage n with the seed `<semilla>:etapa-<n>`, `generarDia(código, día,
  { sal, ensayo })` gives what the screen receives (`{ semilla, etapas, tiempo }`, `tiempo` in ms),
  `puntajePartida(hechas, segundos, { etapas, tiempo })` the layered score with each layer apart, and
  `tarjeta` the share card.
- `ui.js`: draws each piece in SVG (curves from door to door, with a white station halfway), places it with
  left/top and turns it with rotate; a move orbits the rectangle's pieces around its centre. It exports
  `montar`, `resultado`, `desglose`, `ejemplo` and `portada`. `window.__rutas` (`J`, the board in play `t`,
  `estado` and `girar(rect)`) is the hook for the tests. Its texts are in `texts.js` (keys prefixed `rr`,
  plus the cup's `undo` and `giveUp`), its styles in `style.css` (every selector `.rr-`).
- `engine.test.mjs` checks the turns, the minimum against a plain search (also that one turn less reaches
  neither solution), 60 boards, the five stages, the score's edge cases (faster never gives less, the
  shorter trial scales), `generarDia` (deterministic per code and day, the trial shorter) and the share card.
- `tools/e2e/routes/game.mjs` plays `/routes/` end to end: a real drag and a tap against the engine, undo,
  restart, the countdown paused with the screen hidden, the five stages, the result and its breakdown
  against the engine, giving up, running out of time (the page clock pushed 7 minutes ahead), resuming
  from saved moves, La Copa's practice and its trial, and 320 × 568 in the three languages.

## Exceptions to the canons

- **Releasing the drag is the move** (C-8, "dragging chooses, never confirms"): as in Zip and Desenredo,
  the gesture is the game, and every turn can be undone for free (↩ Deshacer, ↺ Reiniciar), so nothing
  irreversible hangs on it. The drag is the board's own (a rectangle between two cells), not `arrastre.js`,
  which moves pieces.
- **Giving up is not 0 points** (unlike Reinas): the stages already done count, as in the lab.
