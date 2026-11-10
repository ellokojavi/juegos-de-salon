# ⚡ ¡Al tiro! (lab prototype, in Games being tried)

Microgames in the style of WarioWare (Nintendo): one quick order, 3 to 5 seconds to do it, and the next
one comes right after. The owner designed it game by game with Claude on a claude.ai artifact (a review
page with ✅ / ❌ per game), kept 30 of about 40, tuned each one, and asked for runs of 10 different games
in a row in the lab. «¡Al tiro!» is Chilean for "right now".

## Summary

- **Where:** `https://juegosdesalon.cl/labs/al-tiro/`, in the lab (each person's key, D-281, D-284).
  Id `al-tiro` in the usage signal; the best run is `al-tiro:best` (stars, out of 30). Not in `games.js`: lab only.
- **For whom:** one player, on a phone held upright.
- **Language:** Spanish only for now. The three languages (C-3) are pending before it can leave the lab:
  the texts are still written inside each microgame, not in a `LOCALES` table.
- **Status:** active project. What would prove it: players who start a second run.

## Files

| File | What |
|---|---|
| `public/labs/al-tiro/game.js` | Everything: the shared stage helpers, the 30 microgames (`GAMES`), their names (`META`), the three types (`KINDS`), the cover, the how-to and the run |
| `public/labs/al-tiro/style.css` | The stage and every microgame's look (moved from the artifact) |
| `public/labs/al-tiro/index.html` | The page: the stage, the HUD, the run's marks and the footer |
| `tools/e2e/al-tiro/lab.mjs` | End to end |

There is no `engine.js` yet: each microgame draws and judges itself. Splitting the rules out (and
their texts into `LOCALES`) is the work to take it out of the lab.

## How a run goes

1. **Cover:** ⚡, the name, one line, the credit to WarioWare and **Jugar**; the site footer under it.
2. **The three ways to play**, one card at a time (every 2.6 s, or by its dot), each with a finger
   doing its gesture: **Toca** (turquoise), **Arrastra** (orange) and **Desliza** (purple). **¡A jugar!**
   can be pressed any time and pulses once all three were shown.
3. **The run:** 10 different microgames drawn from the 30. Each starts with its intro card (the gesture
   of its type on top, the stage framed in the type's color, the name and a hint); the frame comes off
   when the game starts. Every three games the run speeds up by 10 % (`sp`). The HUD shows `n / 10`,
   the stars so far and a mark per game (red 0, orange 1, turquoise 2, yellow 3 stars).
4. **The end:** the total out of 30, a cheer by how it went, each game's icon with its stars, the best
   run, **Otra corrida** (straight in, no how-to) and **Inicio**.

## The 30 microgames, by type

| Type | Games |
|---|---|
| 👆 Toca (17) | ¡Qué color!, ¡Cuenta!, ¡Calcula!, ¡Completa!, ¡Qué hora es!, ¡Su sombra!, ¡Más! (3 rounds), ¡Diferente!, ¡Cuál falta!, ¡Dónde quedó!, ¡Repite!, ¡Espera… ya!, ¡Para! (a radar), ¡Toca rápido! (a hand pump and a balloon), ¡Aplasta! (9 flies), ¡Revienta!, ¡No toques! (whack-a-mole) |
| ✊ Arrastra (6) | ¡Ordena! (big on top), ¡Alimenta!, ¡Conecta! (four in a row), ¡Atrapa!, ¡Rebota! (pixel aliens), ¡Equilibra! (stacked blocks) |
| 💨 Desliza (7) | ¡Corta! (any direction), ¡Encesta!, ¡Patea!, ¡Rueda! (a steel ball on a track), ¡Dibuja!, ¡Sigue! (a rat), ¡Limpia! |

Each game gives 0 to 3 stars, mostly by time or accuracy; the rules of each are in its comment in
`game.js`.

## Exceptions to the canons, for now

- **C-3 (three languages):** Spanish only, see above.
- **C-2 (files):** no `rules.js` / `engine.js` split; one `game.js`.
- **C-6 (memory):** a run is short (about a minute and a half) and is not resumed; only the best is kept.
- **Characters:** every mascot is our own drawing (the muscle sponge in ¡Limpia!, the curly-haired
  tycoon in ¡Atrapa!, the dancing rat and moles). None copies a real person or a brand.

## For the end-to-end test

`window.__alTiro`: `game`, `order`, `idx`, `total`, `active`, `ids` and `only(id)` (a run of that one game).
