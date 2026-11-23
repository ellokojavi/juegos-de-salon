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
  `instalable.js`, and the first-paint offline script so Candlelight shows from the first frame, `offline-first-paint.test.mjs`; D-221, D-222, D-251, D-281, D-609), `style.css` on the tokens only, `rules.js` with
  `LOCALES = { es, en, pt }` (same keys), `engine.js` a pure state machine with `engine.test.mjs`, and
  `game.js` with the session store (C-6), the panel signal `trackStart` / `trackFinish` (C-7, D-210),
  the result's exits from `fin.js` (C-19) and its share through `compartir.js`.
- `public/assets/js/manifests/labs/<id>.js`, the manifest as a module (`game.js` reads it).
- Its card in `public/labs/index.html`, first in 🎲 Juegos en prueba (D-409), its title opening with the game's drawing (or its emoji), which the lab's index pill shows too (`index-nav.test.mjs`).
- `docs/games/<id>.md` with C-13's sections, `tools/e2e/<id>/game.mjs`, a script that plays it to the result, and `tools/e2e/<id>/languages.mjs`.
- A game La Copa plays shows its `portada` (or else its `ejemplo`) alone in `cup/cover/?game=<id>`, which the home page's game sheet frames in the lab (sub-flag `home-carousels-sheet` of `home-carousels`): keep that animation self-contained: the frame may show it from 0.5× to 3× its size (it fills the room the sheet leaves), and a paragraph with a link inside it (a credit line) is hidden there.
- Its cover in `tools/e2e/paths.mjs` (`'<id>': { intro: [] }`), so `landing-fold.mjs` measures it; the cover goes through `coverWithDialogs` and the result through `finDePartida` (the rankings).

The game inside is a placeholder (a race to ten). Replace it, keeping what surrounds it:

- **Styles** from the tokens and classes of `base.css` (C-1, D-533, [DESIGN.md](DESIGN.md)): no distance, corner or colour written by hand; thematic colours declared once at the top of `style.css`. The game shell (screens, the cover's hero, modes, fields, the segmented control, player and toggle rows, the room, the result's hero) lives once in `base.css` (DESIGN.md §2): `style.css` holds only what is the game's own, and `node tools/agents/design-lint.mjs public/labs/<id>/style.css` must report zero (a gate: `design-lint.test.mjs`). An exception is an allowlist entry with its reason (§4).
- **The cover ends with the site footer** (`footerInto` from `site-footer.js`, C-17): the game's own 💬 comment is its option, shown as a tile on the cover and alone while playing. `canons.test.mjs` (subject `footer`) fails a lab game without the footer or without a way to leave feedback.
- **Texts** in `LOCALES` in `rules.js` (C-3, parity test); instructions per U-18; `node tools/agents/usability-lint.mjs` must stay green.
- **Modes** per C-5, with C-7's transport and, with a room, `room-flow.js` and its rules in
  `firebase/database.rules.json`; list them in `game.json` (`modes`, `ai`, `firebasePaths`).
- **Memory, sharing, the pass screen** with the shared modules: `session.js` (C-6), `compartir.js`,
  `handoff.js`, `chat.js`, `sound.js`, `arrastre.js` (C-4, C-7, C-8, C-9, C-15); the board carries
  `data-tablero` (D-309).
- **The result screen** (C-19): exits from `fin.js` for each context, looked at 390×812 and 320 px. In One a Day it is the only screen after the last move (D-581).
- **Rankings** (D-212, D-559): whether a game records a score is a question for the owner. One that does
  (`avisoPartida()`) adds its table to `SOLO_TABLES` in `games.js` so Rankings shows its tab
  (`rankings-coverage.test.mjs` fails otherwise; a game whose first variant keeps its own table, like
  Sudoku's `sudoku_easy`, also adds a row to `FIRST_VARIANT_TABLES`), and its e2e script checks the tab on `/records/`.
  The panel names it on its own (`gameById`).

## The entry gate: a game enters the lab with its canons (D-579)

The lab is where a game is **tried**, not where its canons are put off. Before its first PR merges,
ours or a contributor's, a lab game passes **every** canon of the checklist at the end of
[CANONS.md](CANONS.md), the same as a published game. A contributor brings them built; the
contributions agent and the owner only check. The generator's game passes all of this as born, so
the work is to keep it passing while the placeholder becomes the real game.

`node public/labs/canons.test.mjs` (in the `tests` check) fails a `labs/<id>/` that lacks:

| Subject | What | Canon |
|---|---|---|
| `manifest` | its `game.json`, so the conformance suite below runs over it | C-2 |
| `cover-measured` | the cover exists is not enough: its landing in `tools/e2e/paths.mjs` with `intro`, so `landing-fold.mjs` measures the cover at 320 and 375 px | C-17, U-39 |
| `exits` | the result's exits from `salidasFin` in `fin.js` | C-19 |
| `rankings` | the result in the rankings: `finDePartida`, `bloqueTabla` or `avisoPartida` | C-19, D-559 |
| `dialogs` | the cover through `coverWithDialogs`: «📖 Instrucciones» and «👤 Entrar» as dialogs | C-8 |
| `signals` | `trackStart` and `trackFinish`, so the panel sees it from its first game | C-7, C-16, D-210 |
| `footer` | the cover ends with the site footer (`footerInto` or `mountFooter`) and keeps a feedback option: the general inbox, or the game's own comment in `options` when it passes `inbox: false` | C-17 |
| `spec` | its `docs/games/<id>.md`, with its exceptions to the canons | C-13 |
| `e2e` | `tools/e2e/<id>/` with a script that plays it to the result and its `languages.mjs` | C-12, D-199 |

A canon the game breaks on purpose is a `canonExceptions` entry whose reason names the subject
(`cover`, `fin.js`, `rankings`, `cover-dialogs`, `trackStart`, `e2e`), copied from its spec. The lab
games older than the rule owe what `docs/labs-canon-debt.json` lists: a ratchet, each list only
shrinks, no new game joins it, and a game pays its debt before it leaves the lab. The check reads all of
a game's code (every `.js` and `.html` in its folder, inline scripts included), and accepts any of the
rankings' blocks (`finDePartida`, `avisoPartida`, `bloqueTabla`, `bloqueRanking`, `bloqueVictorias`). **La Bodega is
parked work, not maintained**: its games are outside the gate and owe nothing; one that comes back
out of La Bodega passes the gate then.

**Every canon and who checks it.** The rest of the checklist is enforced elsewhere; nothing on it is
left for "later":

| Checklist item (CANONS.md) | Checked by |
|---|---|
| C-2 files, C-3 three languages with the same keys, C-6 memory, sharing through `compartir.js`, exits from `fin.js` | `node public/assets/js/conformance.test.mjs`; in the browser `node tools/e2e/conformance.mjs labs/<id>` (load, languages, back, resume, share, result) |
| Its name translated or in `SAME_NAME` (C-3) | `game-names.test.mjs` |
| Styles on the tokens and the shared shell only (C-1, DESIGN.md) | `node tools/agents/design-lint.mjs public/labs/<id>/style.css` = 0 (`design-lint.test.mjs`) |
| The cover ends with the site footer and a feedback option (C-17) | `public/labs/canons.test.mjs` (`footer`), `site-footer.test.mjs` for its links |
| Start button above the fold at 320×568 and 375×667, every language (U-39, D-344) | `node tools/e2e/landing-fold.mjs <id>` (its `cover` above puts it there) |
| Its screens in every language (C-12, D-199) | `node tools/e2e/<id>/languages.mjs` |
| Watchdog before the stylesheets, `trackVisit()` (C-7, D-251) | `vigia.test.mjs` |
| The lab's door and `noindex` (D-395) | `labs-puerta.test.mjs` |
| Its card in `/labs/` with its drawing (D-409) | `index-nav.test.mjs`, `listed.test.mjs` |
| A score table in `SOLO_TABLES` (and `FIRST_VARIANT_TABLES` if the first variant has its own) so Rankings shows it (D-559) | `rankings-coverage.test.mjs` |
| Instructions per U-18, no clumsy text (C-1, C-8) | `usability-lint.test.mjs`, and the usability agent's short review (D-304) |
| One tap on a button that waits on an animation, its script double-taps it (C-14, D-576) | `tools/e2e/double-tap.mjs` and the game's script; 👁 the reviewer |
| Rooms: `tryRoom`, `roomMessage()`, chat module, Firebase rules (C-7, C-14, C-15) | `room-state.test.mjs`, conformance; 👁 the reviewer |
| URLs in English, one name inside and out (C-18, C-20) | `parametros.test.mjs`, `english.test.mjs`, `identifiers.test.mjs` |
| Nothing over 5 MB (D-494) | `repo-weight.test.mjs` |
| Sound and vibration with a mute (C-4), result before the pass (C-9), secrets committed (C-10), each fact said once on the result (C-19) | 👁 judged: the session building it, the usability agent and, for a contributor, the contributions agent |

The 👁 items are as binding as the 🤖 ones: the reviewer names any that fails and the PR waits.

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
- `icon: '<folder>/icon.svg'` (path from the site root) when no emoji fits the game: the drawing then shows
  everywhere on screen —list, pills, buttons, dice, share images— through `game-icon.js`, and `emoji` stays as
  the text stand-in (messages, `<title>`). Never write `.emoji` into the screen yourself: DESIGN.md rule 9,
  `game-icons.test.mjs`.
- `reuses`, only if it plays another game's engine on purpose: those files, for the e2e scope
  (`scope.test.mjs`).
- `unoAlDia: { orden, desde, hasta?, grupo? }` if it enters One a Day: `orden` is the next free place
  (`manifest.test.mjs`); a group game's daily score function goes in `uno-al-dia.js`.
  Its today mode ends on **one result page** (C-19, D-581): no screen between the last move and the
  result; what a game would show in between (a summary, the day's score, a ranking) is a block of
  that page, with One a Day's card (`ponerTarjeta`) right under the hero.
- `modes`, `ai`, `memory` (the C-6 session key), `languages`, `firebasePaths` and `canonExceptions`.
- La Copa is a manifest too (`public/cup/game.json`): a tournament, with `torneo: true`, `durationUnit` and `formato`, which only a tournament may carry.
- **La Copa's standalone games (`SUELTOS`) are not manifests:** they are not a game folder with C-2's files but engines and screens inside `public/cup/games/`, played through La Copa's page (`cup/suelto/`), so their entries stay in `SUELTOS`.
- Fields the schema does not have yet (`copa: { pozo }`, `lanza`, `oculto`)
  stay in a games.js entry written by hand until the schema takes them:
  - `copa: { pozo }` if a cup week can pick it: the next free place in the pool. `POZO` in
    `cup/engine.js` is derived from it. Variants go in `VARIANTES` there (D-331).
  - `lanza: '<flag>'` only if the finished game waits for the owner's 🚀 (D-517): add its row to `FLAGS`
    in `flag-list.js` and point its /labs/ card to the page. Until the flag is *all* the entry carries
    `oculto` (off the home page, search, filters, /records/ and `POZO_ABIERTO`); its ✨ Nuevo label starts the
    moment the flag goes to *all*, whatever `nuevoDesde` says (D-556); `POZO`, `POZO_FIJO` and
    One a Day's `desde` do not read the flag. The cleanup PR removes `lanza` and the row, and moves
    the card's HTML for good to ✨ Mejoras lanzadas, dated, where Sudoku, Aletazo, Shinobi and Babel are
    (🎲 Juegos guardados keeps the games that did not prosper). Until then `/labs/` moves it there on its
    own when the flag is *all* (`launched.js`, D-534), an improvement's and a game's alike.

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

A game enters the lab with its canons built and checked (D-579, above), its documentation and a short
usability review; the PR that takes it out carries the full usability pass on top (D-304).
