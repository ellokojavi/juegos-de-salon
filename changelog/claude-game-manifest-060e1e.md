level: patch

- **One place per game, phase 1 (#855).** `games.js` becomes the games manifest: each game's search
  keywords now live in its own entry, and `search.js` reads them from there instead of keeping a list
  of its own. Nothing changes for players: the 🔎 search finds the same games by the same words.
  `manifest.test.mjs` fails if a hand-kept list comes back.
