# Share cards

What is seen when someone pastes a link to the app in WhatsApp, in a chat or on a network (Open
Graph, D-51, D-181): room links travel over WhatsApp, so the invitation to play **is** one of these
cards. The same drawing makes the header of the feedback reply email (D-317).

| | |
|---|---|
| The drawing | [`card.html`](card.html): one page that draws the home page's card (per language), each game's (`?game=<id>`) and the email header (`?email`) |
| Served files | `public/assets/og/<image>.jpg` (1200×630, one per door and game) with their fingerprints in `huellas.json`, and `public/assets/email/header.jpg` (1200×340) |
| Made by | `node tools/release/og.mjs images [--all]` and `node tools/release/og.mjs header` (Chrome; the fonts come from Google Fonts) |
| Checked by | `node tools/release/og.mjs check`, in the `tests` check of each PR: an image drawn with another `card.html` or other texts fails |
| Texts | `public/assets/js/games.js` (name, emoji, tagline) and `COMMON` in `i18n.js`: change them there, never in the image |

`og.mjs` stays in `tools/release/`: besides the images it writes each page's `<!-- generated: og -->`
block and the bridge pages of the old routes, which are the site, not promotion (D-356). Changing
`card.html` (even a comment) changes every fingerprint: retake them with `og.mjs images --all`.
The rest, and when to retake the README's screenshots, is in the `readme-and-cards` skill.

## History

- **2026-10-18:** `card.html` moves here from `tools/release/og/` (D-356); the drawing does not change.
