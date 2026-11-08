level: patch

- **La Copa: «Empezar» shows without scrolling on a day's cover.** Inside a cup the day's cover opened with
  «Cómo se juega» unfolded, the wildcard and «Probar primero» before the button, so on a small phone «Empezar»
  sat 500–1000 px below the fold. Now the button sits right under the title, as on every game's landing (U-39),
  with «Probar primero» under it and the rules folded. `landing-fold.mjs` now also checks each game opened from
  Uno al día (`?today`) and a cup's day cover.
- **La Copa: the wildcard ×2 is a switch beside «Empezar».** On a day's cover the wildcard sat below the
  buttons, so it could be missed before starting, and once a day starts it can no longer be used. Now it is
  a switch right above «Empezar», seen without scrolling; on, the button reads «🃏 Empezar con ×2» and applies the wildcard
  and starts the day.
