# Rally: where it stands

The one page a session reads to know what to do next, and the one it updates in every PR: tick the
phase, answer the decisions that were answered, add a line to the log. Keep it short; the design is
in the other files.

## Now

- **Path**: 1 · Top-down ([path-1-top-down.md](path-1-top-down.md))
- **Next phase**: 1.1 · A grey-box drive, in the lab: built, waiting for the owner to drive it on a
  phone (the last exit line). Then 1.2, the feel round, on the same preview.
- **Code**: `public/labs/drift/` (spec: [docs/games/drift.md](../games/drift.md)), from the `drift-greybox` PR.
- **Name**: Derrape / Drift / Derrapagem 🏁, id `drift` (decision 1)

## Phases

| Phase | What | Status | PR |
|---|---|---|---|
| 1.0 | Concept sign-off | done | [#1926](https://github.com/ellokojavi/juegos-de-salon/pull/1926) |
| 1.1 | Grey-box drive in the lab | in progress: built, the owner's drive pending | `drift-greybox` |
| 1.2 | The feel round | not started | |
| 1.3 | Stages | not started | |
| 1.4 | The look and the sound | not started | |
| 1.5 | Ghost, ranking, share, memory | not started | |
| 1.6 | The lab verdict | not started | |
| 2.0 | Renderer spike and decision | waits for 1.6 and the owner's yes | |
| 2.1 | The second scene, grey | | |
| 2.2 | The camera round | | |
| 2.3 | The world | | |
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
| 4 | The view: the world turns so the car points up, or the map stays fixed. | in 1.2, by playing both | The world turns, damped. | |
| 5 | Controls: two halves with auto-throttle, or something else. | in 1.2, by playing | Two halves, auto-throttle. | |
| 6 | Penalties: a missed gate and a reset. | in 1.3 | +10 s and +5 s. | |
| 7 | How often the stage changes. | before 1.3 | One stage a week, the same for everyone. | |
| 8 | Does the game record scores in Rankings? | before 1.5 | Yes: the table `drift`, score 0 to 100 against par, then time. | |
| 9 | The bar for the lab verdict. | before 1.6 | Half or more of the testers who finish a run start a second one in the same visit, over at least 10 testers. | |
| 10 | After 1.6: launch, iterate, park, or path 2. | at 1.6 | Depends on the number. | |
| 11 | The renderer for path 2: our own small WebGL renderer, or Three.js vendored. | at 2.0, with measurements | Our own. | |
| 12 | After 2.5: is 3D the default, an option, or parked. | at 2.5 | Depends on the number. | |

## Later (ideas that came up and are not in the current phase)

Nothing yet. A feature that tempts a phase beyond its exit list is written here instead of built.

## Log

Newest first. One or two lines: the date (Pacific), what happened, what changed in the design.

- **2026-11-25** · Phase 1.1 built: the grey-box drive in `/labs/drift/` (engine with 17 node tests,
  scheme A and keys, the 2D scene, the tuning panel, e2e). Design changed in core.md section 3: the
  plain grip model spun the car at full lock, so the yaw is now capped at `overSteer` × what the grip
  holds and the rear pulls the nose back (`align`). The 1.0 PR had left this file's "Now" stale; fixed.

- **2026-11-25** · Phase 1.0 done: the owner named the game Derrape / Drift / Derrapagem 🏁 (id
  `drift`, so every code path in these docs now says `drift`), declared the clip's source unknown
  (no credit) and took the 8 to 10 gate stage. The plan folder stays `docs/rally/`.

- **2026-11-25** · The concept: the owner sent a clip of a low-poly 3D rally game and asked how hard
  it would be. Three paths written, path 1 recommended. No code.
