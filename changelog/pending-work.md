level: patch

- **Pending work can no longer be forgotten quietly** (D-441): a daily check on GitHub keeps one "Pending work" issue with any pull request that is stuck and any branch holding work that never reached the site, and closes it when nothing is left; a session waiting for its pull request now reads GitHub another way when the first is refused, and says so instead of retrying forever. Nothing changes for players.
