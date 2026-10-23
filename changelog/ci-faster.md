level: patch

- **Releases get faster, with the same checks** (D-428): La Copa's languages test runs in four parallel parts instead of one six-minute job, and the test groups are re-measured every day, so the end-to-end check takes 6–7 minutes instead of 8–10. Sessions no longer run locally the whole end-to-end suite that GitHub runs anyway. Nothing changes for players.
