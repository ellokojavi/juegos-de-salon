level: patch

- **Workshop: `sync-pr` resolves the rule counts too.** A conflict in `docs/RULES.md`, `CONTRIBUTING.md` or the PR template that only differs in the numbers `rules.mjs` writes is taken from main and regenerated, instead of leaving the PR in conflict (D-580). Carried over from the unmerged branch `auto-sync-generated`.
