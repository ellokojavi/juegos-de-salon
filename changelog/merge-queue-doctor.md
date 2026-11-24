level: patch

- **The merge queue has a doctor** (D-619). Every 5 minutes the heartbeat checks the queue without a model: it remakes a deleted label, starts a step that did not run, and keeps a "Merge queue needs a look" issue with what is still wrong. Every hour the `queue-doctor` cloud task fixes that on its own and ships the fix, never waiting for the owner except on a 🔴 PR. The line now puts a fix to the queue first and PRs that change nothing under `public/` ahead of the rest.
