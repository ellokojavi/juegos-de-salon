# Sudoku: Coming soon

The memory of the 6 s teaser of Sudoku for WhatsApp (the owner, 2026-11-11: "un video en mp4 de 6 segundos para
promocionarlo por whatsapp que solo tenga la animación y diga 'coming soon'"). Like
[`../coming-soon-teaser/`](../coming-soon-teaser/README.md), each round is noted in [History](#history) and in
[`../log.json`](../log.json).

## Today: version 1 (2026-11-11)

| | |
|---|---|
| File | [`output/sudoku-coming-soon-6s.mp4`](output/sudoku-coming-soon-6s.mp4) (1080×1080, 6 s, 30 fps, no audio) |
| Text | "COMING SOON", the owner's words, in Bangers yellow with the pink drop, as the site's titles |
| Shows | the game's drawn icon (`public/labs/sudoku/icon.svg`) and the first 6 s of the splash clip (`public/assets/splash/sudoku.mp4`): the 8s on the board draw their columns across the grid, the view zooms into the box they cross, its one free cell lights up |
| Where it goes | WhatsApp, as a teaser: the game is still in the lab (`laboratorio` in `log.json`), no link |
| Loop | fades in and out of the background in the first and last quarter second |

Rebuild (with the site served on 8791): `node marketing/sudoku-coming-soon/build.mjs`. A new clip in
`sudoku-clip.cjs` reaches this video on the next build.

## History

- **2026-11-11 (v1):** made from the splash clip, the board vertically centered with even margins.
