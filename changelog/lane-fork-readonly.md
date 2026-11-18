level: patch

- **Workshop**: a contributor's PR from a fork no longer turns `tests` red on every push. The `lane` job gets a read-only token on a fork, so trying to label it failed (19 red runs on three PRs this week, signature 3f17b9bc87); it now sees the fork, writes nothing and passes. The gate is unchanged: `owner-approval` stays missing, so the PR still cannot merge without the owner.
