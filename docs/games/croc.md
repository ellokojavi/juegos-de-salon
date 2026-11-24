# 🐸 Croc! (La Copa game, launched 2026-11-22)

A solo arcade highway crossing built for mobile touch controls and deterministic Cup play.

## Summary

- **Where:** `/croc/`, La Copa's screen (`public/cup/games/croc/`), hidden until the owner switches `flags/croc`
  to *all* (D-517's way); a lab key opens it before. `/labs/croc/`, the lab page it grew in, is a bridge to `/croc/`
  (C-18), as are `/minigames/croc/` and `/minijuegos/croc/`. Id `croc` in stats, its ranking table (`croc`,
  heavy traffic `croc_hard`) and `games.js`. The phone's old lab keys (`juegos-de-salon:croc:best`, `:diff`,
  `:session`) are no longer read.
- **For whom:** 1 player. Languages: es, en, pt (C-3).
- **Launch:** launched 2026-11-22 at 21:00 Pacific (2026-11-23 05:00 UTC) with ⚖️ Tembleque and the
  splash `nos-volvimos-locos`. `nuevoDesde` is the launch day (`2026-11-22`) and `unoAlDia.desde` the day after
  (`2026-11-23`, Pacific like every Uno al día day). Uno al día deals by date, never by flag: if the launch slips, move it.

## Rules

Cross 33 rows across three escalating sectors (Suburb Ave, City Highway, Night Expressway) and a **water canal with passing boats** (`row 22`, after the safe riverbank at `row 21`) to reach the pond.

- **Movement:** Board-wide swipes (forward, back, left, right; back never lowers progress), with edge padding and `touch-action: none` to prevent browser scroll/navigation conflicts, plus keyboard support. Every hop fires as soon as the swipe passes the threshold; a **double tap** (two quick still touches) is the Dash. Keyboard: arrows/WASD hop, Space/Shift dashes.
- **Water Canal & Boats:** At `row 22`, either **Dash** over the canal (`21 → 23`) or hop onto a **passing boat** (drifting with it across the water). Missing a boat splashes `-1 ❤️` and returns you to the shore (`row 21`) with `1.5 s` ghost invulnerability.
- **Dash (`⚡`):** Starts with `3` charges (`⚡⚡⚡`). A double tap leaps 2 lanes forward over traffic.
- **Close-Call:** Passing within a narrow bumper margin (when not in ghost mode) triggers celebratory UX (particles, sound, popup) and restores `+1 ⚡` Dash charge (0 points).
- **Lives & Ghost Mode:** `3` lives (`❤️❤️❤️`); getting hit deducts 1 life (`-1` point) and grants `1.5 s` of pulsing transparent ghost invulnerability.
- **Fruits:** Strawberries, Mangoes, and Golden Starfruit spawn on road lanes, award `+1` point each, and restore `+1 ⚡` Dash charge.
- **Scoring:** `+1` per lane progressed, `+10` on reaching the finish, `+1` per fruit taken, `-1` per life lost (clamped `>= 0`). In La Copa, ties among finishers break by faster completion time; crashed runs tie-break by distance reached. Uno al día takes `dayScore`, a smooth 0–100 curve of the points (`DAY_K = 35`).
- **Seasonal Shirts:** The frog's shirt adapts by calendar date (`halloween`, `thanksgiving`, `christmas`, `newyear`, `winter`, `summer`, or default arcade jersey; overridable via `?season=<id>` and disabled under `?test`).

## Modes

Solo. Its traffic levels are La Copa's variants (D-331): 🟢 normal, the default a cup day and Uno al día play,
and 🔥 heavy (`hard`: more cars, faster and closer), which a cup admin can pick for a day. Each ranks apart:
normal in `croc`, heavy in `croc_hard`. A cup day's track is seeded from `hash32(code:day)`, the same for every
player; the trial (D-103) is a 15-row track with its own seed.

## Flow

On reaching the pond the frog dances for 1.8 s (three hops with a wiggle; none with reduced motion). Scenery: the start row and the rest rows (11, 21) are a grass verge between curbs (lamp, bin, bench, butterfly); the water canal (`row 22`) has a river depth gradient, wavy banks with shoreline foam, riverbed stones, caustics, swaying seaweed, swimming and jumping fish, curved moving waves, and passing boats with Kelvin V-wakes and animated stern foam; the finish is a wetland up to the top of the screen (reeds, heron, duck, dragonfly, lily pads).

Waiting room (La Copa's, `cup/game.js`): the cover is the real game playing itself on a random track, slower
(55 %) and with a finger showing each swipe and each Dash, in the lever's traffic; a still frame of a fixed track
with reduced motion. Then the 🐸 and the name with its line, the traffic lever (the standard one: Pintaminas',
Sudoku's; down and green is normal, up and red is heavy, which turns the page red-violet, `body.sp-hard`), Empezar,
«Instrucciones» and «Entrar», the ranking and the footer → the shared 3, 2, 1 → Play (2.5D canvas stage, top HUD
with lane, sector, lives, Dash charges and points; board-wide swipes) → the verdict and «Continuar» → La Copa's
result (score, share card `🐸 33/33 · 🍓2 ⚡3 🏁`, the breakdown: lanes, fruit, lives lost; C-19's exits).

## Message protocol

None: single-player. La Copa's shared screen saves the run after every move and every hit (`ctx.guardar`) and
sends the result (`cup/game.js`); a finished run reopens finished.

## Files

- `public/cup/games/croc/`: `engine.js` (pure, seeded; `generateDay`, `score`, `card`, `dayScore`, `LEVELS`),
  `engine.test.mjs`, `scene.js` (the canvas drawing), `ui.js` (`cover`, `title`, `selector`, `mount`, `result`,
  `breakdown`), `texts.js` (es, en, pt, keys prefixed `sp`, merged into `cup/rules.js`), `style.css` (prefixed `sp-`).
- `public/croc/index.html` (generated by `node tools/release/og.mjs cards`), its bridges, and the card
  `assets/og/croc.jpg`.
- The hook for the end-to-end tests (C-14): `window.__croc` (`g`, `state()`, `act(action)`, `estado()`).
- `tools/e2e/croc/page.mjs`: the page end to end. `tools/e2e/cup-games/languages.mjs` checks it in every language.
- Splash clips: `marketing/splash/croc-wobbles-clip.mjs`, for the `nos-volvimos-locos` campaign (off).

## Exceptions to the canons

None.

## Out of the lab (D-517's way, 2026-11-21), launched 2026-11-22

Prepared the way Sudoku (`3f60e2d8`) and Dominorama (`ba085a29`) were, and launched with ⚖️ Tembleque on
2026-11-22 at 21:00 Pacific (`flags/croc` to *all*, splash `nos-volvimos-locos`).

- **La Copa's screen**: the lab's engine and scene moved into `public/cup/games/croc/` (they were older copies
  there): the engine keeps the cup's track length (`finishRow`) and its demo keeps its traffic when it starts
  over; `generateDay` takes the day's variant. `ui.js` gained the lab's cover (the demo with the finger) and
  its lever (`selector`). The cup page provides the countdown, the clock, the ranking, sharing and the dialogs.
- **The lab page** became a bridge (`deLabs: 'croc'`): unlike Sudoku's and Dominorama's prototypes, which stayed
  until their cleanup PR, the lab's own Croc! (`game.js`, `rules.js`, its manifest) is gone now, because a lab
  game without a game.json fails the lab's gate (D-579) and its code is this game's. What the cup page does not
  keep from it: the best-score line on the cover, resuming a run halfway, and the "same track / new track" buttons.
- **`games.js`**: a SUELTOS entry with `lanza: 'croc'`, `copa: { pozo: 21 }`, `unoAlDia: { orden: 26 }`,
  placeholder dates (above) and `diasNuevo: 10`; its row in `flag-list.js` and the 🚀 switch on its `/labs/` card
  (D-498). It is in La Copa's open pool only once the flag is *all* (`refreshPool`, `enPortada`).
- **Rankings**: a SUELTOS id gets its tab on its own (D-559); it left `SOLO_TABLES`.
