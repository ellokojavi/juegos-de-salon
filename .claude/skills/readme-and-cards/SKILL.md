---
name: readme-and-cards
description: The README, its screenshots and the WhatsApp/social link cards of Juegos de Salón (C-13, D-51, D-181). Use before touching README.md, docs/capturas.json, screenshots, og cards, the app icons or the push-notification tools (vapid.mjs, notify.mjs, release.mjs), and whenever the owner says "Actualiza el README".
---

# README, screenshots and social cards (C-13, D-51, D-181)

The `tests` check on each PR blocks an out-of-date README or card.

```bash
python3 tools/release/readme.py check        # is anything behind?
python3 tools/release/readme.py update     # rewrites the <!-- generated: ... --> blocks
python3 tools/release/readme.py screenshots <section> [--offline]   # redoes the screenshots with Chrome
python3 tools/release/readme.py seal         # "I reread the README with these facts"
node tools/e2e/contact-sheet.mjs <section> --out /tmp/contact-sheet   # look at them together (D-76)
node tools/release/og.mjs cards | images | check           # WhatsApp cards (D-72); cards also writes the JSON-LD, sitemap.xml and robots.txt (#887)
node tools/release/icons.mjs                                    # PNG icons for the installable app, from assets/icon.svg (D-221)
node tools/push/vapid.mjs                                        # the notifications key: already run (D-225), not redone
node tools/push/notify.mjs --dry-run | --test <code>           # which notifications it would send (Cups and Uno al día (One a Day)), or a test one to a Cup (D-224, D-230)
node tools/push/release.mjs --pr <n> --version <x.y.z> [--failed <job>] [--run-url URL] [--dry-run]   # the owner's "live" notification, run by publish.yml (D-504)
```

- **An out-of-date screenshot is a warning in an ordinary PR. "Actualiza el README" (update the README) is a full pass**,
  at the owner's request: generated blocks, prose **and every screenshot** that `check` flags, looked at
  on the contact sheet and only then sealed; it is not delivered with pending warnings (D-213).
- Inside `<!-- generated: ... -->` nothing is edited by hand. Each screenshot declares in
  [docs/capturas.json](../../../docs/capturas.json) which `tools/e2e/` script and which shot it comes from.
- The card images are redone **from a branch up to date with `main`**; they only change if
  a name, an emoji, a tagline or the design changes ([marketing/share-cards/card.html](../../../marketing/share-cards/card.html)).
- **Search engines (#887):** `og.mjs cards` writes, inside each indexed page's generated og block, a
  JSON-LD script (home-page games: VideoGame + WebApplication; the four doors: WebSite; nothing for lab,
  La Bodega, switched-off pages or bridges; a game whose `rules.js` has `howText` or `rules` also gets its
  "Cómo se juega" as a one-question FAQPage, the same text the cover shows: the owner chose that over a
  separate FAQ block on the cover, D-488; a Cup game's own page gets its `como` steps from `public/cup/rules.js`), plus `public/sitemap.xml` (doors with hreflang alternates) and
  `public/robots.txt`. They are generated from `games.js` and each game's `rules.js`: never edited by hand, and `og.mjs check` blocks
  them stale (`tools/release/json-ld.test.mjs`). Each door's WebSite name is in its own language, and
  `tools/e2e/structured-data.mjs` checks against the rendered page that every name and FAQ answer is what it shows.
