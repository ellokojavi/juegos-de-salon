# Canons and standards of Juegos de Salón

Building rules for **every** game in the app, current and future.
Read the ones you need **before** building a new game and **before** changing an existing one: this file is the index, each canon lives in `docs/canons/C-n.md`, and the checklist below names which canon each line comes from. The `game-change` skill loads this for you.
Each canon has an ID (C-n) so it can be cited in code, commits and decisions.
Each canon's form (🤖 checked, 📈 ratcheted, 👁 judged) and what enforces it are in the generated index of [RULES.md](RULES.md) (D-541).

> If a canon gets in the way in a specific case, it is not ignored silently: the exception is
> documented in the game's spec and, if it suits everyone, this file is changed.

---

## C-1 · Identity and tone

Voice, audience, palette, fonts and the design system every game shares. → [canons/C-1.md](canons/C-1.md)

## C-2 · Structure of a game

The files and screens every game has, and where each thing lives. → [canons/C-2.md](canons/C-2.md)

## C-3 · Languages

Spanish by default, English and Portuguese by hand; every text in all three, no loose strings. → [canons/C-3.md](canons/C-3.md)

## C-4 · Sound and vibration

Sound and vibration on key actions, with a mute button. → [canons/C-4.md](canons/C-4.md)

## C-5 · Game modes

The game modes (one phone, rooms, solo) and which a game offers. → [canons/C-5.md](canons/C-5.md)

## C-6 · Game memory (required in every mode)

Every game can be resumed in every mode. → [canons/C-6.md](canons/C-6.md)

## C-7 · Transport and multiplayer

Rooms, Firebase transport, sharing and the watchdog. → [canons/C-7.md](canons/C-7.md)

## C-8 · Touch interface

Touch: 44 px buttons, no horizontal scroll, the cover and its folds. → [canons/C-8.md](canons/C-8.md)

## C-8b · Player errors

How a player error is shown, to whom, and when it closes. → [canons/C-8b.md](canons/C-8b.md)

## C-9 · Pass-the-phone transitions

Passing the phone: the result first, secrets covered. → [canons/C-9.md](canons/C-9.md)

## C-10 · Anti-cheat

Secrets committed and verified, so nobody can cheat. → [canons/C-10.md](canons/C-10.md)

## C-11 · Publishing and versioning

Publishing and versioning: changelog entries without a number, publish.yml. → [canons/C-11.md](canons/C-11.md)

## C-12 · Tests

Engine tests, e2e scripts per screen and language. → [canons/C-12.md](canons/C-12.md)

## C-13 · Documentation

What each game documents: spec, README, requirements, exceptions. → [canons/C-13.md](canons/C-13.md)

## C-14 · Robustness

Robustness: room failures on screen, clean console, one-tap buttons. → [canons/C-14.md](canons/C-14.md)

## C-15 · Room chat

The room chat: shared module, dies with the room. → [canons/C-15.md](canons/C-15.md)

## C-16 · The panel learns on its own

The panel adapts to a new game without being touched. → [canons/C-16.md](canons/C-16.md)

## C-17 · The home page

The home page: types, dice, favorites, order, 320 px. → [canons/C-17.md](canons/C-17.md)

## C-18 · URLs in English

Everything in a URL is English, old names kept as aliases. → [canons/C-18.md](canons/C-18.md)

## C-19 · The way out of a result screen

The way out of a result screen: fin.js exits, each fact once. → [canons/C-19.md](canons/C-19.md)

## C-20 · One name, inside and out

One name inside and out: folder, id, keys, tests and docs follow the player-facing name. → [canons/C-20.md](canons/C-20.md)

## C-21 · Every game is one more game

Every game is one more game: changes reach ALL_GAMES. → [canons/C-21.md](canons/C-21.md)

## Checklist before calling a game done

A lab game passes this whole list before its first PR merges, not before it leaves the lab (D-579), ours or a contributor's. `public/labs/canons.test.mjs` fails one without its `game.json`, its measured cover, `salidasFin`, its rankings, `coverWithDialogs`, the panel's signals, its spec or its e2e scripts; which test or reviewer checks every other line is in [ADD-GAME.md](ADD-GAME.md), "The entry gate".

- [ ] The modes it offers (all three, if it is for two) work and the game can be resumed in **all** of them (C-5, C-6).
- [ ] The instructions follow U-18: the goal first, at most 3 points, without repeating the example drawing (C-1), and start folded on the cover (C-8, D-550).
- [ ] The cover goes through `coverWithDialogs` (`cover-dialogs.js`), so behind the lab flag `cover-dialogs` its steps and sign-in open as the «📖 Instrucciones» and «👤 Entrar» dialogs, not a cover of its own (C-8).
- [ ] The game's name is translated in `games.js` (and its `texts.js`), or its same name is justified in `SAME_NAME` (C-3, D-549, `game-names.test.mjs`).
- [ ] All text is in Spanish, English and Portuguese (that of `IDIOMAS`, the lab's too), with the same keys in all, no loose strings in the code (C-3, D-191).
- [ ] Its screens are in `tools/e2e/paths.mjs` and its `languages.mjs` passes in every language (C-12, D-199).
- [ ] There is sound and vibration on the key actions, with a mute button (C-4).
- [ ] On its landing the start button (or the first mode) is above the fold at 320×568 and 375×667 in every language, with the rules below it, also when it opens from Uno al día or a cup's day: `node tools/e2e/landing-fold.mjs` green (U-39, D-344).
- [ ] Every button that waits on an animation before it acts takes one tap only, and its e2e script double-taps it with `doubleTap()` (C-14, D-576).
- [ ] Buttons are 44 px, the end buttons show without scrolling and there is no horizontal scroll (C-8).
- [ ] Every screen whose look changed is shot by its e2e script and measured with `look.mjs` at 390 and 320 px: margins even (M-1…M-4, nothing covers the next block), its gaps even with the neighbouring games, and the PR lists what was measured (DESIGN.md rule 10, D-570).
- [ ] Its result screen follows C-19: the exits from `fin.js` for each context it is played in, none built by hand (`salidasFin('lab')` from the lab), the header's ‹ naming its logical parent, and each fact said once (score, time, winner, name), the long detail folded or after the exits, Sign in in one line, one share button (D-343, D-353).
- [ ] On one phone, the result shows before the pass, and what is secret is covered (C-9).
- [ ] Secrets are committed and verified (C-10).
- [ ] Room failures show on screen, in every language, and the console stays clean; creating or joining a room goes through `tryRoom` (C-14, U-37).
- [ ] The room's `hello`, `start` and `rematch` go through `roomMessage()` in `room-state.js` (C-7, D-539).
- [ ] Engine tests and `node public/assets/js/games.test.mjs` green, and a full game tested in each mode, with screenshots reviewed (C-12).
- [ ] What changed, in `changelog/<rama>.md` without a number (`node tools/release/changelog.mjs new`); published and checked at the public URL by `publish.yml` (C-11, D-205, D-300).
- [ ] If it has several phones, the room chat uses the shared module and dies with the room (C-15).
- [ ] What it shares (room, result) comes from `compartir.js`, its text from a template of `share-templates.js` with the game's tagline line (`taglineLine`), never a header by hand, and a result goes with its image (C-7, D-165, D-620; `share-templates.test.mjs`).
- [ ] Registered in the menu, README, spec, requirements and decisions (C-2, C-13). On the home page, with its type, it enters the dice and the favorites and fits at 320 px (C-17). A new one brings `nuevoDesde` for its "New" label (D-333) and its search keywords in the three languages (D-404).
- [ ] The exceptions to the canons are written in its spec (C-13).
- [ ] A change meant for the games reached all of them, through `ALL_GAMES`, not only those in `GAMES` or only La Copa's (C-21).
- [ ] Its URLs are in English: folder, parameters and values, read with `parametros.js`, with the old names as aliases (C-18).
- [ ] One name inside and out: its folder, id, phone keys, test hook, e2e folder and spec page are the English version of the name the player reads, and a rename carries what was kept under the old one (C-20, D-535).
- [ ] Its `index.html` carries the watchdog before the stylesheets and calls `trackVisit()` on load: `node public/assets/js/vigia.test.mjs` green (C-7, D-251).
- [ ] The panel shows it without being touched: `node public/panel/adapta.test.mjs` green and a look at `node tools/e2e/look.mjs panel data` (C-16).
- [ ] README screenshots remade and looked at, and `python3 tools/release/readme.py check` green (C-13).
- [ ] `node tools/agents/document.mjs check --from origin/main` with no new ✗: decisions, tests, scripts and CHANGELOG up to date (D-172).
