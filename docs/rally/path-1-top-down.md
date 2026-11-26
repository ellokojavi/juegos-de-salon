# Path 1 · Top-down rally

The stage seen from above on one 2D canvas. Everything in [core.md](core.md) is built here; this
page adds the scene and the order of work. **This is the recommended start**, and a complete game
on its own: it does not need path 2 to be worth launching.

## What the player gets

A cover with the car driving itself behind the card → «Jugar» → 3, 2, 1 → a stage of 8 to 10 gates
driven with two thumbs, the road turning under a car that always points up, tyre tracks and dust in
the slides, the co-driver's map calling the next bend → the result: the time, the penalties, the
difference to their best, the week's ranking, «Jugar otra vez».

## The scene (`scene.js`)

`escena(canvas) → { draw(g, alpha, view), resize(), dispose() }`. It reads `g` and nothing else.
Keep exactly this interface: path 2's scene implements the same one.

- **The view**: a camera `{ x, y, angle, zoom }` owned by the scene, eased toward a target each
  frame. The target looks ahead of the car (more at speed) so the player sees where they are going,
  not where they are; the car sits in the lower third of the stage. *Starting value*: about 70 m of
  road visible ahead on a tall phone. Zoom is fixed: no speed zoom.
- **The road**: the centreline points inside the view, stroked as one wide path with round joins,
  twice (a shoulder colour, then the surface), plus centre dashes on asphalt. Never render the whole
  stage to one big offscreen canvas: a stage is kilometres long and phones cap canvas size.
- **Scenery**: trees, rocks, fences and corner signs scattered by a seeded generator from the stage
  itself (so everyone sees the same), kept off the road, stored in a coarse grid so only the cells in
  view are drawn. Each kind is a small sprite drawn once to an offscreen canvas. Seen from above, a
  tree is a blob with a shadow offset toward one side: cheap and it reads.
- **Gates**: two posts and a bar across the road, the next one brighter, its number beside it.
- **The car**: a sprite drawn once, turned by `g.car.h` minus the view angle, front wheels turned by
  `steer`. A soft shadow under it.
- **Tyre tracks**: while `car.slip` is over a threshold, append the four wheel positions to a ring
  buffer (*starting value*: 600 segments); draw the ones in view under the car, fading with age.
- **Dust**: a fixed pool of particles (*starting value*: 80), spawned at the rear wheels from
  `slip` and from throttle on gravel, drawn as soft circles from a sprite. No `shadowBlur`, no
  per-frame gradients.
- **The ghost**: the same car sprite at 35 % opacity.
- **Settings**: a palette object per setting (ground, road, shoulder, tree, shadow, dust, sky tint)
  and which props appear. Three are enough: day meadow on gravel, burnt forest at sunset, plain at
  dusk on asphalt. In 2D a setting is an afternoon of work, so all three belong in this path.
- **Budget**: 60 frames a second on a modest Android at a canvas 2× its CSS size at most; fall back
  to 1.5× and fewer particles if the frame time readout says so. Measure on a real phone through
  the preview, not only on the Mac.

## Phases

One PR each. The exit list is what "done" means; the PR quotes it.

### 1.0 · Concept sign-off (no code)

Ask the owner the decisions marked "before 1.1" in [PROGRESS.md](PROGRESS.md), as one-tap choices
with the recommended default first. Record the answers there.

**Exit**: the name and emoji are settled (or `rally` is confirmed as the lab name), the source of
the clip is known or declared unknown, and the stage length is agreed.

### 1.1 · A grey-box drive, in the lab

The first PR is a whole lab game (D-579), with the dullest possible look.

- Run the generator; keep its shell (cover, dialogs, result, footer, signals, spec, e2e, languages).
- `engine.js` per core sections 2 to 5 and 7, with `engine.test.mjs`. One hand-written stage and the
  three-gate test stage; no generator yet.
- `input.js`: scheme A and the keyboard.
- `scene.js`: flat ground, the road, gates, a rectangle for the car. No scenery, no particles.
- `game.js`: the fixed-step loop, countdown, HUD (clock, gate count), pause when hidden, result
  with the time. The hook `window.__rally` (`g`, and a way to switch on the autopilot under `?test`).
- The tuning panel (core section 12), lab key only.
- The spec `docs/games/rally.md` in C-13's sections; the card in `/labs/` (25 words at most).

**Exit**: every test green, `public/labs/canons.test.mjs` and `conformance.test.mjs` included;
`tools/e2e/rally/game.mjs` drives the test stage to the result; `landing-fold` passes; cover, stage
and result measured with `look.mjs` at 390 and 320; `design-lint` reports zero; the owner has a
preview link and has driven it on a phone.

### 1.2 · The feel round

No new features. The owner plays on the preview; the session changes `TUNING`, the camera and the
controls, and pushes again. This phase is as many rounds as it takes and is where the project is
won or dropped.

- Fixed view against heading-up view, the owner picks.
- Scheme A's steering ease, auto-throttle, whether the handbrake exists at all.
- Stage width and corner radii against the car's grip: can a first-timer finish?
- If two rounds do not get there, try the two-axle car model (core section 3) or scheme B.

**Exit**: the owner says the car feels good and the controls work one-handed and two-handed on
their phone, in so many words. The chosen values are the defaults; the engine tests assert the
behaviours in core section 3's judging list that can be asserted. **If the answer is no after a
real attempt, stop here**: write why in PROGRESS.md, move the card to La Bodega, and do not go on to
path 2 hoping 3D fixes it.

### 1.3 · Stages

- `tools/generators/rally-tracks.mjs` and `tracks.js` (core section 4), with `tracks.test.mjs`.
  A first pool of at least 12 stages across the three settings.
- The date-to-stage function, in Pacific time, with its test (week boundaries, year ends).
- The co-driver's map. Corner signs before tight bends.
- Missed gates, penalties, reset, wrong way (core section 5), each with its engine test.
- Par per stage from the autopilot.

**Exit**: every stage passes the autopilot test; the owner has driven three stages and vetoed or
kept each; a miss and a reset behave as written, on a phone.

### 1.4 · The look and the sound

- Scenery, the three settings, the car sprite, tyre tracks, dust.
- Synthesised engine, slide, gate, miss and finish sounds; vibration; the mute.
- The cover's demo (autopilot behind the card; still with reduced motion).
- The first-run hint.
- Splits on each gate against the player's best; the best kept on the phone.

**Exit**: frame time measured on a real modest phone and written in the PR (target: 60 a second, no
frame over 33 ms in a clean run); reduced motion checked; every changed screen measured at 390 and
320; a look at each setting sent to the owner as a link.

### 1.5 · Coming back: ghost, ranking, share, memory

- The ghost of the player's best (core section 9), with its switch.
- If the owner said the game records scores: `avisoPartida`, the table in `SOLO_TABLES`, the
  ranking block under the stage, the e2e check on `/records/` (the `owner-tools` skill first).
- The result per C-19, with one share button through `compartir.js` and a template of
  `share-templates.js` carrying the tagline ([SHARING.md](../SHARING.md)).
- The gate checkpoint and resume (core section 10), with the conformance resume check.
- The whole checklist at the end of [CANONS.md](../CANONS.md), line by line.

**Exit**: the checklist is whole, exceptions written in the spec; the usability agent's review has
no open point; the player agent has played it in Spanish and one other language.

### 1.6 · The lab verdict

The game is in the lab for the owner's testers. Nothing to build; something to read.

- **The number** (D-532's habit: one per piece, named before the result): of the testers who
  finish one run, the share who start a second in the same visit. *Proposed bar*: half or more,
  over at least 10 testers. Confirm the bar with the owner before reading the result. Read it from
  the panel's signals ([PANEL.md](../PANEL.md)).
- Also read: how many started runs finish, and what the 💬 comments say about controls.

**Exit**, one of four, the owner's choice: **launch** (the `launch-game` skill, a separate piece of
work); **iterate** (name what, back to the phase it belongs to); **park** (La Bodega); **go on to
path 2** (only alongside or after launch: path 2 improves a game people already replay).

## Risks, and what answers each

| Risk | Sign | Answer |
|---|---|---|
| Touch steering is too coarse or too twitchy | The owner over-corrects, zigzags on straights | The steering ease and speed-dependent lock first; then scheme B behind a switch |
| The turning view is uncomfortable | The owner says so in the first minute | More damping; follow travel, not heading; offer the fixed view |
| A first-timer cannot finish | Runs abandoned before gate 3 in the lab signals | Wider road, gentler first three bends on every stage, a slower car before a faster one |
| It is dull once learned | Second-run share under the bar | The ghost and splits earlier; shorter stages; the weekly stage with its ranking |
| Slow on modest phones | Frame time over 20 ms in the readout | Fewer particles, 1.5× canvas, scenery sprites, never a full redraw of static things that could be cached per cell |
| Stages feel the same | The owner cannot tell two apart | Give the generator named corner kinds (hairpin, chicane, long sweeper) and require a mix |
| Scope creep toward the clip | A phase grows a feature from path 2 or 3 | It goes to PROGRESS.md's "later" list, not into the PR |

## What path 1 leaves ready for path 2

The scene interface, the flat engine, the stage data with a place for elevation, the HUD in DOM,
the autopilot, the tuning panel and every test. Path 2 adds a file and a flag.
