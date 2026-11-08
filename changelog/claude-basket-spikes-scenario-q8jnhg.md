level: patch

- **Artefactos (lab): no more spikes inside the basket.** The level generator could drop spikes, a girder or a fixed plank right on the basket (stage 4 showed a basket with spikes in it). It now never puts a hazard on the basket's cells; the 14 levels that had one were removed and 5 new hard ones generated, and `engine.test.mjs` and the generator's `check` fail if it happens again.
