# 🔮 Cosmic Marble (lab, in Juegos en prueba)

A tilt-maze marble game brought from the owner's **Bolita** prototype (a single HTML file, 2026-11) and
renamed by the owner: Canica Cósmica (es), Cosmic Marble (en), Bolinha Cósmica (pt). The prototype's
own notes on generation, balance, looks and frame cost are in
[cosmic-marble/generation-rules.md](cosmic-marble/generation-rules.md).

## Resumen

- **Where:** `/labs/cosmic-marble/`, behind the lab's door (D-281, D-395), `noindex`, its card in /labs/'s
  🎲 Juegos en prueba. Id `cosmic-marble` in the usage signal and in `localStorage`
  (`juegos-de-salon:cosmic-marble:session`, `…:best`). Its facts are in `game.json`.
- **For whom:** one player, one phone lying flat (keys, WASD or drag on a computer). In es, en and pt.

## Reglas

Five stages per run, one per world (sky, water, galaxy, electric, volcano) in random order; difficulty is
the stage number. Three lives; a stage cleared without falling gives one back. No time limit: each stage
has a par, 20 points inside it, down to 10 at twice the par; 3 off per life lost; at most 100
(`engine.js`, tested in `engine.test.mjs`).

## Modos

Solo (`solo`).

## Flujo

Cover (resume panel, ▶ Jugar, how to play, footer) → the run (`course.js` draws it; ⏸ pauses, and on a
phone offers to level again) → result (points, stage by stage, lives, time, best mark, Again, Share,
the exits from `fin.js`, C-19). The top bar's ‹ during a run goes back to the cover.

## Protocolo de mensajes

None. The run is saved at the start of each stage (seed, world order, lives, stages cleared; C-6); a
reload resumes from the start of that stage with the same course.

## Archivos

- `game.json`, `rules.js` (`LOCALES` for the page, `COURSE_TEXTS` for the run's `bo*` texts),
  `engine.js` (the score), `course.js` (the prototype's courses, physics, input and canvas, as a module:
  `play`, `connect`, `stop`), `game.js` (the page), `style.css`.
- Test hooks: `window.__cosmicMarble` (`S`, `finish`, `step`, `setSeed`… and `page`). Address options:
  `?seed=N`, `?order=neon,water,galaxy,electric,fire`, `?stage=N`.

## Open questions from the prototype

Volcano floor look, sky wall colour, galaxy asteroids, water whirlpool look; never tested on a real
phone; water at the hardest stages can go over the 60 fps budget (generation-rules.md).

## Excepciones a los cánones

None.
