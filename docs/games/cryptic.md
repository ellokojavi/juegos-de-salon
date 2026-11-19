# 🗝️ Cryptic (Críptico; lab, in Juegos en prueba)

Born from `node tools/generators/new-game.mjs cryptic`. The owner's idea (2026-11-19): the mechanics of
a daily cryptic-clue game (one clue a day, type the answer, hints, streak), with our own name (Críptico, the owner's pick), clues and
look. Spanish clues only for now, by the owner's call: the mechanics first, the other banks once it works.

## Resumen

- **Where:** `/labs/cryptic/`, behind the lab's door (D-281, D-395), `noindex`, its card in /labs/'s
  🎲 Juegos en prueba. Not in `games.js` while it is in the lab. Id `cryptic` in the usage signal and in
  `localStorage` (`juegos-de-salon:cryptic:session` for the round in progress,
  `juegos-de-salon:cryptic:days` for each day's result and the streak). Its facts are in `game.json`.
- **For whom:** one player, solo. The screens in es, en and pt; the clues in Spanish (a player in English
  or Portuguese sees «⚠️ The clues are in Spanish»).

## Reglas

- A cryptic clue reads two ways: a **definition** of the answer at one end, and a **wordplay** that builds
  it (anagram, reversal, hidden, charade, container, deletion, homophone, two definitions, initials).
  The clue ends with the answer's length, «(4)».
- The player types the answer as many times as needed. Accents do not matter, Ñ is its own letter.
  A guess of another length is a yellow warning and does not count; a wrong one is red, shakes the clue
  and stays until the next guess (the exception below).
- Up to three helps, in order: the kind of wordplay, the definition underlined, the first letter.
  Solving is worth 3 stars minus the helps; «Me rindo» shows the answer, with no stars.
- **The day's clue** is the same for everyone on a date, at the player's own midnight: clue number
  `days since 2026-11-19 + 1`, walking the bank with a stride so every clue comes out once before any
  repeats (`indexOf` in `engine.js`). With 42 clues, six weeks.
- **The streak:** days in a row with the day's clue solved; given up breaks it. Practice clues (any other
  clue of the bank, at random) count for nothing.
- Rankings: none yet (D-212: whether it keeps a score is the owner's call).

## Modos

Solo (`solo`): today's clue (the yellow start button) and practice (the ghost button under it).

## Flujo

Cover (the yellow «Jugar la pista de hoy», under it the clue number or today's stars, then «Practicar con
otras pistas», how to play) → play (the clue, one box per letter, the answer field and «Comprobar», the
helps, «Me rindo») → result (stars, tries, streak; Share and «Otra pista de práctica», the exit to the lab
from `fin.js`, C-19; then «Cómo se arma», the clue with its definition underlined and how it is solved).
Today's clue, once played, opens on its result.

## Protocolo de mensajes

None: one phone, no room. The round is saved after every move (`createSessionStore`, C-6); each day's
result stays on the phone for the streak.

## Archivos

- `public/labs/cryptic/game.json`: the manifest; `rules.js`: data and LOCALES (the kinds' names too);
  `clues.js`: the clue bank (`{ c, a, k, d, x }`, described at its top); `engine.js`: the pure rules
  (dates, the day's clue, guesses, helps, stars, streak); `engine.test.mjs`: the rules and every clue
  (its definition at one end, anagrams with the same letters, hidden words really hidden, reversals);
  `game.js`: screens and drawing; `style.css`: only its own, on the tokens.
- `tools/e2e/cryptic/game.mjs`: plays today's clue (a wrong guess, two helps, a reload, the answer)
  and a practice clue given up; `node tools/e2e/conformance.mjs labs/cryptic` checks the canons.
- Hook: `window.__cryptic` (`state()`, `clue()`, `answer()`).

## Writing a clue (the owner, 2026-11-19)

The first bank was too direct, and so was its first rewrite: the owner asked for clues that make the player
think and reach for a hint, while staying solvable. The owner's own (SIETE, PEATÓN, COMA, CAMISA) are the bar.
Every clue in `clues.js` follows these rules:

1. **One natural sentence that tells another story.** No colon or semicolon splitting wordplay from
   definition: the seam is the player's to find («Di que se va, pero exige flores en el camarín»).
2. **Every piece is clued too, never written out**: a synonym (cara for costosa), a note (SOL, RE, LA), a Roman
   number (V), a chemical symbol (NA), a translation (tour for GIRA), as «beso catalán» is PETÓ. Only anagrams
   and hidden words show their letters, and then the definition carries the difficulty.
3. **A fair but sideways definition** at one end: «ni te cases ni te embarques» for MARTES, «tiene cuatro
   esquinas» for MANZANA, never the dictionary line.
4. **A blended indicator**: «alborotada», «vuelve», «sin que se viera», «le cortan la cabeza» read as part of
   the story, not as an instruction.
5. **One answer only**, and `x` shows every step of the solution. The engine test checks the mechanics it can
   (definition at an end, anagram letters, hidden and reversed words).

## Excepciones a los cánones

- **C-8b:** a wrong guess is the normal move (as in El Ahorcado, D-56): it does not open a notice to close.
  It is signalled by colour, a shake, a sound and a line that stays until the next guess.
- **C-3:** the clues are in Spanish only for now (the owner, 2026-11-19); the screens are in the three languages.
