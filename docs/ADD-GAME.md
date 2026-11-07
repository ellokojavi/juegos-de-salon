# Adding a game

> A game is **its folder with its `game.json`** (#1249). The rules live in the [canons](CANONS.md)
> and the [usability rules](USABILIDAD.md); this page is only the order and where each piece goes
> (D-213). Every step names the test that fails without it.

## 1. Run the generator

```
node tools/generators/new-game.mjs <id> --name-es "…" --name-en "…" --name-pt "…" --emoji 🎯
```

`<id>` is the English version of the game's name, lowercase and hyphenated: the folder, the id, the
keys and the docs (C-20). It writes a working game **in the lab** (D-395), which passes every rule as
born (`tools/generators/new-game.test.mjs` proves it on a fresh one, untouched):

- `public/labs/<id>/` with C-2's files plus `game.json`: `index.html` with the head every page needs
  (the lab's door `labs-puerta.js` and `noindex`, the manifest and icon, `vigia.js`, the font preloads,
  `instalable.js`; D-221, D-222, D-251, D-281), `style.css` on the tokens only, `rules.js` with
  `LOCALES = { es, en, pt }` (same keys), `engine.js` a pure state machine with `engine.test.mjs`, and
  `game.js` with the session store (C-6), the panel signal `trackStart` / `trackFinish` (C-7, D-210),
  the result's exits from `fin.js` (C-19) and its share through `compartir.js`.
- `public/assets/js/manifests/labs/<id>.js`, the manifest as a module (`game.js` reads it).
- Its card in `public/labs/index.html`, first in 🎲 Juegos en prueba (D-409).
- `docs/games/<id>.md` with C-13's sections, and `tools/e2e/<id>/game.mjs`, a script that plays it to the result.

The game inside is a placeholder (a race to ten). Replace it, keeping what surrounds it:

- **Styles** from the tokens and classes of `base.css` (C-1, D-533, [DESIGN.md](DESIGN.md)): no distance, corner or colour written by hand; thematic colours declared once at the top of `style.css`. The game shell (screens, the cover's hero, modes, fields, the segmented control, player and toggle rows, the room, the result's hero) lives once in `base.css` (DESIGN.md §2): `style.css` holds only what is the game's own, and `node tools/agents/design-lint.mjs public/labs/<id>/style.css` must report zero (a gate: `design-lint.test.mjs`). An exception is an allowlist entry with its reason (§4).
- **Texts** in `LOCALES` in `rules.js` (C-3, parity test); instructions per U-18; `node tools/agents/usability-lint.mjs` must stay green.
- **Modes** per C-5, with C-7's transport and, with a room, `room-flow.js` and its rules in
  `firebase/database.rules.json`; list them in `game.json` (`modes`, `ai`, `firebasePaths`).
- **Memory, sharing, the pass screen** with the shared modules: `session.js` (C-6), `compartir.js`,
  `handoff.js`, `chat.js`, `sound.js`, `arrastre.js` (C-4, C-7, C-8, C-9, C-15); the board carries
  `data-tablero` (D-309).
- **The result screen** (C-19): exits from `fin.js` for each context, looked at 390×812 and 320 px.
- **Rankings** (D-212): only La Copa's standalone games record them, through `cup/game.js`; a new
  game that should is a question for the owner.

**The conformance suite** checks all of this for every game with a `game.json`:
`node public/assets/js/conformance.test.mjs` (the files, the languages, the shared modules; in the
`tests` check) and `node tools/e2e/conformance.mjs labs/<id>` in the browser (load, languages, back,
resume, share, result; one CI part per game). A canon the game breaks on purpose goes in
`canonExceptions` with its reason, copied from its doc's "Excepciones a los cánones"; the check skips it
when that reason names what the check is about (`compartir.js`, `fin.js`, `session.js`, a C-2 file).

The PR that adds it runs `python3 tools/release/readme.py update` and, once the README is reread, `seal`.

## 2. Its manifest, `game.json`

The facts about the game live in `public/<folder>/game.json` (#1249; the schema and `validateManifest`
in `public/assets/js/game-manifest.js`). After editing it run `node tools/generators/manifests.mjs`,
which writes `public/assets/js/manifests/<folder>.js`. A game in GAMES imports that module in
`public/assets/js/games.js` and builds its entry with `catalogEntry(…)`, so the home page, menu, panel,
search, One a Day, La Copa's pool and the e2e scope read the same shape as always (`manifest.test.mjs`,
`game-manifest.test.mjs`). A game in GAMES without a `game.json` fails `conformance.test.mjs` unless it is
old debt in `docs/manifest-debt.json`, which only shrinks; an old entry moves with
`node tools/generators/manifests.mjs migrate <folder> --modes …`.

- `id`, `path`, `emoji`, `name`, `tagline`, `tipos` (keys of `TIPOS`, D-214), `players` as `{ min, max }`,
  `duration`, `nuevoDesde: 'YYYY-MM-DD'` (D-333), and its place in `POPULARIDAD` in games.js (D-255);
  a new mode goes in `MODES`. The rest the home page asks is in C-17 (`games.test.mjs`).
- `keywords`: es, en and pt, at least three each (D-404; `search.test.mjs`); a lab game may go without.
- `labs: true` and `slug` while it lives under `public/labs/` (C-18).
- `reuses`, only if it plays another game's engine on purpose: those files, for the e2e scope
  (`scope.test.mjs`).
- `unoAlDia: { orden, desde, hasta?, grupo? }` if it enters One a Day: `orden` is the next free place
  (`manifest.test.mjs`); a group game's daily score function goes in `uno-al-dia.js`.
- `modes`, `ai`, `memory` (the C-6 session key), `languages`, `firebasePaths` and `canonExceptions`.
- La Copa is a manifest too (`public/cup/game.json`): a tournament, with `torneo: true`, `durationUnit` and `formato`, which only a tournament may carry.
- **La Copa's standalone games (`SUELTOS`) are not manifests:** they are not a game folder with C-2's files but engines and screens inside `public/cup/games/`, played through La Copa's page (`cup/suelto/`), so their entries stay in `SUELTOS`.
- Fields the schema does not have yet (`copa: { pozo }`, `lanza`, `oculto`, La Copa's tournament fields)
  stay in a games.js entry written by hand until the schema takes them:
  - `copa: { pozo }` if a cup week can pick it: the next free place in the pool. `POZO` in
    `cup/engine.js` is derived from it. Variants go in `VARIANTES` there (D-331).
  - `lanza: '<flag>'` only if the finished game waits for the owner's 🚀 (D-517): add its row to `FLAGS`
    in `flag-list.js` and point its /labs/ card to the page. Until the flag is *all* the entry carries
    `oculto` (off the home page, search, filters, /records/ and `POZO_ABIERTO`); `POZO`, `POZO_FIJO` and
    One a Day's `desde` do not read the flag. The cleanup PR removes `lanza` and the row, and moves
    the card to 🎲 Juegos guardados (D-479): `/labs/` moves only improvement cards on its own when a
    flag is *all* (`launched.js`, D-534), not a game's.

Taking it out of the lab moves its folder to `public/<id>/` (the old path becomes a bridge, C-18), drops
`labs`, adds it to GAMES and its screens to `tools/e2e/paths.mjs` (section 3).

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
