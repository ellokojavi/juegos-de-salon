level: patch

- **Workshop:** a Claude Code hook (`tools/agents/push-guard.mjs`) stops a `git push` while `docs/DECISIONS.md` or a generated README block is stale, so the `tests` check no longer goes red for it (D-518).
