level: patch

- **Weekly popularity merges again**: the workflow waits on the commit's `tests` and `end-to-end` check runs through REST instead of `gh pr checks`, which with the workflow token never saw them; the 2026-11-09 PR waited an hour and stayed open with both checks green.
