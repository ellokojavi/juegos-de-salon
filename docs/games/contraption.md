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

The ⚙️ hero, the rainbow title, the tagline, the credit with its link, «🧠 Cómo se juega» folded
(`details.panel`), the language toggle, the six levels as chips (solved ones show their stars, the next
unsolved one is chosen, later ones show 🔒) and a yellow «⚙️ Jugar», in C-5's order.

1. 🧩 Elige una pieza abajo y toca el tablero para ponerla.
2. ↔️ Toca una pieza puesta para girarla, moverla o quitarla.
3. ▶️ Toca Probar: la pelota tiene que caer en la canasta 🧺.

## How it is played

- **The board:** 8 × 11 cells, drawn on a canvas (`data-tablero`). Fixed pieces are the level's: violet
  walls, red spikes (touching them pops the ball), the yellow basket, and parts marked 🔩 that cannot move.
- **The parts** (two cells wide, one tall, anchored at the tapped cell): 📐 ramp (↘ or ↙), 🪵 plank,
  🛝 trampoline (throws the ball up about 7 rows, always the same height), 🌀 fan (blows the ball
  sideways over itself and the three cells it faces, in its row and the one above).
- **Placing:** tap a part in the tray, then a free cell. Tapping a placed part chooses it (dashed
  outline) and shows ↔ Girar and 🗑 Quitar; a tap on another free cell moves it. 🧹 Limpiar sends
  everything back to the tray.
- **▶ Probar** runs the ball with a fixed-step physics (gravity, bounces, a little friction). It ends
  **won** in the basket, or **popped** on spikes, **fallen** off the board or **stuck** (still for 1.4 s
  or 14 s in all); a failure says which and leaves the parts where they were. ■ Parar stops a run.
- **Stars:** 3 with the fewest parts the level needs, 2 with one more, 1 otherwise. Kept on the phone
  (`juegos-de-salon:artilugio-stars`); a level opens when the one before is solved.

## The levels

In `LEVELS` (`engine.js`), each with a `solution`. `engine.test.mjs` checks that every solution fits
its tray and wins, and that no level solves itself with an empty board. They were tuned with a brute
force over every placement of one and two parts, so each has a few answers, not just one.

## For tests

`window.__artilugio` exposes the board and the run. End to end: `tools/e2e/contraption/lab.mjs`
(cover, a failed run, placing/turning/moving by taps, a win, the next level, English, 320 px).

## Exceptions to the canons

- No ranking or rooms: a puzzle with stars, like a lab prototype.
- Its own canvas drawing reads the colour tokens from `base.css` at runtime.
