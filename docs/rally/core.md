# The core: what all three paths share

One engine, one input layer, one set of rules, and a scene that can be swapped. Everything on this
page is built in path 1 and **not rewritten** in paths 2 and 3. If a later path needs to change the
engine, that is a sign the boundary below was drawn wrong: fix the boundary, do not fork the engine.

Numbers marked *starting value* are guesses to tune by playing. They live in one exported `TUNING`
object so a lab panel can change them live (see "Tuning").

## 1. The boundary

```
input.js  ──►  { steer, throttle, brake, handbrake }  ──►  engine.js  ──►  state g, g.events
                                                              │
                                 scene (2D now, 3D later)  ◄──┘   reads g, never writes it
                                 game.js: screens, HUD, sound, memory, ranking
```

| File | Knows about | Never knows about |
|---|---|---|
| `engine.js` | The car, the track, gates, the clock, penalties, the autopilot. Plain numbers and arrays. | DOM, canvas, `performance.now`, `Math.random`, how anything is drawn, touch or keys |
| `tracks.js` | The pool of stages as data, generated at build time | The car |
| `input.js` | Touch, keyboard, later a gamepad. Turns them into the four numbers. | The engine's state |
| `scene.js` (path 1), `scene3d.js` (path 2) | How to draw `g`. Camera, particles, tyre tracks, colours. | Rules, scoring, input |
| `game.js` | Screens, HUD, countdown, pause, sound, memory, ranking, signals, texts | Physics |

**The physics is flat in every path.** The car lives on a plane: `x`, `y`, a heading. In 3D the road
may rise and fall, the body may lean and a wheel may lift, but all of that is **drawn** from the flat
state (height from the track's elevation profile, lean from lateral acceleration). This is the one
decision that keeps three paths one game. Hills that change grip or speed, and jumps, are a path 3
increment that would extend the engine, deliberately and last.

## 2. The engine's shape

Modelled on `public/labs/flap/engine.js`: a state object, a fixed step, events for the page to play.

```js
newGame({ track, mode = 'play', ghost = null }) → g
step(g, input, dt)        // dt is always STEP (1/120 s); the caller runs it in an accumulator loop
autopilot(g) → input      // drives the stage by itself: cover demo, tests, e2e, par time
snapshot(g) → plain JSON  // for C-6's checkpoint;  restore(json, track) → g
```

`g` holds: `car { x, y, h, vx, vy, steer, surface, slip }`, `t` (run time in ms, counted in steps,
never read from a clock), `gate` (index of the next gate), `splits[]`, `penalty` (ms), `missed`,
`mode` (`'demo' | 'ready' | 'play' | 'done'`), `progress` (metres along the centreline), and
`events[]`, emptied by the caller after each frame: `start`, `gate` (with its split), `miss`,
`penalty`, `offroad`, `back`, `reset`, `finish`.

**The loop** in `game.js`: accumulate real elapsed time, clamp a frame to 0.1 s so a hiccup does not
become a time jump, run `step` while the accumulator holds a whole `STEP`, then draw once, passing
the leftover fraction so the scene can interpolate on fast screens. The clock a player sees is
`g.t`, so a slow phone gives a slow-motion run, never an unfair time.

**Units**: metres, seconds, radians. One convention for axes and angles, written at the top of
`engine.js` and used by both scenes.

## 3. The car

Start with the simplest model that slides, and only make it more physical if playing asks for it.

Each step:

1. Ease `car.steer` toward `input.steer` at a fixed rate (*starting value*: full lock in 0.15 s), so
   a tap and a held thumb both feel right and the result does not depend on frame rate.
2. Split the velocity into forward (`vf`) and sideways (`vl`) parts relative to the heading.
3. Forward: add throttle acceleration, subtract braking, rolling drag and air drag. The surface
   scales acceleration and drag.
4. Turn the heading: `yaw = vf / WHEELBASE × tan(steerAngle)`, with the largest steer angle shrinking
   as speed rises (*starting values*: 32° when slow, 9° at top speed; 40° and 14° since the owner asked to turn harder, 2026-11-27).
5. Sideways grip: remove up to `GRIP[surface] × dt` of `vl`. That one line is the drift: while a
   corner asks for less sideways acceleration than the grip gives, the car tracks; ask for more and
   it slides wide with its nose pointed in. The handbrake multiplies grip by a fraction for the rear
   feel; off the road grip and drive both drop.
   **Found in 1.1:** step 4 alone spins the car at full lock (the nose turns at the bicycle's rate
   whatever the grip, and the sideways speed only grows). So the yaw is capped at `overSteer`
   (*starting value* 2.2, now 3.0) times what the grip can hold at that speed, which makes a slide start
   progressively, and the rear pulls the nose back toward the direction of travel at `align`
   (*starting value* 2.5 per second, now 3.0, less with the handbrake), which ends a slide within about half a
   second of letting go. Both are in `TUNING`. To turn harder (the owner, 2026-11-27) the lock, the
   cap and the grip went up together (gravel grip 9 → 11 m/s², asphalt 14 → 16), and `align` with
   them so a bigger slide still ends within half a second.
6. Rebuild the velocity from the new heading, move the car.
7. `car.slip = |vl|` drives the tyre tracks, the dust and the skid sound.

*Starting values*: top speed 30 m/s on gravel and 36 on asphalt, acceleration 7 m/s², braking
14 m/s², wheelbase 2.5 m, grip 9 m/s² on gravel, 14 on asphalt, 5 off the road, handbrake × 0.45.

If this cannot be made to feel right after two tuning rounds with the owner, the next model up is a
two-axle bicycle model with a slip-angle tyre curve that saturates: front and rear grip apart, so
lifting the throttle tucks the nose in. Record the switch in PROGRESS.md. Do not start there.

**What good feels like** (the judging list for a feel round): the car turns in at once; a slide
starts progressively, not as a snap; easing the steering ends a slide within about half a second;
flat-out through a gentle bend is possible and through a hairpin is not; a first-time player
finishes a stage on the first try, badly; an expert finds two seconds.

## 4. The track

**A stage is a centreline plus a width.** Built from pieces: straights and arcs, each with a length
and, for arcs, a radius and a side. Sampled every 2 m into points `{ x, y, h, s, k }` (position,
heading, distance from the start, curvature). Width 7 m (*starting value*), wider at hairpins. Each
stage also carries a surface (`gravel` or `asphalt`), a setting (a palette name), and, for path 2,
an elevation profile over `s` that the flat physics ignores.

**Stages are generated at build time and committed as data**, not generated on the phone:

- `tools/generators/drift-tracks.mjs` draws pieces from a seeded generator, rejects a stage that
  crosses or comes within 25 m of itself, that is outside the length range, or that the autopilot
  cannot finish cleanly, and writes `tracks.js`: a list of stages, each a short array of piece
  codes. A stage is a few hundred bytes.
- Why not on the phone: every player must drive the **same** stage for a ranking to be fair, and
  `Math.sin` and friends are not guaranteed bit-identical across browser engines. A generator that
  makes accept-or-reject decisions on floating-point results could build different stages on two
  phones. Expanding a committed list of pieces into points has no decisions in it, so last-digit
  differences are invisible.
- It also lets the owner veto a dull or unfair stage, and lets a test hold every stage to the rules.
- The generator's other models in this repo: `tools/generators/artifacts-levels.mjs`,
  `tools/generators/bridges.mjs`.

**Which stage is played** is an owner decision (PROGRESS.md). The recommendation is **one stage a
week**: the ranking's week period then compares like with like, players learn the stage and come
back to beat a time, and the pool lasts (52 stages a year). The stage for a date is a pure function
of the date in Pacific time (D-561), so it needs no server. The all-time table then mixes stages,
which is only fair if every stage has a par (see "Scores").

**Finding the car on the track**: keep the index of the nearest centreline point and search a few
points either side each step (never the whole list). From it come `progress`, the distance from the
centre (on or off the road), and the direction of travel (the wrong way).

**A test stage** for the e2e script and `?test`: three gates, about 12 seconds for the autopilot.

## 5. Gates, the clock, penalties

- **Crashes and lives** (the owner, 2026-11-26): trees' trunks, dead trees, stumps, rocks and hay
  bales are solid circles beside the road (`track.solids`); bushes are soft. The car, two circles
  along its length, bounces off them; a hit faster than `crashSpeed` (3 m/s) costs one of 10 `lives`
  and records a dent where it struck (`car.hits`, in the car's frame). The tenth crash wrecks the
  car: the run ends with no time (`g.wrecked`), and the result says at which gate. The scene shows
  each crash as a ring, sparks and debris, with no camera shake, and the damage grows on the car.
- **Forks, ramps and boost pads** (the owner, 2026-11-27, in `tracks.js` on top of the pieces):
  - A **fork** is a second road from `from` to `to` m, bulging `offset` m to one side with a
    sin² profile so it leaves and meets the main road tangentially (a Y at each end). Its points
    carry the main road's distance, so progress, misses and gates read the same on both; no gate
    sits inside a fork. The car is located on whichever road is nearer; ↺ brings it back to the
    main one. Each branch should trade something: the first stage's hairpin fork is tight and
    short or wide with a pad; its sweeper fork is smooth or has a jump.
  - A **ramp** throws the car up at `rampLift` (0.18) of its forward speed under `gravity` 12 m/s²
    (about a second in the air at speed, 2 m high): no steering, no grip, no throttle and no
    crash in the air, and the landing costs nothing (`car.z`, `car.vz`; the scene grows the car a
    little and pushes its shadow away).
  - A **boost pad** (8 × 3.4 m, narrower than the road, so it has to be aimed at) gives
    `boostTime` 1.2 s of `boostTop` × 1.7 the top speed and `boostAccel` 26 m/s²; past the top
    speed with the boost spent, a drag proportional to the excess brings the car back in a second or two.
- **The solids must be the same on every phone** for a ranking to be fair: today the scene's seeded
  generator places them on the phone (fine in the lab). In 1.3 the stage generator commits them
  with each stage, like the pieces (section 4).

- **Gates** sit at even distances along the centreline; the last is the finish. Each is a segment
  across the road between two posts. *Starting value*: 8 to 10 per stage (the clip has 20 on a stage
  more than twice as long).
- **Passing**: the car's movement in a step crosses the gate's segment, in the right direction.
  Emit `gate` with the split and the difference against the player's best split.
- **Missing**: `progress` goes more than a car length beyond a gate without having crossed it. Emit
  `miss`, add the penalty, move on to the next gate. The run never dead-ends on a missed gate.
- **The clock** starts on the first throttle after the countdown, as Flap's starts on the first tap,
  and stops on the finish gate. Shown as `m:ss.mmm`.
- **Penalties** (*starting values*, to settle with the owner): a missed gate +10 s; a reset to the
  road +5 s. The clip's +30 s would end a 75-second run in practice; ours are sized to hurt and
  leave the run worth finishing. The final time is the clock plus penalties, and the HUD shows the
  penalties apart, as the clip does.
- **Off the road**: slower and slippery, no penalty by itself. No invisible walls in path 1.
- **Reset**: a «↺» button, and offered on its own after 3 seconds off the road or driving the wrong
  way. It puts the car on the centreline at the last point it was on the road, stopped, facing
  forward.
- **Giving up**: leaving the page mid-run is not a result. No time, nothing ranked; `trackFinish`
  still says it ended unfinished if the signal supports that (read `transport/stats.js`).

## 6. Input

The hardest design problem of the project, and the first thing the owner should try on a phone.

The engine takes `{ steer: -1…1, throttle: 0…1, brake: 0…1, handbrake: bool }`. `input.js` produces
it from whichever scheme is active, so schemes can be swapped and compared without touching anything
else.

| Scheme | How | For | Against |
|---|---|---|---|
| **Wheel and pedal** (`wheel`, the default since 2026-11-26) | The left thumb lands anywhere on the left half and slides sideways to steer (full lock at `reach`, *starting value* 60 px, 75 since the owner's pick, 2026-11-27). The right thumb on the right half is the pedal: held, it accelerates; slid down from where it landed, it eases off and then brakes; held down with the car stopped, it reverses (the owner, 2026-11-26). Lifting lets the car roll. A gauge just above each thumb (not under it: the owner, «el dedo presionado tapa el control») shows the wheel as a bar with a knob and the pedal as a bar green above and red below; the car turns its front wheels and lights its brake lights. | Analogue steering and analogue pedals at once: brake into a bend while turning, lift, accelerate out. Nothing to aim at. | Two thumbs; needs a hint per half. |
| One finger (`stick`) | One thumb is a stick from where it lands: sideways steers, up accelerates, down brakes. | One hand. | Steering and pedal are coupled in one thumb. |
| A · Two halves, auto-throttle (`auto`, the 1.1 scheme) | The car accelerates by itself; hold a half to turn, both to brake. | Explains itself in one line. | **Dropped by the owner on the first drive (2026-11-26):** the car never stops pulling, and braking while turning is impossible. Kept in the tuning panel only to compare. |
| On-screen buttons | ◀ ▶ on one side, pedal and brake on the other. | Familiar. | Four targets to find without looking; crowds a 320 px stage. Not built. |
| Keyboard | ←/→ or A/D steer, ↑/W accelerates, ↓/S brakes, space for the handbrake. Always on. | Desktop, e2e scripts. | |

The scheme is chosen in the lab's tuning panel; the cover's instructions describe the default. The
first run shows each half's hint on the stage («👈 👉 Desliza para girar» on the left, «👆 Mantén:
aceleras / 👇 Bájalo: frenas» on the right), gone on the first input. With a pedal, the clock starts
on the first throttle, as section 5 says.

**The camera decides whether A works.** With the stage fixed north-up, "left" reverses when the car
drives down the screen. So the default view follows the car's heading: the car always points up,
and left is always left. That means the world turns, which can make a player queasy, and the owner
is sensitive to it. Rules: the view turns toward the car's **direction of travel**, damped (it
arrives over about half a second), never snaps, and does not follow the twitch of a slide. Offer the
fixed view as a lab switch for comparison on the first feel round and let the owner choose.

Touch details that matter: `touch-action: none` on the stage; `pointerdown`, `pointerup` and
`pointercancel` tracked per pointer id; a finger that slides from one half to the other switches
sides; losing focus releases everything; nothing the player needs sits within the bottom safe area.

## 7. The autopilot

`autopilot(g)` returns an input: it aims at a point on the centreline a speed-dependent distance
ahead and brakes when the curvature ahead asks for less speed than it has. It reads only `g`.

It earns its keep four times, which is why it is in the engine and not a test helper:

1. **The cover's demo**: the car drives itself behind the cover card (still with reduced motion).
2. **Stage validity**: a node test runs it over every stage in the pool; a stage it cannot finish
   with every gate passed is rejected. This replaces playing 52 stages by hand.
3. **Par time**: the autopilot's time on a stage, times a factor, is that stage's par.
4. **The e2e script** drives the test stage to the result screen through the page's real loop.

It should be decent, not brilliant: a careful human should beat it.

## 8. Scores

A record is `{ s, ms }`, higher `s` first, then lower `ms`.

- **Recommended**: `s` is the stage's score from 0 to 100 against par, `ms` the final time with
  penalties. `s = round(100 × clamp((2 × par − time) / par, 0, 1))` (*starting formula*): par or
  better is 100, twice par is 0. Within a week everyone has the same stage, so the order is by
  score and then by time, which is by time. Across weeks the all-time table compares scores, which
  is fair between stages of different lengths. A 0 to 100 score is also what La Copa asks of a game
  that joins its pool, so nothing has to be redone later.
- The alternative, `s` constant and `ms` the time, is simpler and makes the all-time table
  meaningless across stages.
- A run with a missed gate still ranks, with its penalty in the time.
- **Sanity**: a time under the stage's shortest possible (its length over top speed) is not sent.
  Solo scores are reported by the phone everywhere on this site; this game does not try to do
  better than the rest (no replay verification: it would not be reliable across browser engines,
  for the reason in section 4).
- **The table**: `drift` (weekly stage) needs no Firebase rule. Add it to `SOLO_TABLES` when the
  owner says the game records scores.
- Uno al día and La Copa are **after launch** and each is its own decision and PR; this design only
  avoids blocking them (a 0 to 100 score, a pure date-to-stage function, a fixed-length run).

## 9. Ghost

The player's best run on this stage, drawn as a faint car. Cheap and the strongest reason to play
again.

- Recorded as **positions**, not inputs: `x`, `y`, heading every 100 ms, rounded to centimetres,
  interpolated when drawn. Replaying inputs through the physics would drift between devices.
- Kept on the phone, one per stage, a few kilobytes (`juegos-de-salon:drift:ghost:<stage>`), in
  `try/catch` like every write.
- Never collides, never ranks, can be turned off.
- A friend's ghost or the leader's means uploading runs: new stored data, a privacy edit, a 🔴 PR.
  A path 3 increment at the earliest.

## 10. Memory (C-6)

- The page hidden mid-run **pauses**: the loop stops, the clock stops with it, «En pausa · Toca para
  seguir», then a short 3, 2, 1 before control returns.
- At each gate the session store (`createSessionStore`) saves `snapshot(g)`. A reload offers the
  shared «⏯ Hay una partida a medias» with Continuar and Borrar; Continuar restores the car stopped
  at that gate with the clock as it was there, plus the reset penalty so reloading is never a way
  to undo a bad corner.
- Finished runs mark `done: true`. A new run deletes the saved one.
- The best time and best splits per stage are kept apart (`juegos-de-salon:drift:best`).

## 11. HUD and what the player hears

- **Top**: the clock, the penalties beside it when there are any, «Puerta n de N».
- **Under it**: the co-driver's map: the next 120 m of centreline (*starting value*) drawn as one
  stroke in a small panel, turned so "up" is where the car is heading. It is the clip's best idea
  and costs twenty lines.
- **On a gate**: the split and the difference to the player's best, green or red, for a second.
- **Edge of the stage**: mute and ↺. Nothing else during a run; the page is marked in play
  (`body.jugando`) so the tester tab hides, as in Flap.
- **Sound**, all synthesised: an engine tone whose pitch follows speed, filtered noise for a slide
  with its volume from `car.slip`, a chime on a gate, a low buzz on a miss, a short fanfare at the
  finish. Vibration on a gate and a miss.
- HUD text is DOM over the canvas, in the site's type and tokens, in three languages. It is not
  drawn inside the canvas, so both scenes share it.

## 12. Tuning

A lab-only panel (visible with a lab key, never on the cover, as Babel's «🧪 Simular final» is
tucked into a side tab): sliders for the `TUNING` values, the control scheme, the camera mode, a
frame-time readout, and "copy values" to paste back into a PR. It is how a feel round with the owner
takes minutes instead of a PR per try. It writes nothing but its own `localStorage` key, and a run
with changed values is never ranked.

## 13. Tests

**Engine, in node** (`engine.test.mjs`), no browser:

- Determinism: the same stage and the same inputs give the same final state, twice.
- Step independence of the caller: one 1-second frame and 120 calls of `STEP` end in the same state.
- The car: accelerates to top speed and no further; stops under braking; holds a gentle bend at
  speed and slides in a tight one; off the road it is slower.
- Gates: a clean pass, a pass in the wrong direction (ignored), a miss (penalty, next gate), the
  finish (clock stops, `finish` event).
- Reset puts the car on the road facing forward with its penalty.
- `snapshot` then `restore` continues to the same result as an uninterrupted run.
- The autopilot finishes the test stage with every gate.

**Stages** (`tracks.test.mjs`): every stage in the pool is inside the length range, never comes
near itself, has its gates on the road, and is finished cleanly by the autopilot within a time
range. The committed `tracks.js` is what the generator writes (run it, compare).

**End to end** (`tools/e2e/drift/game.mjs`, the generator writes the skeleton): cover, three
languages, Jugar with a double tap, the countdown, the hook `window.__drift` drives the test stage
with the autopilot through the real loop, the HUD counts gates, the result shows the time and the
exits, the ranking block is there, at 375 and 320 px with no sideways scroll. Assert on `__drift.g`,
not on pixels or frame rate: CI's Chrome draws in software and is slow. `tools/e2e/flap/lab.mjs` is
the model for driving a real-time game from a script.

**What tests cannot say** is whether it is fun. That is the owner's thumb on a phone, every feel
round.
