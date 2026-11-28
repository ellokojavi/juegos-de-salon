# Rally: where it stands

The one page a session reads to know what to do next, and the one it updates in every PR: tick the
phase, answer the decisions that were answered, add a line to the log. Keep it short; the design is
in the other files.

## Now

- **Path**: 1 · Top-down ([path-1-top-down.md](path-1-top-down.md)), and path 2's 3D view beside it on the cover ([path-2-3d.md](path-2-3d.md), the owner, 2026-11-27)
- **Next phase**: 1.4 · The look first (the owner, 2026-11-26: «Mejoremos las gráficas primero»), then 1.3 · Stages. In progress: the settings, scenery, car, tyre tracks and dust.
- **Code**: `public/labs/drift/` (spec: [docs/games/drift.md](../games/drift.md)), from [#1928](https://github.com/ellokojavi/juegos-de-salon/pull/1928).
- **Name**: Derrape / Drift / Derrapagem 🏁, id `drift` (decision 1)

## Phases

| Phase | What | Status | PR |
|---|---|---|---|
| 1.0 | Concept sign-off | done | [#1926](https://github.com/ellokojavi/juegos-de-salon/pull/1926) |
| 1.1 | Grey-box drive in the lab | done (the owner drove it, 2026-11-26) | [#1928](https://github.com/ellokojavi/juegos-de-salon/pull/1928) |
| 1.2 | The feel round | done (the owner, 2026-11-26: «Me gusta») | [#1940](https://github.com/ellokojavi/juegos-de-salon/pull/1940) |
| 1.3 | Stages | in progress: closed circuits of about a minute, their standards, the generator and the weekly rotation | |
| 1.4 | The look and the sound | in progress, before 1.3 (the owner's order): the look, crashes and lives in [#1941](https://github.com/ellokojavi/juegos-de-salon/pull/1941); forks, ramps, pads | [#1946](https://github.com/ellokojavi/juegos-de-salon/pull/1946) |
| 1.5 | Ghost, ranking, share, memory | not started | |
| 1.6 | The lab verdict | not started | |
| 2.0 | Renderer spike and decision | in progress: renderer A built (the recommended); its measurements on the owner's phone owed | |
| 2.1 | The second scene, grey | done, already dressed: a 2D/3D choice on the cover (the owner, 2026-11-27) | |
| 2.2 | The camera round | | |
| 2.3 | The world | in progress: road, forks, props, crowds, grandstands, hills, fog, baked shadows, the three settings; no elevation on the road yet | |
| 2.4 | Effects and the safety net | | |
| 2.5 | The verdict | | |
| 3.x | Increments, one at a time ([path-3-full.md](path-3-full.md)) | waits for 2.5 and the owner's pick | |

Status is one of: not started, in progress, done, dropped (with the reason in the log).

## The owner's decisions

Ask only the ones the next phase needs, as one-tap choices, recommended option first. Write the
answer and its date here; a decision that sets a policy someone could undo also gets its D-n.

| # | Decision | Needed | Recommended | Answer |
|---|---|---|---|---|
| 1 | The name the player reads, in es, en and pt, and its emoji. The folder and id follow it (C-20). | before 1.1 | «Rally» in all three (then it joins `SAME_NAME`), 🏁. A name of our own, like Aletazo, is more in the site's voice if the owner has one. | **Derrape** (es), **Drift** (en), **Derrapagem** (pt), 🏁; id `drift`. 2026-11-25 |
| 2 | Where the clip came from, so the cover can credit the game that inspired it. | before 1.1 | Ask for the link. Unknown is an acceptable answer: then no credit. | Unknown: the cover credits nothing. 2026-11-25 |
| 3 | Stage length. | before 1.1 | 8 to 10 gates, 60 to 90 seconds. The clip's is 20 gates and about three and a half minutes. | The recommended: 8 to 10 gates, 60 to 90 seconds. 2026-11-25 |
| 4 | The view: the world turns so the car points up, or the map stays fixed. | in 1.2, by playing both | The world turns, damped. | **The world turns** (the follow view): the fixed map «no anda bien», the owner, 2026-11-26 |
| 5 | Controls: two halves with auto-throttle, or something else. | in 1.2, by playing | Two halves, auto-throttle. | Not auto-throttle (the owner, 2026-11-26: it pulls all the time and braking into a bend is impossible). **Wheel and pedal** (default), with one finger in 🔧; the brake held when stopped reverses. «Me gusta», 2026-11-26 |
| 6 | Penalties: a missed gate and a reset. | in 1.3 | +10 s and +5 s. | The recommended: +10 s and +5 s. 2026-11-26 |
| 7 | How often the stage changes. | before 1.3 | One stage a week, the same for everyone. | **One circuit a week**, the same for everyone. 2026-11-27 |
| 8 | Does the game record scores in Rankings? | before 1.5 | Yes: the table `drift`, score 0 to 100 against par, then time. | **Yes, by time** (the week's circuit). 2026-11-27 |
| 9 | The bar for the lab verdict. | before 1.6 | Half or more of the testers who finish a run start a second one in the same visit, over at least 10 testers. | |
| 10 | After 1.6: launch, iterate, park, or path 2. | at 1.6 | Depends on the number. | |
| 11 | The renderer for path 2: our own small WebGL renderer, or Three.js vendored. | at 2.0, with measurements | Our own. | |
| 12 | After 2.5: is 3D the default, an option, or parked. | at 2.5 | Depends on the number. | |
| 13 | The ghost raced by default. | before 1.5 | The next one up the ranking. | **The next one up the ranking**; the leader races their own record made faster. 2026-11-27 |
| 14 | How much faster the leader's ghost is than their record. | before 1.5 | 2 %. | **1 %**. 2026-11-27 |

## Later (ideas that came up and are not in the current phase)

A feature that tempts a phase beyond its exit list is written here instead of built.

- Tilt steering (the phone as the wheel): needs a motion permission on iPhone; try only if the thumb schemes fail.
- The shared 3, 2, 1 before a run: off in the lab since the owner asked (2026-11-27, `COUNTDOWN` in game.js); decide before a launch whether it comes back.
- A handbrake on touch (today only the keyboard's space): if the feel round shows slides need it.
- From the owner's track ideas (2026-11-27), not built: shortcuts as risk and reward (the forks are a first step), climbs and descents (elevation: path 2 or 3), tyre wear and pit stops (a stage is 60 to 90 s), weather that changes during a stage.

## Log

Newest first. One or two lines: the date (Pacific), what happened, what changed in the design.

- **2026-11-27** · The crowd comes alive (the owner: «movimiento al público … serpentina»): fans jump and throw their arms up as the car nears, grandstands rise in a wave, and each crowd bursts into confetti and streamers once per pass (`cheer.js`, both views; none with reduced motion).
- **2026-11-27** · The owner: circuits of about a minute, closed; the generation and rotation with written standards; then a ghost to beat (the next one up the ranking, or the leader's record made 1 % faster). Decisions 7 (one circuit a week), 8 (a ranking by time), 13 and 14 answered. Built: 12 generated circuits replace the three hand-made stages (core section 4 holds the standards).

- **2026-11-27** · The car becomes a rally car (the owner: «una especie de auto de rally», before the track gets relief): `car3d.js` and the 2D sprite; the fans, trees, bales, rocks, bushes and grandstands get more detail (`props3d.js`, heights above a `z` for the relief). Positions and solids unchanged.
- **2026-11-27** · More definition everywhere (the owner: «Mejora notoriamente la calidad de todas las gráficas»): textured ground, shoulder and road and a detailed car sprite in 2D; lighting with highlights, grain, a modelled car and roadside tufts in 3D.
- **2026-11-27** · The owner on the 3D view: the camera no longer turns in reverse; one finger by default and acceleration 18 (3D only: each view now has its own values and controls, as path 2 allows); a top-speed control whose default sits at a quarter of its bar; the wheels turn as the car runs.

- **2026-11-27** · The owner asked for a higher top speed: 42/50 → 52/62 m/s (gravel/asphalt), accel kept at 10 (at 12 the car reached a bend faster and braking in it straightened the nose, which the e2e check caught). The lock now narrows up to a fixed `lockSpeed` (42 m/s) instead of the top speed, so the steering feels as before; the `split` stage's first straight grew 80 m to stay over 60 s.

- **2026-11-27** · The owner brought path 2 forward: «Hagamos esta versión 3D simplemente una variante del juego en la portada», to feel both. The cover offers «🗺️ Vista 2D» / «🚗 Vista 3D»; `scene3d.js` on our own WebGL renderer (`gl3d.js`, option A) draws the same stage from behind the car, and a phone without WebGL plays 2D. The owner is still not at ease with how the car accelerates, brakes, slides and turns: polished as we go.

- **2026-11-27** · The owner sent track ideas (layout archetypes, surface changes, rain, shortcuts) and said «Probemos en el juego», adding people and grandstands. Built in the lab, ahead of 1.3: a surface per stretch of road (`zones`), wet stages (`weather`), two stages to compare with the first (`split`, fast asphalt then technical gravel; `rain`, technical on wet asphalt), picked in 🔧, and crowds behind straw bales at tight bends plus grandstands at the start and finish. For 1.3: the generator can draw stages by archetype and with zones.

- **2026-11-27** · The owner removed the countdown for testing (three seconds on every change): `COUNTDOWN = false` in game.js; the clock already waits for the first throttle, and a resumed run now does too.

- **2026-11-27** · The owner: boosted, the car could not be steered, and a pad must be followed by a long straight. The grip now grows with the speed past the top, so a boosted car turns as at its top speed; a test holds every pad to 130 m of straight; the first stage's straights after its pads grew (S80 → S150, S100 → S170) and the hairpin fork lost its pad.

- **2026-11-27** · The owner's settings became the defaults (follow view, thumb travel 75 px, 40 m in view). For vertigo: top 42/50 m/s (was 30/36), accel 10, brake 20, side streaks. No dust on asphalt itself. New on the stages: forks (two on the first stage), ramps (fly, land unharmed) and boost pads. Design in core section 5.

- **2026-11-27** · The owner asked to turn harder: lock 32°/9° → 40°/14°, `overSteer` 2.2 → 3.0, grip gravel 9 → 11 and asphalt 14 → 16, `align` 2.5 → 3.0 (so a slide still ends in half a second). At 25 m/s the car now turns about two thirds faster.

- **2026-11-26** · The owner asked for faster reverse (now 14 m/s) and crashes: solid trees and rocks, 10 lives, an impact animation and progressive damage (dents, cracked glass, a dead headlight, a hanging bumper, smoke, a flame, a scorched shell). Design in core section 5; in 1.3 the stage generator must commit the solids with each stage.

- **2026-11-26** · Asked decision 7 (how often the stage changes), the owner answered «Mejoremos las gráficas primero»: 1.4's look goes before 1.3, decision 7 waits for 1.3. Penalties kept (+10 s, +5 s). The look: three settings with seeded scenery, a car with stripes and lights, tyre tracks, dust; the car is drawn over the props so a crown never hides it.

- **2026-11-26** · 1.2 done: the owner drove round 1 with the gauges, reverse and the closer camera and said «Me gusta. Continuemos con el desarrollo». The values in the code are the defaults.

- **2026-11-26** · Round 1, second change: the pressed thumb hid its own control (the owner). Each
  thumb's gauge is now drawn just above it, and the car shows the input (front wheels, brake lights).
  Then the owner asked for reverse (the brake held with the car stopped) and more zoom (50 m in view, was 70).

- **2026-11-26** · The owner drove 1.1 (exit met): the fixed map does not work, and auto-throttle is too
  restrictive (no braking while turning). Feel round 1: two new analogue schemes, wheel and pedal
  (default) and one finger; auto-throttle kept only to compare. Design changed in core.md section 6.

- **2026-11-25** · Phase 1.1 built: the grey-box drive in `/labs/drift/` (engine with 17 node tests,
  scheme A and keys, the 2D scene, the tuning panel, e2e). Design changed in core.md section 3: the
  plain grip model spun the car at full lock; the fix is described there and in `docs/games/drift.md`. The 1.0 PR had left this file's "Now" stale; fixed.

- **2026-11-25** · Phase 1.0 done: the owner named the game Derrape / Drift / Derrapagem 🏁 (id
  `drift`, so every code path in these docs now says `drift`), declared the clip's source unknown
  (no credit) and took the 8 to 10 gate stage. The plan folder stays `docs/rally/`.

- **2026-11-25** · The concept: the owner sent a clip of a low-poly 3D rally game and asked how hard
  it would be. Three paths written, path 1 recommended. No code.
