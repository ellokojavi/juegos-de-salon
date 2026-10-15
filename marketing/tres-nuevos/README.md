# ¡Upa, papá! · three new games

The memory of the image and the WhatsApp message announcing the three games out of the lab
(D-332): 🚇 Rutas rotas, 📐 Loteo and 🖌️ Pintaminas. It follows the model of
[`../promo-video/`](../promo-video/README.md) (D-178): read it before touching the asset, and record
each round in [History](#history) and in [`../registro.json`](../registro.json).

## Today: version 1 (2026-10-15)

| | |
|---|---|
| Files | [`output/tres-nuevos-1080.jpg`](output/tres-nuevos-1080.jpg) (1080×1080) and [`whatsapp.txt`](whatsapp.txt) |
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

## How to rebuild it

```bash
# The boards (served site in SITE): then crop the board out of each screenshot into img/
node tools/e2e/look.mjs rutas stage
node tools/e2e/look.mjs loteo end
node tools/e2e/look.mjs pintaminas revealed
node marketing/tres-nuevos/construir.mjs     # tarjeta.html → output/tres-nuevos-1080.jpg
```

## History

- **v1 · 2026-10-15 · app 0.172.0:** first version, the owner's title «Upa, papá!».
