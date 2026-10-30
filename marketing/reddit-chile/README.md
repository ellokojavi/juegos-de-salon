# Reddit r/chile · solo o con amigos

The memory of the image and the post that present Juegos de Salón on Reddit's r/chile, for Chileans
aged 20 to 35, with the focus the owner chose: games to enjoy alone or with friends. It follows the
model of [`../promo-video/`](../promo-video/README.md) (D-178, D-356): read it before touching the
asset, and record each round in [History](#history) and in [`../registro.json`](../registro.json).

## Today: version 2 (2026-10-29)

| | |
|---|---|
| Files | [`output/reddit-chile-1080x1350.jpg`](output/reddit-chile-1080x1350.jpg) (1080×1350, 4:5) and [`reddit.md`](reddit.md) (title and body of the post) |
| Language | Spanish |
| Where it goes | Reddit r/chile, an image post with the text as its body (or a text post with the image) |
| App it shows | 0.234.20 |

**What it shows:** "Solo o con amigos" in Bangers yellow, "18 juegos en el celular, gratis y sin
descargar nada", and two rows of three real screenshots: 👥 Con amigos (📝 Generala's first roll with two dice kept, 🎲 Dudo's reveal, 🏆 La Copa's podium) and 🧩 Solo (📅 Uno al día's card on the home page,
👑 Reinas, 🚇 Rutas rotas with stage 1 solved). At the bottom, "Sin cuenta: tocas el link y juegas"
and `juegosdesalon.cl`. The colors, background and fonts are the app's (U-40, D-380): the values
come from `public/assets/css/base.css`, and the fonts are the same Google Fonts it imports.

**The post** names only games on the home page today (no lab), with the taglines of
`shareApp.lines` and `games.js`. "18 juegos" counts the available games of `PORTADA` besides La
Copa: if one is added or removed, the number changes here, in the image and in the post.

## Channel tips (r/chile)

The researched ranking of where else to post, with each community's rules: [`channels.md`](channels.md).
Every link in a post carries `?from=<channel>` (lowercase, `[a-z0-9-]`, up to 20 characters) so the
panel's traffic view counts it; this one is `?from=reddit-chile`.


- Read the subreddit's rules before posting: self-promotion is tolerated when it is honest and
  occasional. Say it is your own project, answer the comments, and do not repost it within weeks.
- Use the flair the subreddit offers for this (something like "Pregunta / Discusión" or
  "Humor / Ocio"; check which ones exist that day). A wrong flair gets the post removed.
- Best time: weekday evenings, 19:00 to 22:00 Chile time, or a Friday before the weekend.
- Stay the first hour answering: that is what makes a post rise on Reddit.

## How to rebuild it

```bash
python3 -m http.server 8794 -d public                     # in another terminal
node marketing/reddit-chile/capture.mjs                   # the six screens into img/ (SITE=http://localhost:8794)
node marketing/reddit-chile/build.mjs                  # card.html → output/reddit-chile-1080x1350.jpg
```

Each crop is set with `object-position` in `card.html`. Look at the result before delivering it:
text cut at the edges, the footer free of the second row, the contrast.

## History

- **v1 · 2026-10-19 · app 0.186.12:** first version. The owner chose r/chile, Chileans 20 to 35, and
  the focus "juegos para disfrutar solo o con amigos"; approved the image and the post as they are.
- **v2 · 2026-10-29 · app 0.234.20:** 👑 Cuarto Rey left the home page for the lab, so 📝 Generala takes its
  card and its line in the post; 18 games; the newer games are named in the post (Loteo, Pintaminas,
  Tren en Vilo, Agentes, ¿En qué año?); the link carries `?from=reddit-chile`; all six screenshots
  retaken (Reinas with its clock and textures).
