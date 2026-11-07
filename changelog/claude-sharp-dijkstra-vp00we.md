level: patch

- **Outside lane** (#1249 step 4): a PR from a fork, or opened by anyone but the owner, is 🔴 whatever its files, so it never auto-merges (`outsideReason` in `tools/agents/lanes.mjs`, `docs/LANES.md`); registered as the `outside-lane` rule.
