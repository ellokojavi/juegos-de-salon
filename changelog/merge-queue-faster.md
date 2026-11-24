level: patch

- **The merge queue runs end-to-end once per PR** (D-618). It cancels the running `end-to-end` of a PR that is behind main, which tests a main the PR can no longer merge into, and lets a behind PR into the line once `tests` passed. `end-to-end` then runs only after the update, on today's main. A cancelled run is no longer red for `wait-pr.mjs`, the pending-work issue or the processes round.
