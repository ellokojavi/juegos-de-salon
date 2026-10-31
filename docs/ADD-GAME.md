# Adding a game

> A game is **its folder plus one entry in `games.js`**. The rules live in the [canons](CANONES.md)
> and the [usability rules](USABILIDAD.md); this page is only the order and where each piece goes
> (D-213). Every step names the test that fails without it.

## 1. The folder

`public/<folder>/`, in English, with C-2's files (`index.html`, `style.css`, `rules.js`,
`engine.js`, `engine.test.mjs`, `game.js`). Copy `index.html`'s `<head>` from another game: it brings
the manifest, the icon and the iPhone name, `instalable.js` (D-221, D-222), the preloads of
`nunito-latin.woff2` and `bangers-latin.woff2` right before `base.css` (`fonts-preload.test.mjs`) and
`<script src="../assets/js/vigia.js"></script>` with `trackVisit()` on load (D-251). A game in
development lives under `public/labs/` (D-395).

Inside it, what the canons ask, using the shared modules and never one of its own:

- **Texts** in `LOCALES = { es, en, pt }` in `rules.js` (C-3, parity test); instructions per U-18.
- **Modes** per C-5, with C-7's transport and, with a room, `room-flow.js` and its rules in
  `firebase/database.rules.json`.
- **Memory** with `createSessionStore` / `createNameStore` from `session.js` (C-6); `handoff.js`,
  `compartir.js`, `chat.js`, `sound.js`, `arrastre.js` (C-4, C-7, C-8, C-9, C-15); the board carries
  `data-tablero` (D-309).
- **The panel signal** (C-7, D-210): offline modes call `trackStart` / `trackFinish` from
  `transport/stats.js`; rooms are counted by the transport.
- **The result screen** (C-19): exits from `fin.js` for each context, looked at 390×812 and 320 px.
- **Rankings** (D-212): only La Copa's standalone games record them, through `cup/game.js`; a new
  game that should is a question for the owner.

## 2. The entry in `public/assets/js/games.js`

The manifest (#855): the home page, menu, panel, search, One a Day, La Copa's pool and the e2e scope
all read it. `manifest.test.mjs` checks that nothing keeps a copy of its own.

- `id` (never changes), `path`, `emoji`, `tipos` (keys of `TIPOS`, D-214), `nuevoDesde:
  'YYYY-MM-DD'` (D-333), and its place in `POPULARIDAD` (D-255); a new mode goes in `MODES`.
  The rest the home page asks is in C-17 (`games.test.mjs`).
- `keywords`: es, en, pt and de, at least three each (D-404; `search.test.mjs`).
- `reuses`, only if it plays another game's engine on purpose: those files, for the e2e scope
  (`scope.test.mjs`).
- `unoAlDia: { orden, desde, hasta?, grupo? }` if it enters One a Day: `orden` is the next free place
  (`manifest.test.mjs`); a group game's daily score function goes in `uno-al-dia.js`.
- `copa: { pozo }` if a cup week can pick it: the next free place in the pool. `POZO` in
  `cup/engine.js` is derived from it. Variants go in `VARIANTES` there (D-331).
- `lanza: '<flag>'` only if the finished game waits for the owner's 🚀 (D-517): add its row to `FLAGS`
  in `flag-list.js` and point its /labs/ card to the page. Until the flag is *all* the entry carries
  `oculto` (off the home page, search, filters, /records/ and `POZO_ABIERTO`); `POZO`, `POZO_FIJO` and
  One a Day's `desde` do not read the flag. The cleanup PR removes `lanza` and the row.

## 3. What stays elsewhere (code, not data)

| Piece | Where | Fails without it |
|---|---|---|
| Its screens for the e2e tests, under its `id`, plus `tools/e2e/<folder>/languages.mjs` and play scripts (C-12) | `tools/e2e/paths.mjs` | `manifest.test.mjs` (every game outside La Bodega) |
| A Cup game's loader | `public/cup/games/index.js` | `manifest.test.mjs` |
| A Cup game's demo scores (`PUNTAJE`) | `public/cup/demo.js` | `manifest.test.mjs` |
| A lab game's button | `public/labs/index.html` | `manifest.test.mjs` |
| A splash campaign naming it | `public/assets/js/splash.js` | `manifest.test.mjs` (the id must exist) |

`node tools/e2e/look.mjs <game> <screen> --width 320` to look at a screen.

## 4. Documentation and release

- **The spec**: `docs/games/<folder>.md`, with C-13's template (exceptions to the canons, the
  `window.__…` hook), requirements and decisions.
- **The README and link card**: the `readme-and-cards` skill (section, `docs/capturas.json`,
  `readme.py screenshots` / `update` / `seal`, `og.mjs cards` and `images`; once on the home page,
  `cards` also writes its JSON-LD and sitemap line, #887).
- **The changelog**: an unnumbered entry in `changelog/<branch>.md` (`node tools/release/changelog.mjs
  new minor`); the version is set on merge (C-11, D-300).
- **The checklist** at the end of the canons, whole; `node public/assets/js/games.test.mjs` counts
  the countable part (C-12).

A game enters the lab with documentation and a short usability review; the PR that takes it out
carries the full pass (D-304).
