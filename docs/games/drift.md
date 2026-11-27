# 🏁 Derrape (Drift, lab, in Juegos en prueba)

A one-player rally time trial: the car drives down a dirt stage seen from above, through numbered
gates, against the clock. The player reads **Derrape** (es), **Drift** (en), **Derrapagem** (pt); the id
is `drift` (C-20, the owner, 2026-11-25). The original design is in [docs/rally/](../rally/README.md);
this file describes **what is built**, and the plan keeps **what is next** (D-213).

Phase 1.1 of path 1, a grey box: flat ground with a faint grid, the road, the gates and a rectangle
for the car. It exists so the owner can feel the car under a thumb and tune it (phase 1.2).

## Resumen

- **Where:** `/labs/drift/`, behind the lab's door (D-281, D-395), `noindex`, its card in /labs/'s
  🎲 Juegos en prueba. Not in `games.js` while it is in the lab. Id `drift` in the usage signal and in
  `localStorage` (`juegos-de-salon:drift:session`, the run; `juegos-de-salon:drift:tuning`, the lab's
  tuning panel). Its facts are in `game.json`.
- **For whom:** one player, on a phone held upright, or a keyboard. In es, en and pt.
- **Hook:** `window.__drift` (`g`, the engine's state; `S`, the loop's; `autopilot(on)`, `pause()`,
  `unpause()`, `reset()`, `drive()` to finish the run at once).

## Reglas

- Pass every gate to the finish in the shortest time.
- **Wheel and pedal** (the default since the owner's first drive, 2026-11-26): the left thumb lands
  anywhere on the left half and slides sideways to steer; the right thumb on the right half is the
  pedal: held, it accelerates; slid down from where it landed, it eases off and then brakes. Lifting
  lets the car roll. A ring with a dot shows each thumb. Both are analogue, so braking into a bend while
  turning works. The lab's tuning panel also offers **one finger** (a stick: sideways steers, up
  accelerates, down brakes) and the 1.1 **self-accelerating** halves, to compare. On a keyboard: ←/→
  or A/D steer, ↑/W accelerates, ↓/S brakes, space is the handbrake.
- A missed gate (driven past by more than a car length without crossing it) adds 10 s; the ↺ button
  puts the car back on the road, stopped, for 5 s. ↺ lights up after 3 s off the road or the wrong way.
- Off the road the car is slower and slides more; there are no walls.
- The clock starts with the first throttle after the 3, 2, 1 (the car waits on the line until then) and counts in engine steps, so a slow
  phone plays in slow motion and never gets a different time. The final time is the clock plus the
  penalties.

## Modos

One: alone (`solo`). `?test` plays the three-gate test stage instead of the real one.

## Flujo

Cover (resume panel, «🏁 Jugar», how to play, the footer) → the shared 3, 2, 1 → the stage (the clock,
the penalties, «Puerta n de N», ↺, and 🔧 with a lab key; each half's hint, «👈 👉 Desliza para girar» and
«👆 Mantén: aceleras / 👇 Bájalo: frenas», until the first touch) → the result (the final time, the clock and penalties in one line, «Jugar otra
vez», Share through `compartir.js`, the exit to the lab from `fin.js`, C-19).

## The code

- `engine.js`: the pure engine (no DOM, clock or randomness): the car model, the track built from
  pieces, gates, penalties, reset, the autopilot, snapshot and restore. Axes: metres, seconds,
  radians; x east, y north, a heading counter-clockwise from +x. Every tuning value is in `TUNING`.
- `tracks.js`: the stages as piece lists: `test` (3 gates, about 13 s for the autopilot) and `first`
  (9 gates, about 1:14). The generator and the weekly pool come in phase 1.3.
- `input.js`: the touch schemes (`wheel`, `stick`, `auto`), relative to where each thumb lands and analogue, and the keyboard, into `{ steer, throttle, brake, handbrake }`; it draws the thumbs' rings (`.dr-touch`).
- `scene.js`: the top-down 2D scene, `escena(canvas) → { draw(g, alpha, view), resize, dispose }`.
  The camera turns toward the direction of travel, eased over about half a second, never shakes, never
  zooms with speed; twice as damped with reduced motion. The fixed map stays in the panel, though the
  owner found it does not work (decision 4).
- `tuning.js`: the lab's tuning panel (only with a lab key): the controls and the thumb's travel, the car's values, the camera, the road in
  view, the frame time, «Copiar valores». It saves only on this phone.
- `game.js`: screens, the fixed-step loop, the countdown, the HUD, pause, memory, the result.

## The car model (what the feel round tunes)

A body that slides (core.md, section 3): the steering eases to the thumb; the yaw of a bicycle with
less lock at speed; sideways grip removes up to `grip × dt` of the sideways speed each step, which is
the drift. Two terms the plan did not have, found while building: the nose may turn in at most
`overSteer` (2.2) times what the grip holds, so a slide starts progressively and never spins, and
the rear pulls the nose back toward the travel at `align` (2.5 per second), which ends a slide within
about half a second once the thumb lets go.

## Protocolo de mensajes

None: one phone, no room, nothing sent but the usage signals (`trackStart`, `trackFinish`).

## Memoria (C-6)

The run is saved as it starts and at every gate (`snapshot`). The page hidden pauses it («En pausa ·
Toca para seguir», then the 3, 2, 1). A reload offers «⏯ Hay una partida a medias»: Continuar puts
the car back stopped where it was saved, with the clock as it was plus the 5 s reset penalty, so a
reload never undoes a bad corner.

## Rankings

None yet: whether the game records scores is the owner's decision 8 (docs/rally/PROGRESS.md,
before phase 1.5). The result calls `finDePartida` as a game played alone, which counts nothing.

## Archivos

- `public/labs/drift/`: the files above, `game.json`, `rules.js` (LOCALES), `engine.test.mjs`, `style.css`.
- `tools/e2e/drift/game.mjs`: the test stage driven to the result by the autopilot through the page's
  real loop, at 375 and 320 px; before it, real touch: wheel and pedal at 375 (accelerate, steer, brake
  while turning), one finger at 320; then pause and resume.
  `node tools/e2e/conformance.mjs labs/drift` checks the canons; `look.mjs drift intro|stage|result`.

## Excepciones a los cánones

None.
