---
name: owner-tools
description: The owner's panel (public/panel/), La Copa reports and the rankings code (records.js, jugador.js, ranking.js, Uno al día tables). Use before touching the panel, reading Cup reports, or changing how games record wins, solo scores or rankings.
---

# The owner's panel, reports and rankings

- **Panel** (`public/panel/`, D-44, D-207): `window.__panel.seed({ rooms, days, torneos, push, vista })`
  draws it with seeded data without logging in. See [docs/PANEL.md](../../../docs/PANEL.md).
- **La Copa (the Cup) reports** (D-104): `node tools/firebase/reports.mjs [--days 3] [--json]`.
- **Rankings** (D-212): `records.js` (logic), `jugador.js` (the player and their store:
  `jugador-firebase.js`, or `jugador-local.js` in tests and with `?test`; `?records=firebase` forces
  Firebase) and `ranking.js` + `ranking.css` (screen). Open to everyone since D-217 (the lab
  gate, `RANKINGS_EN_LABS`, stays `false`). The
  history of La Copa (podiums, the "Copa" tab and each player's Cups for "Tus copas" (Your Cups), D-220,
  with inherited players that each one claims):
  `node tools/firebase/rankings-history.mjs [--with-labs] [--write]`; `--podiums` writes only the missing podiums of finished Cups, which the `cup-podiums` workflow does twice a night (D-450). Group games
  record wins with `finDePartida` (`ranking.js`) when they end, and show their table with
  `bloqueVictorias` in the intro (D-215); those played solo (Toque y Fama, Generala, Ahorcado (Hangman))
  put their `<id>_solo` table on top with `bloqueTabla` (D-274). A lab game can have its own table too (Julepe's wins, Stick Ninja's `stick` best score), kept apart from the home page's games and Todoterreno; `?seed=` runs never count. A page in one language only (an English-only lab game, D-445) calls `fijarIdioma(lang)` from `ranking.js` so the ranking texts follow it. With no player signed in, `finDePartida` and
  `avisoPartida` offer at the end, after the buttons, to sign in so that game counts (D-274). Uno al día (D-230) records with `anotarDia` from `jugador.js` in
  `unoAlDia/<jid>/<n>` and in the `uno-al-dia` tables (the day period `d<n>` and the week) and
  `uno-al-dia-racha`, and the monthly points table `uno-al-dia-pts` (D-412, D-414), shown by `bloqueRanking` with the tabs Mes · Hoy · Rachas · Amigos (`PESTANAS_UAD`) on /today/ and under the result, and Mes · Amigos in /records/ (/today/ passes `rapido`: one block kept across redraws, table and champion read together, `J.tabla`'s `reciente` reusing the page's fresh read, D-436); `tools/firebase/uad-points-backfill.mjs` fills a month in from the history (October 2026), and its `--rebuild` recomputes the month's totals every night from the history and the days a phone's 🧊 saved (markers `{ c: true }`, the `uad-rebuild` workflow, D-415); its network (invitations, the data of who invites) is in `uno-al-dia-red.js`.
