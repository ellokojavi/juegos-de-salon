level: patch

- **Which games La Copa can play lives in each game's entry**: a game's place in the pool an admin picks the days from is now `copa: { pozo }` in `games.js`, and `cup/engine.js` builds the pool from there in the same order, so no Cup changes (#855, phase 4).
