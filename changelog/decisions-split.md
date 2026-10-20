level: patch

- **Nothing changes for players.** Behind the scenes, the design decisions moved from one 700 KB file to one file each (`docs/decisions/`), with a generated index in `docs/DECISIONS.md` (D-394): cheaper to read, no merge collisions, and checked by the tests.
