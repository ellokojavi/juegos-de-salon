# Bolita: how courses are generated

Every run is different. Each stage is built from a **seed**, its **world** and its **difficulty `d`**, which is the stage number from 1 to 5. Add `?seed=123` to the address to replay the same courses.

## Time, lives and points
- Each stage has a **par time**, computed from its own course: 2 s + route length ÷ 2.4 cells/s, to the second (minimum 8 s). The clock in the corner shows this stage's time over its par.
- A cleared stage is worth **20 points within par**, falling linearly to **10 at twice the par**.
- Each lost life costs **3 points**. Clear a stage **without losing a life** and you get a heart back (max 3).
- Lose all hearts and the run ends; the stages already cleared still count.
- There is no time limit: the clock is a stopwatch for the stage, shown with its par. Taking longer only lowers that stage's points.
- Maximum score: 5 × 20 = **100**. Ties are broken by total time.

## Run
- The five worlds come in a **random order** (`?order=fire,galaxy,…` fixes it).
- Stage *n* is always difficulty *n*, whichever world it is. Difficulty belongs to the stage, not to the world.

## Difficulty knobs
| Rule | Formula | d1 → d5 |
|---|---|---|
| Hazard budget | 5 + 3·(d − 1) points | 5 → 17 |
| Free bumpers along the road (on top of the budget) | 2 + d (Electricidad: 1; Agua: 1 + ⌊d/2⌋ leaves) | 3 → 7 |
| Speed of everything that moves (rocks, sparks, spinners, pistons, gate) | 0.7 + 0.08·d | 0.78× → 1.1× |
| Pull of black holes and whirlpools | 0.75 + 0.07·d of full strength | 0.82× → 1.1× |
| Beams (arcs and flame jets): share of time on | 0.35 + 0.04·d, max 0.55 | 39% → 55% |
| Beam cycle | 2.7 − 0.1·d s | 2.6 s → 2.2 s |
| Checkpoints | 1 at d ≤ 2 (near 48% of the way); 2 at d ≥ 3 (near 36% and 70%) | |

## Checkpoints: always unavoidable
- Every world's structure declares its **chokes**: short straight segments across the only way through (a gap between lanes, a pinch in the river, the gap in an energy barrier, the crossing between columns, a single lava bridge between rows).
- A choke only becomes a checkpoint if the path-finder **can't reach the goal with that segment closed off**. So you can never go around it.
- If a course doesn't get enough such checkpoints, it is rebuilt with the next seed.
- Losing a life puts you back just past the last checkpoint you crossed. You don't touch anything; you simply roll through it.

## Hazard catalogue: one bumper kind, at most two hard kinds per world
| World | Its one bumper | Hard things (cost · first d · max count) | From the structure |
|---|---|---|---|
| Cielo | balloons (2 + ⌈d/2⌉) | hole 1.5·d1·(1+⌊d/2⌋), blade 2·d1·(1+⌊d/2⌋) | wind gusts |
| Agua | leaves (1 + ⌊d/2⌋) | eddy 2·d1·(1+⌊d/2⌋), waterfall 1.5·d1·(1+⌊d/3⌋) | the current |
| Galaxia | moons (1 + ⌊d/2⌋) | pulsar 1.5·d2·(1, 2 from d4) | black holes (2 + ⌊d/2⌋) |
| Electricidad | 1 capacitor | spark 2.5·d1·(1, 2 at d5), arc 3·d2·(1, 2 from d4): 1, 2, 2, 3, 4 zappers at d1…d5 | the circuit, chips |
| Volcán | basalt studs (1 + ⌊d/2⌋) | none bought | lava bridges, the volcano (from d2) |

No meteors/asteroids, drifting lily pads or boulders, pistons, spinners or turning gates any more.

## Signature mechanics (one per world)
| World | Its own mechanic |
|---|---|
| Cielo (was Neón) | **Wind gusts** across the lanes (with you or against you), **red-and-white blades** swinging from the walls (full-reach ones from d3), holes in the clouds, **balloons** as bumpers |
| Agua | **The current** (upstream/downstream), **bank eddies** that swallow you, **waterfalls** that throw you back upstream; its only bumpers are **floating leaves** (soft bounce) |
| Galaxia | **Black holes** feeding on spirals of matter, **curving energy barriers** with light running along them, and **pulsars** (from d2) whose rings of force shove you as they pass |
| Electricidad | A **generated circuit board** (divider styles, chips), arcs and **crackling sparks** that leap to nearby walls |
| Volcán | **Lava bridges**, rolling boulders, pistons (the volcano that threw bombs was removed) |

## Signature hazards
- **Blade** (Cielo): a hot neon tube on a hub in the wall that swings ±77° across the lane. Touch it and it zaps you. Its reach leaves a strip about 1 cell wide along the far wall, so hugging that wall is always safe; otherwise time it. A faint dashed arc shows its reach.
- **Bank eddy** (Agua): a whirlpool sitting against one bank of the narrow river. It pulls you in and its eye swallows you; squeeze past along the other bank.
- **Pulsar** (Galaxia, d2+, one guaranteed): sits beside the way; every beat (2.4 − 0.12·d s) a ring of force rolls out to 2.3 cells and pushes you outward as it passes. Its core is solid.
- From d3, some neon blades reach **right across** the lane (40% at d3, 50% at d4, 60% at d5; they swing slower): there is no wall to hug, so you have to time them.
- **Waterfall** (Agua): the bank breaks and the river pours over into the stretch of river right beside it that you **already passed**. Roll onto the lip and you tumble over the bank and land down there (no life lost, time lost). It's only placed where such an earlier stretch is directly across the bank (at least 4 cells back along the way). The water pulls you toward it (see Look).
- Every Neón and Agua course gets its signature hazards from stage 1. Anything the safe way has to squeeze past (blades, eddies, waterfalls) is only kept if the path-finder still gets through.
- Drifting things (lily pads, boulders, asteroids) are capped at 1 + ⌈d/2⌉ per course. Bumpers keep 0.7 cells off holes and whirlpools.

## Placement and fairness rules
1. **Slots:** hazards sit on slots every 1.0 cell along the way, in **two passes**. In the first pass no two hazards take neighbouring slots. In the second pass they may, but a **hard** hazard (cost ≥ 2) is never next to another hard one. The first 1.6 cells, the last 1.4 cells and ±0.8 cells around each checkpoint stay clear.
2. **Lethal things** (sparks, beams):
   - only on **straight stretches**: the way turns less than about 20° within 1 cell either side
   - at least 2.8 cells from the start
   - their line across must not touch the way anywhere else
   - they **cross** the way and never run along it
   - beams are always off at least ~1 s per cycle
3. **Bumpers sit out on the road, not against the walls:**
   - anywhere across the way, as long as **one side keeps a gap of at least 0.95 cells** (more than a marble and a half)
   - at least 0.9 cells apart
   - never within 1.2 cells of lava
   - if bumpers ever close the way, the newest ones are removed until it is open again
4. **Holes, black holes and whirlpools** keep clear of **every** point of the way (0.55 cells past the rim or core).
5. **Pistons** always leave one side open. **Spinners** are only placed where they fit inside the corridor.
6. **Solvability:** after building, an A* path-finder on a quarter-cell grid must get from start to goal past everything that doesn't move, with room for the ball, preferring the middle of the way. If it can't, the seed is bumped and the stage is rebuilt.

## Structure per world (what d changes)
| World | Structure |
|---|---|
| Cielo | **always 4 lanes**; a **gust** in every lane from d2 (2.2–3.8 cells long, strength 2.2 + 0.5·d, random direction); (harder means more in them, never a longer way); gap between lanes 2.1 − 0.1·d; chicane stubs in each lane, always leaving ≥ 1.25 cells |
| Agua | a **spiral** river: lanes 2 cells apart with rounded corners, winding in toward the middle (or out of it, 40%), mirrored at random. d1–2: 1¼ turns; d3+: the full spiral to the centre. Half-width 0.88 − 0.02·d, pinching 30% at each checkpoint; 4–6 stretches alternate upstream / downstream; current 2.2 + 0.4·d |
| Galaxia | an open field cut by **curving** energy barriers (a slow wave, amplitude 0.28–0.4 cells; 2 barriers, 3 from d3), each with one gap, alternating left/right; 2 + ⌊d/2⌋ black holes between the gaps (pull 6.5 × the difficulty factor; no extra black holes from the budget); ⌊d/2⌋ asteroids drift across |
| Electricidad | a **circuit board laid out fresh each time**: 3 columns (4 columns half the time from d3); each divider gets its own style: **sawtooth**, **castellated** (square wave), a **trace that jogs at 45°**, or a **comb of pins**. The way crosses at alternate ends (gap 1.75 − 0.05·d). **IC chips** sit against the frame or a divider, always leaving ≥ 1.3 cells, more with d. Mirrored at random |
| Volcán | a winding way carved through a 4×6 grid of lava pools; **every row moves sideways**; 1–2 extra open cells give loops; lava eats 0.05 + 0.06·(d − 1) cells into each side of every bridge |

## Instructions per world
- Each stage starts with its world's name and a one-line explanation of its mechanics (also on stage 1, right after the controls hint).
- The start card has a collapsible "Los 5 mundos" list with all five explanations.

## Volcano (Volcán, d2+)
A basalt cone in the biggest lava pool, with gullies, lava rivulets down its flanks, a bubbling crater and a smoke plume. Every 4.2 s (3.0 s at d5) the crater glows and spits sparks, then it erupts and lobs a tumbling bomb at where you're heading. Its shadow grows for 1.35 s; on impact anything within 0.45 cells burns, and the splash keeps burning for 2.4 s while it crusts over.

## Balance (tuned with simulated players)
All the strength knobs live in one `TUNE` table at the top of the course code. They were tuned with two simulated players over 160+ full games:
- **Medium:** slow reactions (0.3 s), shaky hands, half-corrects gravity and current, looks 0.6 s ahead, sometimes just goes for it, and freezes half the time under a volcano bomb.
- **Expert:** quick (0.1 s), steady, near-full correction, looks 1 s ahead and reads the timing of moving hazards.

| Knob | Value | Knob | Value |
|---|---|---|---|
| black-hole pull | 11 × (0.85 + 0.05·d), core +0.1 | pulsar push | 18 |
| eddy pull | 8.3 × (0.85 + 0.05·d) | river current | ×1.1 |
| lava into bridges | 0.18 + 0.10·(d−1) | volcano | every 5.0 − 0.4·(d−2) s, aims *near* where you'll be (see below), blast 0.45, burns 2.2 s, 2 bombs at d5 |
| full-reach blades | 8%·d (from d3) | blade speed | ×0.95 |
| hole radius | 0.42 | wind | ×1.2 |
| arcs on-time | ×0.76 | spark speed | ×0.85 |

Gravity and pull hazards keep about the same strength at every stage; harder stages get more of them, not stronger ones (that used to make d4–5 walls).

Result (50 games each, after the volcano-aim and asteroid changes): medium clears **3.56** stages, expert **4.74**. Earlier run: medium **3.45**, expert **4.58**. Medium loses 0.4–0.9 lives per world it plays (Cielo 0.43, Agua 0.69, Galaxia 0.39, Electricidad 0.86, Volcán 0.63; a second run gave 0.49–0.62). The expert only loses lives to blades (Cielo) and arcs/sparks (Electricidad).

## Volcano aim
Each bomb lands somewhere you are *about* to be, never always dead on you:
- 50%: a spot on the way ahead of you, 1.5–3.5 cells on.
- 33%: where your speed is taking you, 0.4–1.3 s from now.
- 17%: close beside you, 0.6–1.2 cells off.
Every target also gets 0.3–0.8 cells of random scatter.

## Look
- **Water** is drawn in three layers: a pebble riverbed and a net of light on the bottom (both slide as you tilt); fine streaks that follow the real current, bend round the whirlpools and fan into the waterfalls; and on top, wavelets that glint when they face the light, plus a soft sheen.
- **Whirlpools** have foam arms winding in, flecks riding them, and a highlight on the side of the funnel facing the light.
- **Waterfalls** are a tall veil with no hard lip: the river pales and its streaks converge from about two cells around, the rock shows through as the water bends over, and a see-through sheet leans out over the lane below. Its foot slides with the tilt. Below: a dark undercut, foam, rings, spray with shadows, mist, foam carried downstream, and a faint rainbow when the light is right. The water drags you toward the lip from 1.3 cells away, harder the closer you are (strength 4.5 at the lip, against a full tilt of about 10); roll onto it and you drop to the earlier stretch.
- **Lava pools** have ragged, bulging outlines that creep a little past the deadly area, a wide soft heat glow, and dark crust blobs drifting along the shore instead of a hard rim.
- **Checkpoint lines** use each world's palette: pale sky blue, aqua, lilac, electric cyan, ember orange. They brighten (same colour) once crossed.
- **Galaxia's bumpers** are drifting asteroids again (1 + ⌊d/2⌋).


## Frame cost (performance pass)

Measured by running the game's own step + draw 160 times and forcing the canvas to finish each frame (CPU ms per frame, headless Chrome, software rendering, 390×780 at 2×; 16.6 ms is the 60 fps budget). No real phone was measured.

| World | Before | After |
|---|---|---|
| Sky | ~32 | 6–7 |
| Water | 31–35 | 13–19 (more with two waterfalls and two whirlpools on screen) |
| Galaxy | 17–19 | 11–14 |
| Electric | 13–16 | 5–7 |
| Volcano | 22–28 | 12–15 |

Rules that came out of it (they hold for any new effect):
- No `lighter` blending over large areas: lay light on with normal blending and bake its strength into the sprite or tile.
- No curved clips around big fills: use `stepClip` (plain rectangles on whole pixels) or no clip.
- Full-screen layers slide by whole screen pixels and are never scaled; big glows are drawn once at screen size.
- Moving streaks are drawn straight on the board from each drop's remembered points; no separate fading layer.
- Laying out a stage: walls are sorted into one-cell bins (`wallRoom`), so a river stage builds in ~0.1 s instead of ~1 s.
