level: patch

- **Tests: the end-to-end group target goes to 440 s** (D-624, the owner): measured afresh, main's heaviest group was already over the alarm; `durations.json` refreshed from the last five green runs. Taken out of #1928 so the lab games waiting on it (#1934) are not held by that PR.
