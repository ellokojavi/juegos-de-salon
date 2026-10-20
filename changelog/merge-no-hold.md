level: patch

- **Auto-merged PRs merge about two minutes sooner** (D-400). The `end-to-end` check no longer holds itself open for the app's PR monitor; sessions learn of the merge with `tools/agents/wait-pr.mjs`.
