# changelog/

One entry per PR, **without a number** (D-300): `changelog/<branch>.md`, created by
`node tools/release/changelog.mjs new [patch|minor|major]`.

```
level: patch

- **What changed**, for players, in the tone of `CHANGELOG.md`.
```

The number is added on its own, in the order PRs reach `main`
(`node tools/release/changelog.mjs show` shows the one each gets), and the processes agent
collects them into `CHANGELOG.md` in its round.

Which level (D-530, since 1.0.0): **patch** for a fix, an adjustment or anything internal;
**minor** for something new a player sees (a game or feature published); **major** only when the
owner asks for it. Do not write `## X.Y.Z` in `CHANGELOG.md` from a PR:
the `tests` check blocks it (`changelog.mjs migrate` moves it here). Entries written before the
switch to English start with `nivel: parche|menor|mayor`, and they are still read.
