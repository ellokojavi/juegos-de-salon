# 🦎 El Camaleón (lab prototype, in Juegos en prueba)

A party game for one phone passed around (issue #898, approved by the owner on 2026-10-28): everyone
sees the secret word of a 16-word grid except one hidden player, the chameleon. Each gives one clue
aloud, the table votes, and a caught chameleon still escapes by guessing the word. **Inspired by
[The Chameleon](https://bigpotato.co.uk/), by Big Potato Games**, and it says so on the cover and in
the lab (D-286, D-289). Its card art and word lists are not copied: the six topics and their words are
our own.

## Summary

- **Where:** `https://juegosdesalon.cl/labs/chameleon/`, behind the lab's door (D-281), `noindex`. Not in
  `games.js` nor on the home page while it is in the lab. Id `camaleon` in the usage signal and in
  `localStorage` (`juegos-de-salon:camaleon:session`, `…:names`).
- **For whom:** 3 to 8 players, one phone. In the four languages (es, en, pt, de); the names are
  El Camaleón, Chameleon, Camaleão and Chamäleon.
- **Status:** active project. What would prove it: groups that play more than one game in a visit.

## How it is played

1. **Setup:** the names in seating order (3–8, no repeats), remembered for next time.
2. **Topic:** six topics (animals, food, sports, jobs, at home, places) or 🎲 Random, which never
   repeats the last one.
3. **The cards:** the shared pass screen (`handoff.js`, C-9) names each player in turn, from the round's
   starter; "See my card" shows the topic and the secret word, or "You are the chameleon!" with the topic
   only; "Done, hide it" covers it and passes on. The starter rotates each round.
4. **Clues:** the grid of 16 words for all to see; the starter begins and it goes to the right, one word each.
5. **Vote:** everyone points on three; the phone records the one most pointed at (a tie: the starter decides).
6. **Guess:** if the chameleon was accused, the grid's cells become buttons and the chameleon picks one.
7. **Result:** the secret word marked in cyan (a wrong guess in pink), who it was, and the points.

**Points:** escaped unseen +2 for the chameleon; caught but guessed +1 for the chameleon; caught and missed
+1 for everyone else. First to 5 wins (a tie names everyone at the top). The end screen: the winner, the
points, Play again (same players, from 0), Change players and Back to the menu (`fin.js`, C-19).

## Pieces

- `public/labs/chameleon/rules.js`: the topics and words (16 each, ≤16 letters so they fit a cell at
  320 px) and the interface texts, in `LOCALES`.
- `engine.js`: pure rules (`newGame`, `startRound`, `cardHolder`, `cardFor`, `cardSeen`, `toVote`,
  `accuse`, `guess`, `standings`, `fromSaved`), tested by `engine.test.mjs` (packs, phases, points, winners).
- `game.js`: screens and memory (C-6: a reload resumes at the same phase). Test hook `window.__camaleon`
  (`state()`, `screen()`, `saved()`).
- `tools/e2e/chameleon/lab.mjs`: a whole game at 320 px.

## Exceptions to the canons

- Lab only: no `games.js` entry, no README section, no `paths.mjs`/`languages.mjs` yet (they come when it
  leaves the lab, with the full usability pass, D-304).
- The vote is counted by the table, not by the phone: one phone cannot take secret votes without passing
  it around again, and pointing on three is how the table game is played.
- No result sharing in the prototype.
