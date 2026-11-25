# Seasonal templates (D-457)

Small nods to a date (Halloween, Thanksgiving, Christmas, New Year, Fiestas Patrias…) that dress **every
page of the site, the games included** (D-622, amending D-457): the palette, the favicon, the corner and
what falls reach every page; what moves across the screen (`flyby`, `peek`, `strut`, `scares`) stays on
the home page, where nobody is mid-play. Every page gets it from `tester-boot.js`, which `vigia.js`
already puts on every page but the panel: a new page or game needs nothing to take the skin.

## The pieces

| File | What it holds |
|---|---|
| `public/assets/season/templates.js` | `TEMPLATES`: one row per date, the only thing a new season edits besides its css |
| `public/assets/season/<id>.css` | that date's palette (`--fondo`) and the drawing of its corner (`.season-<id> .season-corner`) |
| `public/assets/js/season.js` | the engine: picks today's template, puts `season season-<id>` on `<html>`, loads the css, draws the favicon and the touches |
| `public/assets/css/season.css` | the touches every template shares: where each one sits and how it moves |
| `public/assets/js/season.test.mjs` | checks the dates, the fields, that no two templates share a day, and that `tester-boot.js` loads `season.js` (every page) |

## A template's fields

Only `from`, `to` and `public` are required; a template shows only the touches it names.

| Field | Example | What it does |
|---|---|---|
| `from`, `to` | `'10-26'`, `'10-31'` | the days it is on, `MM-DD`, both included, on the player's calendar; may cross New Year (`'12-31'` → `'01-01'`) |
| `public` | `false` | `false`: only lab key holders see it (D-395, D-409). Going out to everyone is `true` |
| `built` | `'2026-10-26'` | the lab bar's order (D-399) |
| `css` | `new URL('halloween.css', import.meta.url).href` | its stylesheet, written as a literal `new URL` so the e2e scope follows it (D-391) |
| `icon` | `{ emoji: '🎃', colors: ['#ff7a1a', '#5b1fb8'] }` | the tab's favicon, drawn in place like `assets/icon.svg` (the installed app's icon does not change) |
| `hero` | `['🎃', '👻']` | take turns with the home page's 🎲 cycle |
| `motes` | `['🦇', '👻']` (only what floats or flies) | one background particle in three becomes one of these (on pages that draw them: today the home page) |
| `flyby` | `'🦇'` | crosses the home page once per visit, right to left (the emoji faces left) |
| `scares` | `['💀', '🕷️', '👀', '🧟']` | a big fright on the home page 8 s after it opens and then every 40 s, a random one but never the same twice in a row: 💀 looms from the right, 🕷️ scuttles across, 👀 blink in the dark, 🧟 shambles up from below |
| `peek` | `{ emoji: '👻', chance: 1 / 15 }` | now and then rises from the bottom left edge of the home page and hides |
| `fall` | `{ emojis: ['🍂', '🍁'], count: 7, pace: [15, 24], sway: 10 }` | things that never stop falling, behind the page (they never cross a text or a button), on the home page and Rankings: `count` at a time, `pace` seconds from top to bottom, swaying `sway` px |
| `strut` | `{ emoji: '🦃', count: 1, every: 40000 }` | a line of `count` walks along the bottom of the home page, right to left, behind the page (seen through the cards, never over a game's icon, the owner's call), 3 s after it opens and then every `every` ms |
| `corner` | `true` | a decoration in the top right corner, drawn by the template's css |

## Adding one

1. A row in `TEMPLATES` with `public: false`, and its `<id>.css` next to it if it has a palette or a corner.
2. Look at it any day with `?season=<id>` (the home page's lab bar has a box per template); the rare
   touches (the peek) show every time there. While the template is `public: false` the parameter still
   needs a lab key (localhost counts as one); `?season=off` turns today's template off.
3. A card in `/labs/` for the template (`#seccion-<id>`, in *Mejoras en prueba*, with a button to `../?season=<id>`; Halloween's launched one is `#seccion-temporadas`), with its dates and what it does.
4. When the owner approves it, `public: true`. It turns itself on and off every year from then on.

## Moving or skipping one without a PR (D-477)

The panel's 📣 Campaigns → 🎨 Skins lists every template: *Every year* (its own days, the default),
*These days* (a start and an end date) or *Off*. It is saved to Firebase `controls/skins/<id>` and the
home page reads it before choosing (`public/assets/js/controls.js`, `seasonOf(date, templates, controls)`);
`?season=<id>` and `?test` still win over it.

Rules: nothing takes a tap or covers a button (`pointer-events: none`), nothing is text the player
reads (so nothing to translate), nothing moves under `prefers-reduced-motion`, and `?test` keeps it
off so the scripts and screenshots do not change.
