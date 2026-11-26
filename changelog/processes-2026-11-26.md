level: patch

- **Processes round 2026-11-26** (catch-up of 2026-11-25, whose round never opened its PR): the documentation agent's guide now asks it to read the code diff of every merged PR that changes `public/`, `firebase/` or a workflow and to name the doc it compared; D-603 notes the Duels per-round level (`lv`); the end-to-end flags snapshot is refreshed (seven flags on for everyone).
- **Push guard**: a push stops on a new architecture hit (`architecture.test.mjs`) or a new Spanish exported name (`identifiers.test.mjs`), naming it, instead of a red `tests` run (signatures ea485401a9 and 965641ffe6, push-guard.test.mjs).
- **Ideas propose**: `ideas.mjs propose` gives each decision its origin, which `decide` requires since #1435 (ideas.test.mjs).
