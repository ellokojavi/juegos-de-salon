level: patch

- **Merges go live faster**: publishing retests only what main gained since the PR passed, runs no longer queue behind each other, a Pages 5xx is retried, and `docs/facts.json` no longer carries the version that made open PRs conflict (D-506).
