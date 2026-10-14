# changelog/

One entry per PR, **without a number** (D-300): `changelog/<branch>.md`, created by
`node tools/release/changelog.mjs new [patch|minor|major]`.

```
level: patch

- **What changed**, for players, in the tone of `CHANGELOG.md`.
```

The number is added on its own, in the order PRs reach `main`
(`node tools/release/changelog.mjs show` shows the one each gets), and the processes agent
collects them into `CHANGELOG.md` in its round. Do not write `## X.Y.Z` in `CHANGELOG.md` from a PR:
the `tests` check blocks it (`changelog.mjs migrate` moves it here). Entries written before the
switch to English start with `nivel: parche|menor|mayor`, and they are still read.
