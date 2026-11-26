# What this site asks of a driving game

The rules live in their own docs (D-213); this page does not repeat them. It lists the ones a real-time
driving game runs into, says what each means **for this game**, and points at the owner of the rule.
Read CLAUDE.md first; load the `game-change` skill before writing game code, `css-change` before
any CSS and `player-text` before any text a player reads.

Facts here were checked against `main` on 2026-11-25. Check again before leaning on one: the repo
moves daily.

## The shape of the code

| Rule | What it means here | Owner |
|---|---|---|
| No build, no npm: plain ES modules served from `public/` | No bundler, no TypeScript, no package. A library is a file committed under `public/assets/js/vendor/` and served by the site, never a CDN (the QR library is the precedent). `architecture.mjs` fails an import or fetch to another host. | CLAUDE.md, [ARCHITECTURE.md](../ARCHITECTURE.md), `docs/canons/C-14.md` |
| A game is a folder with `game.json` and C-2's files | Start from `node tools/generators/new-game.mjs drift …`: it writes a lab game that passes every canon, with a placeholder game inside. Replace the placeholder, keep the shell. Do not hand-build the folder. | [ADD-GAME.md](../ADD-GAME.md), `docs/canons/C-2.md` |
| The engine is a pure state machine with its test | All physics, track and rules in `engine.js` with no DOM, no canvas, no clock of its own, tested in node by `engine.test.mjs`. This is also what makes the three paths one game. | `docs/canons/C-2.md`, `docs/canons/C-12.md` |
| A game leans only on shared code | Imports from `public/assets/` and its own folder only. If path 2 needs a module two games could use (a WebGL helper), it moves to `public/assets/js/`, which puts that PR in the 🟡 lane. | [ARCHITECTURE.md](../ARCHITECTURE.md), [LANES.md](../LANES.md) |
| One name inside and out | Folder, id, storage keys, the test hook `window.__<id>`, `tools/e2e/<id>/`, `docs/games/<id>.md` all carry the English version of the player-facing name. Renaming later means renaming them all with a migration: settle the name before the first PR. | `docs/canons/C-20.md` |
| Everything internal in English | Code, comments, docs, commits, PRs. New file names in Spanish fail `english.test.mjs`. | CLAUDE.md |

## The lab

| Rule | What it means here | Owner |
|---|---|---|
| A game enters the lab with all its canons (D-579) | The **first** PR is already a whole game: cover through `coverWithDialogs`, result with exits from `fin.js`, rankings block, panel signals, footer, spec, e2e script, three languages. There is no "engine only" PR that adds a `public/labs/drift/` folder without them: `public/labs/canons.test.mjs` fails it. The generator's output passes; keep it passing while the placeholder becomes a grey-box drive. | [ADD-GAME.md](../ADD-GAME.md), "The entry gate" |
| The lab is invisible to players (D-617) | No mention on the home page, in Rankings, privacy, menus or shares until the owner turns it on for all. A lab game's page carries the lab door and `noindex`. | CLAUDE.md, [AGENTS.md](../AGENTS.md) |
| Sub-features get their own flag | A second renderer, a control scheme under trial or a ghost goes behind `flag('<id>')` (`public/assets/js/flags.js`), with its card in `/labs/` and its switch in the tester «T» tab. Lab cards are at most 25 words (`short-cards.test.mjs`). | CLAUDE.md, [AGENTS.md](../AGENTS.md) |
| Launching is a playbook | When the owner wants it out: the `launch-game` skill and [LAUNCH.md](../LAUNCH.md). Not before, and never as part of a build phase. | [LAUNCH.md](../LAUNCH.md) |

## The player's phone

| Rule | What it means here | Owner |
|---|---|---|
| 320 px wide, upright, touch (C-8) | The game is played in portrait. Controls are 44 px or larger, reachable by thumbs, and never under the system's bottom bar. No sideways scroll. A driving game that needs landscape or a keyboard fails here; keyboard is an extra for desktop. | `docs/canons/C-8.md` |
| The start button above the fold at 320×568 and 375×667 | The cover is a card over the stage, as in Flap. `node tools/e2e/landing-fold.mjs --only drift` must pass, and `push-guard` stops a push that changed the cover without it. | [USABILIDAD.md](../USABILIDAD.md) U-39 |
| Instructions per U-18 | The goal first, at most three points, folded on the cover. A driving game explains itself in the first five seconds or not at all: a first-run hint on the stage does more than the instructions. | [USABILIDAD.md](../USABILIDAD.md) |
| Three languages, same keys (C-3) | Spanish, English, Portuguese, in `LOCALES` in `rules.js`. HUD words too: «Puerta 2 de 20», never «GATE». Numbers and times need no translation. | `docs/canons/C-3.md` |
| Sound and vibration with a mute (C-4) | Through `sound.js`. Engine and skid sounds are synthesised (Flap's tones are the model): no audio files to carry. The site's 🔊 silences them. | `docs/canons/C-4.md` |
| Every game can be resumed (C-6) | A run is two minutes, but a call can interrupt it. Plan: the page pauses when hidden, and the session store keeps a checkpoint at each gate ([core.md](core.md), "Memory"). If that proves wrong, the exception is written in the spec with its reason, as Tembleque did. | `docs/canons/C-6.md` |
| One tap on a button that waits on an animation (C-14) | «Jugar» runs the shared 3, 2, 1 (`cuenta-regresiva.js`); its e2e script double-taps it. The console stays clean. | `docs/canons/C-14.md` |
| The result screen (C-19) | Exits from `salidasFin`, each fact once: the time, the penalties, the place. One share button. | `docs/canons/C-19.md` |
| Reduced motion | With `prefers-reduced-motion`, no camera sway, no cover demo movement, no particles that are not information. The game itself still moves: it is the game. | `docs/canons/C-8.md` |
| The design system | The page (topbar, cover card, HUD chips, result) uses `base.css` tokens and shared classes; `design-lint.mjs` on the game's `style.css` reports zero. What is drawn **inside the canvas** is the game's own and is declared once, at the top of the scene file. | [DESIGN.md](../DESIGN.md), `docs/canons/C-1.md` |
| Every changed screen is measured (D-570) | Cover, stage with HUD, pause, result: shot by the e2e script and checked with `look.mjs` at 390 and 320 px; the PR lists what was measured. | [DESIGN.md](../DESIGN.md) rule 10 |

## Weight and offline

| Rule | What it means here | Owner |
|---|---|---|
| Nothing over 5 MB in git; no video under `marketing/` | Tracks are data of a few hundred bytes each. Scenery is generated in code, not modelled files. If path 2 or 3 ever wants model or texture files, that is a decision with its own weight budget, not a default. | [REPO-WEIGHT.md](../REPO-WEIGHT.md) |
| The precache stays under 8 MB, about 4 MB used | The lab is not precached, so nothing counts until launch. A launched game that plays offline adds its folder and what it imports. A vendored 3D library of around a megabyte would be a quarter of the remaining room: one more reason path 2 weighs its renderer before choosing ([path-2-3d.md](path-2-3d.md)). | [OFFLINE.md](../OFFLINE.md), `tools/release/precache.test.mjs` |
| Performance lessons already paid for | From Flap's scene: no `shadowBlur` (it cost about 50 ms a frame on a 3× phone), sprites drawn once, canvas at most 2× the CSS size. From the dice: a page that makes many WebGL contexts runs out, so hand a context back when done. | `docs/games/flap.md`, `public/assets/js/dado3d.js` |

## Scores, data, privacy

| Rule | What it means here | Owner |
|---|---|---|
| Whether a game records a score is the owner's question | Asked in PROGRESS.md. If yes: `avisoPartida({ juego, s, ms })` from `ranking.js`, and the table added to `SOLO_TABLES` in `games.js` so Rankings shows it (`rankings-coverage.test.mjs`). | [ADD-GAME.md](../ADD-GAME.md), the `owner-tools` skill |
| How a record is ordered | A record is `{ s, ms }`, ordered by higher `s` first and lower `ms` second (`claveOrden` in `records.js`). Limits: `s` up to 100 000, `ms` up to 99 999 999. A time trial fits: see [core.md](core.md), "Scores". | `public/assets/js/records.js` |
| Tables need no new Firebase rule | The rules accept any table named `[a-z][a-z0-9-]{0,24}` with an optional `_suffix` of up to 16 characters, for the periods all-time, week and day. So `drift` or `drift_<stage>` works as is. **Any** change to `firebase/database.rules.json` is 🔴 and waits for the owner. | [firebase/README.md](../../firebase/README.md), [LANES.md](../LANES.md) |
| Storing something new about players changes `/privacy/` | Best times and ghosts kept **on the phone** follow what other games already do; check `public/privacy/texts.js` says so. A ghost uploaded to Firebase is new data: a 🔴 PR that edits the privacy page. | CLAUDE.md |
| Storage keys | Every `localStorage` key starts with `juegos-de-salon:`. | [ARCHITECTURE.md](../ARCHITECTURE.md) |
| The panel learns on its own (C-16) | `trackStart` and `trackFinish` from `transport/stats.js`; nothing else to touch. These signals are also how the lab phase is judged. | `docs/canons/C-16.md`, [PANEL.md](../PANEL.md) |
| Seeded randomness | Anything random a test must replay draws from a seeded generator (`azar.js`, or the engine's own `rng(seed)` as Flap does). `Math.random()` never decides a track or a physics outcome. | [REPLAY.md](../REPLAY.md) |

## How the work ships

| Rule | What it means here | Owner |
|---|---|---|
| Own worktree, topic branch, one push at the end | One phase, one branch, one PR. | [SESSIONS.md](../SESSIONS.md) |
| A changelog entry per PR, no number | `node tools/release/changelog.mjs new [patch\|minor]`. | CLAUDE.md |
| The lane decides the review | `node tools/agents/lanes.mjs check`. Files under `public/labs/**` and docs are 🟢; the generator also touches shared files (the lab index, `tools/e2e/paths.mjs`, the manifests), so expect the first PR to be 🟡. Do not assume: run it. | [LANES.md](../LANES.md) |
| Tests | All `*.test.mjs` before the PR; end to end only the game's own scripts, never the whole `ci.mjs`. | [SESSIONS.md](../SESSIONS.md), [tools/e2e/README.md](../../tools/e2e/README.md) |
| Open the PR and drive it to merge | Auto-merge when the lane allows, watch it, fix a red check without being asked. During a feel round the owner reviews on the preview first (D-429): then no auto-merge until they say so. | CLAUDE.md, [MERGING.md](../MERGING.md) |
| A D-n only for a real policy choice | Expected ones are named in the paths: the renderer choice in path 2 is one. A tuning value is not. | CLAUDE.md |
| What the owner is shown | A proposal for a screen is a screenshot of the real page with its own CSS, sent as a link that opens on the phone, never a drawing by hand or a file path (U-41). | [USABILIDAD.md](../USABILIDAD.md) |

## What does not exist yet and this game needs

- **No 3D library on the site.** The 3D there is today is written by hand: the dice
  (`public/assets/js/dado3d.js`, raw WebGL, 191 lines), the globe of Dónde
  (`public/cup/games/where/globo.js`, a WebGL shader), and Tembleque's hard level, which draws its
  3D on a 2D canvas. So there is precedent for small hand-written 3D and none for a scene graph.
- **No clock with thousandths.** `time-format.js` has `mmss`. A time-trial clock (`m:ss.mmm`) is
  written in the game's folder first; it moves to shared code only when a second game needs it.
- **No real-time vehicle physics, no touch driving controls, no camera.** Flap and Stack are the
  nearest relatives (a fixed-step loop, a canvas scene, a demo on the cover): read
  `public/labs/flap/` before writing a line.
