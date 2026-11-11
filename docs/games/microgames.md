# ⚡ ¡Al toque! (lab prototype, in Games being tried)

Microgames in the style of WarioWare (Nintendo): one quick order, 3 to 5 seconds to do it, and the next
one comes right after. The owner designed it game by game with Claude on a claude.ai artifact (a review
page with ✅ / ❌ per game), kept 28 of about 40 (¡Encesta! and ¡Patea! left later), tuned each one, and asked for runs of 10 different games
in a row in the lab. «¡Al toque!» means "right away" (the owner first called it «¡Al tiro!», Chilean for the same).

## Summary

- **Where:** `https://juegosdesalon.cl/labs/microgames/`, in the lab (each person's key, D-281, D-284).
  Id `microgames` in the usage signal; the best run is `microgames:best-points` (points) and `microgames:best` (stars, out of 30). Not in `games.js`: lab only.
- **For whom:** one player, on a phone held upright.
- **Language:** Spanish, English and Portuguese (C-3), with the toggle on the cover. The Spanish is written
  where each text is used, inside `t('…')`; `rules.js` has its English and Portuguese keyed by that
  Spanish, and `rules.test.mjs` fails on a `t()` with no translation or with different `{x}`.
- **Status:** active project. What would prove it: players who start a second run.

## Files

| File | What |
|---|---|
| `public/labs/microgames/engine.js` | The pure rules: which games a run plays (seeded or not), the speed, the points and the 0–100 score |
| `public/labs/microgames/engine.test.mjs` | Its tests |
| `public/labs/microgames/rules.js` | The texts in English and Portuguese, keyed by the Spanish |
| `public/labs/microgames/rules.test.mjs` | Every `t()` has both, with the same `{x}` |
| `public/labs/microgames/game.js` | The shared stage helpers, the 29 microgames (`GAMES`), their names (`META`), the three types (`KINDS`), the cover and the run |
| `public/labs/microgames/style.css` | The stage and every microgame's look (moved from the artifact) |
| `public/labs/microgames/index.html` | The page: the stage, the HUD, the run's marks and the footer |
| `tools/e2e/microgames/lab.mjs` | End to end |

`engine.js` holds the run's rules (order, speed, scoring); each microgame still draws and judges itself
in `game.js`.

## How a run goes

1. **Cover:** the stage fills the screen under the top bar (like the lab's other games). ⚡ and the name, one line, the three ways to play laid out at once (Toca, Arrastra, Desliza, each a card in its color with a finger doing its gesture), **Jugar**, the best run and the credit to WarioWare; under the stage,
   **Cómo se juega** folded (C-8, D-550): the goal, the three ways to play each with its finger doing the
   gesture (**Toca** turquoise, **Arrastra** orange, **Desliza** purple) and the scoring in one sentence;
   the site footer last. Jugar goes straight into the run (the separate how-to screen is gone).
2. **The run:** 10 different microgames drawn from the 29. Each starts with its intro card (the gesture
   of its type on top, the stage framed in the type's color, the name and a hint); the frame comes off
   when the game starts. Every three games the run speeds up by 10 % (`sp`). The HUD shows `n / 10`,
   the stars so far and a mark per game (red 0, orange 1, turquoise 2, yellow 3 stars).
3. **The end** (C-19): a cheer, the points, the stars and the best, **Otra corrida**, the way back to the
   lab from `fin.js`, then each game's icon with its stars and points (🔥 on a streak). Sound and confetti
   on a good run (C-4).

## Scoring (`engine.js`)

- **A game:** 0 to 3 stars, judged by the microgame. Its points are 10 per star times the speed it was
  played at (×1.0 the first three, ×1.1, ×1.2, ×1.3 the last): a ★★★ at the end is worth 39.
- **Streak:** each game with ★★ or more right after another one adds +5 (🔥).
- **A run:** the sum, shown in the HUD as it goes; a perfect run is 381.
- **Uno al día and La Copa** compare `score100`: the stars weighed by speed, 0 to 100 as every other game
  on the platform (D-412), without the streak so a miss costs the same wherever it falls. A tie goes to
  the faster run (its seconds are in the `trackFinish` detail).

## Shared runs, the run of the day and pauses

Every run has a code (5 letters, as a cup's): the link's `?seed=`, today's, or a new one drawn for the run.
The end's **📤 Reta a alguien con esta corrida** shares the link with that code, so a friend plays the same
run (La Copa's idea, inside the lab). A `?today` link (no longer a cover button: the cover keeps only Jugar, so it fits above the fold) opens: Uno al día's
idea, inside the lab: the same run for everyone that day, and the first one played is the one that counts
(`microgames:today`, `{ d, p, s, m }`: date, points, the 0–100 score and the stars). Neither touches the
real La Copa or Uno al día: both are shared calendars, and ¡Al toque! stays in the lab until the owner
decides. Joining them is then `copa: { pozo }` and `unoAlDia: { orden, desde }` in its `games.js` entry and a
`cup/games/` screen, with `score100` as its day score.

**Pause:** when the page is hidden (the phone locks, another app comes up) the game stops and shows
**Seguir**; a game not finished yet starts again, dealt the same and at the same speed (both come from its
place in the run), and one already scored goes on to the next.

With `?seed=K7Q2X` (a cup's code) or `?today`
(Uno al día's seed of the day, `semillaDel`), the run is the same on every phone: the same ten games in
the same order (`runOrder`), and each game dealt from its own stream (`stream(seed, '<n>:<id>')`), so the
apples to count, the colour asked and the road to roll are the same too. Only the in-game motion that
depends on the frame rate (a fly's jitter, a gust) can differ between phones; what is judged does not.
The cover names the shared run's code.

## The 29 microgames, by type

| Type | Games |
|---|---|
| 👆 Toca (17) | ¡Qué color!, ¡Cuenta!, ¡Calcula!, ¡Completa!, ¡Qué hora es!, ¡Su sombra!, ¡Más! (3 rounds), ¡Diferente!, ¡Cuál falta!, ¡Dónde quedó!, ¡Repite!, ¡Espera… ya!, ¡Para! (a radar), ¡Toca rápido! (a hand pump and a balloon), ¡Aplasta! (9 flies), ¡Revienta!, ¡No toques! (whack-a-mole) |
| ✊ Arrastra (7) | ¡Ordena! (big on top), ¡A la hora! (set both hands to a digital time, 10 s), ¡Alimenta!, ¡Conecta! (four in a row), ¡Atrapa!, ¡Rebota! (pixel aliens), ¡Equilibra! (stacked blocks) |
| 💨 Desliza (5) | ¡Corta! (any direction), ¡Rueda! (a steel ball on a track), ¡Dibuja!, ¡Sigue! (a rat), ¡Limpia! |

Each game gives 0 to 3 stars, mostly by time or accuracy; the rules of each are in its comment in
`game.js`.

## Usability rules of the microgames

- **¡Rueda!:** lifting the finger pauses the ball (the clock keeps going); putting it back on the ball goes on.
- **¡Conecta!:** a tap on a column drops the disc there; dragging still works.
- **¡Corta!:** a swipe too short says «¡De lado a lado!» instead of doing nothing.
- **¡Cuenta!:** the things wobble half as much, so they can be counted in time.
- **Out of time** always says «¡Se acabó el tiempo!» (C-8b), never only «¡Fallaste!».
- **¡Toca rápido!:** the hose is tied to the balloon's knot as read from the page, every frame.
- **¡Aplasta!:** the flies under the swatter's head at the tap are the ones squashed.

## Exceptions to the canons, for now

- **C-2 (files):** `rules.js` holds the translations keyed by the Spanish, not a `LOCALES = { es, en, pt }`
  by key: 190 short texts spread over 29 microgames read better where they are used.
- **C-6 (memory):** a run is short (about a minute and a half) and is not resumed; only the best is kept.
- **Characters:** every mascot is our own drawing (the muscle sponge in ¡Limpia!, the curly-haired
  tycoon in ¡Atrapa!, the dancing rat and moles). None copies a real person or a brand.

## Its styles and the design system

`style.css` came whole from the review artifact and was moved onto base.css's scales (D-533): spaces,
corners and text sizes on the steps, buttons from base.css (`btn btn--yellow` / `btn--ghost`). The
colours and glyph sizes base.css has no token for are the sheet's own tokens, `--mg-<hex>` (with its
`-rgb` channels) and `--mg-fs-<size>` for the glyphs and big numbers over 2 rem, declared at the top in
`.alt-stage` (DESIGN.md §4). Giving them real names, or merging the near ones into base.css's, is part of
taking it out of the lab.

## For the end-to-end test

`window.__microgames`: `game`, `order`, `idx`, `total`, `active`, `ids` and `only(id)` (a run of that one game).
- **¡A la hora!:** the hand pointing nearest the finger turns (near the middle, the short one); the long one snaps to 5 minutes, the short one must be within half an hour of its place. Never 12:00, where both hands start.
