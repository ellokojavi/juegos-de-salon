level: patch

- **A new game shares with the templates from its first day**: the new-game generator writes its result's share with `result()` of `share-templates.js` and the game's tagline line, and ADD-GAME.md, C-7 and the canons' checklist say every game's share text comes from a template with that line (D-620). `share-templates.test.mjs` now also fails the generator if it writes a header by hand.
