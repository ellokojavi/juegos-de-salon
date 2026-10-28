# 🚂 Algo nuevo se viene… (`tren-en-vilo-pronto`)

A teaser of 🚂 Tren en Vilo, still in the lab (D-430): it says something new is coming, not what. No
game name, no link, and nothing about crossing (the owner's request: a mystery).

| | |
|---|---|
| Texts | es: "Muy pronto · Algo nuevo se viene…"; en: "Coming soon · Something new is coming…". `langs: ['es', 'en']`: pt and de see English |
| Item | a teaser: `public/assets/splash/bridges-teaser.mp4` (512×320, 8 s loop, 74 KB; it was a 373 KB GIF until #846), its first frame `bridges-teaser-start.png` as the poster and its still `bridges-teaser.png`, made by [`teaser.mjs`](../../teaser.mjs) from [`teaser/bridges.html`](../../teaser/bridges.html) |
| The scene | sunset, clouds and a flock of birds; the train rolls in on the cliff top, smoking, and stops where the track ends at the bridge's first bolt (the pink plate); the gap and the water beyond; a "?" pops up over the locomotive. The bridge is never shown |
| On | from its publish, through 2026-10-28 inclusive, queued after `tres-juegos-demo` (D-430) |
| Usability | full pass before merging (D-355) |

Screenshots at 390 px, as `node tools/e2e/look.mjs splash tren-en-vilo-pronto --lang <xx>` shows it:
[es](es-390.jpg) · [en](en-390.jpg) · [pt](pt-390.jpg) · [de](de-390.jpg).

## History

- **2026-10-22:** made with the owner, who trimmed the texts down to the kicker and the title.
- **2026-10-26:** off, superseded by [`tren-en-vilo-ya`](../tren-en-vilo-ya/README.md) when the game left
  the lab. Its entry stays in `CAMPAIGNS` (an id is never reused).
