# ¡Upa, papá! · three new games

The memory of the image and the WhatsApp message announcing the three games out of the lab
(D-332): 🚇 Rutas rotas, 📐 Loteo and 🖌️ Pintaminas. It follows the model of
[`../promo-video/`](../promo-video/README.md) (D-178): read it before touching the asset, and record
each round in [History](#history) and in [`../registro.json`](../registro.json).

## Today: version 1 (2026-10-15)

| | |
|---|---|
| Files | [`output/tres-nuevos-1080.jpg`](output/tres-nuevos-1080.jpg) (1080×1080), [`output/tres-nuevos-6s.mp4`](output/tres-nuevos-6s.mp4) (1080×1080, 6 s, 30 fps, no audio) and [`whatsapp.txt`](whatsapp.txt) |
| Language | Spanish |
| Where it goes | WhatsApp (the image with the message as its caption), statuses and social networks |
| App it shows | 0.172.0 |

**What it shows** (owner's request: the title says «Upa, papá!»): the title in the app's gradient,
"Tres juegos de lógica, gratis y en el celular", and the three boards side by side, each a real
screenshot of the game: Rutas rotas with stage 1 solved, Loteo with its last board split into plots,
and Pintaminas with the tree uncovered. Under each, its emoji, its name and one line; at the bottom,
`juegosdesalon.cl`.

**The message** names each game with its emoji, the tagline from `games.js` and its link
(`/routes/`, `/plots/`, `/paint-mines/`), so WhatsApp shows each game's preview card.

**The video** ([`animada.html`](animada.html), the same layout with a deterministic `render(t)`):
the first and the last frame are the still image, everything at rest (owner's request: the frozen
thumbnail shows the whole thing). From 0.6 s to 5.0 s each board takes the spotlight in turn
(about 1.45 s each): it grows a little, straightens, wobbles and glows while the other two dim; the
title bounces as each one starts. Opened in a browser without `?render`, it loops.

## How to rebuild it

```bash
# The boards (served site in SITE): then crop the board out of each screenshot into img/
node tools/e2e/look.mjs rutas stage
node tools/e2e/look.mjs loteo end
node tools/e2e/look.mjs pintaminas revealed
node marketing/tres-nuevos/construir.mjs         # tarjeta.html → output/tres-nuevos-1080.jpg
node marketing/tres-nuevos/construir-video.mjs   # animada.html → output/tres-nuevos-6s.mp4 (--fotos 1.2,3 for single frames)
```

## History

- **v1 · 2026-10-15 · app 0.172.0:** first version, the owner's title «Upa, papá!»; the same day, the 6-second video that starts and ends on the still image.
