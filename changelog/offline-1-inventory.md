level: patch

- **📴 Offline mode, step 1 of 8** (D-538, docs/OFFLINE.md): the plan for playing with no signal is approved and in the repo. The games manifest now says which games are offline-capable (all but La Copa, `offlineOk` in `games.js`), and `offline.test.mjs` fails if one of their pages starts importing something from another site when it opens. Nothing changes for players yet.
