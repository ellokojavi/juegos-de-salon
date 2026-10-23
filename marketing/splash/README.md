# The promotional splash

A window over the home page that announces something new (D-351): off by default, each phone sees
a campaign once. Several can be on: they queue up in the order they were turned on, and closing one
opens the next (D-430); with a lab key, the home page shows only the first one per visit (D-431). This folder is its memory: every campaign that was made, and how they are made.

| | |
|---|---|
| The code | `public/assets/js/splash.js` (`CAMPAIGNS` and the `ACTIVE` line) and `public/assets/css/splash.css` |
| Turned on and off | `node tools/agents/splash.mjs list \| on <id> [--until YYYY-MM-DD] \| off [<id>]`, in a PR (`on` adds it at the end of the queue) |
| Seen on demand | `/?splash=<id>` (a campaign that is not on: only with a lab key, D-395), and `node tools/e2e/look.mjs splash <id> [--width 320] [--lang de]` |
| Clips | [`capture.mjs`](capture.mjs), see [clips.md](clips.md) |
| Teasers | a drawn scene of a game that is coming, as a GIF: [`teaser.mjs`](teaser.mjs) records a page of [`teaser/`](teaser/) frame by frame (D-430) |
| Gives way to | The recap window (`assets/js/recap.js`): La Copa's of an ended cup (D-423) or Uno al día's of an ended season (D-424); on a visit that opens it, the splash waits for the next one; it reuses `splash.css`. With a lab key, one gate (`assets/js/home-windows.js`, D-431) opens one window per visit: recap, then splash, then the install bubble |
| Campaigns | [`campaigns/<id>/`](campaigns/): a README (what, when, which PR) and its screenshots in the four languages |

## Making a campaign

1. Its entry in `CAMPAIGNS` (a new id: it is what phones remember, never reused), texts in the
   four languages (or `langs: ['es', 'en']`, and the rest see English), and the clips of its games
   with `capture.mjs`, or a teaser with `teaser.mjs` (an item with only `img`, `still` and `ratio`).
2. Its folder `campaigns/<id>/` with the README and the screenshots (`look.mjs splash <id>` at
   390 px in es, en, pt and de, as JPEG). A test fails if a campaign has no folder.
3. `splash.mjs on <id> --until …` and the PR. **Before merging, the usability agent does a full
   pass of the campaign** (D-355): `covers.mjs check` names it, with its texts, and it is looked at
   in the four languages at 390 and 320 px.
4. When it ends, its README says how it went.

## Campaigns

| Campaign | Dates | Usability |
|---|---|---|
| [🎉 `tres-juegos-demo`](campaigns/tres-juegos-demo/) · ¡Tres juegos nuevos! | 2026-10-18 → 2026-10-23 | before D-355 |
| [🚂 `tren-en-vilo-pronto`](campaigns/tren-en-vilo-pronto/) · Algo nuevo se viene… (teaser) | 2026-10-22 → 2026-10-28 | full pass (D-355) |
