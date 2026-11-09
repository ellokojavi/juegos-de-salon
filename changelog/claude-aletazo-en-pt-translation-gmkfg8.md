level: patch

- **🐤 Aletazo now has its own name in English and Portuguese**: *Flap* in English and *Bate-Asa* in Portuguese, on the home page, the search, La Copa and its launch splash (Spanish keeps Aletazo).
- **No game name left untranslated again** (D-549): `game-names.test.mjs` fails a game whose English or Portuguese name copies the Spanish one without a listed reason, or whose La Copa texts disagree with `games.js`.
