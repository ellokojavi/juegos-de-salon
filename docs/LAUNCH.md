# Launching a game: the playbook

How a lab game goes out to every player, with nothing left behind. It gathers what more than twenty
launches taught (Shinobi, Babel, Aletazo, Sudoku, ¡Al toque!, Dominorama, Memorice…). Each step names
where it lives and the check that holds it; the misses at the end say why each step exists.
Read it **before** preparing a launch, and tick it off in the PR that prepares it. The `launch-game` skill
(`.claude/skills/launch-game/`) walks it in order.

**One command checks it, three times** (`tools/agents/launch-check.mjs`, after Croc! and Tembleque, 2026-11-22):
every place a launched game shows, so nothing rests on reading this list.

```
node tools/agents/launch-check.mjs <id> [<id>…]              # the repo: entry, tables, pools, lab card, splash, cards, docs
node tools/agents/launch-check.mjs <id>… --screens           # + the real screens, flags pinned to all (serve public/ on 8765)
node tools/agents/launch-check.mjs <id>… --live              # + Firebase and the live site, after the hour
```

The first two go green in the preparation PR and again before scheduling; `--live` runs after the hour.
A ✗ is a launch that would go out incomplete: fix it, never schedule around it.

**And GitHub enforces it (D-606):** the PR that launches a game (its `nuevoDesde` moves while it is behind its
`lanza`: the launch-day PR) runs `launch-check.mjs <ids> --screens` in the `launch` job of `end-to-end`
(`tools/agents/launching.mjs` names the games). A ✗ there keeps the PR from merging.

A launch has four PRs or moments, always in this order:

1. **Preparation PR**: the game is ready but hidden behind its flag (D-517).
2. **Splash PR**: the campaign is ready but off (D-454).
3. **Launch**: at the owner's hour, by a Claude cloud task, with an alarm (D-529, D-591), then checked live (`launch-check.mjs --live`, then by eye).
4. **Cleanup PR**: a few days later, the gate and the prototype go (D-479, D-534).

Nothing launches without the owner's word, and the owner names the hour (in Pacific, D-561).

## 1. Preparation PR (D-517's way)

Precedents: Sudoku `3f60e2d8`, ¡Al toque! `54324382`, Dominorama `ba085a29`, Memorice `b3f7ed8c`.

- [ ] **Code.** A La Copa game lives in `public/cup/games/<id>/`, its page in `/<slug>/`. Its loader goes in
      `public/cup/games/index.js` and its demo scores in `public/cup/demo.js` (ADD-GAME §3). A manifest game moves
      from `public/labs/` to `public/<id>/`, and its old path becomes a bridge (C-18). The id stays the lab's (C-20).
- [ ] **`games.js` entry** (`public/assets/js/games.js`, in `ALL_GAMES`, C-21):
  - [ ] `lanza: '<flag>'`: hidden (`oculto`) until the flag is *all*. That covers the home page, search, filters, `/records/` and La Copa's open pool.
  - [ ] `copa: { pozo: <next> }`, and variants in `VARIANTES` (`cup/engine.test.mjs`).
  - [ ] **Eligible in La Copa, not only playable there.** The cup's 🎲 and its list of games draw only what every player sees on the home page: the game must be in `POZO`, out of the open pool while its flag is *lab*, and in it once the flag is *all* (`refreshPool`, `cup/engine.test.mjs`). The cup e2e (`tools/e2e/cup/create-week.mjs`) must find it on the create screen with the flag pinned to *all*, and a cup day with it must play to the end.
  - [ ] `unoAlDia: { orden: <next>, desde: '<the day after launch>' }`. It goes by date, never by flag. If the launch slips, move it.
  - [ ] `nuevoDesde: '<launch day>'` and `diasNuevo: 10`. The label also starts at the flag's `at` (D-333, D-556).
  - [ ] `keywords` in es, en and pt, three or more each (`search.test.mjs`). Also `tipos`, `players`, `duration`, its `POPULARIDAD` place.
  - [ ] `icon` (a drawing) when no emoji is right. That icon is the game's one icon everywhere (DESIGN.md rule 9, `game-icons.test.mjs`, `splash.test.mjs`).
- [ ] **Flag.** A row in `FLAGS` (`public/assets/js/flag-list.js`). Its `/labs/` card points to the finished page and carries the 🚀 switch (D-498).
- [ ] **Rankings.** Every table it records is a game id or is in `SOLO_TABLES`; variants go in `FIRST_VARIANT_TABLES` (D-559, `rankings-coverage.test.mjs`).
- [ ] **End-to-end.**
  - [ ] Its screens go in `tools/e2e/paths.mjs`, with `tools/e2e/<game>/languages.mjs` and a play script that opens `/records/` and finds its tab (C-12, D-559).
  - [ ] Scripts never depend on today's date (D-589).
  - [ ] A cover with a live demo goes in `VISUAL_SKIP` (`tools/e2e/paths.mjs`).
- [ ] **Texts** in es, en and pt, through the `player-text` skill. U-18 instructions are at most 280 characters.
- [ ] **Privacy.** What it stores goes in `public/privacy/texts.js` when that is new (C-17). While the game is in the lab, write the line as `{ game: '<id>', t: '…' }` in all three languages: the page shows it only once the game is in `ALL_GAMES` and not `oculto`, so launching needs no extra edit.
- [ ] **Docs.**
  - [ ] `docs/games/<folder>.md` (C-13).
  - [ ] README section, screenshots and og cards (the `readme-and-cards` skill). The README says "ready to launch".
  - [ ] Changelog entry.
- [ ] **What every game played alone has**, the same as the house's covers (Sudoku, Croc!, Memorice), each checked by `launch-check.mjs --screens`:
  - [ ] the cover's start button is «<icon> Empezar» / «Start» / «Começar», never a word of its own;
  - [ ] under Instrucciones and Entrar, **its ranking** (`bloqueRanking`), naming the level when it has levels («Ranking de Sudoku · 🟢 Fácil») and following its lever;
  - [ ] the result's table names the same level;
  - [ ] the icon view's sheet (the home page the lab holds) shows that table.
  - [ ] a level picker, if it has levels, sits above the steps and Empezar and remembers the choice (D-331);
  - [ ] Empezar shows without scrolling at 320×568 (U-39, `landing-fold.mjs`); «Cómo se juega» comes after it, folded (C-8, D-550);
  - [ ] the result has one share button with the game's link and level (D-162, D-165), and the yellow «Otra vez» before ‹ Menú (C-19);
  - [ ] in Uno al día, its last move goes straight to the result (C-19, D-581).
- [ ] **`node tools/agents/launch-check.mjs <id> --screens` green.**
- [ ] **Agents.** Usability does its full pass (D-304), the player agent plays it, and documentation reviews it. Merge with everything green.

## 2. Splash PR (made, but off)

- [ ] **Campaign.** Add the campaign to `CAMPAIGNS` in `public/assets/js/splash.js`, with `requires: [<flags>]` so nobody sees it before the game.
- [ ] **Items.** Each item names its `game`; its emoji and drawing come from `games.js`, never its own (rule 9).
- [ ] **Clips.** Clips go in `public/assets/splash/`, recorded by `marketing/splash/*-clip.mjs`. A game that writes words on its canvas gets one clip per language: `video`/`img`/`still` as `{ es, en, pt }` in `splash.js`.
- [ ] **Campaign folder.** `marketing/splash/campaigns/<id>/` holds its README and `es/en/pt-390.jpg` (`campaigns.test.mjs`).
- [ ] **Measured.** `tools/e2e/splash/margins.mjs` must be green at 390×844, 360×640 and 1440×900 (D-570).
- [ ] **Owner sees it** with `?splash=<id>` before launch.

## 3. The launch (D-529, D-591)

- [ ] **The hour.** Write the hour in Pacific and in UTC. Also decide:
  - [ ] the campaign's **end**, as an exact moment (`until`, for example "this Sunday at midnight Pacific");
  - [ ] which campaign it **turns off** (`turn_off`, the previous launch's);
  - [ ] whether it goes **first**.
- [ ] **Re-check the dates.** `unoAlDia.desde` and `nuevoDesde` must fit the hour; if they don't, a PR fixes them before the launch.
- [ ] **Re-run the check.** `launch-check.mjs <ids> --screens` green on today's `main`, a day or more before the hour.
- [ ] **The launch-day PR** moves `nuevoDesde` and `unoAlDia.desde` to the hour (Uno al día's days are Pacific, like
      the hour) **and** turns the README and `docs/games/<id>.md` from «ready to launch» to «launched <date>»: written
      after the hour, it was left stale (Croc! and Tembleque).
- [ ] **Two cloud tasks.** Create two one-time **Claude cloud** scheduled tasks from `tools/jobs/prompts/launch.md`:
      the launch at the hour, and the alarm 10 minutes later. Create them from a cloud session or from `/schedule`
      inside the repo, never from the Mac or a desktop-app task (D-591). Confirm both appear on claude.ai/code → Routines.
      Only then tell the owner "programado".
  - **Who creates them:** the owner, with `/schedule`, or a cloud session the owner opened. A session another session
    starts and instructs gets its `create_trigger` denied by its own permission check (the order is not the owner's):
    that is how the Croc! and Tembleque tasks failed, 12 minutes before the hour. Ask for them early, a day before.
  - **If they are not there 30 minutes before the hour:** the session that has the owner's word dispatches `launch.yml`
    itself at the hour (a background wait until `NOT_BEFORE`, then the same `gh workflow run` the prompt has), runs
    the alarm's check itself 10 minutes later, and tells the owner which way it went out.
- [ ] **Record it.** Add the launch to the D-529 uses line in `docs/AGENTS.md`.

### Checked live after the launch (open it, don't assume)

First `node tools/agents/launch-check.mjs <ids> --live` (flags, splash, pages, cards, README). Then by eye, on
https://juegosdesalon.cl/ at phone width, as a new visitor and as a lab key holder. A check of a function is not
a check of the page: the Bodega move passed `launched()` while `/labs/` kept the cards (2026-11-22).

- [ ] `flags/<id>` is `state: "all"`; `splash/<campaign>` is `on: true` with its `until`; the previous campaign is off.
- [ ] The splash shows first, with each game's own icon.
- [ ] The home card is there with ✨ **Nuevo**, newest first; search and the filters find it.
- [ ] Its cover has its ranking under Entrar and «<icon> Empezar»; its page plays to the result, whose table names its level; `/records/` has its tab.
- [ ] The icon view (the lab's home page): it is in ✨ Nuevos, and its sheet's 🏅 tab shows its table.
- [ ] **La Copa, as a new visitor with no saved flags:** on the create screen the game is in the list of games, and a few 🎲 rolls of a 14-day cup bring it in. Then a cup day with it opens and plays to the end.
- [ ] The `/labs/` card moved to La Bodega (`public/labs/launched.js`, D-534): open `/labs/` itself with a lab key and see it there, never only the function.
- [ ] The next day: Uno al día deals it from `desde`.

Tell the owner only once all of this was seen working (D-591's alarm covers the hour itself).

## 4. Cleanup PR (a few days later)

- [ ] **Remove the gate.** Drop `lanza` and the `FLAGS` row; the game joins the fixed pool (`POZO_FIJO` in `public/cup/engine.js`).
- [ ] **La Bodega card.** Move its card's HTML for good to La Bodega (D-479, D-510, D-534; `public/labs/bodega.test.mjs`).
- [ ] **Lab prototype.** Retire it; its old path becomes a bridge.
- [ ] **Docs.** Docs drop the lab notes (the README already says launched, from the launch-day PR).
- [ ] **Flags snapshot.** The e2e snapshot has the flag on *all* (`flags-snapshot.mjs check`; the processes round refreshes it, D-578).

## Past misses, and what stops them now

| Miss | Now |
|---|---|
| ¡Al toque! launched without ✨ Nuevo (`nuevoDesde` was the next day) | New from the flag's `at` (D-556), `games.test.mjs` |
| Dominorama and Memorice showed no ✨ Nuevo to lab key holders on launch night (the home page drew again only when a game came out, and they already saw it) | The home page also draws again when a label starts (`launchChanges`, `games.test.mjs`) |
| ¡Al toque! sat under older new games | Newest first by `nuevoEn` (D-557) |
| ¡Al toque!'s Rankings tab was missing | `SOLO_TABLES`, `rankings-coverage.test.mjs`, the play script opens `/records/` (D-559) |
| Sudoku's easy ranking read the wrong table | `FIRST_VARIANT_TABLES` |
| The `off` input of `launch.yml` was read as a boolean | It is `turn_off` |
| Dominorama's splash card showed 🎲 | Icons come from `games.js` only (rule 9, `splash.test.mjs`) |
| The Dominorama and Memorice launch task waited on a permission prompt on the Mac; out 46 minutes late by hand | Cloud task plus alarm only (D-591) |
| Stack, Aletazo, Sudoku, Memory and Dominorama, all 🚀, were missing from La Copa's 🎲 on phones that had not seen their launch (the pool was read from the phone's saved flags); lab key holders could draw games still in the lab | The create screen fetches flags before drawing (`refreshPool`); the pool is only what every player sees on the home page; `cup/engine.test.mjs` checks each launched cup game, and the live check opens the create screen as a new visitor |
| Launched cards stayed under "en prueba" | `public/labs/launched.js` moves them (D-534), `public/labs/bodega.test.mjs` |
| Croc!, Tembleque, Memorice and Dominorama stayed under 🎲 Juegos en prueba after launch: `launched.js` read only ✨ Mejoras en prueba, and the live check ran its pure function, not the page | `move()` reads both groups and drops a game's «Listo para lanzar…» line (`tools/e2e/labs/launched.mjs` moves a game card); the live check opens `/labs/` with a lab key |
| Live flags and demos made visual references flaky | `VISUAL_SKIP` for those covers; e2e pins its flags |
| Launched flags kept their tester switch | They leave the tester tab (D-567) |
| Tembleque launched with no ranking on its cover and «¡A jugar!» for its button, unlike every game played alone; its result's table did not name the level | `launch-check.mjs` (static: the cover calls `bloqueRanking`; `--screens`: the table on the cover and the button), `tools/e2e/wobbles/game.mjs` |
| The Croc! and Tembleque cloud tasks were denied: a session started by another session cannot create them | §3: the owner creates them a day before; else the session dispatches `launch.yml` at the hour and checks it itself |
| The README still said «ready to launch, not launched» after the launch | The launch-day PR flips it; `launch-check.mjs --live` fails while it says so |
| Each launch read this list and still missed a different surface | `tools/agents/launch-check.mjs`, run in the preparation PR, before scheduling and after the hour |

A new miss adds its row here and its check, in the PR that fixes it (RULES.md rule 5).
