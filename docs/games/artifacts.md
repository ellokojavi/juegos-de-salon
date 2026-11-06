# ⚙️ Artefactos (lab prototype, in Juegos en prueba)

A machine puzzle for one player: each level drops a ball from a pipe and the player places parts on a
grid so that it ends in the basket. An original game in the genre of
[The Incredible Machine](https://en.wikipedia.org/wiki/The_Incredible_Machine) (Sierra, 1993), credited
on the cover and in the lab: the board, the four parts, the six levels and the neon look are our own;
no name, art, sound or level comes from it.

## Summary

- **Where:** `https://juegosdesalon.cl/labs/artifacts/`, in the lab (each person's key, D-281). One name
  inside and out (D-535): the player reads Artefactos, and everything internal is its English
  version, `artifacts`: the folder, the usage signal's id (`trackStart` on each game, `trackFinish`
  at its end), the phone's key `juegos-de-salon:artifacts`, the test hook `window.__artifacts`, the
  lab card's `#seccion-artifacts`, `tools/e2e/artifacts/`, `tools/generators/artifacts-levels.mjs`
  and this page. It was Artilugio until 2026-11-06 (folder `contraption`, id `artilugio`); the best
  kept under `juegos-de-salon:artilugio-stages` is carried over once.
- **For whom:** one player. Spanish, English and Portuguese (C-3), language toggle on the cover.
- **Status:** active project, to try with friends. Not in `games.js` (lab games are not, until they leave).

## Cover

The demo board solving levels by itself, the rainbow title, the tagline, the credit with its link, «🧠 Cómo se juega» folded
(`details.panel`), the language toggle, the format («5 etapas · 6:00») and the best,
and a yellow «⚙️ Jugar», in C-5's order.

1. 🧩 Arrastra una pieza de abajo al tablero.
2. ↔️ Toca una rampa o un ventilador para girarlo; arrastra para moverlo; suéltalo fuera para quitarlo.
3. ▶️ Toca Probar: la pelota tiene que quedar en la canasta 🧺.
4. ⏱️ 5 etapas, cada una más difícil, contra un reloj de 6 minutos.

## How it is played

- **The board:** 8 × 11 cells, drawn on a canvas (`data-tablero`). Fixed pieces are the level's: violet
  walls, red spikes (touching them pops the ball), the yellow basket, and parts marked 🔩 that cannot move.
- **The parts** (two cells wide, one tall, anchored at the tapped cell): 📐 ramp (↘ or ↙), 🪵 plank,
  🛝 trampoline (throws the ball up about 7 rows, always the same height), 🌀 fan (blows the ball
  sideways over itself and the three cells it faces, in its row and the one above).
- **Placing, by dragging:** press a part in the tray and drag it onto the board; it floats as a ghost
  snapped to the grid, over a green slot where it fits and a red one where it does not, lifted about a
  cell above the finger on a touch screen so the finger never hides it (with a mouse, none). Let go to
  place it. The tap way stays: tap a part in the tray, then a cell (with a mouse, its ghost follows the
  pointer before the click).
- **One tap turns:** a tap on a placed ramp or fan turns it round at once (planks and trampolines have
  no direction). The tapped part becomes the chosen one (dashed outline): ↔ Girar and 🗑 Quitar take
  Limpiar's place in the tools row, so nothing below the board moves.
- **Moving and removing:** drag a placed part to move it; drop it off the board (its edge goes red) to
  send it back to the tray. A tap on a free cell with a part chosen also moves it there.
- **↶ Deshacer** undoes the last change (place, move, turn, remove, Limpiar), up to 40; 🧹 Limpiar sends
  everything back to the tray. Each step says the next one under the board, and the phone gives a
  small tick on each snap and a pulse on placing.
- **Keyboard:** R turns the chosen part, Delete removes it, Ctrl/⌘+Z undoes, Esc lets go.
- **▶ Probar** runs the ball with a fixed-step physics (gravity, bounces, a little friction). It ends
  **won** only once the ball **rests on the basket's floor** (down on it, slower than 0.6 cells/s for
  0.3 s: a ball that flies through, bounces out or is still rolling does not count; arriving with
  speed, it rolls and knocks from side to side inside the basket until a flat floor's rolling
  resistance stops it); **boom** when it touches the bottom of the
  board: it blows up (a flash, a fireball, a shock wave, sparks and smoke, the board shakes, a bang)
  and only after it plays out (1.1 s) the stage is marked failed, «¡Bum! 💥 Tocó el fondo»; **popped**
  on spikes; or **stuck** (still outside the basket for 1.4 s, or 30 s in all). A failure says which
  and leaves the parts where they were. ■ Parar stops a run.
- **In the basket:** its floor is rough (`CUP_ROLL`, 7 per second against 1.6 on other flat ground):
  a ball that lands with speed still rolls and knocks the walls naturally, but only a little (about
  0.7 of a cell in the median), and once it has been at rest for 0.3 s (`SETTLE`) the stage passes:
  0.4 to 1.2 s after it touches the floor across the pool. A run lasts up to 30 s (`MAX_T`;
  trampolines can keep a ball in the air a long while), and a ball already down in the basket when
  time runs out counts (the owner's report: at 14 s a late landing was called stuck while settling).
- **Stars:** 3 with the fewest parts the level needs, 2 with one more, 1 otherwise.

## The levels

**A game is five stages against the clock, as Tren en Vilo's.** Each stage is drawn from its tier of
the generated pool (`levels.js`, 72 levels in six tiers of 12), one harder than the one before
(`STAGE_TIERS` in `game.js`: tiers 1, 2, 3, 5, 6):

| Stage | Label | The answer needs | Tray | Hazards |
|---|---|---|---|---|
| 1 | Fácil | 1 ramp | exact | 1–2 |
| 2 | Fácil + | 1 part of any kind | one decoy | 2–3 |
| 3 | Medio | 2 parts | exact | 2–3 |
| 4 | Difícil | 3 parts | exact | 3–4 |
| 5 | Experto | 3 parts | one decoy | 4–6 |

(Tier 4, «Medio +», 2 parts among decoys, stays in the pool unused.) The first game of the day draws
its five with the day's seed, the same for everyone; «Jugar otra vez» draws another five at random.

- **The clock:** one for the whole game, 6:00, in the header beside «Etapa 2 de 5», the stage's
  difficulty and five dots (passed in green, the one in play in yellow). It runs while building and
  testing, stops while a stage's summary is open or the page is hidden, and blinks pink in the last
  30 s. At 0:00 the game ends where it is: «⏱️ ¡Se acabó el tiempo!».
- **A stage passed** opens a summary over the board: «¡Etapa 2 superada!», its stars, the parts used,
  its time and its points, with «Siguiente etapa ›» («Ver el resultado ›» after the fifth).
- **Score:** each stage passed is 10, plus 5 / 3 / 1 for its stars (3 with the parts the answer needs,
  2 with one more, 1 otherwise), plus up to 10 for speed (all of it with the five in 2:00 or less,
  none at 6:00, scaled by the stages passed): at most 85.
- **The result** (`#s-fin`): the stamp (new best, time is up, or done), the total, how many stages
  were passed, a table with a row per stage (difficulty, stars, time, points as 10 + bonus), the speed
  with the time used, the total and a one-line legend; the best on this phone; «Jugar otra vez» and
  the way back to the lab. The cover shows the format («5 etapas · 6:00») and the best
  (`juegos-de-salon:artifacts`).

**How the pool is made** (`tools/generators/artifacts-levels.mjs`): each level is built backwards
from a working machine, so every one has an answer. The ball drops from a random pipe; k parts are
chained on its real path, each where the ball passes; the basket goes where that machine brings the
ball down, and the run must end at rest in it; hazards (spikes, girders, fixed planks and ramps) are
added only where the machine still works. A level is kept only if an exhaustive search finds no answer
with fewer parts from its tray: the search is exact while pruned, because a part the ball never comes
near (and no fan blows on) cannot change the run. `engine.test.mjs` plays every level's answer and
checks that no board solves itself. To make a new pool: run each tier side by side
(`node tools/generators/artifacts-levels.mjs 12 <seed> <tier>`) and join them (`… merge /tmp/artifacts-tiers-*.json`). After a change to the physics, `… check`
re-verifies the pool (every answer still wins, none has a shorter answer).

## For tests

`window.__artifacts` exposes the board and the run. End to end: `tools/e2e/artifacts/lab.mjs`
(cover, the five stages played with their answers placed by drags, each summary stopping the clock, the result's table, Jugar otra vez drawing five others, the clock running out at 320 px, a failed run, dragging from the tray, one-tap turning, dragging to move, Deshacer, dropping off the board, a win, the next level, English, 320 px).

## The look (`scene.js`)

Everything is drawn on the canvas, no image files: the app's neon night with a dotted grid; wooden
ramps and planks with grain and brass bolts (the level's fixed ones in a cooler wood with steel
bolts); a trampoline with two coils whose pad squashes on a bounce; a fan whose blades spin, with
breeze streaks across its reach and a chevron for its direction; violet steel girders with rivets;
red spikes that glow; a woven basket that glows and pulses; a steel pipe the ball drops from; a ball
with light, shadow and a stripe that turns as it rolls, and a fading trail. Particles mark a bounce,
a pop on the spikes (the ball bursts), the explosion on the bottom and a win (confetti from the basket). While a part is picked the
part floats over a green or red slot where it would land.
The cover shows a small board solving the levels by itself, one after another.

## Exceptions to the canons

- No ranking or rooms: a puzzle with stars, like a lab prototype.
- Its own canvas drawing reads the colour tokens from `base.css` at runtime.
