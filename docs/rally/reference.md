# The reference clip

The owner's clip is `VID-20261125-WA0054.mp4`: 35 seconds, 480×512, no sound, a screen recording of a
short-video app (its like, comment and share icons sit on the right edge). It is 7.9 MB, so it is
**not in the repo** (D-494) and neither are frames of it: they are someone else's game. The owner has
the file. This page is what it shows, so nobody needs it to build.

**The game in the clip is not identified.** No title, logo or watermark appears. Before a cover
credits an inspiration (see "Credit"), ask the owner where the clip came from.

## What it shows

The clip cuts between three runs. Two kinds of shot alternate: the **driving camera** (with the HUD)
and **replay cameras** (no HUD).

| Clip time | Shot | What is on screen |
|---|---|---|
| 0–3 s | Driving | A dark blue boxy hatchback on a pale gravel road, daylight, green fields, wooden fences, low-poly trees. HUD clock 0:23 → 0:25, «GATE 2 OF 20». Four dark tyre tracks trail behind the car; dust puffs at the rear wheels. |
| 3–7 s | Replay | The same car from lower and closer, HUD gone. It leans in the corner and one wheel lifts. A stone wall lines the road. A white gate (two posts and a crossbar) spans the road ahead. |
| 7–11 s | Replay, high | An orange sunset, a burnt forest of bare black trunks. The camera is high and far, almost a drone: the car is small, drifting through an S-bend, raising orange dust. Yellow chevron signs mark the corner. A gate at the exit. |
| 11–17 s | Driving | Same burnt setting from behind the car. Clock 4:17 → 4:22 with «(+30 s)» beside it, «GATE 11 OF 20», and for a moment under the map «GATE 10 4:15.750», the split for the gate just passed. |
| 17–21 s | Replay, trackside | A fixed camera beside the road watches the car come through a gate and pass. |
| 21–25 s | Driving | A red coupé on an asphalt road with painted centre dashes, the sun low and dead ahead, wooden guard rails, houses and pines. Clock 0:28 → 0:31, «GATE 3 OF 20». |
| 25–28 s | Replay, high | The asphalt road from far above, crossing a wide plain; the car is a dot. |
| 28–35 s | Driving | The red car again, clock 0:43 → 0:49, «GATE 5 OF 20» then 6, with the split «GATE 5 0:47.750». |

## What the game is, read from that

- **A time trial.** One car, no rivals on the road. The clock runs up, in minutes, seconds and
  thousandths.
- **A stage of 20 gates.** A gate is two posts and a crossbar over the road. The HUD counts the gate
  being driven to. Passing one flashes its split time. Roughly 10 seconds from gate to gate, so a
  whole stage is about three and a half minutes.
- **Time penalties.** «(+30 s)» stays beside the clock once earned. The clip does not show what
  earned it: a missed gate or a reset to the road are the two usual causes. This is our guess.
- **A co-driver's map.** Under the clock, a small panel draws the shape of the road just ahead as a
  single line: straight, a bend left, a hairpin. It changes as the car advances. It does the job of
  pace notes without a word of text.
- **Loose-surface handling.** The car slides: its nose points into the corner while it travels
  wide, the rear steps out, and it leaves tyre tracks and dust. On asphalt it slides less.
- **The driving camera** sits behind and above the car, looks ahead of it, and follows turns with a
  delay, so the car's angle in a slide is visible.
- **Three settings**, each a palette and a set of props more than a different world: a daytime
  meadow on gravel, a burnt forest at sunset on dark gravel, a plain at dusk on asphalt.
- **Two cars**, alike in size: a blue hatchback and a red coupé. Nothing shows they drive
  differently.
- **Flat-shaded low-poly art**: no textures to speak of, plain coloured faces, fog toward the
  horizon, a big soft sun, long shadows from trees and fences across the road.
- **Controls are not visible.** No touch buttons, no steering wheel on screen. It is most likely
  played with a keyboard or a gamepad.

## What we take, and from which path

| From the clip | Path 1 | Path 2 | Path 3 |
|---|---|---|---|
| Time trial, gates, splits, penalties | ✓ | ✓ | ✓ |
| The co-driver's map | ✓ | ✓ | ✓ |
| Sliding car, tyre tracks, dust | ✓ (from above) | ✓ | ✓ |
| Settings as palettes | ✓ (colours and props) | one | three |
| Chase camera, low-poly world, fog, sun | | ✓ | ✓ |
| Long shadows | | baked, cheap | real |
| Body lean, a wheel lifting | | lean only | ✓ |
| Replay cameras | | | ✓ |
| A second car | | | ✓ |

## What we change on purpose

- **A phone held upright, one or two thumbs.** The clip's game does not show how it is played on a
  phone. Ours is designed for 320 px wide first (C-8); this is the hardest design problem in the
  whole project and it is solved in path 1 ([core.md](core.md), "Input").
- **A shorter stage.** Three and a half minutes is long for a phone game played standing up, and a
  mistake at minute three hurts. Starting value: 8 to 10 gates, 60 to 90 seconds. The owner decides.
- **A calm camera.** The owner gets dizzy with strong camera moves (a standing preference, recorded
  for the promo clips). No shake, no speed zoom, damped rotation, and still with reduced motion.
- **Our own look.** The page around the stage is the site's (tokens, Bangers, the neon night, C-1).
  The world inside the canvas may have its own colours, declared once.

## Credit

The site credits what inspires a game on its cover, with a link, and never on the result screen
(Agentes credits Codenames, Aletazo credits Flappy Bird: see `docs/games/flap.md`). Once the owner
names the clip's game, the cover says «Inspirado en …» with its link, in three languages. If it stays
unknown, the game is described as what it is, an original rally time trial, and credits nothing.
**Answered 2026-11-25: unknown.** The cover credits nothing.
