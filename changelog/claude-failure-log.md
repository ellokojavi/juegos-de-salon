level: minor

- **Red CI runs are logged by themselves** (D-518): each failing `tests` or `end-to-end` run of a PR is recorded on the `failure-log` branch, grouped by signature (`tools/agents/failures.mjs`), and a cause seen on two PRs reaches the processes round as ready for a mechanism; flaky runs are counted apart. Nothing changes for players.
