# Changelog

## 0.241.7 — 2026-11-01
- 🧪 **Babel's music joins Babel's /labs/ card**: no separate «Babel con música» card or flag; the music is behind
  Babel's own flag `stack`, so it launches with the game.

## 0.241.6 — 2026-11-01
- 🧪 `tools/e2e/cup/tournament.mjs` no longer fails on the day summer time ends (a 25-hour day, as
  2026-11-01 in Los Angeles): its advanced clock adds three hours to reach tomorrow's day 1 and the cup's end.

## 0.241.5 — 2026-11-01
- 🚀 **Publishing works again**: every Publish run since the merge lanes (D-519) failed to start, because
  `tests.yml`'s new `lane` job asks for more permissions than `publish.yml` granted it. The site stayed
  at the 2026-11-01 03:51 UTC version; this grants them, and the next merge publishes everything waiting.
- 🧪 `public/cup/store.test.mjs` no longer fails on the day summer time ends (a 25-hour day): the
  advanced clock moves two days and two hours, not two plain days.
