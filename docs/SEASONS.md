# Seasonal templates (D-457)

Small nods to a date (Halloween, Christmas, New Year, Fiestas Patrias…) on the pages players move
around in: the home page and Rankings. **Never the games**: they look the same all year.

## The pieces

| File | What it holds |
|---|---|
| `public/assets/season/templates.js` | `TEMPLATES`: one row per date, the only thing a new season edits besides its css |
| `public/assets/season/<id>.css` | that date's palette (`--fondo`) and the drawing of its corner (`.season-<id> .season-corner`) |
| `public/assets/js/season.js` | the engine: picks today's template, puts `season season-<id>` on `<html>`, loads the css, draws the favicon and the touches |
| `public/assets/css/season.css` | the touches every template shares: where each one sits and how it moves |
| `public/assets/js/season.test.mjs` | checks the dates, the fields, that no two templates share a day, and that no game loads `season.js` |

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
| `motes` | `['🦇', '🕷️', '💀']` | one background particle in three becomes one of these |
| `flyby` | `'🦇'` | crosses the home page once per visit |
| `peek` | `{ emoji: '👻', chance: 1 / 15 }` | now and then rises from the bottom left edge of the home page and hides |
| `corner` | `true` | a decoration in the top right corner, drawn by the template's css |

## Adding one

1. A row in `TEMPLATES` with `public: false`, and its `<id>.css` next to it if it has a palette or a corner.
2. Look at it any day with `?season=<id>` (the home page's lab bar has a box per template); the rare
   touches (the peek) show every time there.
3. A card in `/labs/` already names `#seccion-temporadas`; update its text for the new date.
4. When the owner approves it, `public: true`. It turns itself on and off every year from then on.

Rules: nothing takes a tap or covers a button (`pointer-events: none`), nothing is text the player
reads (so nothing to translate), nothing moves under `prefers-reduced-motion`, and `?test` keeps it
off so the scripts and screenshots do not change.
