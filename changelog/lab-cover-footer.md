level: patch

- **Lab games' covers end with the site footer**, like the published ones: Sudoku, Chameleon, Fourth King, Julep, Artifacts, Flap, Memory, Code, Dominorama, Exploding Numbers and Stack. Their own 💬 comment is a tile of that footer on the cover and stays alone while playing. `site-footer.test.mjs` now walks `labs/` too and fails a lab game whose cover has no footer, so a game enters the lab already meeting it.
