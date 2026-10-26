# 🥂 ¡Un brindis por ti! (`brindis-apoyo`)

An invitation to support the site, with a laugh: Leonardo DiCaprio raising his glass in *The Great
Gatsby*. Its button opens the support card (`support.js`, D-449), where the player pays through
Stripe. Each phone sees it once, like every campaign.

| | |
|---|---|
| Texts | kicker "Salud" · title "¡Un brindis por ti!"; the card: "Gracias por jugar", a toast to every game, laugh and rematch, that the site is free and will stay free, and "si quieres devolver el brindis" the player can support it from US$1 (not "$1": in Chile that reads as one peso); button "💙 Apoyar Juegos de Salón" (`cta`, the blue heart the owner chose); in the four languages. The owner asked not to mention coffee here: a toast and a coffee together read oddly, so the coffee stays in the support card |
| Layout | `hero`: the clip as wide as the window, at its 480×200 shape |
| Item | GIPHY's clip [`rY93u9tQbybks`](https://giphy.com/gifs/great-dicaprio-leonardo-rY93u9tQbybks), as MP4 with its JPEG still as poster, **served from GIPHY's `media.giphy.com`**, not copied into `public/`: the scene belongs to the film, and GIPHY is what licenses it for sharing (`splash.test.mjs` allows outside media only from there). The version without letterbox bars was chosen among the `dicaprio-toast` results |
| Link | straight to Stripe's payment page (`PAYMENT_LINK` in `support.js`), not through the support card (the owner's request); Stripe brings the player back to `/?support=thanks` |
| On | off. Support is still in the lab (D-395): turn it on from the panel's 📣 Campaigns only once support is public, or players would land on a card they cannot open |
| Usability | full pass before it goes on (D-355) |

Screenshots at 390 px, as `node tools/e2e/look.mjs splash brindis-apoyo --lang <xx>` shows it:
[es](es-390.jpg) · [en](en-390.jpg) · [pt](pt-390.jpg) · [de](de-390.jpg).

## History

- **2026-10-26:** made at the owner's request, first as a coffee invitation; the owner asked for
  other words without the coffee, and the copy became a toast to the player. The owner then wrote their own version (free forever, support from $1, a blue heart), which was tightened into "devolver el brindis" and US$1.
