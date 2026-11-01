level: patch

- 🚀 **Publishing works again**: every Publish run since the merge lanes (D-519) failed to start, because
  `tests.yml`'s new `lane` job asks for more permissions than `publish.yml` granted it. The site stayed
  at the 2026-11-01 03:51 UTC version; this grants them, and the next merge publishes everything waiting.
- 🧪 `public/cup/store.test.mjs` no longer fails on the day summer time ends (a 25-hour day): the
  advanced clock moves two days and two hours, not two plain days.
