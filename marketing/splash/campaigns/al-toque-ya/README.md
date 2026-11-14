# ⚡ ¡Juega al toque! (`al-toque-ya`)

The launch of ⚡ ¡Al toque! (microgames) out of the lab, made ahead of time (the owner's request,
2026-11-14: "prepare the campaign, don't launch anything yet"). **Off**: nothing here is switched on.

| | |
|---|---|
| Texts | kicker "¡Nuevo juego!" · title "¡Juega al toque!" (en "Play in a flash!", pt "Jogue na hora!"); the card says what it is (tap, drag, swipe; one order, 3 seconds; ten in a row, faster and faster; the perfect run) and ▶ Jugar; in es, en and pt |
| Layout | `hero`: the clip as wide as the window, the card under it |
| Clip | `public/assets/splash/al-toque-teaser.mp4` (512×320, 10 s loop at 30 fps, ~400 KB), drawn by [`teaser/al-toque.html`](../../teaser/al-toque.html) on the teaser engine and recorded with `node marketing/splash/teaser.mjs al-toque` |
| Item | ⚡ ¡Al toque!, its own texts and link (`labs/microgames/` today) since the game is not in `games.js` while in the lab |
| Waits for | `requires: ['microgames']`: unseen until flags/microgames exists and is on for the visitor (D-517) |
| On | **off**: not in `ACTIVE` |
| Usability | full pass before it is switched on (D-355) |

## The animation: a whole run in 10 seconds

Not a teaser (it is a launch, so it shows the play) but drawn on the same engine, in its loop mode:

- **Ten microgames, one run**: ¡TOCA RÁPIDO! (the balloon bursts), ¡CORTA! (one swipe, the sandwich
  falls in two), ¡ATRAPA!, ¡ESPERA… YA!, ¡APLASTA! (a combo), ¡DIBUJA!, ¡PARA!, ¡ORDENA!, ¡REVIENTA!, ¡REBOTA!.
- **It speeds up like the game**: each game lasts `1 / speedAt(i)` seconds from the game's own
  `engine.js`, so the cuts come faster at ×1.1, ×1.2, ×1.3; the speed lines behind thicken and the
  chevrons on each side light one per step.
- **Every cut is a lightning strike** in the next game's gesture color (Toca turquoise, Arrastra
  orange, Desliza purple), with a punch-in of the stage.
- **The HUD fills as in the game**: a mark per game in the game's colors, golden stars after each
  one, and the 🔥 streak lit by the engine's own `score()` (one ★ slip in game 6 breaks it, so the
  streak visibly restarts).
- **No seam**: the run ends in a big yellow bolt that whites out the frame, and frame 0 comes out of
  that white. No words in the clip; the emoji are drawn as images, never with `fillText`.

## Launch plan (when the owner says go)

1. **Launch PR** (D-517's way): the game leaves the lab, `games.js` entry, flag `microgames`, and this
   campaign's `href` points at the game's new folder (`?play`).
2. **Switch on** at a set hour with the `launch` workflow (D-529): flag `microgames` and splash
   `al-toque-ya`, `--off` whatever launch campaign is running then; 7 days, first in the queue.
3. **Usability full pass** of this campaign in es/en/pt at 390 and 320 px (D-355).
4. **Outside the site** (drafts only, nothing posted):
   - *Share line (es)*: «⚡ ¡Al toque! 10 microjuegos seguidos, 3 segundos cada uno, cada vez más rápido. ¿Haces la corrida perfecta? juegosdesalon.cl»
   - *Share line (en)*: «⚡ In a Flash! 10 microgames in a row, 3 seconds each, faster and faster. Can you make the perfect run? juegosdesalon.cl»
   - *Share line (pt)*: «⚡ Na Hora! 10 microjogos seguidos, 3 segundos cada, cada vez mais rápido. Você faz a corrida perfeita? juegosdesalon.cl»
   - The same MP4 works as a WhatsApp status / Instagram story (letterboxed) or a short post.
   - Challenge hook: a run's code (`?seed=XXXXX`) is the same on every phone: «Te reto a esta corrida».
5. **Measure**: the panel's 📊 How they did (reach, % tapped, % closed); what proves the game is
   players who start a second run (docs/games/microgames.md).

Screenshots, as `node tools/e2e/look.mjs splash al-toque-ya --lang <xx>` shows it:
[es](es-390.jpg) · [en](en-390.jpg) · [pt](pt-390.jpg) · [es at 1280](es-1280.jpg).

## History

- **2026-11-14:** made with its clip, kept off until the game leaves the lab.
