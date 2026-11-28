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
  lets the car roll. Held down with the car stopped, the brake is reverse (`reverseAccel`, `topReverse`, white lights). A gauge just above each thumb, where the thumb does not cover it, shows what it does: the wheel a bar with a knob, the pedal a bar green above and red below; the car shows it too, with its front wheels turned and its brake lights. Both are analogue, so braking into a bend while
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
- `tracks.js`: the stages as piece lists: `test` (3 gates, about 13 s for the autopilot), `first`
  (9 gates, about 1:04), and two that try the owner's track ideas (2026-11-27): `split`, fast then
  technical (10 gates, about 1:02: a kilometre of asphalt sweepers, then gravel hairpins and a chicane,
  the surface changing under the car through `zones`) and `rain` (8 gates, about 1:02, technical, on
  wet asphalt: `weather: 'wet'`). `STAGES` lists the three real ones; the lab's 🔧 panel picks one
  («Tramo»), and a new pick starts a new run on it. The generator and the weekly pool come in phase 1.3.
- Surfaces and rain: each centreline point carries its surface (`sf`), forks take the main road's;
  `gripOf(surface, wet)` and `topOf(surface)` are the one place they are read. Wet: gravel grip × 0.85,
  asphalt × 0.6 (less than dry gravel), so the car runs wider at the same speed. The scene draws each
  stretch in its surface's look (the setting's own road for its surface, the other's usual look
  where the stage changes, edge to edge), darkens a wet road, scatters puddles, draws rain across the
  screen (still with reduced motion) and throws spray instead of dust.
- `input.js`: the touch schemes (`wheel`, `stick`, `auto`), relative to where each thumb lands and analogue, and the keyboard, into `{ steer, throttle, brake, handbrake }`; it draws the thumbs' gauges (`.dr-touch`) just above each thumb.
- `scene.js`: the top-down 2D scene, `escena(canvas) → { draw(g, alpha, view), resize, dispose }`: the road (ruts on gravel, lines on asphalt), the props as sprites drawn once, the car over them (a crown never hides it), tyre tracks while it slides, dust from a fixed pool, the light of the hour as one tint.
- Forks, ramps and boost pads (core section 5), placed per stage in `tracks.js`; the scene draws the forks as roads, the ramps as wooden wedges and the pads as cyan carpets with running arrows. Speed (the owner asked for vertigo, then for more): top 52 m/s on gravel, 62 on asphalt (accel 10, so it takes longer to get there); the steering's lock still narrows up to 42 m/s (`lockSpeed`), so it feels as before; the 🔧 panel goes up to 100 and 120; thin streaks down the sides from 30 m/s (none with reduced motion). No dust on asphalt itself, only at its edge and off it.
- Crashes (core section 5): solid trees, rocks, stumps and hay bales; 10 lives; a crash over 3 m/s costs one and dents the car where it struck; the tenth wrecks it and ends the run with no time. `game.js` puts the solids of the setting being drawn on the track (`arm`), so the car hits what the player sees.
- `scene3d.js` and `gl3d.js` (path 2, brought forward by the owner on 2026-11-27): the same race seen from behind the car, chosen on the cover («🗺️ Vista 2D» / «🚗 Vista 3D», kept with the panel's values as `view.scene`). `escena3d(canvas)` has the 2D scene's interface and returns null without WebGL, and then the race is drawn from above. `gl3d.js` is our own small WebGL 1 renderer (matrices, a flat-shaded mesh builder, one shader with one sun and fog; no library). The world is built once per stage and setting from the same data as the 2D scene (roads and forks, `scenery()`'s props, crowds and grandstands, ramps, pads), so a tree is where the car hits it; it is cut into 120 m chunks, one buffer each, drawn only near the camera. The ground rises into hills only farther than 70 m from the road, where nothing is solid. The car leans (roll out of a turn, pitch under braking, a few degrees, eased), turns its front wheels, shows its brake and reverse lights, darkens with each crash and smokes from the seventh. The camera sits 8.5 m behind and 3.8 m above, follows the direction of travel eased over about half a second, and never rolls or shakes. In reverse the camera holds still. The wheels turn as the car runs (faster than it moves when it pulls away hard). Each view drives with its own values and controls (`tuning.js`: `SCENE_TUNING`, `view.scheme3d`; saved as `tuning` and `tuning3d`): 3D accelerates at 18 and plays with one finger by default (the owner, 2026-11-27), and the cover's rules describe the chosen view's controls. The panel's «Velocidad máxima» sets gravel's top speed (asphalt's follows in proportion), its default at a quarter of the bar. Not yet in 3D: rain drops, the crash ring, the speed streaks, the people's jump.
- The definition pass (the owner, 2026-11-27: «Mejora notoriamente la calidad de todas las gráficas… tanto al entorno como al vehículo»). 2D: `textures.js` draws a seamless 512 px tile per setting (ground with its grass, ash or stalks; gravel with pebbles; asphalt with aggregate and cracks), repeated as a pattern sized in metres, so the ground, the shoulder and the road show grain at any zoom with nothing drawn per frame (no `DOMMatrix`: no grain); the road gets a verge rim and darker edge lines. `car2d.js` draws the car once per scale as a sprite (body with its volume, fenders, stripes, bonnet vents, windscreen with its reflection, roof scoop, windows, mirrors, spoiler, outline) and a soft shadow; the scene draws the wheels with tread, chrome headlights and glowing tail lights on top. The canvas goes up to 3× the CSS pixels (`MAX_DPR`). 3D: the shader adds a sky/ground ambient, a sun highlight and rim on the paint and glass (`shine`), and a procedural grain on the ground and the road (`grain`); the car is a loft through eight sections with a real cabin (windscreen, roof, rear window, side glass with its pillar), bumpers, grille, fender lips, mirrors, spoiler, exhaust, 16-sided wheels with tread and spokes, lit lamps and a layered shadow; tufts and pebbles line the road's edges (never on a road).
- `scenery.js`: the three settings (`meadow`, `forest`, `plain`), each a palette and the props it grows, and the props of a stage from a seeded generator (the same for everyone, none on the road; `scenery.test.mjs`). The stage names its setting; the lab's 🔧 panel can show any of the three.
- People (the owner, 2026-11-27: «agregar gente y gradas»): `people(track)` puts a crowd on the outside of every bend tighter than 45 m, behind a row of straw bales, and a grandstand by the start and by the finish, from the stage's own seed, the same in every setting. The bales and the grandstands are solid (`solids`); the people are not, and stand behind the bales. The people jump as the car goes by (not with reduced motion).
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
`overSteer` (3.0) times what the grip holds, so a slide starts progressively and never spins, and
the rear pulls the nose back toward the travel at `align` (3.0 per second), which ends a slide within
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
  while turning), one finger at 320; then pause and resume; at 375 the cover's 3D choice, a 3D run with a crash to
  the result, and back to 2D.
  `node tools/e2e/conformance.mjs labs/drift` checks the canons; `look.mjs drift intro|stage|result`.

## Excepciones a los cánones

None.
