# ⚙️ Artefactos (lab prototype, in Juegos en prueba)

A machine puzzle for one player: each level drops a ball from a pipe and the player places parts on a
grid so that it ends in the basket. An original game in the genre of
[The Incredible Machine](https://en.wikipedia.org/wiki/The_Incredible_Machine) (Sierra, 1993), credited
on the cover and in the lab: the board, the four parts, the six levels and the neon look are our own;
no name, art, sound or level comes from it. Since 2026-11-11 it wears the flat neon of the other
games (the owner chose option B of two mockups): Tren en Vilo's layout and beams, Aletazo's spikes.

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

The demo board solving levels by itself, the title in white (`display--lg`, as Reinas' and Tren en Vilo's),
the tagline, the language toggle, the best (no format chip: the owner dropped «5 etapas · 6:00» on
2026-11-11; the fourth step says it), a yellow «⚙️ Jugar», and «🧠 Cómo se juega» folded
(`details.panel`) with the credit and its link inside it, as Tren en Vilo keeps Poly Bridge's, in C-5's order. The tagline is one line:
«Lleva la pelota a la canasta.»

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
- **The tray:** each part drawn as the object it is (the same drawing as on the board), one per copy left, so two ramps are two ramps; past three, one with its ×n; a kind with none left stays faint.
- **💡 Pista** lights a slot in cyan where one part of the answer goes (one the board does not have yet), with the part faint over it, until it is placed; each hint costs one star of the stage, down to none (three hints on a three-part answer leave only the 10 for passing it; the same hint shown again costs nothing more). **🏳️ Rendirse** gives the stage up: a second tap within 3 s confirms, the stage counts as not passed (0 points) and the next one starts.
- **Placing, by dragging:** press a part in the tray and drag it onto the board; it floats as a ghost
  snapped to the grid, over a green slot where it fits and a red one where it does not, lifted about a
  cell above the finger on a touch screen so the finger never hides it (with a mouse, none). Let go to
  place it. The tap way stays: tap a part in the tray, then a cell (with a mouse, its ghost follows the
  pointer before the click).
- **One tap turns:** a tap on a placed ramp or fan turns it round at once (planks and trampolines have
  no direction). The tapped (or just placed) part becomes the chosen one (dashed outline), and its own
  Girar (ramps and fans) and Quitar float on the board just above it (below it on the top row), as two
  small flat round icons, a turning arrow and a trash can, with no words (the words are their aria-label).
  They go away after 5 s without a touch (letting the part go), while a part is dragged, and while the
  ball runs; every touch gives them 5 s more. They leave with a short fade (0.22 s), and a part that is let
  go keeps its dashed outline for that same moment, fading out on the board.
- **Moving and removing:** drag a placed part to move it; drop it off the board (its edge goes red) to
  send it back to the tray. A tap on a free cell with a part chosen also moves it there.
- **↶ Deshacer** undoes the last change (place, move, turn, remove), up to 40. The three
  helpers share one row under Probar, as Tren en Vilo's: ↶ Deshacer · 💡 Pista · 🏳️ Rendirse (there is no Limpiar since 2026-11-11). Each
  step says the next one under the board in one short line (cut with an ellipsis if a phone is too
  narrow), and the phone gives a small tick on each snap and a pulse on placing.
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
- **In the basket:** its floor is rough (`CUP_ROLL`, 12 per second against 1.6 on other flat ground):
  a ball that lands with speed still rolls and knocks the walls naturally, but only a little (about
  0.7 of a cell in the median), and once it has been at rest for 0.3 s (`SETTLE`) the stage passes:
  0.4 to 1.2 s after it touches the floor across the pool. A run lasts up to 30 s (`MAX_T`;
  trampolines can keep a ball in the air a long while), and a ball already down in the basket when
  time runs out counts (the owner's report: at 14 s a late landing was called stuck while settling).
- **Stars:** 3 with the fewest parts the level needs, 2 with one more, 1 otherwise.

## The levels

**A game is five stages against the clock, as Tren en Vilo's.** Each stage is drawn from its tier of
the generated pool (`levels.js`, 72 levels in six tiers of 12, regenerated on 2026-11-08 with the legibility filter), one harder than the one before
(`STAGE_TIERS` in `game.js`: tiers 1, 2, 3, 5, 6):

| Stage | Label | The answer needs | Tray | Hazards |
|---|---|---|---|---|
| 1 | Fácil | 1 ramp | exact | 1–2 |
| 2 | Fácil + | 1 part of any kind | one decoy | 2–3 |
| 3 | Medio | 2 parts | exact | 2–3 |
| 4 | Difícil | 3 parts | exact | 3–4 |
| 5 | Experto | 3 parts | two decoys | 5–7 |

(Tier 4, «Medio +», 2 parts among decoys, stays in the pool unused.) The first game of the day draws
its five with the day's seed, the same for everyone; «Jugar otra vez» draws another five at random.

- **The clock:** one for the whole game, 6:00, as Tren en Vilo's header: the five dots on the left (passed
  in green, given up in red, the one in play in white, the rest as rings) and «⏳ 5:59» on the right, with
  «Etapa 2 de 5» in yellow centred under them and the stage's difficulty under it. It runs while building and
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
  the way back to the lab. The cover shows the best
  (`juegos-de-salon:artifacts`).

**How the pool is made** (`tools/generators/artifacts-levels.mjs`): each level is built backwards
from a working machine, so every one has an answer. The ball drops from a random pipe; k parts are
chained on its real path, each where the ball passes; the basket goes where that machine brings the
ball down, and the run must end at rest in it; the answer must read as a machine, not a fluke (`legible()`, the owner's report of Experto answers that needed five bounces and luck): it still wins with the ball's start nudged ±0.04 and ±0.08 of a cell and with the physics stepped at 1/90 and 1/240 s (no chaos), with at most 4 + k hard bounces, a run of at most 3 + 1.2·k s, and the ball meeting each part at most twice; hazards (spikes, girders, fixed planks and ramps) are
added only where the machine still works, and never on the basket (no spikes inside it, no girder through it). A level is kept only if an exhaustive search finds no answer
with fewer parts from its tray: the search is exact while pruned, because a part the ball never comes
near (and no fan blows on) cannot change the run. `engine.test.mjs` plays every level's answer and
checks that no board solves itself. To make a new pool: run each tier side by side
(`node tools/generators/artifacts-levels.mjs 12 <seed> <tier>`) and join them (`… merge /tmp/artifacts-tiers-*.json`). After a change to the physics, `… check`
re-verifies the pool (every answer still wins and is legible, none has a shorter answer).

## For tests

`window.__artifacts` exposes the board and the run. End to end: `tools/e2e/artifacts/lab.mjs`
(cover, the five stages played with their answers placed by drags, each summary stopping the clock, the result's table, Jugar otra vez drawing five others, the clock running out at 320 px, a failed run, dragging from the tray, one-tap turning, dragging to move, Deshacer, dropping off the board, a win, the next level, English, 320 px).

## The look (`scene.js`)

Everything is drawn on the canvas, no image files, in the flat neon of the other games: a night sky
(blue to violet) with stars and dark hills over the dotted grid, and a cyan line along the bottom, the
floor that blows the ball up. Ramps and planks are Tren en Vilo's beams: yellow with a dark edge, a dashed
middle line and a pink joint ringed in white at each end (the level's fixed ones in steel grey with grey
joints); a trampoline with two coils whose pad squashes on a bounce; a fan whose blades spin, with breeze
streaks across its reach and a chevron for its direction; violet girders with white rivets; the spikes as
Aletazo's: a red rail on the line the ball pops on, with two pink sixteen-point stars per cell spinning on
it, each with a red halo and a dark eye, neighbours turning opposite ways; the basket a green cup with a
pink joint on each rim, drawn over the ball so a ball inside reads as inside; the pipe the ball drops from,
a cyan neon tube of tinted glass that fills the start's cell (kept free of parts), drawn over the ball so the
ball waits dimmed inside it and drops out of its mouth, with chevrons of light flowing down it, a bright rim
at the mouth and a soft cone of light below (the owner, 2026-11-11); a flat pink ball ringed in white, with a fading trail that plays out once the run ends. The canvas
re-measures itself whenever its box changed, so the ball is always round.

**What the ball touches lights up** (the owner, 2026-11-11): with `newRun(board, { contacts: true })` the
engine says each step where the ball presses on a surface and how hard (`'touch'`, `v` = the speed into it;
the generator and the tests do not ask, and it changes nothing in the run). The drawing lights that spot
along the surface in the surface's colour (pale yellow on a beam, green on a trampoline or the cup, cyan on
a fan, lilac on a girder or a side), as strong as the blow: rolling leaves a faint line along where the
ball goes, fading in a third of a second; a knock lights a longer, brighter stretch; past 4 cells/s a small
white ring opens where it hit, and past 6.5 a few sparks fly. Particles also mark a pop on the spikes (the
ball bursts), the explosion on the bottom and a win (confetti from the basket). While a part is picked the
part floats over a green or red slot where it would land.
The cover shows a board (up to 240 px wide, smaller on short screens, none under 640 px tall) building and solving the levels by itself, one after another: each part of the answer rises from below the board and glides along an arc into its slot, lit in cyan, as a player would drag it; then the ball drops and the machine works.

## Exceptions to the canons

- No ranking or rooms: a puzzle with stars, like a lab prototype.
- Its own canvas drawing reads the colour tokens from `base.css` at runtime.
