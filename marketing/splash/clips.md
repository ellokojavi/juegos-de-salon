# The splash's clips

A few seconds of each game being played, for the promotional splash over the home page (D-351).
They replace a still picture: the owner found the link cards repeated the texts next to them.

| | |
|---|---|
| Files | `public/assets/splash/<game>.mp4` (360×360, 12 fps, muted, loops) and `<game>.jpg` (its poster: the board solved) |
| Games | 🚇 Rutas rotas (`routes`), 📐 Loteo (`plots`), 🖌️ Pintaminas (`paint-mines`) |
| Made by | [`capture.mjs`](capture.mjs): the real game in headless Chrome, its solution played slowly while the board is shot |

## How to rebuild them

```bash
python3 -m http.server 8771 -d public &                          # the worktree's site
SITE=http://localhost:8771 node marketing/splash/capture.mjs [routes|plots|paint-mines]
```

A new game: one entry in `GAMES` in `capture.mjs` (its page, its board's selector, when it is
ready, and how to play its solution through the game's test hook), then its item in the campaign
(`video` and `img` in `public/assets/js/splash.js`).

## History

- **v1 · 2026-10-18:** the three games out of the lab (D-332), for the demo campaign `tres-juegos-demo`.
