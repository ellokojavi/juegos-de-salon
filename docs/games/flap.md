# 🐤 Aletazo (La Copa game, launched by flag; the lab prototype stays until the cleanup)

A one-tap flyer for one player: every tap gives the bird a wing flap ("aletazo") upwards, gravity
pulls it down, and the course scrolls from right to left. The bird flies through neon hoops and the
openings of walls, and it gets harder every 5 gates. Its name is Aletazo in Spanish, **Flap** in English
(its folder's name) and **Bate-Asa** in Portuguese. An original game in a well-known genre: the bird,
the hoops, the walls and the look are our own, drawn in the app's neon night. **Inspired by
[Flappy Bird](https://en.wikipedia.org/wiki/Flappy_Bird), by Dong Nguyen (.GEARS, 2013)**, and it says
so on the cover and in the lab (the link goes to Wikipedia in the player's language: the game has no
official page since it was pulled in 2014). It was built with a
contributor, round by round on a playable prototype, before entering the lab.

## Summary

- **Where:** `https://juegosdesalon.cl/labs/flap/`, in the lab (each person's key, D-281, D-284). Id
  `aletazo` in the usage signal.
- **For whom:** one player. In Spanish, English and Portuguese (C-3), with the language toggle on the
  cover.
- **Status:** active project, to try with friends.

## Rules

One player. Every tap gives the bird a flap upwards; gravity pulls it down. A hoop is +1, +2 through its
middle (within 30 % of its radius); a bare gap in a wall is +1. Crashing into a hoop's end, a wall, a spike
or the ground, or skipping a hoop, costs one of the 3 lives (1 in La Copa's trial). A new level every 5
gates. The player-facing text is `juego.como`, `puntaje` and `desempate` in `public/cup/games/flap/texts.js`.

## Cover

A glass card over a demo that flies itself (the engine's autopilot: the game's own gravity and flaps, like a player, planning each flap so it never touches a rim): the title with a 🐤 that sways,
the tagline («Un toque, un aletazo.»), the credit («Inspirado en Flappy Bird, de Dong Nguyen.», with the link), three steps, the
language toggle, a yellow «🐤 Jugar» (like Shinobi's and Babel's Empezar) and the best score on this phone, in C-5's order
(language toggle before the button). The owner's changes after trying it on the PR preview:

- **The demo flies above the card** when there is room (390 px and taller): `demoBand()` in `game.js`
  measures the free strip from the card's top, and the engine keeps the demo's hoops in it, at 70 % of their
  size, so the bird and the hoop show whole instead of half behind the card. Where the strip is too thin
  (a short phone), the demo is only a background.
- **On a short screen** (`max-height: 640px`) the steps fold under «Cómo se juega ▾», after Jugar, so Jugar
  stays in the first screen (U-39); opened, they unfold below it and the card scrolls inside, so the
  language toggle never leaves the view.
- **The title's last O is not clipped**: the slanted font goes past `.rainbow`'s box, fixed as in Shinobi.

The steps:

1. 👆 Toca para subir un poco.
2. ⭕ Pasa por aros y huecos. Al medio vale doble.
3. ❤️ 3 vidas. Si chocas o te saltas un aro, pierdes una.

Under the stage, below the fold, the game's ranking (the `aletazo` table, Semana · Siempre · Amigos, with signing in, D-212, D-249), like every game played alone; the stage keeps the whole first screen. Then «💬 Dejar un comentario» opens the lab's comment form (D-265).

## How it is played

- **The start:** «🐤 Jugar» (and «Jugar otra vez») runs the shared 3, 2, 1… ¡A jugar! (`cuentaRegresiva`,
  D-102, D-105) over the bird gliding on its own (wings still, no hoops to cross: the engine's `'glide'` mode), blurred and darkened; on «¡A jugar!» the blur fades as the
  overlay leaves and the game starts from the bird where it is, easing to the middle and hovering level,
  with «👆 Toca para aletear» pulsing under it until the first tap. Neither the countdown nor the wait is
  play time: the clock starts with the first tap.
- **The tap:** anywhere on the stage (or the space bar, or ↑). The first one starts the game, gravity and
  the clock, and the hint fades out.
- **Gates:** a **hoop** (+1, or **+2 through its middle**: within 30 % of its radius); a **hoop set in
  a wall**, the only way through; or a **bare gap** in a wall, its lips lit cyan (+1). Each hoop is
  drawn in two halves, the back one before the bird and the front one after it, so the bird flies
  through.
- **Lives:** 3 ❤️. Hitting a hoop's end, a wall, a spike or the ground costs one, and so does skipping a
  hoop. After a hit the bird blinks for 1.3 s and can't be hurt again. The ground bounces it back up.
- **The HUD:** the hearts, the score and the level in words («Nivel 2», never abbreviated). From Jugar to the
  result the page is marked as in play (`body.jugando`, like Stack and Shinobi), so the testers' «T» tab hides.
- **Levels:** a new one every 5 gates, announced in big letters («Nivel 3»). Each of the first ten is
  10 % of the starting speed faster; after that it keeps climbing, slower, and never stops. Hoops get
  smaller and further apart in height; from 6 gates in some move up and down (a faint dotted track
  shows it); from level 2 walls appear (announced once: «¡Muros! Pasa por el hueco»), more of them and
  with narrower bare gaps as it goes; from 12 gates in, spinning spikes sit between two hoops, off the
  straight line, never next to a wall. The first three hoops are a warm-up, almost level.
- **Dead center** celebrates like Shinobi's flag, softer (the owner's request): two rings open from the
  hoop, a faint gold flash, a short spray of sparks, the bird lights up for a moment and a «+2» pops up.
  A plain pass shows a «+1».
- **The end:** the bird falls with ✕ eyes, and a card shows the stamp («🏆 ¡Nuevo récord!» or «¡Se
  acabó!»), the score, a line about how it went (under 6: «Recién saliendo del nido 🐣»; 6–15: «Ya le
  estás agarrando el vuelo»; 16–30: «¡Vuelas bonito! ✨»; 31–50: «¡Pájaro de altura! 🦅»; 51 and up:
  «¡Dueño del cielo! 👑»), «Tu mejor: n» when it is not a record, «Jugar otra vez» and back to the lab. Under the stage, the notice that saves the run to the ranking (or «¿Quieres que esta partida cuente?» without a player) and the table; a tester's start never counts.
  The owner chose this simple ending over one with a summary of the game.
- **Paused:** leaving the tab mid-game (a call, another app) pauses it; a tap brings it back.

## Modes

Only one player, in three places that play the same screen: its page `/flap/`, a La Copa day and
Uno al día (`?today`). No rooms, no AI.

## Flow

Waiting room (title, credit, the cover's demo, Empezar) → La Copa's countdown → the bird hovers with
«👆 Toca para aletear» → the flight → «¡Se acabó!», the verdict line and «Continuar» → La Copa's result
(score, breakdown, share card, ranking). Hiding the page pauses; a reload mid-flight ends it with its points.

## Message protocol

None: a one-player game sends nothing between phones. The result goes through La Copa's own code.

## Files

`public/cup/games/flap/`: `engine.js` (physics, course, rules, La Copa's interface), `scene.js` (the
drawing), `ui.js` (the screen; hook `window.__aletazo`), `texts.js`, `style.css`, `engine.test.mjs`.
The lab prototype: `public/labs/flap/`. End to end: `tools/e2e/flap/game.mjs`, `tools/e2e/flap/lab.mjs`.

## How it works

- `engine.js`: the world is measured in stage heights (1 = the stage's height, `W` its width over its
  height). `newGame({ W, random })`, `flap(g)` and `step(g, dt)` (a fixed 1/120 s step) move the game
  and leave what happened in `g.events` (`flap`, `pass`, `perfect`, `hit`, `level`, `walls`, `over`,
  `end`) for the page to play. `spawn(g)` lays the next gate; `crossing(gate, y)` says what crossing
  it is worth; `autopilot(g)` flies the cover's demo. Difficulty: `levelOf(passed)`, `diff(level)`
  (0 up, never 1), `targetSpeed(level, W)`, and `fit(W)`, which slows and tightens the world on a
  narrow portrait stage so the gates come at the same pace. `rng(seed)` gives tests a repeatable course.
- `scene.js`: the drawing on one transparent canvas over the app's night: stars and two strips of city
  in parallax, the ground, walls, hoop halves, spikes, the bird, sparks, rings and points. No
  `shadowBlur` (it cost ~50 ms a frame on a 3× phone): the glow is a wide see-through stroke, and the
  bird and the spike are sprites drawn once. The canvas is at most 2×.
- `game.js`: the screens, the input, a few synth tones (opened on the tap on Play, silenced by the app's
  🔊), the texts in `LOCALES = { es, en, pt }`, the best score in `localStorage`
  (`juegos-de-salon:aletazo-best`) and the usage signal (`trackStart` on the first flap, `trackFinish`
  with points, gates, dead centers, walls, level and seconds).
- **The hook:** `window.__aletazo` (`g`, the game in play, and `start()`), for the end-to-end script.

## Tests

`public/labs/flap/engine.test.mjs` (the physics, scoring by crossing height, hits by rim, wall, ground
and skipped hoop, the shield, the end after 3 lives, levels every 5, the course: no walls in level 1,
no spike beside a wall, openings always within reach, and the cover's demo never charging anything).
End to end: `tools/e2e/flap/lab.mjs`.

## The sky

The city goes through the day as the score climbs: a game starts by day (blue sky, sun, white clouds, flocks
of far birds), turns to afternoon at 20 points (a low orange sun, pink clouds, windows and street lamps
lighting up) and to night at 40 (the moon, stars, lit windows, the antennas' blinking tips), then day
again at 60, and so on (`SKY_EVERY` and `skyOf` in `engine.js`). The change eases over about two
seconds. The cover's demo is always night; the countdown is the coming game's day.
The ground is a street: a tiled sidewalk, a neon curb and flecked asphalt with its lane, lit by the lamps
from the afternoon on (`ground()` in `scene.js`). In the afternoon it fades into the sea (`sea()`): a seawall,
waves and the low sun glittering on the water; the night brings the street back.

## Its type

A skill game: when it leaves the lab and enters the catalog (`games.js`), it goes with `tipos: ['skill']`
(🎯 Pulso on the home page's filters), like Shinobi and Babel.


## Tester's start

With a lab key, the tester ribbon (the «T» on the right edge) offers «🐤 Empezar en nivel»: the level and
points the next game starts from (`newGame({ level, score })`), then the usual countdown. It is for trying
the levels and the times of day without playing up to them; a test game keeps no best and sends no stats.
Its texts are only for testers, in Spanish, like Babel's «Simular final».

## Migrated to the design system (D-533, #1193)

The stylesheet dropped its copy of the shell's `.link-btn` («Cómo se juega ▾» is now `.tarjeta .como` over the shell's button) and writes the rest (the stage, the HUD, the cover and result cards, the countdown, the pause) on the tokens; the page's one-screen layout is written on `#app`. The design lint reports zero on it beyond one escape: the cover's 🐤 and the short-phone title at 2.2 rem, sized together so 🐤 Jugar stays in view at 320×568 (U-39); the stage's sky and the hint's drop are the game's own tokens (`--aletazo-cielo`, `--aletazo-sombra`). What the player may notice: the pause title takes `.display--lg` (it was 2.6 rem), the steps and the best score are 0.9 rem (were 0.95, so each step fits one line at 320 px), the stamp is 1.4 rem (was 1.3), the lives, the notice, the hint and the verdict move up to the nearer text step, the short phone's 🐤 is 1.6 rem (was 1.7).

## Out of the lab (2026-11-08, D-517's way)

Aletazo leaves the lab as Shinobi and Babel did: a La Copa game in `public/cup/games/flap/` that serves its
standalone page **`/flap/`** (generated by `og.mjs cards`, with its link card `assets/og/aletazo.jpg`), La Copa
(`copa.pozo` 16) and Uno al día (`orden` 21, from 2026-11-10: it joins the deck shuffled on 2026-11-28, its
first day 2026-12-09, since no day of the deck in play changes). The id stays `aletazo` (its usage signal
and ranking table). It is in the three languages.

- **Launched by a flag** (`lanza: 'aletazo'`, D-517): hidden from the home page, the search, the filters,
  /records/ and a new cup's pool until `flags/aletazo` is *all*. The `launch` workflow switches it, and the
  splash `aletazo-ya`, at 2026-11-09T08:00:00Z (00:00 Pacific, D-529), dispatched by a scheduled task. Its
  card in /labs/ (`#seccion-aletazo`) keeps the switch and points to `/flap/`, with the prototype as a link.
- **The cup's screen** (`ui.js`): the waiting room shows the title with the swaying 🐤, the line «Un toque,
  un aletazo.» and the credit to Flappy Bird, over the cover's demo (the autopilot flying by night). After
  the cup's countdown the bird hovers with «👆 Toca para aletear» until the first tap; the HUD, levels,
  walls, times of day, dead centers and synth tones are the lab's. The end shows «¡Se acabó!», the verdict
  line and «Continuar», which hands the result to the cup (ranking, share card ⭕/🎯, breakdown).
- **Fair:** the course comes from `generateDay(code, day)`'s seed: everyone flies the same gates (their
  heights and sizes; the spacing follows the screen's width, `fit`). The trial flies with one life.
- **Score:** the game's points with no cap (a gate 1, dead center 2); Uno al día maps them with
  `100 × (1 − e^(−points/30))` (10 → 28, 30 → 63, 60 → 86). Ties: less flying time wins.
- **A reload mid-game** ends that game with the points it had (state saved after each gate), as Babel.
- **Names in English** (D-316): the engine and screen export `generateDay`, `dayScore`, `cover`, `title`,
  `mount`, `result`, `breakdown`; `cup/games/index.js` maps them to La Copa's Spanish interface.
- **Tests:** `public/cup/games/flap/engine.test.mjs` (the lab's, plus the cup's interface) and
  `tools/e2e/flap/game.mjs` (waiting room, credit, flight, pause, end, result, 320 px).
- **The splash** `aletazo-ya` (`marketing/splash/campaigns/aletazo-ya/`): `hero`, its clip the cover's demo,
  `requires: ['aletazo']`.

## Exceptions to the canons

- No `game.json` and no `createSessionStore` (as Shinobi and Babel): built in `cup/games/`, its attempt
  kept by La Copa's shared screen (`docs/manifest-debt.json`, `docs/memory-debt.json`).
