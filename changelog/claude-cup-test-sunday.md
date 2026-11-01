level: patch

- 🧪 `tools/e2e/cup/tournament.mjs` no longer fails on the day summer time ends (a 25-hour day, as
  2026-11-01 in Los Angeles): its advanced clock adds three hours to reach tomorrow's day 1 and the cup's end.
