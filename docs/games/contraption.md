# ⚙️ Artilugio (lab prototype, in Juegos en prueba)

A machine puzzle for one player: each level drops a ball from a pipe and the player places parts on a
grid so that it ends in the basket. An original game in the genre of
[The Incredible Machine](https://en.wikipedia.org/wiki/The_Incredible_Machine) (Sierra, 1993), credited
on the cover and in the lab: the board, the four parts, the six levels and the neon look are our own;
no name, art, sound or level comes from it.

## Summary

- **Where:** `https://juegosdesalon.cl/labs/contraption/`, in the lab (each person's key, D-281). Id
  `artilugio` in the usage signal (`trackStart` on each level, `trackFinish` on each solved one).
- **For whom:** one player. Spanish, English and Portuguese (C-3), language toggle on the cover.
- **Status:** active project, to try with friends. Not in `games.js` (lab games are not, until they leave).

## Cover

The demo board solving levels by itself, the rainbow title, the tagline, the credit with its link, «🧠 Cómo se juega» folded
(`details.panel`), the language toggle, where the run is (the level, its difficulty, the stars so far)
and a yellow «⚙️ Jugar», in C-5's order.

1. 🧩 Arrastra una pieza de abajo al tablero.
2. ↔️ Toca una rampa o un ventilador para girarlo; arrastra para moverlo; suéltalo fuera para quitarlo.
3. ▶️ Toca Probar: la pelota tiene que caer en la canasta 🧺.

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
  0.5 s: a ball that flies through, bounces out or is still rolling does not count; arriving with
  speed, it rolls and knocks from side to side inside the basket until a flat floor's rolling
  resistance stops it); **boom** when it touches the bottom of the
  board: it blows up (a flash, a fireball, a shock wave, sparks and smoke, the board shakes, a bang)
  and only after it plays out (1.1 s) the stage is marked failed, «¡Bum! 💥 Tocó el fondo»; **popped**
  on spikes; or **stuck** (still outside the basket for 1.4 s, or 14 s in all). A failure says which
  and leaves the parts where they were. ■ Parar stops a run.
- **Stars:** 3 with the fewest parts the level needs, 2 with one more, 1 otherwise. Kept on the phone
  (`juegos-de-salon:artilugio-stars`); a level opens when the one before is solved.

## The levels

**A run of levels, dealt at random, harder as it goes.** The first three teach the parts, hand-made in
`LEVELS` (`engine.js`): the ramp, the trampoline, the fan. From the fourth on, each level is dealt at
random from the generated pool (`levels.js`, 72 levels in six tiers of 12), one tier harder every 4
levels, never repeating one until its tier runs out:

| Tier | Label | The answer needs | Tray | Hazards |
|---|---|---|---|---|
| 1 | Fácil | 1 ramp | exact | 1–2 |
| 2 | Fácil + | 1 part of any kind | one decoy | 2–3 |
| 3 | Medio | 2 parts | exact | 2–3 |
| 4 | Medio + | 2 parts | one decoy | 3–4 |
| 5 | Difícil | 3 parts | exact | 3–4 |
| 6 | Experto | 3 parts | one decoy | 4–6 |

**🎲 Otro** (beside the level, not in the tutorial) deals another level of the same tier, as the same
step, for when one gets stuck. The cover shows where the run is («Nivel 9», its difficulty and the
stars so far); the run, the stars per level, the levels seen and the one in progress are kept on the
phone (`juegos-de-salon:artilugio`). Stars: 3 with the parts the answer needs, 2 with one more, 1 otherwise.

**How the pool is made** (`tools/generators/contraption-levels.mjs`): each level is built backwards
from a working machine, so every one has an answer. The ball drops from a random pipe; k parts are
chained on its real path, each where the ball passes; the basket goes where that machine brings the
ball down, and the run must end at rest in it; hazards (spikes, girders, fixed planks and ramps) are
added only where the machine still works. A level is kept only if an exhaustive search finds no answer
with fewer parts from its tray: the search is exact while pruned, because a part the ball never comes
near (and no fan blows on) cannot change the run. `engine.test.mjs` plays every level's answer and
checks that no board solves itself. To make a new pool: run each tier side by side
(`node tools/generators/contraption-levels.mjs 12 <seed> <tier>`) and join them (`… merge /tmp/contraption-tiers-*.json`).

## For tests

`window.__artilugio` exposes the board and the run. End to end: `tools/e2e/contraption/lab.mjs`
(cover, a level dealt at random at step 9 and 🎲 Otro, a failed run, the explosion on the bottom, dragging from the tray, one-tap turning, dragging to move, Deshacer, dropping off the board, a win, the next level, English, 320 px).

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
