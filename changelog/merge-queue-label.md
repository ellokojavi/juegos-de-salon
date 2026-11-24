level: patch

- **The merge queue makes its label again if it goes missing.** For over an hour on 2026-11-24 the `merge-queue` label did not exist: every queue step updated a PR and then failed to label it, so the queue lost track of the PR in flight and kept updating others (six PRs testing at once). Now it recreates the label and goes on.
