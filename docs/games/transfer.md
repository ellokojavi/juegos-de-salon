# 🚉 Transbordo (Transfer, lab, in Juegos en prueba)

A one-player metro puzzle concept: the player orders route cards and the train runs them on a small
invented map. Five trips, one new rule each. Its genre (a plan of transit moves on a fixed map) was
suggested by the ideas agent's look at *Mind the Route: Metro Puzzle* (GameLeap, Google Play); the cards
and levels are our own. The map is the **real Santiago Metro** (the owner, 2026-11-12: real lines and
station names, with their real geometry, diagonals and curves): Lines 1, 2, 3 and 5 around the centre,
stations in their real order, on a schematic like the maps in the stations (the owner, same day: the
real geometry looked deformed): straight runs at 0°, 45° and 90°, even spacing, rounded corners at the
bends (`bends` in rules.js) and each name on a side chosen by hand; `tools/e2e/transfer/labels.js` fails the e2e run if any name touches another name, a dot, a line or the train on any trip (the owner: names must never overlap). Platforms are named after the real terminals (dirección Los Dominicos).
**Four cities** (the owner, 2026-11-12, with the networks' own schematics as reference): Santiago, the
Buenos Aires Subte (Lines A, B, C and E; a transfer whose station has a name per line shows both, one per
row, «C. Pellegrini / Diagonal Norte»), the London Underground (Central, Victoria, Jubilee, Piccadilly,
Bakerloo) and the São Paulo Metro (Lines 1 to 4). The cover offers one button per city; each is five
trips with the same steps (`CITIES` in rules.js). Stretches start and end at real stations, never skip one.

**Names never overlap**: `placeNames` in game.js measures each name in the map's font and puts it on the
first of eight sides (the station's `label` first) that touches no other name, dot, line or the train's
ring; `tools/e2e/transfer/labels.js` checks every trip of every city in the browser, and that every line is
drawn. **The train** is a drawn icon centred on its ring, with an arrow towards where it heads (the next
station or bend on its line), so a player sees when the other platform is needed. **The cards** carry drawn
icons in the line's colour: a track with stops (ride), an arrow to a bar (to the end), a U-turn (other
platform), ⇄ (change). Names (C-3): Transbordo · Transfer · Baldeação.

## Resumen

- **Where:** `/labs/transfer/`, behind the lab's door (D-281, D-395), `noindex`, its card in /labs/'s
  🎲 Juegos en prueba. Not in `games.js` while it is in the lab. Id `transfer` in the usage signal and in
  `localStorage` (`juegos-de-salon:transfer:session`). Its facts are in `game.json`.
- **For whom:** one player (`solo`). In es, en and pt.

## Reglas

Each trip gives a start (station, line and the terminal the train heads to), a destination and a hand of
cards. The player taps cards into the plan's slots (tapping a placed card takes it back) and presses
🚇 ¡Vamos!: the train rides the plan station by station and stops at the first card that breaks, saying why.

- **Cards:** Avanza N (ride N stations), Hasta el final (ride to the terminal), Otro andén (the opposite
  direction), Combina a <línea> hacia <terminal> (only at a station of that line).
- **Fails:** the line ends first, a closed station (the train cannot pass), a line that does not stop there,
  already at the terminal, ending elsewhere, or not passing the ⭐ station.
- **Hearts:** 3 per trip. A failed route costs one; with none left the trip scores 0 and the run moves on.
  💡 Pista costs a heart (never the last) and fills the solution up to the next slot.
- **Score:** the hearts left on each trip are its stars; up to 15 ⭐.
- **The five trips** (`LEVELS` in `rules.js`, each solution proved in `engine.test.mjs`): 1 count stations;
  2 the other platform; 3 a transfer; 4 Universidad de Chile closed, so the way round goes by Line 2 and Santa Ana (or Line 3);
  5 a station to pass through (Bellas Artes), so the short way by Line 1 and Line 3 fails.

## Modos

Solo (`solo`), five fixed trips. No daily seed yet.

## Flujo

Intro (resume panel, the mode, how to play, the site footer with 💬) → play (trip n of 5, hearts, the
trip panel, the map, the verdict, the plan, ¡Vamos!, the hand, Vaciar and Pista) → result (stars per trip,
¡Otra vez!, Share through `compartir.js`, and the exit to the lab from `fin.js`, C-19).

## Protocolo de mensajes

None: no room. The whole state is saved after every change (`createSessionStore`, C-6).

## Archivos

- `public/labs/transfer/game.json`: the manifest (#1249), `rules.js`: data and LOCALES, `engine.js`: the pure rules,
  `engine.test.mjs`, `game.js`: screens and drawing, `style.css`: only its own, on the tokens.
- `tools/e2e/transfer/game.mjs`: plays the five trips (one wrong route first) to the result; `window.__transfer` is its hook; `node tools/e2e/conformance.mjs labs/transfer` checks the canons.

## Excepciones a los cánones

None.
