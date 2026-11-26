# Changelog

## 1.49.11 — 2026-11-26
- **Queens:** the 👑 has a thin dark outline, so it stands out on light regions too.

## 1.49.10 — 2026-11-25
- **A calmer wait**: the spinner and its fun line sit in the middle of the screen, and the first line only shows after 2.5 s of spinner, so most waits end before anything distracts.

## 1.49.9 — 2026-11-25
- **Uno al día without a signed-in player no longer shows month points.** /today/'s season box and the home card's chip showed the month's points (and the cached place) left on the phone by the last signed-in player; signed out they now show only the days left and the streak, and signing out forgets the cached points and place.
- **Signing out leaves a clean sheet.** "Salir" now clears what that player did on the phone (Uno al día days, the cups and their progress, games played, the upload queue, cached points), so the next person starts fresh and is no longer offered someone else's Gran Final; signing in again brings the cups and Uno al día back from the account. Language, sound, offline and lab settings stay.
- **Every key the site keeps on the phone is sorted** in `public/assets/js/storage-keys.js`: the player's progress (cleared on signing out) or the phone's own (settings, visits, hints). `storage-keys.test.mjs` fails on a new key in neither list, so one player's progress can no longer stay on the phone for the next.

## 1.49.8 — 2026-11-25
- **Rally plan, phase 1.0 signed off**: the owner named the game Derrape (Drift, Derrapagem) 🏁, so its id is `drift`; the clip's source is unknown, so no credit; a stage is 8 to 10 gates. `docs/rally/` updated, next is the grey-box drive (1.1). Nothing changes for players.

## 1.49.7 — 2026-11-25
- **Rally, a plan and no code yet**: the design for a time-trial driving game in three paths (top-down 2D, simple 3D behind the same engine, a backlog of extras), with its phases, the owner's open decisions and the prompt that starts a session on it, in `docs/rally/`. Nothing changes for players.

## 1.49.6 — 2026-11-25
- **No more endless waiting on La Copa and Uno al día**: on a stuck connection, La Copa's «…» gives up after 10 s, and a page whose scripts never arrived stops staying blank. Either way the player sees «No pudimos…» with a button to try again (`stall-guard.js`). While waiting, a spinner turns under the title with a fun line that changes every 2 s («Soplando los dados para la suerte…», «Sobornando al dado con un caramelo…»), instead of a bare «…» or an empty page.

## 1.49.5 — 2026-11-25
- **Offline mode**: a phone that kept an old copy of a page no longer gets stuck on it. A page saved by an older version of the app is never served again, and a page whose files no longer match the site loads again once on its own. La Copa failed to open on a player's iPhone because of this.

## 1.49.4 — 2026-11-25
- **Duels: tidy numbers.** In «Your numbers», each tile's icon, value and label sit on the same line as its neighbour's, and the duel game's icon is as big as the others.

## 1.49.3 — 2026-11-25
- **No flash of the old background**: on a skin's days the page no longer shows the usual background for a fraction of a second before the skin; the phone remembers the skin's palette and draws it from the first frame.

## 1.49.2 — 2026-11-25
- **Skins in the lab stay off until previewed**: a seasonal skin not yet public no longer turns on by itself for lab testers on its dates; it shows only when opened with its preview from the panel (D-623).

## 1.49.1 — 2026-11-25
- **Panel, 📱 Screens: a coverage table under the width curve.** For P50, P80, P90 and P99, the narrowest width a design must still fit to cover that share of the range's visits, with the share it really covers (by whole bands). Owner only.

## 1.49.0 — 2026-11-25
- **Thanksgiving skin, for everyone, on every page**: from November 22 to 29 the whole site, games included, gets a November sunset and a few leaves falling behind the page; on the home page a turkey walks past behind the games now and then. From now on every skin dresses every page, not only the home page (D-622). The oak branch in the corner is gone, so nothing sits behind the user pill.

## 1.48.18 — 2026-11-25
- **Panel, 📱 Screens: a width curve above the Width table.** Visits drawn along real pixels (log scale), each band's block sized so its area is its share, with the middle 80% shaded, the most common width marked and the 320 px floor dashed; tapping a block rings its row in the table. Owner only, nothing players see.

## 1.48.17 — 2026-11-25
- **Panel: no pink dot on 🩺 Health.** A page failing to start now and then is normal and the dot asked for nothing; Health itself keeps every failure (D-621).

## 1.48.16 — 2026-11-25
- **Panel: archived campaigns can be previewed.** In 📣 Campaigns, tapping an archived campaign opens it into the same still splash preview the queue's cards have (▶ plays it), with its Live Preview 🔎 link and ↩︎ Unarchive; a second tap folds it again. Owner only: players see nothing new.

## 1.48.15 — 2026-11-25
- **Thanksgiving skin, in the lab**: from November 22 to 28 the home page and Rankings get a November sunset, a few leaves falling behind the page and a turkey that walks past behind the games now and then. Only lab key holders see it until the owner turns it on for everyone; the owner reviews it from the panel's 🎨 Skins. Seasonal templates can now drop things that keep falling (`fall`) and walk something across the bottom (`strut`), both behind the page (docs/SEASONS.md).

## 1.48.14 — 2026-11-25
- **The podium medal on a player's sheet looks like a real medal**: the 1, 2 or 3 is engraved in the gold, silver or bronze, with a raised ring inside the rim; the gleam crosses the number and then runs round the ring (the owner's pick A5-B5).

## 1.48.13 — 2026-11-25
- **Rankings open on «Siempre»**: every game ranking with that tab now opens on it instead of «Semana», so a quiet week never shows an empty table. Uno al día keeps its own tabs.

## 1.48.12 — 2026-11-25
- **/labs/ cards (owner only)**: a flagged card no longer shows the «📊 Uso en el laboratorio» numbers (its box still turns green when ready), and its flag id shows as a small label at the end of its title (Cup-Best-Day-All), with no extra line.

## 1.48.11 — 2026-11-25
- **Duels (lab):** «⚔️ Your rivals» on /duels/ shows each rival's record by game with the same bars as «📈 Your progress», and the rematch is a round ⚔️ at the end of each game's bar: that rival, that game, the format you last played it in, ready to send.

## 1.48.10 — 2026-11-25
- **La Copa (big cup, lab)**: the places each player moved (▲2, ▼1) go back to their own column beside the place when the day blocks fit on one line; with more than 8 days or a narrow screen they stay after the name.

## 1.48.9 — 2026-11-25
- **Tests: every new lab flag says what the end-to-end scripts see.** A flag Firebase does not know yet is on in every script, and four PRs went red on scripts that never asked for it; now the quick `tests` check asks for its row in `tools/e2e/flags-held.json` (off, or lab on purpose) before the long run starts. Nothing players see changes.

## 1.48.8 — 2026-11-25
- Retention ledger: the week of 2026-11-15 is read (next-day return 57.8%, second week under the band's floor 59.3%), and its one proposal, a morning Uno al día push, waits for the owner in #1895. Nothing changes for players.

## 1.48.7 — 2026-11-24
- **⚔️ Duels lock the level** (lab): when you challenge someone to a game with levels (Sudoku, Croc!, Pintaminas, Loteo), you pick 🟢 Fácil or 🔴 Difícil right under the game, nothing is picked for you, and the duel says it everywhere: its title, the invite, each round. The round's page says «🔒 Nivel del duelo: 🔴 Difícil» and offers no level picker, so both players get exactly the same game.

## 1.48.6 — 2026-11-24
- **Player sheets:** opening a player's sheet from a ranking no longer jumps while their facts load. It opens on a skeleton of the card's own shape (two chips, the three stats, the games, a row of medals) close to its final height, then eases the last few pixels and fades the facts in; Close stays put. Their all-time place appears with the rest instead of a moment earlier.

## 1.48.5 — 2026-11-24
- **Every game's share carries its tagline line**, the lab games' too (Memorice, Transbordo, Críptico, Sudoku, Blackjack, Dominorama, Babel, Números explosivos, which gets its tagline) and La Copa's result of the day (in Labs, flag `share-tagline`). `share-templates.test.mjs` fails a game's share without it.

## 1.48.4 — 2026-11-24
- **A new game shares with the templates from its first day**: the new-game generator writes its result's share with `result()` of `share-templates.js` and the game's tagline line, and ADD-GAME.md, C-7 and the canons' checklist say every game's share text comes from a template with that line (D-620). `share-templates.test.mjs` now also fails the generator if it writes a header by hand.

## 1.48.3 — 2026-11-24
- **Every share message comes from one set of templates** (`share-templates.js`, D-620): room invites, the app, the video, a game's link, results, tables and invites to a cup, a duel or Uno al día. A test checks every one in the three languages. Fixed on the way: Uno al día's shares leave a blank line after their header like all the others, a duel challenge opens with its header (`⚔️ *Sudoku* · al mejor de 3`), and a room invite sent before the inviter's name arrived says «Te invitaron a jugar» instead of «👋  te invita».

## 1.48.2 — 2026-11-24
- **A shared game says what it is about** (in Labs, flag `share-tagline`): a room invite, a game's link (its cover or its sheet on the home page), a solo result and a duel challenge add one line, `🎮 {tagline}`, with the tagline its card shows, in the message's language. New `docs/SHARING.md`: the inventory of every share button, the six templates they fit and the review of each one.

## 1.48.1 — 2026-11-25
- **Duels (lab):** each duel has its own page, `/duels/?d=…`: a big card with both players, the score, how it stands and the clock, then the duel round by round (decided, your turn with ▶ Play, the rival's score hidden until you play, still to play, not needed), the head to head with that rival and ⚔️ Rematch. A row of /duels/ and the profile's cards open it. On the Duels card of /labs/, 🧪 adds made-up duels to yours on that phone only, never written, to try the nemesis, the arch rival and the stats.
- **Duels (lab):** the round to play has no box around it, only its glowing ball. While the 🧪 test duels are on, 🎨 A B C on /duels/ and on a duel's page switch between three looks to compare: rows and a track; cards, tiles and a tug of war per round; tickets, a line by date and one card per round.
- **Duels (lab):** the owner picked the looks: a duel's page keeps the round track, with ▶ Play round N on the card itself and «🙈 Beto already played it» under it; /duels/ shows the open duels as tickets and the finished ones on a line by date, each opening with its rounds, the head to head, See the duel and ⚔️ Rematch. New «📈 Your progress»: the win rate duel by duel, the latest ten and the record by game. The 🎨 A B C switch is gone.

## 1.48.0 — 2026-11-24
- **🥇 Labs: the podium shines** (flag `podium-shine`). On a player's sheet opened from a ranking, 1st, 2nd and 3rd place get a medal that shines: rays of its metal turn behind it, it beats softly, only the number inside, and the card is framed in gold, silver or bronze with a gleam crossing it. Still for whoever asks for less motion (the owner's pick C, 2026-11-24).

## 1.47.27 — 2026-11-24
- **Making-of**: the opening line names the contributors next to the product lead and the AI agents.

## 1.47.26 — 2026-11-24
- **Labs (profile-chips)**: a player's sheet shows since when they play and their overall place as two short chips (📅 nov 2026 · 🎯 1.º general), like one's own profile, instead of a grey sentence; each chip keeps the full sentence as its label.

## 1.47.25 — 2026-11-24
- **Making-of**: the PRs figure now says how many people contribute (3, live from GitHub), and the fallback figures are brought up to today.

## 1.47.24 — 2026-11-24
- **A player's sheet no longer says «10 días seguidos» from the Uno al día points table**: that number was the streak bonus, capped at 10, not the real streak (the sheet already shows the real one below). The 🔥 leaves the points table's rows for the same reason, and a place from 4th on shows big in the yellow-to-pink gradient of the home page's Uno al día card instead of a grey ring.

## 1.47.23 — 2026-11-24
- **Profile**: a badge's sheet now shows its name in the games' display type, in yellow with a purple drop shadow, next to its emoji.

## 1.47.22 — 2026-11-24
- **Lab: Dominorama rules in the zone's corner** (flag `dominorama-corner-labels`): each zone's corner filled with its color and the rule inside, about twice the diamond's size, because players found the diamonds too small. Only lab testers see it.

## 1.47.21 — 2026-11-24
- **Profile**: a badge the profile finds new that no game announced (🧩 Collector counted from every phone, when this phone's own list missed a game) now opens its congratulations window there, once.

## 1.47.20 — 2026-11-24
- **Dominorama: a laid piece is two squares again.** Its halves were 6 px longer along its length (52×58 on a phone), so pieces on the board looked stretched; now they keep the 2:1 shape of the ones in the tray.

## 1.47.19 — 2026-11-24
- **Duels open straight on the quick duel** (lab flag rivals): «Nuevo duelo» no longer asks ⚡ or 🛠️ first; the rival, the format and the game are there at once, and «🛠️ Arma un duelo a tu medida» is a link right under the button, with «⚡ Volver al duelo rápido» to come back.
- **A custom duel picks how to win, then how many rounds**: 🏆 most rounds won, over 3, 5, 7 or 9 rounds (odd, so there is always a winner), or ➕ most points, over any number from 2 to 9. The rules (`firebase/database.rules.json`), the test store and a round's link take up to nine rounds.
- **The custom duel's sheet changes size smoothly** (lab flag rivals): going from step to step, switching between most rounds won and most points, or opening a round to change its game, the sheet eases to its new height instead of jumping, and each new step fades in. With reduced motion it changes at once.

## 1.47.18 — 2026-11-24
- **Dominorama: zones that touch never look alike.** Each zone now takes the palette color farthest from its neighbours (side or corner), measured in Oklab, instead of the next one in order; before, two touching zones could even get the same color. Amber and mint left the palette for a clearer orange. Over 900 generated boards the closest touching pair went from identical to clearly distinct.

## 1.47.17 — 2026-11-24
- **U-41: visual proposals reach the owner as a published Artifact page readable on the phone**, never only a PNG or a file path.

## 1.47.16 — 2026-11-24
- **Profile**: in the achievements, the games section now comes first, before Uno al día, La Copa, Duels and your plays.

## 1.47.15 — 2026-11-24
- **The share button has a cleaner icon**: the open box with the arrow going up, as on iOS, now drawn as a thin turquoise line instead of the thick two-colour one.

## 1.47.14 — 2026-11-24
- **Badges (in the lab, `badge-details`)**: a badge whose detail would only say «not yet» no longer opens it: an unearned month or cup podium, or Madrugador, Finde a tope, Odio los lunes and Especialista with no progress at all. Earned badges and those with progress still open theirs.

## 1.47.13 — 2026-11-24
- **Achievements (lab badge-details)**: the ⓘ on each badge moves to the card's top-right corner and is toned down.

## 1.47.12 — 2026-11-24
- **Workshop: the merge queue trial's evaluation has its criteria written down** (D-586): on 2026-11-25 it decides remove, keep, or build on it judged on the queue as it is since D-618 and D-619, with the hours it was down left out. Carried over from the unmerged branch `merge-queue`.

## 1.47.11 — 2026-11-24
- **Workshop: `sync-pr` resolves the rule counts too.** A conflict in `docs/RULES.md`, `CONTRIBUTING.md` or the PR template that only differs in the numbers `rules.mjs` writes is taken from main and regenerated, instead of leaving the PR in conflict (D-580). Carried over from the unmerged branch `auto-sync-generated`.

## 1.47.10 — 2026-11-24
- **The queue-doctor cloud task exists** (D-619): `trig_01EUEoQEdrD3rkiC9dMK5HZC`, hourly at :45 UTC. Its prompt now clones the repo first, as the stalled-PR takeover does, since a fresh cloud run starts without it.

## 1.47.9 — 2026-11-24
- **The merge queue has a doctor** (D-619). Every 5 minutes the heartbeat checks the queue without a model: it remakes a deleted label, starts a step that did not run, and keeps a "Merge queue needs a look" issue with what is still wrong. Every hour the `queue-doctor` cloud task fixes that on its own and ships the fix, never waiting for the owner except on a 🔴 PR. The line now puts a fix to the queue first and PRs that change nothing under `public/` ahead of the rest.

## 1.47.8 — 2026-11-24
- **La Copa no longer counts as a game** in the profile badges (Collector, Explorer) and the player peek: it is a way of playing the games over days, not one more game. One list, `PLAYABLE_GAMES` in `games.js`, feeds every "games played" count.

## 1.47.7 — 2026-11-24
- **The profile's Vibración switch** keeps the 📳 emoji and greys it out when vibration is off, instead of switching to 📴.

## 1.47.6 — 2026-11-24
- **Profile without the ⓘ**: the info button at the right of the profile title is gone; the page explains itself. The welcome still opens by itself on the first visit.

## 1.47.5 — 2026-11-24
- **Processes round 2026-11-24**: the push guard now stops a push that adds a page no footer script measures or excuses (D-599), instead of a red `tests` run; flags snapshot and end-to-end durations refreshed.

## 1.47.4 — 2026-11-24
- **The merge queue labels the PR it updates again.** #1860's new label function was called `mark`, a name the step loop already used for a local, so every real update crashed before labelling the PR and the queue lost track of it. It is now `labelInFlight`, and a new test runs the whole step against a fake `gh`.

## 1.47.3 — 2026-11-24
- **Profile**: every badge medal now gives its emoji the same soft dark rim, so pale ones read on the metal; El canapé is no longer the odd one out.

## 1.47.2 — 2026-11-24
- **The merge queue makes its label again if it goes missing.** For over an hour on 2026-11-24 the `merge-queue` label did not exist: every queue step updated a PR and then failed to label it, so the queue lost track of the PR in flight and kept updating others (six PRs testing at once). Now it recreates the label and goes on.

## 1.47.1 — 2026-11-24
- **The merge queue runs end-to-end once per PR** (D-618). It cancels the running `end-to-end` of a PR that is behind main, which tests a main the PR can no longer merge into, and lets a behind PR into the line once `tests` passed. `end-to-end` then runs only after the update, on today's main. A cancelled run is no longer red for `wait-pr.mjs`, the pending-work issue or the processes round.

## 1.47.0 — 2026-11-24
- 🎖️ **El detalle de cada logro, en Labs:** en tu perfil, un logro con ⓘ se abre al tocarlo y te dice lo que la tarjeta no alcanzaba a mostrar: qué juegos te faltan (cada uno con su botón para jugar), cuál está en su semana de estreno y cuántos días le quedan, tus juegos más jugados, tu mejor lugar en cada tabla, tu racha de hoy, el mes en calendario con los días que fallaste, y las mañanas, fines de semana, copas y meses que ya cuentan. Los logros secretos siguen en secreto.

## 1.46.6 — 2026-11-24
- **Privacy**: the lines about proposing a clue in Cryptic and about Duels show only once each is out of the lab; until then the page no longer tells players about something they cannot use.
- **Rule (D-617)**: a game or feature in the lab changes nothing a player sees until it is on for everyone; only the tester toggles show it.

## 1.46.5 — 2026-11-24
- **Profile**: the badges tab no longer ends the games group with a «Ir a los juegos» button.
- **Profile**: a tap on a game in «Tus partidas» opens its cover.

## 1.46.4 — 2026-11-24
- **PR previews always say how they ended**: when GitHub Pages is slow, the preview check used to be cut off at 10 minutes with the comment stuck on ⏳; it now has 15, enough to write the link or the ⚠️.

## 1.46.3 — 2026-11-24
- **The profile card's «Jugando desde… · n de m logros» becomes two chips** (lab flag profile-chips): 📅 the month and year, 🎖️ n/total, on one line under the name; each chip's sentence is its label, read aloud and shown on a long press.

## 1.46.2 — 2026-11-24
- **Toque y Fama: 🔢 Número and 🔤 Palabra switch like tabs.** The toggle changes the game on the same page, with the top bar still, instead of loading the other page; Back returns to the previous tab.

## 1.46.1 — 2026-11-24
- **Duels on the home page**: on a desktop or a wide screen the sliding row shows two and a half cards; the narrowest phone still sees a peek of the next one.

## 1.46.0 — 2026-11-24
- **#️⃣ Sudoku, in the lab: bigger number keys.** Behind the `sudoku-big-keys` flag, the 9×9 pad splits into two rows, five keys and four centred under them, a little taller than today, and the board's digits bigger (the 6×6 keeps its one row), so a wide finger hits the number it meant.

## 1.45.2 — 2026-11-24
- CONTRIBUTING: the design system and its lint, measuring visual changes at 390 and 320 px, the tester tab for lab flags, and lanes.

## 1.45.1 — 2026-11-24
- **Profile ⚙️, «Juegos sin señal»**: the row no longer stays on «Preparando los juegos…» while the phone already keeps every game. It looked for the saved games in the wrong place; it now looks where the home page does. La Copa had the same slip when sending results with the app closed, and it is fixed too.

## 1.45.0 — 2026-11-24
- **Vibration can be turned off** (lab flag vibration-setting): a «Vibración» 📳/📴 switch in the profile's ⚙️ Preferencias, next to Sonido; off, no game vibrates on this phone (kept in `juegos-de-salon:no-vibration`), including the ones that call the phone's vibration directly.

## 1.44.0 — 2026-11-24
- **Two new duel badges** (lab flag `rivals`): 🔁 *De hijo*, beat the same rival three duels in a row, and
  🐉 *Mata gigantes*, win a duel against a game's champion (the rival is 1st ever in one of the duel's games
  when the profile opens), a reason to challenge the best.

## 1.43.12 — 2026-11-23
- **The home page shows the language selector again.** With *settings-in-profile* on for everyone, the flags had left the home page too; a first visitor without a profile could not find how to change the language. Game covers and the other bars still leave 🔊 and the language to the profile's ⚙️.

## 1.43.11 — 2026-11-23
- **Labs: the icon sheet goes to La Bodega.** The «🎠 Íconos que abren una hoja con tabs» card is folded under 🎲 Juegos guardados as 💤 No prosperó, and its switch leaves the T tab (PARKED); tapping an icon keeps opening the game's cover.

## 1.43.10 — 2026-11-23
- **Profile**: the «El canapé» badge now shows a dumpling 🥟 instead of a toast 🥂, on a deeper silver medal with a dark rim so it reads well.

## 1.43.9 — 2026-11-23
- **The weekly 🔥 Popular refresh no longer gets stuck**: when its PR is behind main, the workflow turns on auto-merge and the merge queue merges it, instead of failing and leaving it open.

## 1.43.8 — 2026-11-23
- **Labs (ranking-peek): the badges on a player's sheet breathe**: they sit in a card like the most-played games, with bigger medals ringed in their metal and quieter names, and CERRAR stays at the bottom over a fade.

## 1.43.7 — 2026-11-24
- **Contributors' PRs no longer stay stuck** (D-616): a red commit is rerun once in case it was not their code, a second red is read and explained, a fork is asked to allow edits by maintainers, and a contributor silent a week becomes a one-tap decision for the owner.

## 1.43.6 — 2026-11-24
- **Duels (lab):** the ⚔️ on a ranking row is just the icon, without its circle, with a larger tap area. The challenge sheet opened from a ranking now shows the games with that ranking's game already chosen, so it can be changed, under the format (now also Most points), which comes first. The new-duel sheet opens at once, with grey placeholders where the rivals load, instead of growing as the network answers.

## 1.43.5 — 2026-11-23
- **🔥 Popular, this week**: the home page's order and its three 🔥 Popular games follow the games finished in the last four weeks.

## 1.43.4 — 2026-11-23
- **Croc!**: Richer river visuals on the water canal (depth gradient, organic banks, swaying seaweed, swimming and jumping fish, curved moving waves) and clearer boat wakes (V-shaped Kelvin wake and animated stern foam rings).

## 1.43.3 — 2026-11-23
- **Tests**: La Copa's create-week check expects Tango as `tango:time` in a new cup (D-607); it failed whenever the random week drew Tango.

## 1.43.2 — 2026-11-24
- **Profile (Labs): «🎮 Tus partidas» now sits below the badges** in Logros, not first (the owner; flag `profile-plays`).

## 1.43.1 — 2026-11-23
- **Labs (👀 flag `ranking-peek`): your own name in a ranking opens your sheet with «(tú)» after the name and a «Ver mi perfil →» link to your profile.** Not on the profile itself, where your sheet is «how others see me» and stays as they see it.

## 1.43.0 — 2026-11-24
- **Duels (lab):** the Duels page now shows your numbers (record, win rate, streaks, rounds, rivals, your duel game), your 🔥 arch rival (the one you have dueled most) and 💀 nemesis side by side, every rival head to head, and a ⚔️ Rematch on each rival and each finished duel, with the same game and format.

## 1.42.1 — 2026-11-23
- **Labs (settings-in-profile): sound and language only in the profile's ⚙️.** With the flag on, game covers, the home page and every other top bar drop 🔊 and the language flags; the profile keeps both.

## 1.42.0 — 2026-11-23
- **🎖️ Profile in the owner's panel** (D-615): how many open the player profile, who (signed-in players by their ranking name, only the owner sees it), what they use there, where they came from, and whether it moves account creation, sign-ins and coming back. The privacy page says so in the three languages.

## 1.41.2 — 2026-11-23
- **Profile (Labs): «🎮 Tus partidas» moves from Rankings to the profile** (the owner; flag `profile-plays`): in Logros, one bar per game as long as its share of the most played, five shown and the rest behind «Ver N juegos más». With the flag on, /records/ no longer lists it. Also closes a stray `@media` left open at the end of profile.css.

## 1.41.1 — 2026-11-23
- **Labs (👀 flag `ranking-peek`): the sheet a name in a ranking opens now starts with the player's place in a medal.** Gold, silver or bronze on the podium, the same metals as the badges, and a plain ring from 4th on. Beside it: the table and tab in small capitals, then what the row counts with its unit («95 pts», «0:50 tiempo», «12 victorias», «🔥 21 días seguidos»). Below that, their all-time place as a tag.

## 1.41.0 — 2026-11-23
- **A duel round's result shows only the duel's ways on**: no «🏠 Volver al menú» button and no «📅 Uno al día de hoy» line under it; «⚔️ Volver a tus duelos» moves under «Compartir mi resultado»; the header's ‹ Menú stays the way to the menu.
- **The profile's duels move into Logros** (lab flag rivals): a ⚔️ Duelos group with five badges (Primer duelo, Primera victoria, Retador: 5 rivals, Duelista: 10 wins, Invicto: 5 wins in a row), the duel record and «⚔️ Ir a tus duelos» to /duels/; the duels block above the tabs is gone.
- **Every Logros group ends with its way on** (lab flag profile): «📅 Ir a Uno al día», «🏆 Ir a tus copas», «🎮 Ir a los juegos», like «⚔️ Ir a tus duelos».

## 1.40.34 — 2026-11-23
- **☁️ The cloud floats straight up, whole** (flag `cloud-quiet`): when storing ends, the cloud now rises out of its button while the button fades where it is, so the top of the screen no longer cuts it, and its place closes only once it is gone. A second «ready» from the phone no longer cuts the animation short.

## 1.40.33 — 2026-11-23
- **☁️ The offline cloud floats away** (in Labs, flag `cloud-quiet`): when the phone finishes storing the games, the cloud flashes, waits a moment and rises as it fades, and its place in the bar closes smoothly instead of vanishing at once. With reduced motion it only fades.

## 1.40.32 — 2026-11-23
- **📴 Extended offline mode** (in Labs, flag `extended-offline`): offline, the home page shows a still plate «📴 SIN CONEXIÓN» where the dancing emoji was, which moves nothing and opens the offline sheet; the other screens drop the sticker and the Candlelight palette alone says it; the games waiting to upload show apart, as a line at the bottom for a few seconds.

## 1.40.31 — 2026-11-23
- **☁️ Quiet cloud on the left of share** (Labs, flag `cloud-quiet`): when the cloud comes and goes on the home page's bar, it does so on share's left, so share and the profile pill never move.

## 1.40.30 — 2026-11-23
- **A game plays by the same rules in La Copa and outside it** (D-613, written in C-21): La Copa only adds what a cup needs. The two cups running with Tango ahead move to scoring the time at their next Tango day nobody has played.

## 1.40.29 — 2026-11-23
- **Behind the scenes**: when a PR takes in the latest `main` (by hand or from the merge queue), its end-to-end run repeats only the scripts that both the PR's own changes and what `main` brought reach, not the PR's whole scope (D-612). Over the last 89 such merges that is 752 batches instead of 1092, about 2,800 script minutes fewer, so PRs in the merge queue wait less.

## 1.40.28 — 2026-11-23
- **☁️ The offline cloud, only when it asks for something** (in Labs, flag `cloud-quiet`): on the home page's bar the cloud shows while the phone stores the games or when some are missing, and leaves once it is ready; the profile's ⚙️ always has a «Juegos sin señal» row with the state, which opens the same sheet. Its four states are tried from the «T» tab, with no network cut.
- **Tests**: the end-to-end groups may take 420 s each, up from 400 (D-611): main sat at the alarm with 1 s of headroom, and no new script could get in.
- **☁️ The cloud comes in as softly as it leaves**: its slot opens first, then the cloud grows from its centre, a little past its size and back. And the profile's «Juegos sin señal» row no longer stays on «Preparando los juegos…» after the home page's cloud has gone: while it says loading it reads again every 3 s, and an older read never draws over a newer one.

## 1.40.27 — 2026-11-23
- **Main green again**: the end-to-end groups check compared a 460 s group against 459.99999 s (400 × 1.15 in floating point); the alarm is rounded now.

## 1.40.26 — 2026-11-23
- **Críptico (lab)**: one more hard clue by the owner.

## 1.40.25 — 2026-11-23
- **Labs (👀 flag `ranking-peek`): tap any name in any ranking to see that player's profile.** It works on every table with names: a game's cover and result, Rankings, Uno al día, La Copa's champions, and a Cup's own table (for players signed in with their name). The sheet opens with where you tapped it: that table and tab, their place and score as the row showed them, and their all-time place in that table when you came from the week's or friends' tab. From a Cup's table it says the Cup, their place and points.

## 1.40.24 — 2026-11-23
- **☀️ Tango scores the same in La Copa and outside it**: in the cups created from now on, Tango scores the time, as on its own page and as Reinas does; mistakes cost nothing and each hint adds 15 seconds. The cups already running finish with the rule they began with (D-607).

## 1.40.23 — 2026-11-23
- **Offline, the whole game is in Candlelight** (D-609): the play screens of every game take the offline palette, not only the home page and the covers, and so do the home page's La Copa and Uno al día cards, the floating sparkles and the confetti. The "Sin conexión" sticker steps aside while playing so it covers no board, and no longer stretches into a dark bar over the setup screens.
- **Airplane mode shows at once**: a connection check that gets no answer is asked again half a second later and then switches; checks run every 5 s while the page is in view and on each touch of the screen, so it takes a few seconds at most, and half a second after a tap. A single lost answer (a Wi-Fi to data handoff) no longer flashes the room offline.
- **Offline colours keep their meaning**: Candlelight's orange and cyan are their own (terracotta, sage) instead of the same amber and cream, so Batalla Naval's hit, sunk and water and Generala's kept dice still read apart.
- **"📡 Solo con señal"** (pt "Só com sinal") instead of "Con señal" on what needs signal offline: it read as "has signal".
- **Tembleque plays offline**: its easy and hard levels are now kept on the phone; offline they opened the home page.
- **Every page paints Candlelight from its first frame**: Tembleque and four lab pages lacked the script; a test now requires it on every page and game.
- **The sticker no longer covers a cover's icon** on short titles (Tembleque's scale): it moves right of it.
- **PR previews store the real offline list**, so a game added since the last publish also opens offline there.

## 1.40.22 — 2026-11-23
- **Plan to move the repo to an organization** and use GitHub's merge queue (batches instead of one PR at a time), written down to run later: `docs/ORG-MIGRATION.md`. Nothing changes yet.

## 1.40.21 — 2026-11-23
- **Profile (Labs): the card's figures wait with three hopping dots.** Until the server answers, three yellow dots hop where each figure goes; then the real number pops in, one figure after the other. This replaces the spinner and the count-up, which are gone. A figure the server could not give still shows «—».

## 1.40.20 — 2026-11-23
- **Faster PRs after a merge of main**: a PR that already passed its tests and then takes the latest
  `main` reruns only its own end-to-end scope against it, no longer every script `main` brought (D-610).
  #1802 waited half an hour for 18 batches after its own 8-minute test had passed.

## 1.40.19 — 2026-11-23
- **La Copa, in the lab (`cup-zone-phone`): a new cup starts on the time of your phone, not of your language.** Creating a cup in Spanish from the United States no longer starts it on Chile's audience and Chile's midnight (days from 19:00 to 18:59): it starts on 🌎 Global and your phone's hours. A phone in Chile still starts on 🇨🇱 Chile and one in Brazil on 🇧🇷 Brazil (D-608).

## 1.40.18 — 2026-11-23
- A PR that launches a game (its launch day moves while it is behind its flag) now runs `launch-check.mjs --screens` on GitHub, in the `launch` job of `end-to-end`, and cannot merge on a ✗ (D-606): the next launch cannot go out with a place missing.

## 1.40.17 — 2026-11-23
- **Profile (Labs): the card's figures wait for the real number.** Partidos, the streak and the cups show a spinner until the server answers, then count up to the real figure; before, the card first showed this phone's own count (153) and jumped to the player's real total (188). A figure the server could not give shows «—», never a partial number.

## 1.40.16 — 2026-11-23
- **Profile (Labs): `/profile/?reveal` replays a new badge's reveal** for the last badge earned (or
  `?reveal=<id>` for one), on every visit and without recording anything, to try it as often as wanted.

## 1.40.15 — 2026-11-23
- **⚔️ Duels page** (lab, flag `rivals`): it is called «Duelos» and shows other players' recent duels («Ana 2–1 Beto», the game, who won or «En juego»), under your own when you have them. In ⚡ Quick duel the games come in two rows that slide sideways, the next column peeking. On a game's ranking the ⚔️ is smaller, and your own row keeps the same columns, so every row lines up.
- **⚔️ Choosing a rival** (lab, flag `rivals`): the search is always there and finds players as you type the start of their name, without the keyboard jumping; the suggestions include the players of your cups and, so the list is never empty, the players active this week. Signed out, the sign-in card on /duels/ and in the new-duel sheet says «⚔️ Entra para tener duelos». The sheet closes with its ✕ alone (no ‹ Back).
- **PR previews come with test data**: each browser that opens a preview gets, once, six made-up players with this week's scores in a few games and some duels between them, so rankings, suggestions and recent duels can be tried there. Never on localhost or the real site.
- **⚔️ Duels page** (lab, flag `rivals`): your open duels in one list, no tabs: ▶ Jugar where it is your turn, «Esperando a …» where not; and your nemesis, with ⚔️ Revancha, under them.

## 1.40.14 — 2026-11-23
- **Profile: the card's figures count up** (the owner): days in a row, games and cups run fast from zero to their number, like a machine looking for it; drawn again as the server answers, they count on from where they stood. With reduced motion, the number at once.

## 1.40.13 — 2026-11-23
- **Workshop**: a test (`root-files.test.mjs`) now fails when a file nobody expects is committed at the repo root, so scratch files no longer slip in. The flags snapshot follows the launches of Profile and Wobbles,.

## 1.40.12 — 2026-11-22
- `launch-check.mjs` no longer gives false ✗: the cover's ranking in the static pass is a hint (a cover may draw it with `bloqueTabla`; `--screens` decides), the home card gets 12 s to appear when several games are checked together, and `--live` judges the launch's own splash (one that is on, else the one switched last), not an older game's campaign that is rightly off.

## 1.40.11 — 2026-11-22
- **Offline mode switches to Candlelight in seconds in airplane mode**, also on phones that keep saying they are online (common on iPhone): a failed connection check is confirmed 3 s later instead of a minute later, checks run every 20 s while the page is in view and none while it is hidden, and the app looks again each time it comes back to the front. It took up to two minutes; now at most ~23 s, ~5 s on returning to the app.

## 1.40.10 — 2026-11-22
- 🧪 Labs: a launched game's card now moves to La Bodega on its own, like an improvement's did: 🐸 Croc!, ⚖️ Tembleque, 👀 Memorice and 🎲 Dominorama had stayed under «Juegos en prueba». Its «Listo para lanzar» line goes with the move.

## 1.40.9 — 2026-11-22
- ⚖️ Tembleque: its cover's button says «⚖️ Empezar» like the other covers, and the ranking after a game names its level («Ranking de Tembleque · 🔴 Difícil»), as the cover's does.

## 1.40.8 — 2026-11-22
- **Tembleque**: its cover now shows the leaderboard of the level on the lever (easy or hard), as Sudoku's does, not only after a game.

## 1.40.7 — 2026-11-22
- 🛠️ Launches: `tools/agents/launch-check.mjs` checks every place a launched game must show (its entry, Rankings, its cover's ranking, La Copa, Uno al día, La Bodega, the splash, the cards and docs, then the real screens and the live site), and the new `launch-game` skill walks docs/LAUNCH.md in order. The playbook gains what Croc! and Tembleque taught.

## 1.40.6 — 2026-11-22
- **Profile (Labs): a badge the game just celebrated is lit on your profile**, every time: what the window
  announced counts as earned there too. The first visit after earning it shows it switching on, grey to its
  metal with a flash, brings it into view and keeps its «¡Nueva!» for the whole visit (before, it vanished
  as the page finished loading). Only once: the next visit shows it as one more.

## 1.40.5 — 2026-11-22
- **👉 Swipe between games removed.** The lab experiment (flag `game-swipe`) never launched and is gone: its code, styles, texts, test and `/labs/` card.

## 1.40.4 — 2026-11-22
- **Profile: the pill's bubble «Tu perfil vive aquí» shows only to a signed-in player** (the owner): a guest sees the pill alone.

## 1.40.3 — 2026-11-22
- 🐸 Croc! and ⚖️ Tembleque get their launch dates: both launch on 2026-11-22 at 21:00 Pacific with the splash ¡Nos volvimos locos!, and Croc! joins Uno al día from 2026-11-23. Tembleque's nine cheers launch with it.

## 1.40.2 — 2026-11-22
- **Profile: a player's sheet breathes** (the owner): more room between its sections (figures, most played games, achievements) and between each title and its list.

## 1.40.1 — 2026-11-22
- **Your first duel starts on arrival** (lab, flag `rivals`): a player with no duel yet who opens ⚔️ Tus duelos from the home card finds the new-duel sheet already open, instead of an empty page and a button to look for. Closing it leaves the page as it was; it does not open again on that visit.

## 1.40.0 — 2026-11-22
- **⚔️ Duels** (lab, flag `rivals`): challenge another player to a few rounds of one game: best of 3, best of 5 or most points over 3 rounds. Both get the same levels (each round has its seed), each plays whenever they like, and a duel lasts 3 days at most: a round not played by then is a 0, and a round begun and left counts as begun. Challenge from the ⚔️ on any other player's row of a game's ranking, or from the profile's ＋ New duel (the rivals you already played first, then your cups' friends, then a search by name). The profile shows your record (won–lost and %), your open duels as cards with ▶ Your turn, See all and your nemesis; /duels/ lists them all; the home page gets a third card after La Copa and One a Day, peeking from the edge («1 VS 1», or how many duels you have open). The privacy page says what a duel keeps.
- **⚔️ Duels, quick or custom** (lab, flag `rivals`): ＋ New duel now asks ⚡ Quick duel (the rival, one game, best of 3 or 5) or 🛠️ Custom duel, step by step (who, how to win, and each round's game, with 🎲 Mix). Once sent, 📲 Send the challenge to that rival shares its link, and the rival opens «Javi challenges you» with ⚔️ Accept and play round 1. After a round, ▶ Play round N opens that round's own game.

## 1.39.19 — 2026-11-22
- **Profile (Labs): every achievement a game earns opens its window, not only the secret ones** (the owner). Right after the game that earns it, any badge the phone can tell alone (streaks, Madrugador, Se llama obsesión, 100 and 1.000 games, Explorer, Estreno, Lunes, Findes, De la casa, Mes completo) opens the same window, its medal shown at once with «🎖️ ¡Nuevo logro!» and what it asked. What a phone had already earned when this reaches it is never announced, secret ones included: the first look, after a game or on the profile, only notes them (the owner). `?achievement=demo` adds three of them.

## 1.39.18 — 2026-11-23
- **Profile (Labs): the public profile has no switch** (D-605, replaces D-602 and D-604). Every player's sheet shows the same to everyone: where they stand, their streak, games and cups, their most played games with their all-time place, and their achievements. «Ver cómo me ven los demás» stays in Ajustes; «Mostrar mi actividad», its yellow bubble and the hidden sheet go, and so does the `jugadores/<jid>/oculto` rule. The privacy page says so in the three languages.

## 1.39.17 — 2026-11-22
- **Profile (Labs): a player's sheet says their all-time place in each of their most played games, not how many times they played it** (the owner): «Reinas · 5.º histórico» instead of «Reinas · 12 partidas», so the sheet tells how well someone plays, not how much. A game where they are below the first 100 shows no place.

## 1.39.16 — 2026-11-22
- **Croc!**: the frog does a little victory dance (three hops with a wiggle) when it reaches the pond.

## 1.39.15 — 2026-11-23
- A game's sheet on the new home page no longer jumps when it opens: the space for its animation is the same size from the first frame, and the animation fades in instead of resizing the sheet.

## 1.39.14 — 2026-11-23
- **Owner approvals**: ticking Yes on a 🔴 PR that is still a draft now marks it ready for review before merging, instead of failing (#1750, #1773); and when a tick carries to a new commit (only main merged in, D-575, or the owner's own PR with no 🔴 file changed, D-596) the `needs-owner` label goes too, as it does on the tick itself.

## 1.39.13 — 2026-11-22
- **Profile (Labs): your activity shows on your public profile by default, and you can hide it** (D-604, amends D-602). In Ajustes, «Mostrar mi actividad» starts on, with a yellow bubble under it: «Tus juegos son visibles para otros jugadores», closed with ✕ or by turning the switch off. «Ver cómo me ven los demás» now opens exactly the sheet others see, with no texts of its own. The server keeps only the choice to hide (`jugadores/<jid>/oculto`, replacing `abierto`); the privacy page says so in the three languages.

## 1.39.12 — 2026-11-22
- **Your profile introduces itself (Labs)**: a bubble rises from the top bar's profile pill to say your badges, rankings and settings now live there; it goes away for good when you close it or open the profile. The first visit to the profile opens a card that explains its three tabs; «Entendido» or ✕ closes it, and a subtle ⓘ at the right of the profile's title, like a superscript, opens it again. `?profile-intro=demo` shows both again.

## 1.39.11 — 2026-11-22
- **Your public profile (Labs)**: in your profile's ⚙️, 👁️ Tu perfil público decides what others see when they tap your name in a ranking. Your streak, your games, since when you play and your favourite games show only if you turn on «Mostrar mi actividad»; otherwise others see your place and your achievements. «Ver cómo me ven los demás» shows your sheet as they see it (D-602). The privacy page says it in three languages.

## 1.39.10 — 2026-11-22
- **A finer line under the names (Labs, profile)**: the line that says a name in a ranking opens its player is thinner and fainter.

## 1.39.9 — 2026-11-22
- **Another player at a glance (Labs, profile)**: on your profile, a tap on any name in a ranking opens a short sheet with that player's flag and name, since when they play, their place in the overall ranking when in the top 10, their streak, games and cups won, their three most played games and their achievements; your own name shows how others see you. Only what is already public is shown: the achievements that only a player's own phone knows stay out.

## 1.39.8 — 2026-11-22
- **A secret achievement now celebrates itself (Labs)**: right after the game that earns it, or on the profile for 💎 and 🎂, a window like One a Day's month-end one (the comic card, diagonal stripes) shows a round «?» medal that shakes and turns over to reveal it with a burst of confetti, then fireworks behind; its own message, how many secret ones you have and «Ver mis logros». Once per achievement and phone; `/profile/?achievement=demo` shows each.

- **Martes 13 left the secret achievements** (the owner: too hard to earn); the phone no longer counts games on a Tuesday the 13th.

## 1.39.7 — 2026-11-22
- Croc! now labels its difficulty switch "Easy mode" / "Hard mode" (Modo fácil / Modo difícil), like the other games.

## 1.39.6 — 2026-11-22
- **«Tus copas» in the profile (Labs) tells each cup**: its name, its dates, your final place (a medal on the podium) and who won, the ones in progress first, five at a time with «Ver más».

## 1.39.5 — 2026-11-22
- **The profile's overall ranking places (Labs) look like a podium**: 🥇 🥈 🥉 with the badges' gold, silver and bronze, 🔥 in the top 10, and a pop when each place arrives.

## 1.39.4 — 2026-11-22
- **CI failure log reads the right attempt**: `failure-log.yml` now reads the log of the attempt that ended (`--attempt`), so a quick "Re-run failed jobs" no longer leaves an empty log and a bogus "no failing test found" record (signature f2f83772a2, four unrelated breaks counted as one). `failures.test.mjs` pins it.

## 1.39.3 — 2026-11-22
- **The profile's section bar (Labs) stands out when scrolling**: nearly opaque in the page's colour, blurred behind and edged, so the badges no longer show through it.

## 1.39.2 — 2026-11-22
- **Twelve new badges in the profile (Labs)**: 🛋️ Finde a tope (Saturday and Sunday on 4 weekends), ☕ Odio los lunes (a game before 8 a.m. on 4 Mondays), 🧗 El Alpinista (won a cup after being last on day 1), 🥂 El canapé (3 cups within 7 days), 🎓 Especialista (50 games of one same game) 🎬 De estreno (a new game in its launch week) and 🏠 De la casa (100 different days with a game), plus five secret ones: Martes 13, Dieciochero, Noche de brujas, Viejito Pascuero and Año nuevo. What they need stays on the phone; the privacy page says so.
- **The profile's pill (Labs) says «Entrar» after signing out**, also on a page brought back with ‹, which kept showing the old name; and the home page's top bar follows every cover's order: language, share, ☁️, and the pill last.

## 1.39.1 — 2026-11-22
- Profile (lab): the top bar no longer jumps on load. The language as one flag with a ▾ and the profile pill are drawn from the first frame, using what the phone saw last time, instead of showing the three flags until the network answered.
- Profile (lab): on Android the share button shows Android's own icon (three dots joined by two lines) in white and turquoise, instead of the box with an arrow.
- Profile (lab): on the home page the profile pill moves to the right end of the top bar, after share, as on every other page.

## 1.39.0 — 2026-11-22
- **La Copa, with more than 10 players** (part of the 20-player lab flag `cup-big`): the table says how many places each player moved by the last day that closed (▲1, ▼2 after the name, no arrow column; it goes by itself when the next day closes); place, name with its (you) and points share one line and the day blocks use the whole width below; the graph draws the first 10 lines, whoever climbs in from below comes as a dashed line that fades in and only players who end among the first 10 are drawn.

## 1.38.8 — 2026-11-22
- 🎲 Dominorama: a domino now settles into place with a little squash and a ring spreading from its cells, and a full zone that breaks its rule shows stripes and an edge in its own color over the dominoes, so you can see which cells are wrong even when they are covered; laid dominoes are a little smaller, so each zone's color and edge show around them. The zones' colors no longer include reds, pinks or orange, so a broken rule stands out.

## 1.38.7 — 2026-11-22
- **The README's screenshots are up to date again**: 97 shots across 12 sections retaken with today's covers and screens. The tester tab (T) no longer shows in them: localhost counts as the lab, so it sat on every shot covering the top bar's share button; `readme.py screenshots` now hides it for the photo only (`README_SHOTS`, `tools/e2e/cdp.mjs`).

## 1.38.6 — 2026-11-22
- **Croc!**: the Dash is now a double tap instead of a long swipe, and you can hop back a row with a swipe down (or ↓ / S). Going back never lowers your progress.

## 1.38.5 — 2026-11-22
- **Shinobi**: the rising tick sound while the stick grows is gone; landings and falls keep their sounds and vibration.
- **Shinobi**: holding the stick no longer buzzes the phone: the stage really gets `touch-action: none` now (base.css gave every `role="button"` `manipulation`, which left Android's long-press on), and touch, selection and drag defaults are blocked.

## 1.38.4 — 2026-11-22
- **How the splash clips of action games are made**, step by step, with what the owner asked along the way (little zoom, show what the card names), in `marketing/splash/clips.md`, so the next splash starts there.

## 1.38.3 — 2026-11-22
- **Push guard checks the /labs/ card length**: a card over 25 words (D-594) now stops the push with its name, instead of a red `tests` run after bringing main in (signature 97c0b5ca90, three PRs on 2026-11-20).
- **End-to-end flags snapshot refreshed**: `home-carousels` is on for everyone (D-578).

## 1.38.2 — 2026-11-22
- **What changed**, for players.

## 1.38.1 — 2026-11-21
- **⚖️ Tembleque's cover shows the real game**: the drawing above the level lever is now a loop of each level as it really plays, the claw dropping pieces on the plank or pieces landing on the disc, with a calm camera that leans in a little as each piece lands and melts back into the start, so it never stops. Only the level on the lever plays; with reduced motion it stands still. Recorded by `tools/generators/wobbles-cover.mjs`, which borrows the splash's takes.

## 1.38.0 — 2026-11-21
- **⚖️ Tembleque is out of the lab, ready to launch, not launched.** Its page is now /wobbles/, with both levels (the lab's links lead there), and once the owner switches `wobbles` on it reaches the home page with ✨ Nuevo, the search and Rankings, a tab per level. Not La Copa or Uno al día for now (the owner's choice, 2026-11-21, D-601). Until then it stays hidden; the ¡Nos volvimos locos! splash (off) now opens its cover.
- **Its cover on a short phone (320×568)**: a smaller icon and picture keep ¡A jugar! above the fold with either level on the lever; `landing-fold.mjs` now measures a cover's Play button (`#btn-play`) rather than the lever above it, which had let it pass.

## 1.37.0 — 2026-11-21
- **🐸 Croc! is ready to launch, and not launched yet**: it leaves the lab the way Sudoku did (D-517), as La Copa's game with its own page `/croc/`, hidden until the owner switches the `croc` flag on from its `/labs/` card (a lab key opens it before). Its cover is the lab's: the real game crossing on its own with a finger showing each swipe and each Dash, and the traffic lever, now La Copa's variant (normal by default; heavy traffic turns the page red-violet and ranks apart). Once launched it is in La Copa's pool and in Uno al día from the day after its launch (both dates are placeholders until the owner picks it). `/labs/croc/` now leads to `/croc/`, and the `nos-volvimos-locos` splash (still off) opens Croc!'s cover there. By Daniel (danielanguita), prepared for launch by Claude.

## 1.36.1 — 2026-11-21
- **🤪 ¡Nos volvimos locos!: bigger game names and texts on its cards** (16 px text instead of 12, on phones with room; a step smaller on short or 320 px phones). Only campaigns with `bigClips`, so far only this one, still off.

## 1.36.0 — 2026-11-22
- **🎖️ Your profile, in Labs** (flag `profile`): in ⚙️, «👤 Tu cuenta» now changes your name and your PIN (each asks for your PIN) and signs you out after asking once. Your scores and badges stay with you; the tables show the new name within an hour (D-600).

## 1.35.5 — 2026-11-21
- **Every game's result**: the big 🏆 above the result no longer pushes the page sideways for a moment as it pops in; it is as wide as the emoji now.
- **🃏 Blackjack, in Labs**: when you lose a hand the table shakes, and for that moment the page could scroll sideways by a few pixels; now it never does.

## 1.35.4 — 2026-11-21
- **🎖️ Your profile, in Labs** (flag `profile`): the profile's card no longer has a circle with your initial: your flag and your name say who you are, as on every table. On a narrow phone the top bar's profile button shows 👤 instead of the initial.

## 1.35.3 — 2026-11-21
- **🤪 ¡Nos volvimos locos!: bigger clips on a phone.** A campaign can ask for `bigClips`: each clip takes what the screen's height leaves for it (193 px on a Pixel 9 instead of 104) and the window grows taller. Only this campaign, still off, uses it.

## 1.35.2 — 2026-11-21
- **🎖️ Your profile, in Labs** (flag `profile`): the badge for one same game 10 times in a row is now **😬 Se llama obsesión** (en «Called obsession», pt «Se chama obsessão»).
- **🎖️ Your profile, in Labs**: at 320 px a long one-word badge name (Madrugador, Explorador, Coleccionista, Todoterreno) no longer spills out of its card.

## 1.35.1 — 2026-11-22
- **🎖️ Your profile, in Labs** (flag `profile`): a new silver badge, **🎵 Es una obsesión**, for playing one same game 10 times in a row. The phone counts the run (never sent); the privacy page says so in the three languages.

## 1.35.0 — 2026-11-21
- **🤪 ¡Nos volvimos locos!, the splash for 🐸 Croc! and ⚖️ Tembleque**, made and kept off until both games launch (`requires: ['croc', 'wobbles']`). Each card shows real play with a camera that pushes in on the action, in the player's language, and its ▶ Jugar opens the game's cover so a newcomer first sees what it is about. A campaign's clip can now be one per language (`video: { es, en, pt }`).

## 1.34.7 — 2026-11-21
- **🎖️ Your profile, in Labs** (flag `profile`): every page's top bar (each game, Uno al día, La Copa, Rankings) now ends in the same pill as the home page, with your flag, your name and a › that open your profile; on a narrow phone it is a round button with your initial. The language there is one flag with a ▾ too. A game's cover no longer has its «🏅 <name>» button: changing the PIN and signing out are in the profile's ⚙️.

## 1.34.6 — 2026-11-21
- **🎖️ Your profile, in Labs** (flag `profile`): on the home page the profile's button is now a pill with your flag, your name and a ›, as a ranking row shows them (or «👤 Entrar» without a name), without the streak, which Uno al día's card already shows. Offline mode's ☁️ stays on the home page and is no longer in the profile's settings.
- **🎖️ Your profile, in Labs**: on the home page the language selector is one flag with a ▾ that opens the three languages, so the whole bar fits in one row, even at 320 px. The profile's ⚙️ keeps the full selector too.

## 1.34.5 — 2026-11-21
- **🎖️ Your profile, in Labs** (flag `profile`): a page of your own at `/profile/` with your card (initial, since when, 🔥 streak, games, cups won) and three tabs. **Badges**: 21 in bronze, silver and gold for One a Day, The Cup and the games; the ones still to earn show greyed with their progress (14 / 30), three are secret until earned, and a new one says so. **Rankings**: your places this week, all time and among friends, and every game you played with your best and your place; a tap opens its table. **Settings**: your name, PIN, language, sound, One a Day's notices and the offline state. Without a name it invites you to sign in, shows the badges this phone already earned and the rankings. On the home page 🏅 becomes your initial and 🔥 streak; /records/ stays as it is meanwhile.
- The phone now counts how many games end early in the morning or at night (for the 🌅 early bird and 🦉 night owl badges); it never leaves the phone, and the privacy page says so.

## 1.34.4 — 2026-11-21
- **Críptico (lab)**: one more hard clue, of a new shape (the second letters of several words); the hint that names its kind now says «letras sueltas (la primera, la segunda o la última de varias palabras)» instead of «iniciales».

## 1.34.3 — 2026-11-21
- **Críptico (lab)**: two more clues by the owner, one medium and one hard.

## 1.34.2 — 2026-11-21
- **Críptico (lab)**: two more hard clues, reworked with the owner from a list of candidates.

## 1.34.1 — 2026-11-21
- **Críptico (lab)**: six more clues, five medium and one easy, picked and reworked by the owner from a list of candidates.

## 1.34.0 — 2026-11-21
- **🎠 Home page with icons, ready for everyone.** In the icon view a tap on a game now opens the game's own cover,
  for everyone: the view launches with flag `home-carousels` to *all* (the owner, 2026-11-21), with the same rows
  as in the lab. The sheet with tabs (Detalles / Ranking) stays in the lab as the sub-flag `home-carousels-sheet`,
  which replaces `home-carousels-covers` with the opposite meaning.
- **✨ Sudoku and ¡Al toque! are no longer new** (the owner, 2026-11-21): their label ends, so in the icon view they
  move from ✨ Nuevos to their own rows.
- **🔗 A shared game link** (`?game=<slug>`) still opens that game's sheet, but the taps after it now follow the
  flag: a game's cover, not another sheet.

## 1.33.6 — 2026-11-21
- **No dark band under the footer on any page**: on Android, when the browser hid its address bar (and on tall phones
  even without that), the covers of La Copa's games, Reinas among them, five lab games, and seven other pages with a footer showed a strip of dark blue
  background under the violet sunset. The sunset's last colour now carries on down to the bottom edge, without making
  the page any longer. A new check measures it on every page with a footer, and a new page has to join it (D-599).

## 1.33.5 — 2026-11-21
- **📋 WBR, bar chart: heights in proportion.** The tallest bars were capped to leave room for their figures, so a
  week of 647 looked as tall as one of 572; now every bar is scaled inside that room, each height true to its number.

## 1.33.4 — 2026-11-21
- **The making-of page is a third shorter on a phone** (16,413 → 11,046 px at 390 px): the numbers sit two
  by two, the factory's steps and the weeks as compact rows (the weeks along a cyan line), and the agents
  and the learnings as cards that slide sideways, with dots under each row showing which card is on
  screen. A laptop sees no change. Nothing changes for players.

## 1.33.3 — 2026-11-21
- **📋 WBR, Pace chart: today dashed.** In the week in progress, today's stretch of the line is dashed (the day is not
  over: on a Saturday morning it read flat), and the % compares the full days only, up to yesterday, against the same
  days of the week before.

## 1.33.2 — 2026-11-21
- **The making-of page's section bar on a phone**: one row instead of three or four wrapped lines
  (57 px tall instead of 91 at 390 px and 114 at 320), the 🎲 held at the left (a 44 px tap back to the top) and the sections as
  44 px chips that slide sideways. The section on screen is marked in yellow, on a laptop too, and on
  a phone its chip slides into view as you scroll. Nothing changes for players.

## 1.33.1 — 2026-11-20
- **Críptico (lab)**: seven more clues (six easy, one medium) and a new kind of wordplay, «cambia una letra», in the three languages.

## 1.33.0 — 2026-11-20
- **Críptico (lab)**: a day is now three clues, easy, medium and hard, worth 20, 30 and 50 points, so a perfect day is 100 (D-598). The day has 3 hints for its three clues, and a hint costs more on a harder clue (5, 8 and 15 points); giving up scores 0 for that clue and the day goes on. After each clue its answer and how it is solved, then the next; at the end the score, how the three are solved, and a spoiler-free share. The streak counts the days finished. Every clue of the bank has its level.

## 1.32.2 — 2026-11-20
- **Críptico (lab)**: one more clue by the owner, and an earlier one of theirs reads as one sentence, without a full stop before the definition.

## 1.32.1 — 2026-11-20
- **Críptico (lab)**: docs/games/cryptic.md, «The owner's clue»: a clue the owner proposes in a session is evaluated, commented and improved with them before it goes into the game.

## 1.32.0 — 2026-11-20
- **📋 WBR: share it by link.** In the panel's WBR, **🔗 Share** freezes the week as it reads now and copies a link
  (`juegosdesalon.cl/wbr/?id=…`) to a light HTML page anyone can open without signing in: the same charts and
  tables, no PDF. Under the week's buttons the panel lists its shares, each with **Copy link** and **Stop sharing**,
  which turns the link off at once. Firebase: `wbrShared/<id>`, readable only by its id, written only by the owner.

## 1.31.5 — 2026-11-20
- 🧪 Lab · **News strip** (`/labs/marquee/`): only treatments A, B and F remain (C, D and E are gone), and each gets
  calmer sub-variants that tell the news without taking over the home page: A1 faint slow ticker, A2 ticker that
  glides one headline every 6 s and rests, A3 ticker that runs one lap and stops, B1 serene headline (no band, no
  timer line, soft fade every 8 s), B2 one round then still, F1 soft stories (grey ring, faint segments), F2 still
  bubbles (nothing moves, the ring goes grey once opened).

## 1.31.4 — 2026-11-20
- **Panel, WBR: each column ranks its own games for the top 3, 5, 10 and 20 shares**, so the week in progress reads its own concentration, not the closed week's ranking.

## 1.31.3 — 2026-11-20
- **Panel, WBR: every game, not only the top 10**, ranked by the closed week, with the share of the games finished the top 3, 5, 10 and 20 take under the total.

## 1.31.2 — 2026-11-20
- **Panel, WBR: the pace chart has a Y axis with its numbers**, and a game's monthly active users average only the weeks it was out: the weeks before its launch no longer count as zeros.

## 1.31.1 — 2026-11-20
- **Panel, WBR: the n/a cells are faded**, so the measured numbers stand out.

## 1.31.0 — 2026-11-20
- **Panel (owner):** a new 🎮 Games view (`#/game-report`) ranks every public game by games finished in the closed week, with the week in progress, the change, its share, its browsers, finished of started and an 8-week trend; below it, one toggle per game unfolds that game's key metrics week by week (games finished and started, browsers, games per browser, "play again", finished by channel and rooms).

## 1.30.0 — 2026-11-20
- **Panel, WBR: three charts.** Games finished by week and by month (the partial ones dashed), the week's pace from Sunday against the week before and the four-week average, and a trend line for each game in the Top 10.

## 1.29.10 — 2026-11-20
- **Panel, WBR: this month's partial column runs to today**, not to the last closed Saturday, when the week in progress shows.

## 1.29.9 — 2026-11-20
- **Críptico (lab)**: one more clue by the owner.

## 1.29.8 — 2026-11-20
- **La Copa, new cup: no extra chip for a length outside the shortcuts.** With 12 days the 3 · 7 · 14 shortcuts stay as they are, none lit, and the one that matches lights up; the extra «12» chip wrapped to a row of its own.

## 1.29.7 — 2026-11-20
- **La Copa: from a cup's board, ‹ goes back to La Copa's home again**, where «Crear una copa» and your other cups are. Launched for everyone on 2026-10-30, it had turned itself off: its flag record was gone, and a missing flag reads as lab only. Its gate is removed, so it no longer depends on the flag.

## 1.29.6 — 2026-11-20
- **Internal:** the agents' edit guard now runs from the shared settings, so it also works in headless rounds (D-597). Nothing changes for players.

## 1.29.5 — 2026-11-20
- **La Copa's 🎲 draws from exactly the games every player sees on the home page**: a launched game (Stack, Aletazo, Sudoku, Memory, Dominorama) is in it once its flag is 🚀 for everyone, read fresh before drawing, not from what the phone last saved; a game still in the lab is never in it, not even for a lab key holder.
- **Launch playbook**: a game's launch now checks it can be drawn in La Copa, not only played there: a test per launched cup game, and a live check of the create screen as a new visitor.

## 1.29.4 — 2026-11-20
- **Internal:** the documentation, ideas and retention agents can now only edit their own files, and every PR shows documentation drift as warnings (D-597). Nothing changes for players.

## 1.29.3 — 2026-11-20
- **Making of (owner):** a new "The lab" section explains how everything new is tried live before players see it: the switch (off, lab, everyone), the `/labs/` cards, the «T» tester tab and launching with a tap, with three screenshots. Also a Nov 19 step (launches that check themselves, D-591), a 12th learning ("Check that the checks fire": the push guard that never blocked, the launch that waited on a prompt), and the review step now names the player agent.

## 1.29.2 — 2026-11-20
- **Críptico (lab)**: the answers no longer show in the public repo (D-595). `clues.js` keeps each answer and explanation sealed (`sealed.js`, added with `tools/generators/cryptic-clues.mjs`); a clue a player proposes becomes an issue without the clue or its answer (`feedback.mjs proposal <issue>` reads it); and `engine.test.mjs` fails when an answer shows in the pending changelog, the game's files or its docs. The example clue on the proposal form left the bank, since the form gives its answer.

## 1.29.1 — 2026-11-20
- **The owner approves their own 🔴 PRs once** (D-596): after the tick, a push that touches no 🔴 file (a fix for a red check, a text, a doc) keeps the approval and the PR merges on its own; a push that changes a 🔴 file again, or any push to an outside PR, still asks.

## 1.29.0 — 2026-11-20
- **La Copa: up to 20 players, in the lab** (flag `cup-big`; 10 without it). From the 11th, the board shows the first 10 rows with the 11th peeking under a "See all" button, and the day-by-day graph draws its first 10 lines, with no place numbers or name chips, and continues the names column with the other players, one under another with their place. Cups of 10 or fewer look as before.

## 1.28.16 — 2026-11-20
- **Críptico (lab)**: one more clue by the owner (initials).

## 1.28.15 — 2026-11-20
- **Panel (owner):** the Timeline no longer reads nameless campaign views as one person seeing a campaign several times: a burst of 3 or more within 10 seconds is a robot and is left out, and the rest say "N views without a name within 2 minutes (could be different people)".

## 1.28.14 — 2026-11-20
- **Agents moved from Words to Logic** on the home page, and the Words row is gone from the carousels.

## 1.28.13 — 2026-11-20
- Workshop: the push guard really stops a push now. Its hook command ended in `|| true`, which turned the guard's "stop" (exit 2) into "go on", so since November 9 it never blocked anything and the design-lint gate went red on three PRs it should have caught (#1582, #1667, #1699). `push-guard.test.mjs` now runs every blocking hook's command and fails if the 2 does not get through.

## 1.28.12 — 2026-11-19
- **The tester tab's cloud states go with offline mode** (D-592): «Estados de la nube» shows in «Probando ahora» only while the offline-mode row does, and hides with it.

## 1.28.11 — 2026-11-19
- **La Copa's home card without the context that did not prosper** (flag `copa-contexto`, in La Bodega): the home page no longer asks it, so testers no longer get it and the «T» tab has no switch for it.
- **The «T» tab drops the switch of every flag whose card went to La Bodega as 💤** (D-593), as it already did for launched ones.

## 1.28.10 — 2026-11-19
- **Lab cards, short**: every card being tried in the lab now says what it tries in a sentence or two, and a new rule keeps each one at 25 words or fewer (D-594).

## 1.28.9 — 2026-11-19
- **Rankings (lab, flag `cup-best-day-all`):** «Mejor día de copa» also lists La Copa's own games: Línea Relámpago, Toque y Fama: Número and La Gran Final. Their best days were already kept but shown nowhere.
- **Group games (lab, flag `wins-hide-empty`):** while nobody is in a game's «Más victorias», its cover shows only the title and the line saying how wins count, with no tabs and no «Todavía nadie» (today Generala, El Ahorcado and Línea de tiempo); signing in stays.

## 1.28.8 — 2026-11-19
- **The tester tab «T» opens lighter** (D-592): its first view, «Probando ahora», shows only what the tester pinned with 📌; «Experimentos» lists every switch of the page, each with its 📌. Hiding one never turns it off, and anything turned off on the phone always stays in sight, marked.

## 1.28.7 — 2026-11-19
- **Lab · 📰 News strip**: a demo of six ways to draw a strip of news above the home page's top bar, over the real home page and unscaled (the phone's own width, or 320, 360, 390 or 430 px on a computer). Each headline is a campaign, and a tap opens its real splash without marking it seen.

## 1.28.6 — 2026-11-19
- **Home carousels (lab):** the rows show as soon as the page opens. They used to wait for two reads from the server (the flags and the lab key) before the first icon appeared.
- **Home carousels (lab):** the sheet of a game you can play alone and with others (Generala, Toque y Fama, El Ahorcado) shows its solo scores, as its own cover does. It used to show the wins table, which is almost always empty.

## 1.28.5 — 2026-11-19
- **Críptico (lab)**: the cover's split-flap board runs through more words before landing on the name (10 in Spanish, 9 in English and Portuguese), so its loop is longer.

## 1.28.4 — 2026-11-19
- **Home carousels (lab):** the "Con amigos" row is now "Solo o con amigos" (English "Solo or with friends", Portuguese "Sozinho ou com amigos"): its games can be played alone too.

## 1.28.3 — 2026-11-19
- **Críptico (lab)**: the cover's line now says what the game is in plain words: «Pistas directas, indirectas y con truco para encontrar una palabra.» (in English and Portuguese too).

## 1.28.2 — 2026-11-19
- ✨ Nuevo shows on launch night for lab key holders too: the home page draws again when a launch starts a game's label.
- docs/LAUNCH.md: the launch playbook, from preparation to cleanup, with every past miss.

## 1.28.1 — 2026-11-19
- Scheduled launches run only as Claude cloud tasks with a second task as alarm (D-591), after the desktop-app task waited on a permission prompt; launch times corrected to 18:54 Pacific.

## 1.28.0 — 2026-11-20
- **Panel (owner):** the WBR has a new table, weekly active users by game: how many browsers finished each game in each week (a month averages its full weeks), most first by the closed week; a game started and never finished gets a ⚠️ highlight. Each browser now notes, once a day, which games it started and finished, with the same random number it already had and nothing else (D-590, /privacy/ updated in the three languages); until that count covers a week, the table shows an estimate marked ~.
- **Panel and weekly email (owner):** every games metric in the WBR says whether it counts games started or finished ("Games started per active browser", "Most finished", "Cup games finished"…).

## 1.27.27 — 2026-11-19
- **Críptico (lab): the owner's MANJAR clue** («El hombre junto a un frasco de vidrio. It's delicious!, exclama»). The bank has 56 clues.

## 1.27.26 — 2026-11-20
- **Críptico (lab): propose your own clue.** At the end of every clue, «✍️ ¿Se te ocurre uno? Propón tu críptico»
  opens the feedback form with the kind «Críptico» picked: the clue, the answer, how one gets there (optional),
  the name to sign it with (the registered player's, editable) and the optional email. It reaches the panel as
  feedback and becomes an issue the feedback agent judges, improving it when it can, for the owner to publish
  as is, as one of its versions or not at all.
- **«Hoy es tu críptico».** A published clue carries its author: on its day the author does not play it, sees it
  with its solution and keeps the streak; practice never gives a player their own clue; everyone else sees
  «Críptico de <name>». The privacy page says the chosen name is published with the clue.

## 1.27.25 — 2026-11-19
- **Panel (owner):** the WBR's Top 10 games (and the Sunday email's) rank and count games finished, as the headline does, instead of games started; its total row is now total games finished.

## 1.27.24 — 2026-11-19
- **Panel (owner):** the WBR's column titles are short ("Nov 8–14", "Oct 26–Nov 1"), so more columns fit on a phone; a partial week or month carries a * explained in one line under the headline table, and in the Sunday email.

## 1.27.23 — 2026-11-19
- One icon per game: the splash takes every game's icon from games.js, so Dominorama's card shows its drawn domino, not 🎲; a test stops a campaign from mixing in another emoji for a game.

## 1.27.22 — 2026-11-19
- **Panel (owner):** the WBR's Top 10 games table ends with two rows: the total games played on the platform in each column, and the share of it the top 10 take, to see how play spreads across the games.

## 1.27.21 — 2026-11-19
- **Panel (owner):** the 📋 WBR shows the week in progress first, as a partial column (Sunday to today, Pacific time), on the latest closed week; the % changes, the top 10 and the highlights still compare the closed week.

## 1.27.20 — 2026-11-19
- **Críptico (lab): a word never breaks over two lines.** The letter boxes share the card's width in one row, and
  their letters shrink for the long answers (MEDIANOCHE, MANTEQUILLA). The car-jack clue now answers GATA, as it
  is said in Chile (the owner).

## 1.27.19 — 2026-11-19
- **Críptico (lab): the owner's NÓMADA clue** («Madonna sale quinta, enloquece y viaja»). The bank has 55 clues.

## 1.27.18 — 2026-11-19
- 🎲 **Dominorama** and 👀 **Memorice** leave the lab at 19:00 Pacific on 2026-11-19 (flags and the `dominorama-memorice` splash, by the `launch` workflow); they join Uno al día and show ✨ Nuevo from 2026-11-20.

## 1.27.17 — 2026-11-19
- **Críptico (lab): ten clues of high difficulty**, thought with the owner (CORAZÓN, MEDIANOCHE, PRIMAVERA, ANTIFAZ,
  ARES, ALMA, ESPONJA, CANDADO, SOLEDAD, PARAGUAS): each piece takes a step of its own before the word is built.
  The bank has 54 clues.

## 1.27.16 — 2026-11-19
- **Críptico (lab): the airport board mixes its words.** Each word reads whole for a moment, then the next one's
  letters creep in one tile at a time, so for a while the two words mix. CRÍPTICO is one more word of the loop,
  held as long as the others, so the loop has no start or end.

## 1.27.15 — 2026-11-19
- **Críptico (lab): you type straight into the boxes.** The separate answer field is gone: a tap on the boxes opens
  the keyboard, each letter lands in its box and the cursor (the yellow box) moves on by itself. Only letters go in,
  never more than the answer has.

## 1.27.14 — 2026-11-19
- **Críptico (lab): two clues from the owner**, MANTEQUILLA («Hombre americano con un litro extra en tequila. Qué
  maravilla de calorías doradas») and RELAMIDO («Sonaron cuatro notas y no quedó una pizca de dulce de leche en la
  cuchara»). The bank has 44 clues.

## 1.27.13 — 2026-11-19
- **🎲 Dominorama: every `>` and `<` rule can fail** (issue #1656): the board builder no longer shows a rule that holds whatever the player does (`>-1`, `>0` on a board with no blank, `<13` on two cells), which read like a bug. It checks each threshold against the board's own dominoes at every step that sets or reshapes a rule, and the engine test checks every zone of every test board.

## 1.27.12 — 2026-11-19
- **Críptico (lab): sharper clues.** The owner still found ours too easy. The bank grows to 42, and every clue now
  clues its pieces instead of writing them out (a synonym, a note, a Roman number, a symbol), with a sideways
  definition, as the owner's own clues do. The spec's rules gain that one.

## 1.27.11 — 2026-11-19
- **Críptico (lab): harder clues.** The 30 clues of the bank are rewritten as one natural sentence that tells
  another story, with no colon between the wordplay and the definition, a sideways definition and an indicator
  blended into the story, so the player has to think and reach for a hint. The owner's two clues stay as written.
  The rules are in the game's spec.
- **Críptico (lab): a new clue from the owner**, COMA, a double definition («Ojalá se alimente y te ayude a separar
  las ideas»). The bank has 33 clues.
- **Críptico (lab): the owner's CAMISA clue** («En la cumbre, de dos en dos, Camilo miraba Santiago. Hasta que se le
  salió un botón») replaces the earlier CAMISA one; still 33 clues.

## 1.27.10 — 2026-11-19
- **🗝️ Críptico** (lab): the cover's airport board never stops. Each word comes in as a wave, tile by tile, its tiles keep flapping while it holds, and it loops through the words endlessly. There is a bit more room between the board and the title.

## 1.27.9 — 2026-11-19
- **🗝️ Críptico, a new game in the lab**: one cryptic clue a day, in Spanish. Part of the clue defines the word and the rest builds it with wordplay (anagram, reversal, hidden word, charade…). Three helps that cost a star each, a streak, and practice with clues from other days. It starts with 32 clues of our own.

## 1.27.8 — 2026-11-19
- **🔤 Toque y Fama: Palabra under Palabras** (lab): on the home page, the 🔤 Palabras filter shows its own card, which opens the word version directly. With no filter there is still one Toque y Fama, where you pick number or word.

## 1.27.7 — 2026-11-19
- **The Dominorama and Memorice splash** (still off) is titled "¿Lógica o memoria?".

## 1.27.6 — 2026-11-19
- **The splash, polished for Dominorama and Memorice** (still off): on a phone each game's clip sits inside its card with a small border and the cards are further apart; Dominorama's clip shows only the board filling up; Memorice's has room around its board and its card opens with "Un clásico de la infancia."

## 1.27.5 — 2026-11-19
- **Labs, T tab**: a sub-flag always sits under its main flag, and the icon view's one is called «↳ target: portada».

## 1.27.4 — 2026-11-19
- **Icon view (lab):** the 🎯 Pulso row joins 🤹 Destreza; one row now holds the quick games and the skill games together.

## 1.27.3 — 2026-11-19
- **Splash campaign `dominorama-memorice`**, made but off: it presents 🎲 Dominorama and 👀 Memorice side by side, and stays unseen until both games are launched and the owner turns it on in 📣 Campaigns.

## 1.27.2 — 2026-11-19
- **Labs, icon view**: the T tab calls it «main page con íconos», and a new sub-flag `home-carousels-covers`, shown under it only while it is on, makes a tap on an icon open the game's cover instead of its sheet.

## 1.27.1 — 2026-11-19
- **The stalled-PR takeover runs in the cloud again**: it had been scheduled on the Mac mini's Remote Control environment, where each hourly run stayed open and filled the server's 32 places, so sessions opened from other devices failed. Its prompt doc now says which environment to pick.

## 1.27.0 — 2026-11-19
- **🎲 Dominorama leaves the lab, ready to launch by flag (D-517's way), not launched**: La Copa's screen in `cup/games/dominorama/` (the lab's engine moved there, plus `generateDay` and `card`; `ui.js`, `texts.js` in es/en/pt, `style.css`, the drawn domino icon), its page `/dominorama/` with its bridges and link card, La Copa (pozo 20) and Uno al día (orden 25, `desde` a placeholder until the owner picks the launch date). Hidden until `flags/dominorama` is on; the credit to NYT's Pips stays on its cover. Splash media recorded for a future campaign (`marketing/splash/dominorama-clip.mjs`). e2e `tools/e2e/dominorama/page.mjs`.

## 1.26.5 — 2026-11-19
- **👀 Memorice is ready to leave the lab, launched by flag (D-517's way), not launched yet**: La Copa's game in
  `public/cup/games/memory/` (the lab's engine and pictures moved there, plus `generateDay`, `card` and Uno al día's
  `dayScore`; its screen `ui.js`, texts in es/en/pt, `style.css`), serving its page **/memorice/**, La Copa (pozo 19)
  and Uno al día (orden 24, its date a placeholder until the owner picks the launch). Hidden until `flags/memory` is
  on; its ranking table is `memory`. The lab card points to the page; the prototype stays on the moved engine. Its
  link card `assets/og/memory.jpg`, the splash clip `assets/splash/memory.mp4` (with `memory-start.jpg` and
  `memory.jpg`, recorded by `marketing/splash/capture.mjs memory`) and the e2e `tools/e2e/memory/page.mjs`.

## 1.26.4 — 2026-11-19
- 🚉 Transbordo leaves the games being tried for 📦 La Bodega → 🎲 Juegos guardados as 💤 No prosperó (the owner was not convinced); still playable with the lab key.

## 1.26.3 — 2026-11-19
- **The offline copy no longer stores the lab games** on players' phones: Labs is for the team, so its games stay online-only (`precache.mjs`, guarded by `precache.test.mjs`).

## 1.26.2 — 2026-11-19
- **Making-of setup diagram: the left lane reads THE TEAM** instead of PEOPLE, so players, on the product side, are not read as missing from it. Nothing changes for players.

## 1.26.1 — 2026-11-19
- **La Copa on the home page**: with no day to play, its card shows a gold one-line «🏆 Jugar» (Play, Jogar) as tall as One a Day's «Únete al mes», behind the new lab flag `copa-jugar`.

## 1.26.0 — 2026-11-19
- **In the lab: today's Uno al día at the end of a game played on its own** (flag `solo-result-today-card`, #1597). Under «Volver al menú» of any game played on its own, one cyan line says which game Uno al día brings today («📅 Uno al día de hoy: 👑 Reinas · Jugar») and opens it; only while today's game is not played yet on that phone, never in La Copa or in Uno al día itself. In three languages, with its card in /labs/ and its switch in the «T» tab.

## 1.25.21 — 2026-11-19
- **The making-of page up to 19 November** (`/making-of/`): the four new agents (Feedback, Retention, CI health, Backlog) with their job descriptions, the agents told as seven standing roles plus four specialists Processes sends (cards and diagram), 14 GitHub jobs in the setup diagram, an 18 November step (the merge queue, Croc! by a second contributor) and an 11th learning, «Measure the AI before you trust it» (the clue judge). Nothing changes for players.

## 1.25.20 — 2026-11-19
- **Workshop: the player agent looks harder at the screen a PR changes.** It still plays the whole game as a first-time player, but it learns from the PR's changelog entry (never its code) which screen changed, plays that screen again in the second language and at 320 px, and its report always says how that screen read. Nothing changes for players.

## 1.25.19 — 2026-11-19
- **Icon view (lab)**: the home page lab is renamed «Vista de íconos», its groups sit further apart, and «Rápidos» is now «Destreza».

## 1.25.18 — 2026-11-19
- **The install invitation's e2e check reads the page's clock**: since the scripts run on a fixed day (D-589), the check that the ✕ snoozes the invitation 14 days compared the page's date with node's real one, and went red on every PR that ran it from 2026-11-19 on. `real-date.test.mjs` now fails a pinned script whose check reads node's clock.

## 1.25.17 — 2026-11-19
- Workshop: the push guard now also stops a `git push` when a decision file would fail `document.test.mjs` (a topic not in `topics.json`, a Status not in canonical form, a number twice), with the new `node tools/agents/document.mjs decisions` (CI failure signature seen on #1492 and #1574).

## 1.25.16 — 2026-11-19
- **Workshop: no end-to-end script depends on the real date** (D-589). The scripts that open a page following
  today (the home page and its ✨ New row, `/today/`, `/records/`, La Copa's create screen, the screen catalog
  of the languages scripts and `look.mjs`) open it on a pinned day, `launch({ clock: true })` in `cdp.mjs`, and
  `real-date.test.mjs` fails a new one that does not; `landing-fold.mjs` looks for each Uno al día game's day
  from that day on. On 2026-11-19 the day's Uno al día cover turned every PR red at UTC midnight.

## 1.25.15 — 2026-11-19
- **Toque y Fama: Palabra**: tap a box to choose where the next letter goes, as in Número. A yellow warning ("⚠️ La palabra está en inglés") shows only when the cup's word language differs from yours, and the instructions say the word follows the cup's language, not the one you picked.

## 1.25.14 — 2026-11-18
- **Rankings shows Sudoku's easy level.** Its tab «Sudoku · 🟢 Fácil» read a table nobody writes to and always
  said «Todavía nadie»: Sudoku keeps one table per level since the lab, the first level too. Rankings, the game's
  page and the home page's game sheet (lab) now name it from one place (`FIRST_VARIANT_TABLES` in `games.js`); an
  old link to `#juegos/sudoku` opens the right table.

## 1.25.13 — 2026-11-18
- **The footer's sunset reaches the bottom of the screen.** On a phone with a gesture bar, a dark band of the page's
  background showed under the footer of the home page, Rankings and the game covers (the owner's report): the footer
  now covers the room the page keeps for that bar.
- **In the lab, the home page as carousels** (flag `home-carousels`, the owner's requests): a game's sheet is always
  as tall as ten rows of its ranking need, and the ranking shows the first ten and no more; the game's animation
  grows to fill that room (up to three times its size), with the game's line and its data centred under it, and a
  game with no animation shows its icon, big, in its place; a tile's icon has no box of its own; and 🎲 Juego al azar
  is gone from that page, the hero giving its room back so the first row shows on the first screen.
- **In the same lab treatment** (the owner's requests): the rows no longer slide, they are grids of three games; a
  game shows once on the page, in the first row that holds it; a line parts La Copa and Uno al día from the games;
  a game's sheet has a share button, whose link (`/?game=<folder>`) opens the home page with that sheet over it, and
  on a phone without the carousels goes to the game's own page; and Sudoku's animation in the sheet is its board
  alone, without the icon above it.

## 1.25.12 — 2026-11-19
- **Workshop: a PR that changes a screen on purpose gets the runner's visual reference on its own.** The
  session commits the reference it made with `visual.mjs --update --part <game>`; the Visual references
  workflow remakes exactly the references the PR changes on GitHub's runner and commits them to the branch,
  with a token that starts the checks again, so the Mac's ~2 % pixel difference no longer turns
  `end-to-end` red and needs no second push (#1624, #1626, #1629). Never on a fork's PR; a screen nobody
  approved still fails the check.

## 1.25.11 — 2026-11-18
- **Croc! (lab): a gap between the result emoji and its title**: the 💥 or 🏆 no longer touches the big title letters.

## 1.25.10 — 2026-11-18
- **Workshop: the processes ledger records the CI mechanisms of this round** (#1632, #1633, #1634): the
  real-date failure of the Uno al día covers and the visual-reference round trip, each with what stops it.

## 1.25.9 — 2026-11-18
- **Workshop: a push that changes a game's cover waits for its fold check.** `push-guard.mjs` stops the
  push until `node tools/e2e/landing-fold.mjs --only <game>` passed in that worktree on the cover as it is
  (~15 s a width); a passing run leaves a stamp in the worktree's git folder (`tools/e2e/landing-stamp.mjs`).
  PRs #1624 and #1629 took five pushes each, finding the cover's fold in CI.

## 1.25.8 — 2026-11-18
- **Croc! (lab): the traditional 3, 2, 1 before crossing**, and the cover polished: the swipe trail stops short of a bigger finger, the swipe and long-swipe instructions live together in «📖 Instrucciones» (no caption under the demo), and the footer has «Sugerencias y comentarios» next to the coffee.
- **Every new lab cover keeps its footer and feedback (canon gate)**: the lab entry gate (`public/labs/canons.test.mjs`, D-579) now also fails a lab game whose cover lacks the site footer or a way to leave feedback (the general inbox, or the game's own comment). The new-game generator already passes it; Croc!'s start button counts a double tap once (D-576).

## 1.25.7 — 2026-11-18
- **Croc! (lab): the cover shows the swipes**: a finger over the demo swipes short up or sideways on each hop and long up with a golden trail on each Dash, the demo runs slower so each gesture can be followed, and the caption says «Desliza ◀ ▶ · Muévete de lado» on side hops; «Cruzar la autopista» is the standard yellow button, and the tab shows the site icon like every game, not a second 🐸.

## 1.25.6 — 2026-11-18
- **Internal**: the check that every game's start button is above the fold now runs, on a PR, only for the games the PR changes (15 s instead of ~4 min per phone width), and every game's own PR checks its cover; a shared change and `main` still check every game (D-588).

## 1.25.5 — 2026-11-18
- **Babel's and Aletazo's Uno al día covers show Empezar without scrolling**: on their day the notice pushed it below the fold; their drawing gives up the space on the day's cover.
- **The fold check measures every game's day cover, every day**: it moves the page's clock to a day each game comes out, instead of measuring only the real day's game, which made every PR fail on the day a too-tall cover came out (Generala, 2026-11-19); it also found Babel's and Aletazo's.

## 1.25.4 — 2026-11-18
- **Croc! (lab): a grass verge and a wetland**: the rest lanes are a grass verge between curbs, with a lamp, a bin, a bench and a butterfly, and the finish is a wetland that fills the screen, with reeds, a heron, a duck, a dragonfly and lily pads, where there was a dark empty band.

## 1.25.3 — 2026-11-18
- **Croc! (lab): a cover like the other games**: the demo is the real game playing itself (its frog, cars, canal and boats), taller, with a caption of what the frog does; the traffic lever is the standard one (Pintaminas', Sudoku's) and always starts on normal traffic; the instructions fold into «📖 Instrucciones», with «👤 Entrar» and the ranking on the cover.

## 1.25.2 — 2026-11-18
- **Generala in One a Day**: the cover's extra line is shorter («Todos reciben los mismos dados.»), so on a 320 px phone the start button no longer falls below the fold in English and Portuguese.

## 1.25.1 — 2026-11-18
- **Croc! (lab):** its card in `/labs/` says in one short line what the game is today.

## 1.25.0 — 2026-11-18
- **Croc! (lab): new name, water canal with boats, Dash/boat cover demo and electric difficulty lever**: the lab's highway-crossing frog game (Sapiondo) is now **Croc!** in all three languages, inside and out (`/labs/croc/`, id `croc`, its La Copa game, tests and docs; the phone's `sapiondo` record and settings carry over once on load, C-20). It adds a water canal with passing boats at row 22, after a safe riverbank at row 21, crossed by Dashing over it or hopping onto a boat; a looping cover animation that shows Dash and boat-riding; and Tembleque's electric lever for the difficulty, explaining normal vs. heavy traffic. By Daniel (danielanguita).

## 1.24.2 — 2026-11-18
- **In the lab, the home page as carousels: a game's sheet keeps one height for Detalles and Ranking** (flag
  `home-carousels`, the owner's request). The sheet is as tall as the taller of its two tabs, up to what the screen
  gives, and does not move when the tab changes. The game's animation adapts to it: it grows to fill the room the
  details leave (up to twice its size) and, on a short screen, shrinks so the game's line stays in sight. The
  ranking is now read as the sheet opens. A credit line with a link inside a framed drawing (Agentes') is not shown.

## 1.24.1 — 2026-11-18
- **In the lab, the home page as carousels: a game's sheet plays its cover animation** (flag `home-carousels`). On
  top of the details, the demo of the game's waiting room plays by itself, or its "how to play" drawing when it has
  no demo, to show how the game is played: fifteen of La Copa's games bring one; the group games and ¿En qué año?
  have none yet. It comes framed from a new page, `cup/cover/?game=<id>`, so the home page still loads no game's code.
- **In the same lab treatment, a carousel's game shows only its icon and its name** (the owner's request): how long
  it takes and how many play left the tile and stay in the game's sheet. The tester «T» tab no longer draws
  itself inside a framed page.

## 1.24.0 — 2026-11-18
- **In the lab: the home page as carousels** (flag `home-carousels`, `/labs/` 🎠, the owner's design). With the
  flag on, the filters, the search and the long list give way to rows that slide sideways under La Copa and Uno al
  día: Favoritos (once one is marked), Populares, Nuevos, Con amigos, Rápidos and one per type. A game shows its
  icon, its name and how long it takes; a tap opens a sheet with its details, its ranking, the ⭐ and ▶ Jugar.
  Players see no change until the owner launches it. The tests hold the flag off (`tools/e2e/flags-held.json`),
  so the scripts that open the home page keep testing what players see; `home/carousels.mjs` tests the new one.

## 1.23.0 — 2026-11-18
- **🏁 La Gran Final reparte puntos por ronda, como un día**: en cada ronda el mejor se lleva 10, el segundo 8… (a igual puntaje, el más rápido), y gana la final quien suma más. La tabla de la final muestra tu lugar en cada ronda. Rige para las finales que se abren desde el 19 de noviembre; las que ya están en curso siguen con el promedio (D-587, pedido de un jugador).

## 1.22.8 — 2026-11-18
- **Merge queue (trial, D-586)**: a PR behind main is brought up to date one at a time before auto-merge merges it, so two PRs that pass alone can no longer break main together. Nothing changes for players.

## 1.22.7 — 2026-11-18
- The processes log records the mechanism of PR #1611 for the e2e groups signature. Nothing a player sees changes.

## 1.22.6 — 2026-11-18
- **Bulls and Cows, playing alone on a small phone**: the Start button sits right under the title, no scrolling to find it.
- **Hangman**: the hit or miss banner stays long enough to read (2.6 s whole instead of 0.6 s), and a letter's verdict that closes on its own waits 2.8 s.

## 1.22.5 — 2026-11-18
- Every Altoke game now opens with an animated preview of what the finger does, pinned to the bottom of its intro card: tap, tap, tap on the balloon, tapping one of the options (colors, numbers, clocks, shadows, trays), reordering the bars, dropping the chip into the Connect Four, cutting, tracing and chasing. Under the ones of the previous PR it covers all 29 games except ¡Pinball!, which already had its own.
- The answer buttons are bigger (taller, and wide enough to hit with a thumb) and now always fit the screen, even on a 320 px phone, where some games' answers were cut off.

## 1.22.4 — 2026-11-18
- ¡ATRAPA! and ¡EQUILIBRA! (Altoke) open with a small preview of the drag: a faded ghost of the basket or the plate at both ends, the real one sliding between them under a thumb, as ¡Pinball!'s intro does.
- The five purple (swipe) games, ¡RUEDA!, ¡CORTA!, ¡DIBUJA!, ¡SIGUE! and ¡LIMPIA!, open with the same kind of animated preview at the bottom: the thumb cuts the line, rolls the ball along the road, traces the heart, stays on the running mouse and rubs the dirty glass clean.

## 1.22.3 — 2026-11-18
- End-to-end groups (D-585): a new game's test jobs are timed from their siblings instead of a flat 90 s each, and the group target is 400 s, so a PR that adds a game no longer turns `groups.test.mjs` red. Nothing a player sees changes.

## 1.22.2 — 2026-11-18
- **Panel and ideas: home-page shares no longer inflated**: until PR #1478 (2026-11-15) every test run wrote five `comparte/app` to the live numbers, 17,002 in four weeks. The data is left as it is; the panel, the weekly report and `ideas.mjs check` skip `app` shares up to 2026-11-15 and say how many they skipped.

## 1.22.1 — 2026-11-18
- **Tembleque** (lab): the nine cheers of a balanced drop now sit behind the flag `wobbles-cheers`, with its switch in the «T» tab and its card under Tembleque in /labs/; switched off, it says ¡Perfecto! as before.

## 1.22.0 — 2026-11-18
- **Sapiondo in the lab & La Copa**: 2.5D arcade highway crossing (`/labs/sapiondo/` and `public/cup/games/sapiondo/`) with `🐸` icon, seasonal frog sweaters (Halloween, Thanksgiving, Christmas, New Year, Winter, Summer), board-wide swipe controls (`2.4`-tile long forward swipe for Dash with glowing arrow preview, 3 Dash charges refilled by fruit/non-ghost Close Calls), 3 lives with `1.5 s` ghost shield, `+1` per lane / `+10` at finish / `+1` per fruit / `−1` per life lost scoring, Normal & Hard difficulties, and deterministic seeded tracks for Cup play.

## 1.21.26 — 2026-11-18
- **Clearer texts in Bulls and Cows, Hangman and Sudoku**, from a player pass: Bulls and Cows' solo rules now say what a bull and a cow are, and its scoring sentence is shorter; Hangman's result says "Your score: n out of 100", no longer shows the word twice when playing alone, and the English title reads "You were hanged"; Sudoku's card counts its mistakes and hints (❌ 2 · 💡 1) instead of repeating marks, and the ranking invitation reads "Sign in to get on the leaderboard" in every game.

## 1.21.25 — 2026-11-18
- **Tembleque** (lab): a balanced drop no longer always says ¡Perfecto!: it picks one of nine cheers (¡Perfecto!, ¡Impecable!, ¡Clavado!, ¡Exacto!, ¡Genial!, ¡Tremendo!, ¡Maestro!, ¡Bravo!, ¡Increíble!), never the same twice in a row, in both levels and in es, en and pt. The hard level's streak keeps «Perfecto ×n».

## 1.21.24 — 2026-11-18
- **Small phones (320×568): the turn fits on screen.** In Hangman, after picking a letter, «Try the E» and «Buy a letter» now sit side by side above the fold (the drawing, the lives and the word tighten; keys stay 44 px). In Bulls and Cows solo and La Copa's number game, the keypad tightens, the hint steps aside from the second guess and the newest guess goes first, so its clues show without scrolling. 390 px is unchanged.
- New check `tools/e2e/play-fold.mjs` (D-520): mid-turn, the confirm button and the latest feedback must be above the fold at 320×568 in every language.

## 1.21.23 — 2026-11-18
- **Tembleque, hard mode: the dial that turns the board moved to the top**, under the next pieces, and it
  fades while you are not using it: at the bottom, an iPhone's swipe there closed the game.
- **Tembleque, hard mode: the next pieces are centred under the dial**, the next one bigger and brighter than
  the one after it, so it is clear which comes first.

## 1.21.22 — 2026-11-18
- **The owner's approval box on a 🔴 PR stays put**: if anyone but the owner edits the description and drops or changes the box, a new workflow (`lane-box.yml`) puts it back as it was. PR 1589 lost its box when a contributor's session rewrote its description.
- **A 🔴 PR the owner already answered loses its `needs-owner` label**: once the Yes (merged) or the No is carried out, the label goes, so the list of PRs waiting for the owner shows only those still waiting.

## 1.21.21 — 2026-11-18
- **The panel leaves Labs out**: on the live site the /labs/ pages now write their visits, plays and errors apart (Labs in the panel's environment picker), so every Live number is players' activity only (D-584).

## 1.21.20 — 2026-11-18
- **A contributor's PR from a fork no longer shows a red `lane` check** for a permission they cannot fix: the job's token is read-only there, so it prints the lane, writes nothing and ends green; `owner-approval` stays missing, so the PR still waits for the owner (19 red runs on three fork PRs in two days).

## 1.21.19 — 2026-11-18
- Usability round 2026-11-18: marketing note updated (the Sudoku "Coming soon" asset still shows app 1.7.32 and none of the other games). Nothing a player sees changes.

## 1.21.18 — 2026-11-18
- **Learning piece 1**: step 1.3 (the clue judge) closed below its bar at the owner's call; the piece is paused. Nothing changes for players.

## 1.21.17 — 2026-11-18
- **Retention ledger**: week of 2026-11-08 recorded (next-day return 42.7%, 40 players, verdict no-history); no proposal.

## 1.21.16 — 2026-11-18
- **Agentes**: four decoys that could pass for right answers are replaced (PODER, LIFE, LUCK, MUSEU), and the clue judge's third round agrees with the owner on 16 of 20 labelled clues and catches all 12 bad ones.

## 1.21.15 — 2026-11-17
- **Tembleque (lab)**: its cover and result follow the canons. How to play starts folded, with sign-in, and behind
  `cover-dialogs` both open as the Instrucciones and Entrar dialogs; on a 320×568 phone the picture shrinks so
  the level lever stays above the fold. Each level's result now has the rankings (a table per level), the
  shared «Volver al laboratorio» exit and the breakdown after it; the easy level's top buttons are 44 px.

## 1.21.14 — 2026-11-17
- **Blackjack (lab, felt table)**: «Pedir» shows a hand tapping the felt twice by your cards, the table's sign for a card; the two taps on the felt no longer ask by themselves.

## 1.21.13 — 2026-11-17
- **Sapiondo (lab)**: danielanguita owns it while it is in the lab (D-553), so their PRs that touch only Sapiondo merge on green checks without the owner's tick.

## 1.21.12 — 2026-11-17
- **Blackjack (lab, felt table)**: two taps on the felt by your cards ask the dealer for a card, as at a real table: a hand taps twice where your finger landed and the card comes; one tap does nothing.

## 1.21.11 — 2026-11-17
- **Blackjack (lab, felt table)**: «Elige tu apuesta ↓» shows in every betting round, not only the first.

## 1.21.10 — 2026-11-17
- **Blackjack (lab)**: in «Arma tu mesa» the player's name starts at its box's left edge, with no empty slot for a seat number.

## 1.21.9 — 2026-11-17
- **Game covers**: no more flash of the old «Cómo se juega» and sign-in before the «Instrucciones» and account buttons: the phone remembers the last answer of the `cover-dialogs` flag and builds the cover at once; the network only confirms it.

## 1.21.8 — 2026-11-17
- ¡NO TOQUES! (Altoke) shows a mole instead of a hammer, and the board no longer scrolls the page while a game is on (it scrolls again on the result screens); the board never grows taller than the screen.
- Each game of Altoke scrolls the page so the whole stage is in view.
- ¡REVIENTA! bubbles rise about a third slower (the round lasts 7.2 s).
- Testers get the picker for any single game back in the T tab (a try-out: nothing is saved).
- The tester tab shows every Altoke game in its picker (the tab scrolls on short screens, and the mole icon shows).

## 1.21.7 — 2026-11-17
- **Blackjack (lab, felt table)**: a chip tapped from your pile flies onto the bet, and «Limpiar» sends each chip back to its own pile, one after another.

## 1.21.6 — 2026-11-17
- **The retention loop is built** (learning piece 7, with the owner's Yes to its concept): `tools/agents/retention.mjs` reads next-day return to any game week by week against an eight-week noise band, and the weekly retention agent proposes at most one hypothesis and action to the owner on a real drop, then writes its verdict. It only proposes. First read: 67%, 63%, 59%, then 43% the week of 8 Nov; the band fills by mid-December. Nothing changes for players.

## 1.21.5 — 2026-11-17
- **Agentes clue judge (learning piece 1, step 1.3)**: the owner's rubric as a prompt and a scorer (`tools/generators/clues/judge.mjs`), run blind on the labelled cases: 46%, then 64% after one rubric revision; the next round waits on the owner's labels. Nothing changes for players.

## 1.21.4 — 2026-11-17
- **Blackjack (lab, felt table)**: the player's plate is centred over the bet's chip, in one line when the name is short («Jiri 🪙 250») and two when it is long, the coins under the name, so a name as long as the field allows («Margarita», «Maximiliano Ro») always reads whole.

## 1.21.3 — 2026-11-17
- **Blackjack (lab, felt table)**: each player's name and coins read as one line, «Jiri 🪙 240», in a dark stitched plate above their bet, with air from the chip; a long name is cut with «…».
- **Game covers**: on a phone taller than the cover, the sunset footer rests on the bottom edge, so its gradient no longer stops short above a dark band.

## 1.21.2 — 2026-11-17
- **Agentes: every board can be deduced, and no word gives its clue away** (D-583): 18 words that contained their clue (MIDNIGHT for NIGHT, PESCADOR for PESCA, FEIRANTE for FEIRA…) are replaced in Spanish, English and Portuguese, and a board never again has a clue with as many look-alikes as agents, so the clue's number always tells which group it is. Every Agentes board changes from this version.

## 1.21.1 — 2026-11-17
- **The retention loop, as a concept for the owner** (learning piece 7): what it should achieve (at most one argued proposal a week to bring players back, each ending with a number), how it tells a real drop from noise, and an autonomy table of what its agent may do alone, only with the owner's Yes, and never. Nothing is built until the owner agrees. Nothing changes for players.

## 1.21.0 — 2026-11-17
- **Sapiondo in the lab & La Copa**: 2.5D arcade highway crossing (`/labs/sapiondo/` and `public/cup/games/sapiondo/`) in Spanish, English, and Portuguese, featuring a frog in a Chilean flag t-shirt, 3 mobile overlay buttons (`◀ ▲ ▶`) plus Dash (`⚡`), road fruits, bumper Close-Calls, Normal & Hard difficulties, and deterministic seeded tracks for Cup play.

## 1.20.48 — 2026-11-17
- **The Sunday report measures the factory** (learning piece 2): a «🏭 The factory» section with five numbers from GitHub (PRs merged and hours open, 🔴 included; red CI runs per PR; one-tap decisions and how long they wait; agent round PRs; reverts), `tools/reports/factory.mjs`. Nothing changes for players.

## 1.20.47 — 2026-11-17
- **Agentes' clues get their mechanical checks** (learning piece 1, step 1.2): `tools/generators/clues/` checks deck shape (M1), give-away words (M2) and boards where the count cannot pick the group (M3), with the eval cases for the judge to come. It found 18 give-aways in the three decks and M3 on about 18% of boards; both wait for the owner's decision, since a deck change reshuffles running Cups. Nothing changes for players.

## 1.20.46 — 2026-11-17
- **A backlog agent takes the branch sweep and the owner's to-dos out of the daily round**: once a week it deletes superseded branches, opens PRs for wanted ones, asks about the rest, closes the owner's done issues and moves one or two forward. The pr-created reminder now says to launch the review agents in one message, so they run in parallel. Nothing changes for players.

## 1.20.45 — 2026-11-17
- **Two more hooks catch slips while the file is open**: `css-edited.mjs` shows the design lint's hits right after a stylesheet is edited, and `stop-tests.mjs` runs the unit tests a branch's changes touch when a turn ends (each state once) and keeps the turn going while one fails. Nothing changes for players.

## 1.20.44 — 2026-11-17
- **Each agent runs on the model and effort its work needs** (D-582): ideas on Opus high; processes and ci-health on Opus medium; feedback and usability on Opus low; documentation and player on Sonnet; contributions on Sonnet; support on Haiku. `agents-models.test.mjs` fails an agent that does not name both, and the ci-health agent moves one back to Opus after two misses. Nothing changes for players.

## 1.20.43 — 2026-11-17
- **Every visual change is measured before it ships** (D-570, DESIGN.md rule 10): a new check, M-4, fails a screen where a picture, a panel or a title sits on the block before it, on every screenshot the end-to-end scripts take, and the process asks each screen whose look changes to be shot, measured with `look.mjs` at 390 and 320 px, and listed as measured in its PR.

## 1.20.42 — 2026-11-17
- **Blackjack (lab)**: clearer words before launch: «Fichas iniciales», «Hasta la carta roja» with a line on what the red card does, «Mazo» instead of «Zapato», leaving says you lose your chips, and English outcomes as full phrases; sharing a table game lists every player by coins.
- **Tools**: `look.mjs` and `landing-fold.mjs` open a lab game at its real path (`routeOf`): Blackjack's cover was being measured on a missing page.
- **Blackjack (lab)**, from the player agent's games: the result's number is the change both ways («Ganó la casa (−10)»), the table says «2 manos ganadas» instead of a bare ✋, the deal is quicker and says «Repartiendo…» / «Juega la casa…» while it runs, and the solo setup drops the lone «1» by the name.

## 1.20.41 — 2026-11-17
- **Blackjack (lab)**: its language check (`tools/e2e/blackjack/languages.mjs`) walks the cover, setup, betting, a hand and the result in es, en and pt; it pays the last canon Blackjack owed the lab's gate (D-579).

## 1.20.40 — 2026-11-17
- **Two agents take load off the daily round**: the feedback agent (`.claude/agents/feedback.md`) handles 🐞 reports end to end (reproduce, fix in its own PR, decide, close, answer the player once), and the ci-health agent (`.claude/agents/ci-health.md`) reads the failure signatures, flaky tests, test levels and the weekly cost numbers and builds one mechanism a week. `processes.mjs check` dispatches them (feedback when reports wait, ci-health once a week); the processes agent reviews what they deliver. Nothing changes for players.

## 1.20.39 — 2026-11-17
- **Launching a feature from /labs/ no longer turns open PRs red** (D-578): the end-to-end tests read a snapshot of the flags kept in the repository, refreshed by the processes round; and adding a test no longer fails the README check.

## 1.20.38 — 2026-11-17
- **The making-of page catches up**: the Player and Contributions agents join the team (seven agents), the setup diagram counts the jobs as they are now (13 on GitHub, 5 on the Mac mini, 3 in Claude's cloud), and the timeline adds the heartbeat (Nov 16) and the first outside contribution, Blackjack, with the player agent (Nov 17).

## 1.20.37 — 2026-11-17
- **Sessions read only the canons they need**: `docs/CANONS.md` is now an index (one line per canon and the checklist, 8 KB instead of 78 KB) and each canon lives in `docs/canons/C-n.md`, like the decisions (D-394). Three project skills route the work so a session loads only what applies: `game-change` (which canons a change needs), `player-text` (the U-n rules and the lint for texts in three languages) and `css-change` (the design system and its gate). Nothing changes for players.

## 1.20.36 — 2026-11-17
- **A player agent plays the games a PR changes** (`.claude/agents/player.md`): on the preview, phone-sized, in Spanish and one other language, a full game to the result, and it comments the friction it met. It only reports. MERGING.md, AGENTS.md and the `pr-created.mjs` reminder launch it on game PRs. Its first trial, on Blackjack (#1551), found that the result headline shows the balance when losing and the gain when winning, an unlabelled ✋ count, and a 3-second wait with nothing to tap after betting. Nothing changes for players.

## 1.20.35 — 2026-11-17
- **One a Day ends on one page** (D-581): the canons and the new-game guide require that the last move of a daily game go straight to its result page, with anything an in-between screen showed as a block of it; the usability and contributions reviews look for it.

## 1.20.34 — 2026-11-17
- **Sessions can no longer edit the main folder**: the new `worktree-guard.mjs` hook stops an Edit or Write in the repo's main folder, which parallel sessions share, and says how to open a worktree (D-135). Nothing changes for players.

## 1.20.33 — 2026-11-17
- **PRs no longer sit in conflict for hours over generated files** (D-580): `wait-pr.mjs` brings a PR up to date by itself when the only conflicts are in the decisions index, `docs/facts.json` or the README's generated blocks.

## 1.20.32 — 2026-11-17
- **Blackjack (lab)**: the result screen has what every game's has (C-19): alone, the coins left count in the ranking (the notice under the hero when signed in, «¿Quieres que esta partida cuente?» otherwise), the game's ranking after the exits, «Cambiar modo», and the feedback link last; online, the win counts in the victories. The title no longer repeats the hero's 🏆, and alone there is no one-row table repeating the coins.

## 1.20.31 — 2026-11-17
- **Two hooks so sessions stop forgetting steps**: `push-guard.mjs` now also stops a `git push` from a branch that brings changes without its changelog entry (D-300), and the new `pr-created.mjs` reminds the session, right after `gh pr create`, to check the lane, tick it when the owner asked for the work, turn on auto-merge and watch the PR. `docs/SESSIONS.md` lists the pre-approved checks and these hooks. Nothing changes for players.

## 1.20.30 — 2026-11-17
- **Lab games come in with their canons** (D-579): a new game in the lab, ours or a contributor's, passes the whole canons checklist before it merges. `public/labs/canons.test.mjs` checks its `game.json`, a measured cover, its result exits, its result in the rankings, the cover dialogs, the panel signals, its spec and its e2e scripts; `docs/ADD-GAME.md` ("The entry gate") names the test or reviewer for every other line. The generator now makes a game that passes all of it. The games already in the lab owe what `docs/labs-canon-debt.json` lists, and that list only shrinks.

## 1.20.29 — 2026-11-17
- **Blackjack (lab, felt table)**: «Elige tu apuesta ↓» sits right above the chips; each player's name and coins sit on the felt over their bet, and nothing on the table moves while a hand is played; the cards land at their tilt without a snap.

## 1.20.28 — 2026-11-17
- **Tembleque (lab): the cover's easy picture tells one story.** The claw carries the piece over the plank and drops it, the piece lands with a squash, the plank tips under its weight and wobbles back to level, and the claw goes home; stars twinkle. Still with reduced motion.

## 1.20.27 — 2026-11-17
- **Fewer approval prompts for the owner**: the read-only checks every session runs before a merge (lanes, preview, design and usability lint, pending, costs, jobs status, the unit-test runner, waiting for a PR) are pre-approved in `.claude/settings.json`. Nothing that writes, pushes or merges was added. Nothing changes for players.

## 1.20.26 — 2026-11-17
- **Rule (D-576)**: a button that waits on an animation takes one tap only, and its game's e2e script proves it with a double tap (`tools/e2e/double-tap.mjs`). Blackjack's script now double-taps «Apostar» and «Siguiente ronda»; the check fails on the code before #1543.

## 1.20.25 — 2026-11-17
- **Blackjack (lab), on the felt trial**: on the first round, the empty felt shows the first step in one stitched chalk line beside the bet's spot, «Elige tu apuesta ↓», its arrow bobbing towards the chips while the spot glows gently. It goes once the cards are dealt.

## 1.20.24 — 2026-11-17
- **Where a job goes, and what Claude cloud tasks can and cannot do** (D-577): `tools/jobs/README.md` orders it GitHub, then a Claude cloud task, then the Mac mini only if nothing else reaches what it needs, and records the lessons of setting up the first cloud tasks; CLAUDE.md points to it. The session sweep proposes and archives on the owner's «sí».

## 1.20.23 — 2026-11-17
- **Blackjack (lab), on the felt trial**: before a new hand, the cards slide off the felt towards the dealer, turning a little and fading one after another, instead of just fading. The table's words («Blackjack paga 3 a 2», «El crupier se planta en 17») are bigger and look printed in the felt: soft, faint and a touch blurred.

## 1.20.22 — 2026-11-17
- 🧪 **Tango scored by time, in the lab: the game's cover says so too.** Its «Cómo se juega» shows the new rule when `tango-time` is on, and the /labs/ card of `mistakes-rule` says Tango's −10 is La Copa's.

## 1.20.21 — 2026-11-17
- **Finished Claude sessions are archived every day** (D-577): a cloud scheduled task archives the owner's sessions that are done and idle, and lists the ones waiting on the owner.

## 1.20.20 — 2026-11-17
- **Blackjack (lab)**: Guard `dispatch` against double-taps during the felt's round-clear fade and active deal animations, and ensure `animateTransition` always clears `dealReveal` on exit so the table cannot get stuck with no cards.

## 1.20.19 — 2026-11-17
- **Blackjack (lab), on the felt trial**: the table fills the phone's height instead of half of it: it takes all the room the buttons and «Cómo se juega» leave, the dealer's half and the player's share it evenly, the cards grow with the screen, and it keeps the same size while betting and playing.

## 1.20.18 — 2026-11-17
- **Blackjack (lab), on the felt trial**: losing to the house is no longer celebrated: no confetti; the view turns red from its edges, a 💸 sinks where the trophy was, the title goes red, and the phone gives a low buzz. Breaking even shows 🤝 and no confetti.

## 1.20.17 — 2026-11-17
- **Blackjack (lab), on the felt trial**: the table opens at its full size the moment the bet goes down and does not grow again; each card lands in its own place to the right of the last, nothing already on the felt moves, and the cards and stamps fade off before the next round.

## 1.20.16 — 2026-11-17
- **Blackjack (lab), on the felt trial**: betting and playing fit a phone without scrolling, «Cómo se juega» folded included: a lower table with smaller cards, the bet chip beside the cards, the table already laid out while betting, and a tighter betting box (the bet shows on the table).

## 1.20.15 — 2026-11-17
- **Labs**: the felt trial's card is folded into Blackjack's own card, one card for the game; its switch stays in the «T» tab.

## 1.20.14 — 2026-11-17
- **Blackjack (lab), on the felt trial**: a signed-in player sees their account in the setup as a block, flag and name, with «Cambiar» to type another name instead.

## 1.20.13 — 2026-11-17
- **Blackjack (lab), on the felt trial**: placing the bet opens the table and folds the betting box away in one smooth move, and the table grows smoothly as the cards are dealt.
- **Blackjack (lab), on the felt trial**: every coin (seats, bet, standings, how to play) is the table's yellow chip instead of 🪙, which iPhone drew as a grey moon. The signed-in name and the setup's chips from the last two PRs now sit behind the same switch, all on the one `/labs/` card.

## 1.20.12 — 2026-11-17
- **Tembleque is one game in the lab**: one cover, like the other games, with two levels: easy in 2D
  and hard in 3D. The ‹ in each level comes back to the cover.
- **Tembleque's cover picks the level with a lever**, the same as Sudoku's: down for easy (2D), up for hard
  (3D), with a moving picture of the level above it that changes when you flip it.

## 1.20.11 — 2026-11-17
- **One tap per change**: updating a branch from main keeps the owner's approval, the weekly popularity PR no longer waits for it, and sessions tick the PRs the owner asked for with one command (D-575).

## 1.20.10 — 2026-11-17
- **🔥 Popular, this week**: the home page's order and its three 🔥 Popular games follow the games finished in the last four weeks.

## 1.20.9 — 2026-11-17
- **Publishing works again**: the install invitation's test now pins its own flag, so launching «Instala Juegos de Salón» to everyone no longer turns it red.

## 1.20.8 — 2026-11-17
- **La Copa notifications no longer stop for hours** (D-574): each heartbeat run on GitHub starts the next one before it ends, instead of waiting for GitHub's schedule, which left about 3 hours without notifications in each cycle.

## 1.20.7 — 2026-11-17
- **Blackjack (lab)**: the setup's coin options show the table's yellow chip; the 🪙 emoji drew as a grey moon on iPhone.

## 1.20.6 — 2026-11-17
- 🧪 **Tango, in the lab: the time scores, as in Reinas.** On its own page and in Uno al día, mistakes no longer take off points: 100 up to 45 seconds, then down to 10 at 5 minutes, and each hint adds 15 seconds. La Copa keeps its rule, so no running cup changes. Behind the `tango-time` flag, with its card in /labs/ (D-572).

## 1.20.5 — 2026-11-17
- **La Copa: the account tip on the sign-up form starts on its own line** instead of being glued to the PIN hint ("No lo compartas.¿Tienes jugador?"), U-10.

## 1.20.4 — 2026-11-17
- **Blackjack (lab)**: a signed-in player finds their account's name already in the setup, alone or online, and does not type it again.
- **Blackjack (lab)**: on the cover's demo, the cards already dealt glide to their new place when the next one lands, instead of jumping.

## 1.20.3 — 2026-11-17
- **The weekend cup's test no longer fails by luck**: with every game in the pool, its 🎲 rarely drew games the test can play; it now seeds the draw (#1517 was blocked by it).

## 1.20.2 — 2026-11-17
- **A red PR no longer waits for anyone**: each hour the heartbeat nudges the session that left its PR red, and two hours later a cloud task takes it over (D-573).

## 1.20.1 — 2026-11-17
- **Blackjack's felt table, in the lab** (flag `blackjack-felt`): the table becomes a turquoise felt with a gold rim and "Blackjack pays 3 to 2" in an arc, the cards are bigger and fanned with corner indices, the bet is a chip on its spot, the shoe is a bar with the red card marked, and each hand's result lands as a stamp. Its card in `/labs/` and the «T» tester tab switch it on and off to compare.
- **Blackjack's cover**: the modes read «🤖 Contra la casa» and «📡 Varios celulares» (C-5), the rules and signing in open from «📖 Instrucciones» and «👤 Entrar» like every cover (C-8), and with the felt table on, a small hand deals itself to a Blackjack in place of the icon.
- **The lab's index**: a card whose title opens with a game's drawing (Blackjack) shows it in its pill too, as the others show their emoji.
- **Rule for the lab:** every card in `/labs/`, game or feature, opens its title with its emoji or the game's drawing, so its index pill carries it; `index-nav.test.mjs` fails a bare title.

## 1.20.0 — 2026-11-17
- 🧪 **Lab: «Instala Juegos de Salón»** (D-571, flag `install-invite`). The invitation to put the app on the phone says "install" now, in an iridescent card with a turning border and a sheen. On the home page it waits for a first finished game; its ✕ snoozes it 14 days, then 60, instead of turning it off forever. A moment after any game ends it invites from the top, once a week at most. On iPhone the steps draw Safari's own buttons and an arrow points at its toolbar. The home footer keeps a «📲 Instalar la app» tile, and «sin instalar» reads «sin descargas».

## 1.19.2 — 2026-11-17
- **Uno al día, straight to the result (lab)**: Shinobi and Aletazo no longer show their own end screen with a «Ver resultado» button in Uno al día; the run ends and the day's result opens, with the breakdown folded in it. Aletazo keeps its fall and verdict on screen for a moment. Games whose end shows the solution (Palabra, Sudoku, Desenredar…) keep theirs. Behind flag `uad-skip-end`.
- **Tests**: `cup/talk.mjs` no longer expects the tester controls of the comments balloon once `cup-talk-hint` is launched (D-567 drops them); it failed on every PR since the launch.

## 1.19.1 — 2026-11-17
- **The 🐞 feedback upload and the lab readiness check left the Mac mini** (D-569): the heartbeat on GitHub runs them now, every 5 minutes and every hour, so they keep going if the Mac stops.

## 1.19.0 — 2026-11-17
- **Outside PRs get an answer within the hour** (D-568): a new `contributions` agent runs every hour as a Claude Code cloud scheduled task, reviews only the outside PRs that changed since its last look, comments what is missing in the contributor's language, and tells the owner (a bot comment, so GitHub emails it) when a PR waits only for their Yes. It never pushes, approves or merges. A new kind of job, `cloud`, in `jobs.json`, with its prompt in the repository so it can be recreated.

## 1.18.0 — 2026-11-17
- **Blackjack in the lab**: Vegas-style Blackjack table against the house (`/labs/blackjack/`) in Spanish, English, and Portuguese, with Solo vs. House and Multi-phone Online Rooms (2–6 players via Firebase).
- **Casino table & betting**: 1–8 deck shoe with red cut card, live card counter (`n/total`), animated 3D SVG casino chip stacks (`100`, `50`, `20`, `10`, `5`, `1`), sequential card dealing and dealer reveal with sound effects, Hit / Stand / Double / Split / Surrender (50%), and full-screen Blackjack FX.

## 1.17.2 — 2026-11-16
- 🔢 **Toque y Fama and La Copa's Número: exploring costs nothing, for everyone.** A guess the clues had already ruled out no longer takes off 15 points if it tries a digit no earlier guess had. The rules texts say it in every language, and its card moved to La Bodega.

## 1.17.1 — 2026-11-16
- 🧪 **Toque y Fama and La Copa's Número, in the lab: exploring costs nothing.** A guess the clues had already ruled out no longer takes off 15 points if it tries a digit no earlier guess had (5678 after 1234 gave two cows). Behind the `number-new-digit` flag, with its card in /labs/.

## 1.17.0 — 2026-11-17
- **Panel: 📱 Screens.** A new section under ☰ More › Owner shows which screen sizes play Juegos de Salón, to decide what to design and test for: visits by width band, each with real phones in it (≤ 340 px is the iPhone SE 1st gen, 375–399 px the iPhone 12–16, 412 px the Pixel…), the bands that hold 80% of visits, the ones under 1% that are not worth a design of their own, the width split over time, and height and width × height. Each visit now counts its screen band once, never its exact size; the privacy page says so in all three languages.

## 1.16.10 — 2026-11-16
- **Testers: every feature in the lab has an on/off switch in the «T» tab**, on that phone only, to try the page with and without it; launched features drop out of it (D-567).

## 1.16.9 — 2026-11-16
- **La Copa, in the lab: the tester tab (T) shows the comments balloon again** after closing it, to try it once more (D-566).

## 1.16.8 — 2026-11-16
- **La Copa, in the lab: the comments balloon looks like one**: a yellow-to-orange gradient, a tail pointing at the table and a soft pop when it appears (D-566).
- **La Copa: the table no longer shows up twice** when the comments arrive while the board is being drawn (coming back to a cup, for example).

## 1.16.7 — 2026-11-16
- **La Copa, in the lab: the comments balloon now invites you to comment** («💬 ¡Ahora puedes comentar la ronda del día! …») (D-566).

## 1.16.6 — 2026-11-16
- **La Copa, in the lab: a balloon on the table says you can comment on today's results**, once per phone; ✕ or using a 💬 closes it for good (D-566).

## 1.16.5 — 2026-11-16
- **The panel's 📋 WBR no longer freezes the page**: its trend is kept until its data or week changes, and La Copa's plays are read in one pass over the cups instead of one per day.

## 1.16.4 — 2026-11-16
- **⚡ ¡Al toque! leaves the lab for good**: its /labs/ card, the `microgames` flag row, its gate in La Copa (`LANZA`) and the splash's `requires` go; the game is out for everyone (D-498).

## 1.16.3 — 2026-11-16
- **Uno al día's ranking catches up every hour again**: its hourly rebuild runs inside the notifications' heartbeat on GitHub, which really runs (the separate hourly schedule ran about 4 times a day) (D-565).
- **The panel shows whether the heartbeat beats**: the longest gap between rounds and how many there were, and an issue opens on its own when it falls behind (D-565).

## 1.16.2 — 2026-11-16
- **La Copa, in the lab: a notification when someone comments on your row** («💬 Bea comentó tu resultado»): who, never what, several together, never at night, with its own «Comentarios» switch in ⚙️ Avisos (D-564).
- **Every notification arrives within about 5 minutes**: GitHub checks every 5 minutes with a relay of long runs, instead of a 15-minute schedule that really ran every few hours (D-564).

## 1.16.1 — 2026-11-16
- **🐤 Aletazo in La Copa, for everyone:** at equal points the day goes to whoever went through the middle of a hoop 🎯 more often; with the same centers too, the place and its points are shared. The `flap-tiebreak` flag is gone and its card is in La Bodega.

## 1.16.0 — 2026-11-16
- **⚡ ¡Al toque! joins La Copa and Uno al día**: its page /in-a-flash/ becomes La Copa's screen (`public/cup/games/microgames/`, D-456's way, as Aletazo and Sudoku): a cup can draw it (pozo 18) and Uno al día deals it from 2026-11-16. Everyone on the same day plays the same ten microgames, each dealt the same; the cup counts the points, Uno al día and the Gran Final the run's 0–100 (`d100`, also read by final/ui.js and `puntajeDia`).

## 1.15.13 — 2026-11-16
- **La Copa, in the lab: Edit and Delete on their own line** under your comment in the table, seen only by you (D-562).
- **La Copa, in the lab: comments as an extra line at the bottom of the row**, so the place, the arrow and the points stay aligned with the name and the day blocks (D-562).

## 1.15.12 — 2026-11-16
- **🐤 Aletazo in La Copa, in the lab (`flap-tiebreak`):** at equal points the day goes to whoever went through the middle 🎯 more often, not to a millisecond less of flying time; with the same centers too, the place and its points are shared. A cup result may now carry its own tiebreak `d` (Firebase rules: a number 0–1000).

## 1.15.11 — 2026-11-16
- **La Copa, in the lab: a 💬 before the name of who wrote each comment** in the table (D-562).

## 1.15.10 — 2026-11-16
- **La Copa, in the lab: edit your comment** (D-562). Next to your comment in the table, «Editar» opens the field with it already written, to change it.

## 1.15.9 — 2026-11-16
- **La Copa, in the lab: comments straight in the table** (D-562). Today's comments on a player stack on their row, in the order they came, with nothing to open; the 💬 opens just a text field (emojis go in the text). The reaction buttons and the day label are gone.

## 1.15.8 — 2026-11-16
- **🏓 ¡Rebota! in neon.** A neon court, paddle, ball and glowing aliens, and a shorter court, higher on the screen, so the ball comes back more often. Hit all three and they come back to dance in party hats.

## 1.15.7 — 2026-11-16
- **La Copa, in the lab: reactions and comments only for today, and the first comment in the table** (D-562). Tapping a 💬 no longer jumps the page to the top; only today's result can be reacted to and commented on; and the first comment a player gets today shows on their row of the table, for everyone.

## 1.15.6 — 2026-11-16
- **Uno al día: every phone shows the same month table.** Each player's points of the day count for everyone at once, not only on their own phone, and the ranking under the result already includes today's points and streak bonus (D-563).

## 1.15.5 — 2026-11-16
- **La Copa, in the lab: reactions and comments move into the table** (D-562). Each player's row has a 💬 under their points, with how many reactions and comments they got; tapping it opens their results right under the row, to react and comment there.

## 1.15.4 — 2026-11-16
- **La Copa, in the lab: reactions and comments on each other's results** (D-562, from a player's suggestion, [#1488](https://github.com/ellokojavi/juegos-de-salon/issues/1488)). Under the cup's table, each day you played shows everyone's result; on each one, your own too, you can leave one reaction (🔥 😂 👏 😮 😢 👑) and a short comment. Whoever gets a comment can hide it, the author can delete it, and everything is deleted when the cup ends. Behind the flag `cup-talk`, card in `/labs/`.

## 1.15.3 — 2026-11-16
- **Panel on Pacific time** (D-561): every view in the owner's panel (Summary, Group, Individual, One a Day, Users, Traffic, Health, Campaigns, the logs and "today") now cuts days, weeks and months at Pacific midnight instead of UTC. Counters with no time keep their UTC day. Nothing changes for players.

## 1.15.2 — 2026-11-16
- **WBR and the weekly email on Pacific time.** Days, weeks and months are now Pacific dates, not UTC ones (D-561): a game played on a Saturday evening counts on that Saturday and in that week. Games are regrouped by the moment they were played (from Oct 4, when that moment started being recorded), cups by their results, and from today the site also records active browsers and visits by Pacific day, so those are exact from now on (earlier weeks keep UTC days, as the WBR and the PDF say). Finished games before Oct 18 now include the offline games that recorded their ending.

## 1.15.1 — 2026-11-15
- **Panel: Timeline back on the phone's bar.** The bar reads Summary, WBR, Timeline, Feedback and ☰ More. Health moves under More (it was left out of More's groups, as Timeline was, so neither could be reached on a phone), and its alert dot shows on ☰ More while Health is in there. The panel now reports any section that is neither on the bar nor under More.

## 1.15.0 — 2026-11-15
- **📋 WBR in the panel.** A new section, the Weekly Business Review: the weekly email's headline and top-10 games tables for the closed week or any week before (‹ Week before / Week after ›), made for the phone, with the tables scrolling sideways and the names pinned. The Sunday email links to its week's WBR. On a phone the bottom bar shows Summary, WBR, Health and Feedback; Timeline moved under More.

## 1.14.2 — 2026-11-15
- **Lab plays out of the counts.** The panel's game numbers and the weekly report no longer count lab games (Julep, Fourth King, The Case, La Bodega's), lab cups, or plays before a game's launch (D-560): last week's games finished go from 620 to 574. The report reads each game's versions as one in its difficulty table too, keeps the broken share figures out until the counter has clean weeks, shows games per active browser with one decimal, and names pages and errors in English ("home", "resource", "promise").

## 1.14.1 — 2026-11-15
- **Hangman**: when you lose playing alone, the word you missed now shows right under the title.

## 1.14.0 — 2026-11-15
- **Game covers (in the lab first)**: under Empezar, two equal buttons, «📖 Instrucciones» and «👤 Entrar» (your name once you are in), each opening a dialog that closes on any tap outside it, with the page behind kept still: the steps, numbered; or signing in to the ranking with your name and PIN, or your account. The ranking stays open below. «Volver al menú» leaves the cover, and the top bar loses the game's name on every screen of the game, with «‹ Menú» as tall as the icons. On every game's page, also the ones with their own cover.

## 1.13.14 — 2026-11-15
- **Shares counted right in the panel**: the home page's "shared" number was mostly our own tests. `compartir.test.mjs`, run in Node with no web page, counted five home-page shares in the live numbers on every run, locally and in CI (hundreds a day since D-349). A share now counts only on a web page and never from a robot; a test fails if sharing in a test writes to the database. The days already counted are left as they are.

## 1.13.13 — 2026-11-15
- **Weekly report: daily active browsers and games per active browser.** Two new rows in the email's headline table, over the same five weeks and three months: the average of browsers active each day, and games started per browser active in the column's range.

## 1.13.12 — 2026-11-15
- **The weekly report shows the trend.** The email now carries two tables: the headline (games finished, started, active browsers, visits) for the closed week with its change, the four weeks before, this month so far and the two months before; and the top 10 games over the same columns, every mode and version read as one, La Copa's plays included and lab plays left out, with "n/a" before a game was out or a counter existed. "Most played" now ranks every public game together (it used to pick the top group game, so Battleship won with 5 games against Flap's 186). Shares left the headline until its counter stops overcounting.

## 1.13.11 — 2026-11-15
- **`lanes.mjs check` no longer asks to coordinate with a lab game's contributor**: the owner's PRs never need their approval (D-553); it only notes they may be changing the game too.

## 1.13.10 — 2026-11-15
- **¡Al toque! in Rankings**: its best runs, recorded since launch, now have their tab on the Rankings page. A test now fails if a game records a score Rankings doesn't show (D-559).

## 1.13.9 — 2026-11-15
- **Long-session hint**: at 250 turns, and every 150 after, Claude Code shows the owner a one-line 📏 note with the session's size, since long sessions take half the tokens (`tools/agents/session-length.mjs`, docs/COSTS.md). It only informs.

## 1.13.8 — 2026-11-15
- **Costs, measured**: the landing-fold check runs as two jobs, one per phone width, with the same checks (a full end-to-end run ~8.5 → ~7 min); `tools/agents/costs.mjs` now also reports end to end, every workflow's minutes and Claude's tokens from this machine's sessions; `docs/COSTS.md` explains the numbers and the levers (D-558).

## 1.13.7 — 2026-11-15
- **Faster tests, lighter rounds**: the three slowest test files run their independent parts in parallel with the same checks (18 → 10 s, 11 → 2 s, 11 → 7 s); the processes agent's feedback step moved word for word to `docs/FEEDBACK-TRIAGE.md`, read only when there is feedback (36 → 27 KB per round); and a weekly cost check (`tools/agents/costs.mjs`, D-558) that never trades quality for savings.

## 1.13.6 — 2026-11-15
- **Faster tests**: the unit tests on each PR run in parallel (`tools/release/run-tests.mjs`), about 22 s instead of 72 s; locally the same command. Fixed a duplicated line in `CLAUDE.md` that split its table in two.

## 1.13.5 — 2026-11-15
- **Publishing retries a deploy that could not find the site package yet**: three publishes on 2026-11-15 (#1467 among them) failed because GitHub had not yet made the just-uploaded site visible to the deploy step; `pages-5xx.mjs` now retries that case a minute later, as it does a 5xx, and so does a failure whose error it cannot read: the running job's annotations always came back empty, so no retry had ever fired (D-506).

## 1.13.4 — 2026-11-15
- **Dudo:** the Classic rules hint now says "con tres o más jugadores" / "com três ou mais jogadores" in Spanish and Portuguese, as English already did (U-1).

## 1.13.3 — 2026-11-15
- Workshop: the push guard now checks the worktree a `cd` moves to before `git push`, not the session folder, so a stale README block or decisions index stops the push again (#1416, #1436).

## 1.13.2 — 2026-11-14
- **✨ The newest game first.** On the home page, the games still new go from the newest to the oldest, right after La Copa: ¡Al toque! now leads them (D-557).

## 1.13.1 — 2026-11-14
- **⚡ ¡Al toque! wears its ✨ Nuevo label.** A game launched with its switch is new from the moment it goes out, not from a date written ahead (D-556).

## 1.13.0 — 2026-11-14
- **⚡ ¡Al toque! is out of the lab, ready to launch at 21:00 Pacific today.** Its page is now /in-a-flash/ (the lab's link and /microgames/ lead there), on the home page, in the search and with its link card in three languages, once the `microgames` switch is on; until then it stays hidden. Its launch splash opens the game. La Copa and Uno al día come next.

## 1.12.28 — 2026-11-14
- **Answered decisions close themselves** (D-555): a daily sweep closes the owner's decision issues once they are answered and done, settles a question asked again in a newer issue, and lists in "Pending work" an approved task left undone for two days. `decide` no longer asks again what is still open, and deleting a branch happens on the tick.

## 1.12.27 — 2026-11-14
- **Making-of: the Traction numbers refresh themselves every day**: a daily workflow counts games finished and different phones with the panel's functions and publishes only those totals; the page reads them when it opens (D-554).
- **The Traction cards show records, labelled as such** (the best week of games, the most phones in a week and in 30 days), so a slow week never undersells the reach.

## 1.12.26 — 2026-11-14
- **Making-of: a Traction section**: games finished (2,000+ in total, 580+ in the last 7 days, 126 on the best day), different phones in 7 and 30 days, and $0 on ads, from the panel's own counts as of 14 November 2026.

## 1.12.25 — 2026-11-14
- **Making-of: the captions under Where Is It? and Liar's Dice wrap within their clip's width**, like Shinobi's and Babel's.

## 1.12.24 — 2026-11-14
- **🕹️ ¡Pinball!: the intro shows the table.** Before the game starts you see the pinball table, with a thumb pressing each side in turn and its flipper swinging up, and «TOCA» on each half: you know where to put your fingers before the clock starts.

## 1.12.23 — 2026-11-14
- **Making-of: room for the arrows between the five build steps**, and learning 9 is now "A rule without an enforcer drifts" (D-541), replacing one about evals the project has not run yet.

## 1.12.22 — 2026-11-14
- **Making-of: the numbers update themselves** (games from the site, weeks from the first commit, PRs, decisions and tests from GitHub), a "3 / 10" counter in the corner, and the setup diagram fits one laptop screen.
- **Making-of: a 🎲 beside the title.**

## 1.12.21 — 2026-11-14
- **Making-of: a yellow "Next" button at the foot of every section**, the play section says there are 20+ games (four shown), and the presenter notes are gone: the page is what the audience sees.

## 1.12.20 — 2026-11-14
- **Lab game owners** (D-553): a contributor who brought a game into the lab now merges their own changes to it without waiting for the owner, as long as the PR stays inside that game.

## 1.12.19 — 2026-11-14
- **🕹️ ¡Pinball!: one finger on each side, and smoother.** A 👆 pulses under each flipper with «TOCA» until you tap that side, and the side you press glows, so it is clear each thumb moves its own flipper. The balls move smoothly: a continuous trail instead of jumps, and no slow motion on slower phones.

## 1.12.18 — 2026-11-13
- **⚡ ¡Al toque! launch campaign, ready and off**: the splash `microgames-launch` with a new 10 s looping clip (a whole run of ten microgames, cut by lightning strikes in each gesture's color and sped up by the game's own ramp), its texts in es/en/pt and its launch plan; unseen until a `microgames` flag exists and is on.

## 1.12.17 — 2026-11-14
- **Pintaminas (in the lab first)**: a game starts with no brush chosen. A tap on the board before picking one paints nothing and costs nothing: it says «Primero elige un pincel abajo.» and the brushes light up, so nobody paints by mistake at the start.

## 1.12.16 — 2026-11-14
- **⚡ ¡Al toque! (lab): a new microgame, 🕹️ ¡Pinball!** Three balls drop onto a little neon table; tap the left or right half to swing that flipper and keep them up. Every ball you hit with a flipper and still in play after 5 seconds is a star. The runs now draw from 29 microgames.
- **🕹️ ¡Pinball! tuned:** the bumpers move every game, the first ball drops onto a flipper at once and the other two come in later, one by one; save all three and they throw a ¡JACKPOT! party with googly eyes and party hats.
- **👉 Swipe between games (lab, flag `game-swipe`).** On a game's cover, swipe left for the next game and right for the previous one, in the order of the home page cards you came from (with your filter or search); a small tab at each edge shows the neighbour and can be tapped too. Only on the cover: once you play, swipes are the game's.
- **🕹️ ¡Pinball!: you see the next balls coming.** The two later balls wait see-through where they will drop, with a ring that fills up, instead of coming from the roof; the balls are smaller, a bumper sends them down a little slower, and the game lasts 6.5 seconds.
- **🕹️ ¡Pinball!: a shorter table in brighter neon.** The table sits lower and shorter, by your thumbs; every line is a glowing neon tube that hums, the bumpers have two rings and light up white-pink, and the balls are a bit bigger again.
- **🕹️ ¡Pinball!: a bigger table, two bumpers, neon sparkles.** A taller table, two bumpers instead of three, the balls as fast as before, and a soft neon sparkle wherever a ball strikes a wall, a flipper or a bumper. It runs smoothly again: the neon no longer slowed the game down on phones. The table sits higher, the first ball waits a moment so you see the table, the flippers are nicer paddles, and a flipper only fires again once it is back down.

## 1.12.15 — 2026-11-13
- **Game covers, La Copa and Uno al día**: the language is a flag button in the top bar from the first moment, also on a first visit with a slow connection. Before, the three flags showed under the title until the site's settings arrived, and on a small phone that pushed the start button below the bottom of the screen. The 🌐 card moves to La Bodega for good (D-537).
- **In the lab, ¡Al toque!**: on a phone narrower than 420 px the three ways to play sit side by side, so Jugar is seen without scrolling (it was up to 300 px below the bottom of the screen at 320 px). The fold check had been measuring the language button in the top bar instead of Jugar, and no longer does.

## 1.12.14 — 2026-11-13
- **The owner's decision issues say where each idea came from**: every decision the processes agent opens carries a "Where it came from" line (who started it, when, with links), and `processes.mjs decide` refuses one without it (#1435).

## 1.12.13 — 2026-11-13
- **Making-of: every arrow in the setup diagram has a straight stem before its point**, so the head and the line leading to it read clearly when projected.

## 1.12.12 — 2026-11-13
- **Making-of: a roomier setup diagram.** Wider gaps between columns and boxes, so every arrow and its label has space when projected.

## 1.12.11 — 2026-11-13
- **The making-of page, round two** (`/making-of/`): titled Parlor Games (Juegos de Salón) with parlorgames.app as its link and QR; the product's screenshots in English; a "See it played" section with real clips of Where Is It?, Liar's Dice, Shinobi and Babel (recorded by `tools/generators/making-of-clips.mjs`); a diagram of the whole setup (people, the factory, the product, with /labs/ and /panel/); "Free" instead of "$0"; the learnings' numbers aligned with their titles.

## 1.12.10 — 2026-11-13
- **Panel, 📣 Campaigns**: while a start or end day is being edited, its date and time sit under the label, where the day shows, instead of over the label and the old value, and the ✕ stays tappable. The preview no longer says "✓ Looks right on a phone": it says something only when it finds a problem (⚠️).

## 1.12.9 — 2026-11-13
- **Panel, 📣 Campaigns**: the start and end days can be edited again on a Mac. Safari edits them in place, and the field was invisible while it was being edited. The preview is back in its own column to the right of the controls, and pressing ▶ on it no longer makes it flicker and restart, because the panel's redraws keep the playing preview in place again.

## 1.12.8 — 2026-11-13
- **The making of Juegos de Salón** (`/making-of/`): an unlisted, English-only page the owner projects for an executive audience: the product, how the agents build and ship it, each agent's job description, nine weeks of milestones and ten learnings with presenter notes (N shows them), and a QR to play. Arrow keys or Space jump section by section.

## 1.12.7 — 2026-11-12
- **🚉 Transbordo (lab): a cover that shows the game.** A trip plays itself on the cover, city after city: its cards, the train riding them, turning at the transfer and arriving. "Cómo se juega" now starts folded, as on every cover.

## 1.12.6 — 2026-11-12
- **🚉 Transbordo (lab): nine metros.** Chicago, Rome, New York and Seattle join, and Madrid now has five trips too. Each game draws five different cities, one per trip, and every map shows all of its city's lines, so a single-line trip still shows where the others cross.

## 1.12.5 — 2026-11-12
- **🚉 Transbordo (lab): the train moves.** It speeds up, slows down and settles on each station; its arrow turns to the new direction after a transfer or the other platform; it stops short at a closed station, shakes when the route fails and pulses on arrival. The first trips now draw the lines that cross them too.

## 1.12.4 — 2026-11-12
- **Dudo, 📜 Classic rules, as a cacho table plays them** (players' feedback, D-552): going into aces is half rounded up (4 cuadras → 2 ases), calzar only from half the dice and with three players or more, the obligada round is closed (you see your own die, not the others') and there is none when two players are left.

## 1.12.3 — 2026-11-12
- **What a mistake costs, in sight while playing** (lab, flag `mistakes-rule`): in the logic puzzles a line under the title says it, «❌ Cada error resta 10, aunque lo deshagas.» in Tango, «✅ Equivocarte no resta: solo cuenta el tiempo.» in Reinas, and so in Conexiones, Toque y Fama: Número, El caso, Loteo, Pintaminas and Sudoku. A player found it hard to remember which games count mistakes.

## 1.12.2 — 2026-11-12
- **El Camaleón goes to La Bodega**: the owner sent its lab card to 🎲 Juegos guardados as 💤 No prosperó; it is still playable with the lab key.

## 1.12.1 — 2026-11-12
- **🚉 Transbordo (lab): five trips on five metros.** No more choosing a city: each trip is harder and runs on a different metro (Santiago, Buenos Aires, São Paulo, London and, new, Madrid). Every line now shows its directions on the map (the terminal at each end), so after a transfer you know which way to go; the card the train is following lights up during the ride, and the "Avanza" arrow reads better.

## 1.12.0 — 2026-11-12
- **🚉 Transbordo (lab) travels to four cities**: besides Santiago, five trips each on the Buenos Aires Subte,
  the London Underground and the São Paulo Metro, with their real stations, colours and terminals, drawn like
  the maps in their stations. An arrow on the train shows which way it is heading, the train and the cards'
  actions are drawn icons instead of emoji, and every station name is placed on its own so none ever overlaps.

## 1.11.0 — 2026-11-12
- **🚉 Transbordo, a metro puzzle in the lab**: put your route cards in order (ride, other platform, change
  lines) and the train follows them on the real Santiago Metro map (Lines 1, 2, 3 and 5 with their real stations, drawn like the maps in the stations). Five trips, one new rule each: counting stations,
  changing platform, a transfer, Universidad de Chile closed and Bellas Artes to pass through. Three hearts per trip, a
  hint that costs one, up to 15 ⭐. One player, in Spanish, English and Portuguese.

## 1.10.1 — 2026-11-12
- **Offline mode downloads only what changed**: on a new release the service worker copies every `?h=` file an older release already kept instead of downloading all ~4.5 MB again; only pages, unhashed files and changed files go to the network.

## 1.10.0 — 2026-11-12
- **🚇 Rutas rotas: 💡 Pista**, playing alone on its own page (not in La Copa): a button beside the clock marks one rectangle of the shortest way for the current stage; each hint takes 3 points off the score, and the breakdown says how many («💡 2 pistas: −6.»). Behind its lab switch `routes-hint` until the owner turns it on for everyone (#1381).

## 1.9.2 — 2026-11-12
- Marketing log: the Sudoku teaser's `laboratorio` is a list (`["sudoku"]`), not `true`, so `marketing.mjs check` no longer stops on it; the teaser is recorded as up to date (usability round 2026-11-12).

## 1.9.1 — 2026-11-11
- **The countdown's last digit is no longer cut off on Safari (iPad, iPhone).** The big number asked Bangers for a bold it does not have, and Safari faked it by thickening each letter to the right, past its box. Now no browser fakes a weight or slant (`font-synthesis: none`), the big display text keeps room for the letters' lean (`--ink-overhang`), and `font-synthesis.test.mjs` fails if a rule asks Bangers for a weight it is not loaded in. Titles that were also faked bold (the mode buttons on every game's intro) now show Bangers' real, slightly lighter weight; the 18 visual references were renewed from the runner.

## 1.9.0 — 2026-11-11
- 📤 **Share a game from its cover** (lab, flag `cover-share`): each game's cover gets a share button in the top bar, beside the language and sound. It sends the game's name, one line inviting to play and its link (without room codes); on a computer the message is copied. It hides once the game starts.
  The game covers' visual references now show it (the test page holds a lab key).

## 1.8.1 — 2026-11-11
- **Offline mode**: the ☁️'s shimmer while storing is faster (one pass in 2.4 s instead of 6) and smooth: the cloud is no longer drawn again on each step of progress, only its ring moves, so the colours never jump.

## 1.8.0 — 2026-11-11
- **Sudoku (lab): el modo 🟢 Fácil ahora es un mini sudoku de 6×6**, con cuadros de 2 filas × 3 columnas y números del 1 al 6, para que una partida quepa en una juntada. 🔴 Difícil sigue siendo el sudoku clásico de 9×9.
- **Sudoku: la portada muestra el tablero del nivel elegido**: la demostración que se resuelve sola es de 6×6 en Fácil y de 9×9 en Difícil, y los textos ya no dicen "del 1 al 9" para los dos.
- **Sudoku: el switch dice qué cambia**: Fácil es «6×6: menos celdas y dígitos, más rápido» y Difícil «9×9 y pocas pistas: hay que pensar con notas».
- **Sudoku tiene su propio ícono**: un cuadro de 3×3 con números, en el rojo oscuro del modo difícil, en vez del ábaco 🧮. Se ve en la portada, en el juego y en el laboratorio; donde solo cabe texto, el juego usa #️⃣.
- **Sudoku fácil: números más grandes** en el tablero de 6×6.

## 1.7.33 — 2026-11-11
- **¡Al toque!**: the ✓ or ✗ at the end of each game now sits small in the middle of the top bar, next to the points, instead of over the game, so it no longer hides what you just did.

## 1.7.32 — 2026-11-11
- **Artefactos (lab)**: while you build, the red ball waits up in its tube, barely seen; on ▶ Probar it lights up, slides down and falls out.
- **Artefactos (lab)**: "💬 Sugerencias y comentarios" under the board is now the same violet chip as on the cover, not an underlined link (`.footer-links.tiles.chips` in `base.css`).

## 1.7.31 — 2026-11-11
- **Sudoku's card to La Bodega**: launched on 2026-11-11, its /labs/ card moves from 🎲 Juegos en prueba to ✨ Mejoras lanzadas, folded, with «🚀 Lanzado.».

## 1.7.30 — 2026-11-11
- **Artefactos (lab)**: a bigger board. The stage and its difficulty now sit between the dots and the clock, so the board takes the height that frees up (the full width on most phones). Each stage is announced big over the board for a moment as it starts, and the ball waits hidden inside the cyan pipe until Probar drops it out.

## 1.7.29 — 2026-11-11
- **Weekly popularity merges again**: the workflow waits on the commit's `tests` and `end-to-end` check runs through REST instead of `gh pr checks`, which with the workflow token never saw them; the 2026-11-09 PR waited an hour and stayed open with both checks green.

## 1.7.28 — 2026-11-11
- 📊 Panel: the footer note is down to one line, what is kept and the time zone.

## 1.7.27 — 2026-11-11
- 📊 Panel (lab ☰ More): the bottom bar on a phone stays pinned to the screen as you scroll (the screen's entrance slide kept a transform that tied it to the page's end), with rounded top corners, a shadow and the open section in yellow.

## 1.7.26 — 2026-11-11
- **🧮 Sudoku (lab): 💡 hints and a little celebration.** A hint fills the selected cell (or the easiest one left) and says why the number goes there; it costs 15 points and asks first. A right number pops with a soft ring, and completing a row, column or box sends a light along it.

## 1.7.25 — 2026-11-11
- **Uno al día: a cleaner points box, in the lab** (flag `uad-clean-hero`, the owner's pick of three mockups). Your place goes big (#3 del mes), with your points and the days left under it in plain text; while there is no place yet, the points stay big. Last month's 👑 champion chip has a row of its own. The streak, the wildcards and what today added are one line (🔥 9 días · 🧊 1 · ✅ +125 hoy), instead of the "Hoy sumaste…" sentence, the place sentence and the four numbers. A failed ranking read keeps the last place this phone saw, as the points already did.

## 1.7.24 — 2026-11-11
- **Panel, in the lab: a bottom menu of one row on a phone.** Behind `panel-nav-more`: Summary, Timeline, Health, Feedback and ☰ More; More opens a sheet with the other sections by group (Players, Games, Owner) and stands for the section it holds when that one is open. A computer keeps the whole column.

## 1.7.23 — 2026-11-11
- **Home page**: with a filter on, "Show all" sits right after "Showing 4 of 21 games." instead of floating apart.

## 1.7.22 — 2026-11-11
- **Uno al día**: the ranking at the end of the game is read again once today's points are in, so it shows the same total and place as /today/ instead of the month without today.

## 1.7.21 — 2026-11-11
- **Panel: the last lines are no longer hidden under the bottom menu on a phone.** The menu grew to four rows but the page kept room for two; the room below the page now follows the menu's measured height.

## 1.7.20 — 2026-11-11
- **Panel: a browser that cannot remember no longer fills the timeline.** A splash counted as a first reach even when the browser had no storage to remember it, so such a browser wrote one "saw the campaign" row per page (four in seven seconds on Nov 11, all visible, no name, US). Now a browser with no storage is never a first reach: no timeline row and no reach count from it.

## 1.7.19 — 2026-11-11
- **Panel: a burst of identical "saw the campaign" rows is one row.** The Nov 9–10 fix stopped a phone from writing one row per view only when it can remember what it saw; a browser with no storage still wrote four rows in a second (Nov 11, 02:34). The timeline now joins rows with the same campaign, name and country within two minutes into one, marked "N times in a row".

## 1.7.18 — 2026-11-11
- **¡Al toque!: a cleaner points breakdown** (lab): the stars line starts with ⭐ («⭐ 21 estrellas × 10 puntos»), the speed line just reads «⚡ Bono de velocidad» in the same neutral colour as the others, and ¡Calcula!'s icon is 🧮 (its ➕ read as a cross in the run's summary).

## 1.7.17 — 2026-11-11
- **The 🔥 Popular label** follows this week's most finished games.

## 1.7.16 — 2026-11-10
- **Artefactos (lab), lighter screens**: the cover drops the «5 etapas · 6:00» chip and its tagline fits one line («Lleva la pelota a la canasta.»). On the board, a chosen part shows two small flat icons, turn and trash, floating just above it, fading out after 5 s without a touch or on a drag (and the part's outline fades when it is let go); Limpiar is gone, Deshacer · Pista · Rendirse share one row above Probar, and every help line under the board is one short line.

## 1.7.15 — 2026-11-10
- Every block on a game cover sits the same 12 px from the next, now checked for every game; ¡Al toque!'s ranking was 16 px away.
- ¡Al toque!: the Desliza line no longer touches the top of its box, the hand stays inside it, and the cover fits above the fold again on a 375×812 phone.

## 1.7.14 — 2026-11-10
- Labs: 🐤 Aletazo, launched for everyone on 9 November, moves to La Bodega as 🚀 Lanzado.

## 1.7.13 — 2026-11-10
- The ranking under a game no longer touches its cover: the 16 px of space comes from `ranking.css` for every game (¡Al toque! had none; Flap had its own).

## 1.7.12 — 2026-11-11
- **¡Al toque!: the owner's feedback after a few runs** (lab, `/labs/microgames/`): the result explains its points with a short breakdown (stars × 10, what the speed added, the 🔥 streaks, the total) and shows the run's summary above Otra corrida; the run's marks at the top are just red (no star) or green, brighter the more stars; the ✓/✗ after each microgame is a bigger round badge with a pop, set lower so it no longer covers the run's marks; ¡Rebota!, ¡Equilibra! and ¡Sigue! no longer freeze when they end with a message (¡Rebota! now ends the moment the ball gets past the paddle); ¡Conecta! lights up the four in a row and stops pointing at the column once the disc drops; the cover gives the three ways to play more room; ¡A la hora! always needs both hands moved; a run plays at most one of the two clock games; and ¡Alimenta! is gone (28 microgames). After each game its stars fill in one by one, golden and shining, with the points it gave and its ⚡ speed bonus (×1 up to ×1.3, a step every 3 games, shown as «⚡ Bono de velocidad» in the breakdown); a streak shows as it happens (an orange «🔥 Racha de n · +5» and a flame ring on its marks); at the end the stars fill game by game and the total counts up.

## 1.7.11 — 2026-11-10
- **¡Al toque! (lab)**: el ranking se ve con el diseño del sitio (pestañas Semana, Siempre y Amigos), y la portada termina donde termina su contenido, sin franja vacía, entera en la pantalla.

## 1.7.10 — 2026-11-10
- **¡Al toque! (lab)**: la portada ya no repite «Cómo se juega» y cabe entera en la pantalla; el ⚡ del título da un salto de vez en cuando, y la mano de «Desliza» ya se ve. Tiene ranking (semana, siempre y amigos) como los demás juegos para uno, y la pestaña «T» muestra los 29 microjuegos como botones de colores.

## 1.7.9 — 2026-11-10
- **¡Al toque! (lab)**: en la pestaña «T» de los testers, «Probar un microjuego» abre cualquiera de los 29 directo, y está ahí también la corrida de hoy; la portada queda como la ven los jugadores.

## 1.7.8 — 2026-11-10
- **¡Al toque! (lab)**: los teléfonos con el modo sin conexión ya reciben cada versión nueva del juego; antes se quedaban con la primera que habían visto.

## 1.7.7 — 2026-11-11
- **¡Al toque! fills the screen and shows its three ways to play at once** (lab, `/labs/microgames/`): the stage takes the whole screen under the top bar, like the lab's other games, instead of a small 4:5 box. The cover now lays out Toca, Arrastra and Desliza together, each with a finger doing its gesture, above Jugar, instead of the microgame vignettes that took turns beside the ⚡.

## 1.7.6 — 2026-11-10
- **¡Al toque! (lab)**: nuevo microjuego ¡A la hora!: una hora digital y un reloj; arrastra la aguja corta y la larga hasta esa hora y toca ¡Listo! antes de 10 segundos.

## 1.7.5 — 2026-11-10
- **¡Al toque! (lab)**: la portada deja solo el botón Jugar, más ancho, y queda entera en la pantalla del teléfono sin bajar.

## 1.7.4 — 2026-11-10
- **¡Al toque! (lab)**: los microjuegos que se juegan solos junto al ⚡ de la portada se ven más grandes, y la portada ya no corta sus botones en un teléfono angosto.

## 1.7.3 — 2026-11-10
- **¡Al toque!, in the lab:** the cover's ⚡ sets off a little microgame on each side, one after another: a fly swatted, a colour word, a sum, bars sorting themselves, a balloon that pops and a clock.

## 1.7.2 — 2026-11-10
- **¡Al toque!, in the lab:** the rules are on the cover, folded under the stage, with the three ways to play; Jugar goes straight into the run.
- **¡Al toque!:** the pump's hose is a real hose and stays tied to the balloon as it grows; the flyswatter lands where you tap and squashes the fly you hit.
- **¡Al toque!:** points per game (by stars and speed, with streaks) and a 0–100 score for Uno al día and La Copa; a run with `?seed=` or `?today` is the same for everyone.
- **¡Al toque!:** sound (with its 🔊 button), confetti on a good run, and the way back to the lab like every game.
- **¡Al toque!:** in English and Portuguese, with the language on the cover.
- **¡Al toque!:** the phone locking or another app pauses the game, and Seguir plays it again; the end offers to challenge someone with the same run, and the cover a run of the day that is the same for everyone.
- **¡Al toque!:** in ¡Rueda! lifting the finger pauses the ball; in ¡Conecta! a tap on a column drops the disc; ¡Corta! says when the swipe was too short; ¡Cuenta! wobbles less; running out of time always says so.

## 1.7.1 — 2026-11-10
- **⚡ ¡Al toque!, microgames in the lab's Juegos en prueba** (`/labs/microgames/`): in the style of WarioWare, one quick order and 3 to 5 seconds to do it. Each run is 10 different games drawn from 28 (count, add, pop, sort, cut, follow the rat, balance the blocks…), one after another and a little faster every three. Before starting, it shows the three ways to play (tap, drag, swipe), each with a finger doing it, and every game's intro shows its own. Spanish only for now.

## 1.7.0 — 2026-11-10
- **🔑 Lab keys in the panel**: the owner gives a tester their lab link, sees who has a key and who uses it (🟢 active, 🟡 quiet, ⚪ never used) and removes a key in one tap, with no terminal. The owner may now read and write `labsLlaves/` in the Firebase rules.

## 1.6.18 — 2026-11-10
- **One name for the comment button**: the lab games that said "💬 Dejar un comentario" (Artifacts, Flap, Memorice, Code, Dominorama, Exploding Numbers, Stack) now say "💬 Sugerencias y comentarios", like the site's inbox and every other cover, in the three languages.

## 1.6.17 — 2026-11-10
- **Lab games' covers end with the site footer**, like the published ones: Sudoku, Chameleon, Fourth King, Julep, Artifacts, Flap, Memory, Code, Dominorama, Exploding Numbers and Stack. Their own 💬 comment is a tile of that footer on the cover and stays alone while playing. `site-footer.test.mjs` now walks `labs/` too and fails a lab game whose cover has no footer, so a game enters the lab already meeting it.

## 1.6.16 — 2026-11-10
- **La Copa: the Gran Final explains how every game scores.** On the final's rules, the games played whole (Shinobi, Babel, Tango…) now say how they score, like the short rounds; and Shinobi, Babel and Aletazo add that in the final their points count as they are, up to 100 (also when their round starts).

## 1.6.15 — 2026-11-10
- **Panel: no more bursts of identical "saw the campaign" rows.** A splash now counts as shown only once the page is in front of someone (a prerendered page or a background tab waits until it is visible), and the timeline writes one row per phone and campaign, on its first reach. Rows from a page that opened hidden carry `vis` (`hidden`/`prerender`) for a while, to learn where the four-in-a-second bursts of Nov 9–10 came from.

## 1.6.14 — 2026-11-09
- **Las reglas empiezan plegadas en todas las portadas**: en Reinas, Zip, Tango y los demás juegos sueltos, y en Sudoku y El Camaleón del lab, el "Cómo se juega" se abre con un toque y la portada muestra lo que importa (D-550).

## 1.6.13 — 2026-11-09
- **🔢 Sudoku's cover, ready for production** (lab): a small board that solves itself and says why (row, column, box), the level lever now electric like Pintaminas' (a wave on every flip; hard flashes, sparks and turns the whole cover red-violet), your best score per level, and a ranking per level (`sudoku_easy`, `sudoku_hard`) with signing in, also on the result.

## 1.6.12 — 2026-11-10
- **🔢 Sudoku enters the lab** (Juegos en prueba): the numbers classic, solo, in two levels picked with Pintaminas' lever (green fácil, red difícil), with a score: 100 for the finished board, 10 less for each wrong number (it turns red). Every board is new and has a single solution; the hard one needs more than singles but never guessing. With notes, erase, undo, a clock and a pad that counts what is left of each digit; a repeated digit turns red too. In es, en and pt.
- **🔢 Sudoku (lab): 🏳️ Rendirse instead of Borrar.** On the right of the row, it asks "¿Seguro?" first, as in Pintaminas and Dominorama; giving up scores 0 and shows the solution. The same number again still empties a cell.
- **🧮 Sudoku (lab): its own icon.** 🔢 was Toque y Fama's: the game is 🧮 now, and its cover shows a sudoku drawn on ruled notebook paper.
- **La Copa: one footer on the board.** When the board was drawn twice in a row, its new footer (lab `cup-footer`) could appear twice; now the second replaces the first.

## 1.6.11 — 2026-11-09
- **La Copa's board ends with the site footer** (lab, flag `cup-footer`): «Report a problem» and «Leave this cup» become tiles of the violet-sunset footer instead of two loose links (U-38). `site-footer.js` takes a screen's own `options`; `site-footer.test.mjs` fails on any new loose link outside a game.
- **Artefactos' lab test** pins the day it plays, so it no longer fails on dates whose five stages the drags were not placed for.

## 1.6.10 — 2026-11-09
- **🐤 Aletazo now has its own name in English and Portuguese**: *Flap* in English and *Bate-Asa* in Portuguese, on the home page, the search, La Copa and its launch splash (Spanish keeps Aletazo).
- **No game name left untranslated again** (D-549): `game-names.test.mjs` fails a game whose English or Portuguese name copies the Spanish one without a listed reason, or whose La Copa texts disagree with `games.js`.

## 1.6.9 — 2026-11-09
- **Owner panel: shorter section descriptions.** The notes under each title and section now say only what is needed to read the numbers; decision numbers and how the data is collected moved out of the screen (they live in the docs).

## 1.6.8 — 2026-11-09
- **A new game can also be 🔥 Popular** (D-548): the label goes to the three most played games of the week, new ones included, so a game like Shinobi wears both "New" and 🔥 Popular.

## 1.6.7 — 2026-11-09
- **La Copa: the wildcard ×2 is a switch beside «Empezar».** On a day's cover the wildcard sat below the
  buttons, so it could be missed before starting, and once a day starts it can no longer be used. Now it is
  a switch right above «Empezar», seen without scrolling; on, the button reads «🃏 Empezar con ×2» and applies the wildcard
  and starts the day.

## 1.6.6 — 2026-11-09
- **The footer buttons now look like the rest of the app**: "Sugerencias y comentarios" and "Invítame a un café" are pills tinted with their own color (cyan and orange), with the icon on the left, like the tags on the game cards, instead of two frosted squares.
- **No empty frame on the coffee card offline**: the thank-you clip comes from GIPHY and cannot work without signal; offline, or when GIPHY does not answer, the card now opens without it.
- **No coffee button offline**: without signal the "Invítame a un café" button (footer and end of game) steps aside, since paying needs Stripe; it comes back with the signal.
- **Messages sent without signal always arrive**: a 💬 message written offline waited on the phone but only went up when La Copa or the lab was opened; now it goes up from any page, and as soon as the signal is back.

## 1.6.5 — 2026-11-09
- **Offline sheet in candlelight**: the sheet that explains offline mode (and any sheet opened offline) takes the Candlelight palette instead of its hard-coded purple, also when it opens over a game screen.
- **The sheet says La Copa plays offline**: with the `cup-offline` flag on, it no longer says La Copa needs the signal; it says a pending day of a cup opened with signal on this phone plays offline and uploads when the signal is back, if the day is still open (D-544). es, en, pt.

## 1.6.4 — 2026-11-09
- **One language selector on the cover**: picking a variant (Loteo's Números / Servicios, and any game with variants) redrew the cover with the full flag toggle under the title, next to the round flag button in the top bar. Now only the top-bar button stays.
- **Artefactos (lab)**: on a 375×667 phone the cover demo is a touch smaller, so Jugar is back inside the first screen.

## 1.6.3 — 2026-11-09
- **Workshop:** a Claude Code hook (`tools/agents/push-guard.mjs`) stops a `git push` while `docs/DECISIONS.md` or a generated README block is stale, so the `tests` check no longer goes red for it (D-518).

## 1.6.2 — 2026-11-08
- **Artefactos (lab): a livelier cover** (the owner's request): the demo board is bigger, and before each ball drops its parts rise from below and glide into their slots one by one, as a player would drag them, so the cover shows that the parts move.

## 1.6.1 — 2026-11-08
- **🔥 Popular, this week**: the home page's order and its three 🔥 Popular games follow the games finished in the last four weeks.

## 1.6.0 — 2026-11-08
- **🔥 Popular refreshes itself every Monday**: the three most popular games (games finished in the last four weeks) get the label, and the ones that left the top three lose it, with no one having to remember it.

## 1.5.5 — 2026-11-08
- **Labs**: the 🎨 Sistema de diseño card moves to La Bodega (✨ Mejoras lanzadas); the page stays behind the lab door.

## 1.5.4 — 2026-11-08
- **🐤 Aletazo's launch splash** gets a new clip: a 24-second loop that starts over with no cut, as the bird flies through the hoops from day to the afternoon over the sea, into the night and back to day (the owner's request).

## 1.5.3 — 2026-11-08
- **La Copa sin conexión** (laboratorio, tarjeta propia `cup-offline` en Labs, D-544): si te queda un día pendiente y no tienes señal, igual lo juegas. El resultado queda guardado en tu celular y se sube solo al volver la señal; si no alcanza a subir antes de que cierre el día, cuenta como no jugado. Funciona con las copas que ya abriste con señal en ese celular. Sin la prueba encendida, abrir una copa sin señal dice que no hay conexión.
- **La Copa sin conexión sube sola con la app cerrada en Android**: cuando vuelve la señal, el día jugado se sube sin abrir la app. En iPhone, que no lo permite, la pantalla dice que se sube la próxima vez que abras la app con señal.

## 1.5.2 — 2026-11-08
- **La Copa: «Empezar» shows without scrolling on a day's cover.** Inside a cup the day's cover opened with
  «Cómo se juega» unfolded, the wildcard and «Probar primero» before the button, so on a small phone «Empezar»
  sat 500–1000 px below the fold. Now the button sits right under the title, as on every game's landing (U-39),
  with «Probar primero» under it and the rules folded. `landing-fold.mjs` now also checks each game opened from
  Uno al día (`?today`) and a cup's day cover.

## 1.5.1 — 2026-11-08
- **🧪 Lab: each piece of news is told once** (D-546, flag `news-once`): a visit that arrives from a notification opens no home window, a splash for games the phone already played is not shown, and a cup's end seen on its own board is not recapped again on the home page.

## 1.5.0 — 2026-11-08
- **🐤 Aletazo sale del laboratorio** (launches 2026-11-09 at 00:00 Pacific): the one-tap flyer, inspired by Flappy Bird, becomes a La Copa game with its own page `/flap/`, its ranking, La Copa's pool and Uno al día (from the deck of 2026-11-28), in Spanish, English and Portuguese. Every tap flaps the bird up through hoops (dead center counts double) and the gaps in walls, with 3 lives; the day's course is the same for everyone. Hidden until the `launch` workflow switches `flags/aletazo` and the new splash «¡A volar con Aletazo!» on at the hour (D-517, D-529), with the «Nuevo» label for 10 days.
- **📣 Campaigns in the panel could not be saved** (PERMISSION_DENIED): the `launch` workflow had stored a campaign's end as an exact moment (`2026-11-09T08:00:00Z`), which the Firebase rules refused as a day, and the panel rewrites every campaign at once. The rules now take a day or an exact moment, as splash.js does (`firebase/splash.test.mjs`).

## 1.4.36 — 2026-11-08
- **The end-of-season notification of Uno al día is no longer sent to a phone that already saw the season's recap on the home page** (D-545): each piece of news is told once, by the first channel that shows it.

## 1.4.35 — 2026-11-08
- **The per-game checks walk every game** (C-21, D-542): the canon guard (`games.test.mjs`), the file layout (`structure.mjs`), game memory (`memory.mjs`), conformance, the language parity of each game's texts and the share cards now cover the games built in `cup/games/` too (Queens, Tango, Zip, Babel…). What those cannot meet yet is frozen in debt lists that only shrink (`docs/games-debt.json`, and new entries in `docs/memory-debt.json` and `docs/manifest-debt.json`). The home page's share card now lists every game. Eight games got their own page in `docs/games/` (Connections, Word, What Year?, Queens, Tango, Zip, Untangle, Where Is It?).

## 1.4.34 — 2026-11-08
- **Panel**: in 🕑 Timeline the Key events list now comes right after the summary tiles, with When and Time of day below it.

## 1.4.33 — 2026-11-08
- **/labs/ has an index at the top**: one tap per game and improvement still being tried jumps straight to its card, without scrolling past every game. La Bodega is left out, and a card published for everyone drops out of the index on its own.

## 1.4.32 — 2026-11-08
- **Every game is one more game** (C-21, D-542, the owner's request): the code walks a single list of all the games (`ALL_GAMES`), so a change meant for the games reaches every one of them, and a test stops a new hand-made split. The docs no longer speak of "mini-games" as a kind apart. Nothing changes for players.
- **A PR preview only when there is something to see** (D-543, the owner's request): a PR that changes nothing under `public/` but tests gets no preview build.

## 1.4.31 — 2026-11-08
- **The floating title no longer cuts its last letter**: scrolling the home page, the name on top of the filters showed the N of SALÓN cut off; it now gets the same side room as the other gradient titles.

## 1.4.30 — 2026-11-07
- **Uno al día calendar**: a day uploaded too late for points shows ⏳ instead of a 0 that looked like a lost score; tapping it still explains why, and its spoken label says so too.
- **Firebase**: a rule in `firebase/README.md` — a real player's `unoAlDia/` history is never deleted to test something, and how to repair one that was.

## 1.4.29 — 2026-11-07
- **Offline mode goes back online on its own** (D-538): out of airplane mode, the first check often failed because the phone had no route yet, and the next one waited 15 seconds and then needed a second one, so the screen stayed in Candlelight. Now `connection.js` retries quickly (2, 4 and 8 seconds) while the browser says it is online, and checks again when the page comes back to the front (switched from the phone's settings, where the `online` event may never reach it).

## 1.4.28 — 2026-11-07
- **Artefactos (lab): no more spikes inside the basket.** The level generator could drop spikes, a girder or a fixed plank right on the basket (stage 4 showed a basket with spikes in it). It now never puts a hazard on the basket's cells; the 14 levels that had one were removed and 5 new hard ones generated, and `engine.test.mjs` and the generator's `check` fail if it happens again.

## 1.4.27 — 2026-11-07
- **Labs**: the "✅ Listo para publicar" card goes to La Bodega under 🎲 Juegos guardados as 💤 No prosperó, sent there by the owner from /labs/. No player sees a change.

## 1.4.26 — 2026-11-07
- **📴 Offline mode (lab)**: «📴 Sin conexión» is now a sticker like the cards' «Nuevo», stuck on the title: «Juegos de Salón» on the home page and the game's name on its cover. It takes no room, so nothing on the page moves when it comes or goes.

## 1.4.25 — 2026-11-07
- **📴 Offline mode (lab)**: the «📴 Sin conexión» pill now floats at the bottom of the screen instead of taking a line at the top, so going offline or coming back moves nothing on the page. It shows on the site's pages and the game covers, and steps aside while playing.

## 1.4.24 — 2026-11-07
- **📴 Offline mode (lab)**: a page opened with no signal now shows the Candlelight palette from its first frame, with no flash of the normal colours. Going offline or coming back online with a page open switches on that same screen, right away, with a soft fade instead of a jump.

## 1.4.23 — 2026-11-07
- **📴 Offline mode (lab)**: the minigames' covers (Shinobi, Zip, Babel, Conexiones…) now take the Candlelight palette offline, as the party games' covers already did; the board keeps its colours once Start is pressed.

## 1.4.22 — 2026-11-07
- **Offline mode (lab):** without signal, the game covers take the candlelight colours too, and 🎲 Juego al azar only picks games this phone has stored, so it always opens.

## 1.4.21 — 2026-11-07
- **Offline mode (lab): a candlelight palette.** Without signal, the home page, Uno al día, Rankings and the menus turn a warm, quieter brown and amber, so it is clear you are in the offline version; the games keep their colours.

## 1.4.20 — 2026-11-07
- **Offline mode (lab):** an end-to-end test plays the whole path (stored, opened without signal, explained once, a game queued and uploaded once on the way back), and the phone no longer tries to upload while it knows it has no signal.

## 1.4.19 — 2026-11-07
- **Offline mode (lab): the first time without signal**, one sheet says what still works, what comes back with the signal and that scores upload by themselves; on iPhone it adds that the app on the home screen keeps them safest. Uno al día's page now opens without signal too.

## 1.4.18 — 2026-11-07
- **Offline mode (lab): scores.** Games played without signal are saved on the phone (up to 200, for 30 days) and upload by themselves when the signal is back, each one counted once. The end screen says "📴 Guardado en tu celular", and a message says how many went up and, if any did not, why. Yesterday's Uno al día played without signal still counts for its day if it uploads within 48 hours. The privacy page says what is kept.

## 1.4.17 — 2026-11-07
- **Your name, not «Jugador 1»**: One a Day in Hangman, Generala, Battleship and Liar's Dice now greets you by the name you already used on this phone (in La Copa, the rankings or another game) instead of «Jugador 1», and the ranking offer at the end no longer suggests «Jugador 1». The feedback box also fills in your name if this phone knows it. For the owner's panel: a seat label like «Jugador 1» or «Player 2» never stands in for a known name in the timeline again.

## 1.4.16 — 2026-11-07
- **Rules for making rules** (D-541, #1249 step 1): `docs/RULES.md` says every rule is a check, a ratchet or a judgement with a named reviewer, with the ten rules for making rules; `CLAUDE.md` links it.
- **Rule registry** (D-541, #1249 step 2): `docs/rules.json` lists every rule with its form (🤖 check, 📈 ratchet, 👁 judged): the design system, English and the 33 usability rules; `tools/agents/rules.mjs index` generates the index in `docs/RULES.md`, and `rules.test.mjs` fails on a rule without its form, a check naming a file that does not exist, a judged rule without its reviewer, or a usability mark that disagrees with `docs/USABILIDAD.md`.
- **Canon inventory** (D-541, #1249 step 3, part 1): the 21 canons (C-1…C-20 and C-8b) are in `docs/rules.json` with their form: 4 checked, 11 checked in part and judged in the rest, 6 judged with their reviewer; `rules.test.mjs` now fails on a canon missing from the registry.
- **Outside lane** (#1249 step 4): a PR from a fork, or opened by anyone but the owner, is 🔴 whatever its files, so it never auto-merges (`outsideReason` in `tools/agents/lanes.mjs`, `docs/LANES.md`); registered as the `outside-lane` rule.
- **The canons in English** (#1249 step 3, part 2): `docs/CANONES.md` is translated and renamed `docs/CANONS.md` (every reference follows; the player's quoted texts stay in Spanish). Two canons now follow the decisions that replaced theirs: C-1's country content (D-187, which replaced D-186) and C-17's share sheet with the Shorts in every language (D-410, which replaced D-254).
- **Workshop in English** (#1249 step 13): the 41 Spanish paths left in phase 3 of D-316, all under `marketing/` (agents-card, case-teaser, coming-soon-teaser, three-new, the promo video and share tutorial scripts, `marketing/log.json`), are renamed with every reference; `english.mjs status` reports phase 3 = 0. `repo-weight.test.mjs` no longer counts a blob main already has (a renamed video) as new weight.
- **Architecture boundary** (#1249 step 5): `tools/agents/architecture.test.mjs` fails when a game imports another game's folder, calls an external host or writes a storage key outside `juegos-de-salon:`; today's hits (40 imports, the Firebase SDK from its CDN, `uad-pts-cache` and `copa:prueba:uid`) are frozen in `docs/architecture-allowlist.json` with reasons, and Firebase paths are counted for step 7's manifests. `docs/ARCHITECTURE.md` explains it; registered as the `architecture` ratchet.
- **Seeded randomness, replay and fuzzing** (#1249 steps 10–11): `azar.js` takes a seed (`seedRandom`, `withSeed`, `?test&seed=`), `tools/replay/replay.mjs` replays a recorded game, and Hangman keeps a full recorded game and the D-61 bug as replay tests; `tools/fuzz/fuzz.mjs` plays 2000 random Hangman games against its invariants in `tests` (a pure `step`/`legalActions` adapter in its engine), printing any failure as a replay. `docs/REPLAY.md`.
- **Game manifests** (#1249 step 7): Hangman and Dudo describe themselves in a `game.json` (players, modes, AI, game memory, languages, Firebase paths, canon exceptions) validated by `public/assets/js/game-manifest.js`; `node tools/generators/manifests.mjs` writes the modules `games.js` imports, so their catalog entries live in one place (unchanged for every consumer).
- **Judged rules on the PR** (#1249 step 6): every 👁 rule in `docs/rules.json` names the files it `applies` to; `rules.mjs touched` lists the rules a diff touches, and `.github/workflows/rules-comment.yml` (`pull_request_target`, main's code only, or by hand for any PR) keeps one comment on each PR naming the judged rules it touches and their reviewers. `CONTRIBUTING.md` and the new PR template carry a rules section generated from the registry.
- **Missing measurable rules** (#1249 step 12): C-2 file layout (`structure.test.mjs`, no debt), C-6 game memory (`memory.test.mjs`, La Copa listed: its state lives on the server), the runtime flags registered as the `flags` rule over `listed.test.mjs`, and English exported identifiers (`identifiers.test.mjs`, 304 Spanish names frozen in `docs/english-identifiers-debt.json`, which only shrinks).
- **Rules round** (#1249 step 16): `node tools/agents/rules.mjs report [--json] [--record]` gives each ratchet's debt and its trend (`docs/rules-debt.json`), any judged rule without a reviewer, and rule ids that fix commits named twice in 30 days without a check; `rules.test.mjs` fails when a ratchet's debt grows past its last count, and the processes round runs it and opens the PR for a missing check.
- **Visual regression** (#1249 step 15): `tools/e2e/visual.mjs` compares each game's intro screen (25 games, Spanish, 390×812, frozen clock, seeded random, no motion) with a reference PNG in `tools/e2e/visual/ref/` (half size), made on GitHub's runner by the "Visual references" workflow once this is on main — until then the check passes with a note through a plain-node PNG diff (`png.mjs`); a change past the tolerance is ❌ in `end-to-end` for the games a PR reaches, and `--update` (or the manual "Visual references" workflow, on GitHub's runner) approves it in the diff.
- **Visual references from the runner** (#1249 step 15): the 25 intro-screen references, made on GitHub's runner by the "Visual references" workflow, so the visual check compares each game from now on (Babel and Where left out with their reasons in `VISUAL_SKIP`); the clock is stopped for the screenshot (Date, performance.now and frame timestamps), so a cover animated in JS, like Babel's, draws the same frame every run.
- **Game factory** (#1249 steps 8, 9, 14): a conformance suite run on every `game.json` (`conformance.test.mjs` in `tests`, `tools/e2e/conformance.mjs` in the browser: load, languages, back, resume, share, result); `node tools/generators/new-game.mjs <id>` makes a lab game that passes every rule as born, and `docs/ADD-GAME.md` starts with it; every game in GAMES, La Copa included, now lives in its `game.json`, moved by `manifests.mjs migrate` with each catalog entry unchanged.

## 1.4.15 — 2026-11-07
- **Panel timeline: 🤖 next to a robot.** A browser that says it is automated (`navigator.webdriver`) or a crawler or link-preview fetcher by its user agent is marked `r` on its `live/` and `seen/` rows, and the timeline shows 🤖 after its name and flag. The rows are kept, not dropped.

## 1.4.14 — 2026-11-07
- **Offline mode plan: the offline palette is chosen.** "Candlelight" (dark warm brown, amber and cream) will colour the home page, menus and game covers while offline, with a fade in and out as the signal goes and comes back. Written into step 8 of `docs/OFFLINE.md`; nothing changes for players yet.
- **Testers: offline mode from the T tab.** While the offline flag is on, the T tab has a «📴 Modo sin conexión» switch that forces offline mode on this phone, on every page, until switched off: no airplane mode needed to try it. It is also the way back while forced, since the Labs link needs signal.
- **Testers: the offline switch is a real cut now.** Forced offline mode takes the network away from the site, as airplane mode does: pages and files come only from what the phone kept, Firebase and every other site fail, and the browser says it is offline. Switching it on or off reloads the page. Stuck on a page that cannot load, any address with `?connection=online` ends it.

## 1.4.13 — 2026-11-07
- **📴 Offline mode, step 4 of 9** (D-538), in the lab: with no signal, a small «📴 Sin conexión · 2 por subir» pill opens each page, and what needs a connection (La Copa, Rankings, the two-phone mode of each game) stays in place, dimmed and tagged «📡 Con señal»; tapping it says why in one line instead of failing.

## 1.4.12 — 2026-11-07
- **📴 Offline mode, step 3 of 8** (D-538), in the lab: the app notices by itself when there is no signal or it is too poor to use, and only goes back once it has been steady for a few seconds. Testers can force the mode from its card in /labs/, which also shows what the app detects. Nothing changes on screen yet.

## 1.4.11 — 2026-11-07
- **📴 Offline mode (lab)**: after a new version was published, a game opened with no signal could draw blank or fail (seen on Shinobi): the phone kept the page from the old version, which asked for files the new one no longer stored. Pages now belong to the version they came with, and with no signal a missing code file falls back to another stored version of it instead of leaving the page half drawn (the home page without its 🎲 button).

## 1.4.10 — 2026-11-07
- **📴 Offline mode (lab)**: opening a page the phone had not stored, with no signal, drew the home page without its styles under that page's address (seen on /labs/). It now goes to the home page itself, styled.

## 1.4.9 — 2026-11-07
- **📴 Offline mode, step 2 of 8** (D-538), in the lab (🧪 `offline`): with the flag on, the phone stores the games that can be played without signal (about 4 MB, generated at each publish into `precache.json`) and opens them in airplane mode. Pages still come from the network first, so nobody gets stuck on an old version; with the flag off nothing is cached, as before.

## 1.4.8 — 2026-11-07
- **📴 Offline mode, step 1 of 8** (D-538, docs/OFFLINE.md): the plan for playing with no signal is approved and in the repo. The games manifest now says which games are offline-capable (all but La Copa, `offlineOk` in `games.js`), and `offline.test.mjs` fails if one of their pages starts importing something from another site when it opens. Nothing changes for players yet.

## 1.4.7 — 2026-11-06
- **Every online game's room follows the same rules** (D-539): Battleship, Bulls and Cows and the lab's Julep now apply joining and rematch through `room-state.js`, like Hangman, Timeline, Generala and Liar's Dice. In Julep a second rematch offer from the same player no longer replaces the first, so two phones cannot end up in different rooms. A join can carry more than a name through `onHello` (Julep's key for its sealed hand).

## 1.4.6 — 2026-11-06
- **Panel, 📣 Campaigns**: the end day can always be changed, also after picking 1 week, 2 weeks or 1 month; a new **Custom** option lights up when the end day matches no preset and opens the calendar. Every change shows on the card at once, before Firebase answers.

## 1.4.5 — 2026-11-06
- **🐤 Aletazo teaser**: the day → afternoon → night → day loop is now seamless (24 s): the city, the sky and the sparkles at the end lead into the start with no visible cut.

## 1.4.4 — 2026-11-06
- **In the lab: La Copa and Uno al día also get the language as one flag button in the top bar**, like the game covers (flag `compact-lang`, D-537).

## 1.4.3 — 2026-11-06
- **🌐 First visit in the browser's language (lab)**: someone who never chose a language sees the app in English or Portuguese when their browser is in one of them, and in Spanish otherwise; the toggle still changes it. Behind the flag `browser-lang`, on its /labs/ card (D-536).

## 1.4.2 — 2026-11-06
- **⚙️ Artilugio is now called Artefactos** (the owner's choice), and it moved to `/labs/artifacts/`: the lab card points there, and the best score kept on the phone comes along.
- **Artefactos: a ball that lands late in the basket now passes the stage.** A run that trampolines kept in the air for a long while was cut at 14 s and called stuck while the ball was settling in the basket; a run now lasts up to 30 s, and a ball already in the basket when time runs out counts. The basket's floor is rougher, so the ball still rolls naturally but only a little, and the stage passes after a fraction of a second at rest (0.3 s).
- **One name inside and out (C-20, D-535):** a game's folder, id, phone keys, test hooks and docs are the English version of the name the player reads, and a rename carries over what was kept. Artefactos is the first: `contraption` and `artilugio` are now `artifacts`.

## 1.4.1 — 2026-11-06
- La Copa's end-to-end scripts reach a new day from the cup's midnight, so they no longer depend on the hour they run (clock-jumps.test.mjs).

## 1.4.0 — 2026-11-05
- **⚙️ Artilugio, a new machine puzzle in the lab's Juegos en prueba** (`/labs/contraption/`), in the genre of The Incredible Machine (Sierra, 1993), credited on the cover; the board, the parts, the levels and the look are our own. Each level drops a ball that must land in the basket 🧺: pick a ramp, plank, trampoline or fan from the tray, tap the board to place it, tap it again to turn, move or remove it, then ▶ Probar to watch the ball run. Six levels that unlock one after another; the fewer parts, the more stars, kept on the phone. In Spanish, English and Portuguese. Drawn in the app's neon: wooden ramps with bolts, a squashing trampoline, a spinning fan with visible breeze, a glowing basket, confetti on a win and a pop on the spikes; the cover shows a little board solving the levels by itself. Parts are dragged from the tray onto the board (snapped to the grid over a green or red slot, lifted above the finger), one tap turns a ramp or fan, a part is dragged to move it or dropped off the board to remove it, and ↶ Deshacer undoes the last change. A stage is passed only once the ball comes to rest in the basket; a ball that touches the bottom of the board blows up (flash, shock wave, smoke, a shake and a bang) before the stage is marked failed. The ball now drops all the way to the basket's floor and may roll from side to side with its momentum before it rests. After three levels that teach the parts, the levels are dealt at random from 72 generated ones in six tiers that grow from one part to three, with decoys and more hazards; 🎲 Otro deals another of the same difficulty.

## 1.3.1 — 2026-11-05
- **A game on its own page no longer repeats its name**: the chip at the top already says it, so the title under ‹ Menú is gone (Babel and every standalone game).

## 1.3.0 — 2026-11-05
- **👀 Memorice, a new game in the lab** (`/labs/memory/`, the owner's idea): an endless, quick memory game in pixel art, with 45 of our own 12×12 pictures picked by the owner (Chilean favourites like the flag, a piscola, an empanada or a moai, plus pop, food and symbols). Some pictures show on a covered board (some repeated: pairs and, on the big boards, trios) and hide again; you tap every copy of the one asked for (alone, a pair or a trio) before the time to answer runs out. The first four rounds teach it (one picture, then a pair, on 3×3 and 4×4); after that the groups and what is asked are mixed, the board grows up to 6×6, more pictures show, and there is less time to look (4.5 s at first, 2 s at round 20, down to 0.8 s) and to answer, until the three lives run out; five rounds in a row without a miss give a life back. A button covers the pictures early, so a good player reaches the hard rounds sooner. In Spanish, English and Portuguese; every game is a new one. Its card is in the lab's Games being tried, and `tools/e2e/memory/lab.mjs` plays it end to end.
- Memorice's stylesheet uses the design tokens (D-533): the colours and tiles look the same; a few text sizes and corners moved to the nearest step.

## 1.2.9 — 2026-11-05
- **🗼 Babel's score tally (in the lab)** is now a receipt: a row each for the floors, the streak bonus («Bono de racha») and the length bonus, then the total, labels on one line and big figures.

## 1.2.8 — 2026-11-05
- **🗼 Babel's score tally goes to the lab** (flag `babel-tally`): the end screen's floors + bonuses = points show is for lab keys until the owner publishes it from its /labs/ card. In the lab it has bigger figures, the same space around every + and =, and stays on one line with three-digit figures on small phones.

## 1.2.7 — 2026-11-05
- **🗼 Babel's end fits the screen**: the rules no longer sit under the finished tower, and the tour fits the screen without scrolling on any phone. (The animated score tally that first shipped here is now in the lab: see the `babel-tally` entry.)

## 1.2.6 — 2026-11-05
- The design system: an analysis of why La Copa behaves as a system apart and the PRs that make it one (`docs/design/cup-unification.md`, #1196).

## 1.2.5 — 2026-11-05
- **Labs: no 📦 Enviar a La Bodega on a card already published for everyone.** Its card moves to La Bodega on its own when `/labs/` opens (D-534), so the button that asked a PR to move it is gone while the flag is *all*; ↩️ Volver al laboratorio and ⚪ Apagar para todos stay.

## 1.2.4 — 2026-11-04
- **Labs: a feature published for everyone goes to La Bodega on its own** (D-534). When `/labs/` opens it reads the flags and moves every card under ✨ Mejoras en prueba whose flag is *all* into ✨ Mejoras lanzadas, folded and dated by the day it went live, with its switch. No PR: the cleanup PR that removes the gate moves its HTML for good. Until now a launched card waited there until someone moved it by hand.

## 1.2.3 — 2026-11-04
- **La Copa: the early podium card moves to La Bodega**: the announcement on the last day, already on for everyone, now sits under ✨ Mejoras lanzadas in /labs/ (D-479, D-511).

## 1.2.2 — 2026-11-04
- **🐤 Aletazo shows its ranking on the cover**, like the other games played alone: under the stage, below the fold, the Aletazo ranking (Semana · Siempre · Amigos) with signing in; the stage still fills the first screen. At the end, the run is saved to the ranking (or «¿Quieres que esta partida cuente?» without a player) and the table shows under the result; a tester's «Empezar en nivel» game never counts.

## 1.2.1 — 2026-11-04
- **A red PR is approved in its own description** (D-531): the Yes/No boxes sit at the top of the PR instead of in a separate issue, and a push refreshes them in place instead of opening a new issue each time.

## 1.2.0 — 2026-11-04
- **La Copa: the podium is announced on the last day** (in the lab behind the flag `cup-podium-early`): once nothing left to play can change the first three places, the board announces them above the days («¡Cata ya ganó la copa!», the three steps, and a line saying what is left cannot move them). It counts only with what each player can see: whoever has not played the last day keeps the others' results hidden, and the announcement waits; the points of a day still open may drop as others play it and a free wildcard may still double a day, so when in doubt it waits too. The podium with its medals, the closing notice and the splash come as always when the cup closes. Demo `decided` in the test store.

## 1.1.5 — 2026-11-04
- **The English name is now Parlor Games** (was Party Games): page titles, the app name when installed, share messages, sheets, the privacy page and the English link card.

## 1.1.4 — 2026-11-04
- **La Copa: «🏆 Otra copa con este grupo» for everyone** (#1165): the owner published the flag `cup-again` on 2026-11-04, so every admin of a finished cup now sees the button under the podium. Its card moves to La Bodega with its switch (D-510); the gate comes off in a later PR.

## 1.1.3 — 2026-11-04
- **☀️ Tango**: a sun given at the start now sits on a dark amber cell instead of a yellow one: the yellow emoji was nearly invisible on it. A soft shadow under every sun lifts it off its cell too.

## 1.1.2 — 2026-11-04
- **The referee** (learning programme, piece 6, D-532): `tools/referee/` is a gateway for an open model on the owner's Mac mini (Ollama on localhost, reached only through a Cloudflare tunnel), with templates instead of prompts, a lab key, limits, a timeout, a breaker and a cache, keeping no player text; `jobs.json` gains services kept alive by launchd (`service: true`), with the `referee` job. Nothing changes for players yet: no game asks it.
- **New Cup, the day on Now and Tomorrow** follows the cup's zone: changing the zone or the audience (or midnight passing) renames the buttons, which were computed once when the screen opened and said Thursday at 9 pm on a Wednesday in Los Angeles when the screen had started in Chile time.
- **The design system, phase 1** (D-533, #1189): `docs/DESIGN.md` and the scales as tokens in `base.css` (space `--s-2`…`--s-32`, corners `--r-8`…`--r-pill`, button edges, shadows, text steps), used inside `base.css` where it wrote the same values by hand. Nothing changes for players: the computed styles of every screen are the same. The usability agent owns the system from now on; the lint, the components page and the migration are the next phases of #1188.
- **The design system, phase 2** (D-533, #1190): the design lint, `node tools/agents/design-lint.mjs`, measures every stylesheet against the tokens (a token colour written by hand, any other colour, a corner or a distance off the scale, a class copied from `base.css`, a text size off the steps) and reports; `docs/design-allowlist.json` holds the exceptions with their reason, and `docs/design-baseline.json` is the ratchet `design-lint.test.mjs` holds: a file's count never grows, it only drops as games migrate. Today's baseline: 1,637 hits in 33 stylesheets, after the first seven allowlist entries (the bubbles' tails, the podium's feet and the room kept for the install bubble). Nothing changes for players. The system governs everything, La Copa included (phase 7, #1196).
- **The design system, phase 3** (D-533, #1191): the components page, `/labs/design/`, behind the lab's door: every colour token (read from `base.css` itself, so a new one appears by itself), the space, corner and text scales drawn, the four title steps, every button variant and state, chips, the folding panel, the stack, a ranking, the keyboard, and where the escapes live. Its card in the lab under ✨ Mejoras en prueba, its doc `docs/games/design.md`, its script `tools/e2e/design/page.mjs`. Found two debts of the system itself, noted in DESIGN.md §5 for the owner: the topbar's "‹ Menú" link is 40 px tall (U-10 asks 44), and `base.css` writes a few corners, paddings and sizes off its own scales.
- **The design system, phase 4** (D-533, #1192): the game shell lives once in `base.css` (screens, the cover's hero, modes, form fields and their error, the segmented control, La Copa's choice buttons, the player's row, the row with a switch, the link button, the room's code, QR, players, "or" and waiting, whose turn, the result's hero), with two new tokens (`--well` for a sunken surface, `--placeholder`); until now each game copied them from the one before. Ahorcado is the pilot: its sheet keeps only what is its own, on the tokens, and the lint reports zero on it. The lint learns three things from the usability agent's review: a token colour at an alpha is written `rgb(var(--cyan-rgb) / 0.6)`, a white surface is not ink, and a class styled only inside another is not a shared class; one hit per value per declaration. The components page shows the shell. The recipe for every later game is DESIGN.md §6.
- **The design system, phase 5, Línea de Tiempo** (D-533, #1193): the game's stylesheet drops its copies of the game shell (screens, the cover's hero, modes, fields, the segmented control, player rows, the room, whose turn, the result's hero) and keeps what is its own on the tokens; the lint reports zero on it beyond two escapes (the deck card's emoji and the solo score). The lint now also reads the size inside a `font:` shorthand, and a selector after an `@media` that ends in `@keyframes` keeps its own head; the baseline follows. For the player: the dealing selector's labels fit in one line at 390 px, the player row's ✕ is 44 px, whose turn takes the shell's size, and a few sizes moved to the nearer text step.
- **The design system, phase 5: Toque y Fama** (D-533, #1193): its stylesheet drops its copies of the game shell (screens, hero, modes, fields, segmented control, toggle and switch, room, status, choice buttons, result's hero) and writes the rest on the tokens: 51 lint hits to 0. The shell wins where the copy differed: the toggle's switch is yellow and 58 × 34 like everywhere else, each toggle sits in a field (12 px apart instead of 8); the usability agent shortened the second toggle to "Cero al inicio" / "Leading zero" / "Zero no início" so it keeps one line at 320 px like "Derecho a réplica" (U-3: before "Permitir cero al inicio" / "Allow leading zero" / "Permitir zero no início"), inputs, the segmented control and whose-turn take the shell's sizes, the lose notice reads in ink instead of a pale pink of its own. Kept as the game's own, with the reason written: the Número / Palabra buttons compact inside the hero (the first mode stays above the fold at 320×568) and the hero's emoji at 3.2 rem on a short phone and the solo result (allowlisted).
- **The design system, phase 5: Generala** (D-533, #1193): its stylesheet drops its copies of the game shell (screens, hero, modes, field, player rows, toggle and switch, room, status, result hero) and writes the rest on the tokens; the lint reports zero on it beyond one escape, the kept-die tag's 0.62 rem so "Guardado" fits under five dice at 320 px. What the player may notice: the toggle row no longer has a margin above it, the dice and the table sit on the scale's steps (a 1 px gap here, a 2 px corner there) and the final table's text takes the nearest text step.
- **The design system, phase 5: Dudo** (D-533, #1193): the second game migrated, by the recipe of DESIGN.md §6. Its stylesheet loses its copies of the game shell (screens, hero, modes, fields, player rows, toggle and switch, the room, whose turn, the result's hero) and writes the rest (the dice, the table, the bid, the reveal, the shaking cloth) on the tokens, with the ace's gold and the cloth's green as its own tokens; the lint goes from 94 hits to zero beyond two escapes (the rivals' dice glyphs at 0.62 rem and the bid's figure at 2.6 rem). Intended differences, read from the computed-styles dump at 390 and 320 px: the player row's ✕ is 44 px (U-10), the hand's panel and the big dice take 16 px corners, the dice rows' gaps and the small texts move to the nearest step, the lobby's waiting line uses the shell's `.dots`.
- **The design system, phase 5, Julepe** (D-533, #1193): the lab game's stylesheet drops its copies of the game shell (screens, the cover's hero, modes, player rows, the toggle row and its switch, fields, the room, whose turn, the result's hero) and keeps what is its own on the tokens: the playing card, the pot, the seats, the trick, the hand's close, the board; the lint reports zero on it beyond four escapes (the card's rank and suit, and the tiny card's). For the player: the player row's ✕ is 44 px, the room's waiting line gets the shell's dots, and the sizes and gaps off the scales moved to the nearer step (the pot's number at 2 rem, the seats' lines at 0.75 rem, the card's corner at 8 px).
- **The design system, phase 5, Batalla Naval** (D-533, #1193): the game's stylesheet drops its copies of the game shell (screens, the cover's hero, modes, fields, the toggle row and its switch, the room, whose turn, the result's hero) and keeps the sea, the fleet and the battle on the tokens, with its thematic colours declared once at the top of the sheet; the lint reports zero on it beyond three escapes (the cell's corners and the small board's glyphs). For the player: the setup's switches are the shell's yellow ones, whose turn takes the shell's size, and a few sizes moved to the nearer step.
- **The design system, phase 5: El Camaleón (lab)** (D-533, #1193): its stylesheet drops its copies of the game shell (screens, the cover's hero, player rows, the form's error) and writes the rest (topics, the secret card, the word grid, the table, the points) on the tokens: 20 lint hits to 0 beyond one escape, the chameleon's reveal at 5 rem. What the player may notice, read from the computed-styles dump at 390 and 320 px: the player rows take the shell's look (a sunken row with the name inline, the number in Bangers, rows 6 px apart instead of 10), the lizard is 4.2 rem like every cover and the end's pops in, its glow is the lime token instead of a green of its own, the grid keeps the board's 28 px of air before the step panel instead of 40 (D-309), the topic name and the cells' side padding moved to the nearer step.
- **The design system, phase 5: Cuarto Rey** (D-533, #1193): its stylesheet drops its copies of the game shell (screens, the cover's hero, player rows, the form's error, the handoff's scrolling) and writes the rest (the card, the table, the seats, the mini-games, the ranking, the history) on the tokens, with the king's gold and the card's drop as its own tokens; the lint goes from 88 hits to zero beyond three escapes (the countdown, the final crown and the handoff's glasses, compacted so the buttons stay on screen). Intended differences, read from the computed-styles dump at 390 and 320 px: the player row takes the shell's well with the name typed straight into it (no box inside the row), the cover's crown takes the shell's icon size (4.2 rem) and glow, the cards' corners and paddings, the seats' and ranking rows' paddings and the small texts move to the nearest step, and the unused confirmation modal's rules are gone.
- **The design system, phase 5: Stick Ninja (lab)** (D-533, #1193): `labs/stick/style.css` drops its copy of the shell's link button and is written on the tokens, 47 lint hits to 0 beyond two escapes (the cover's 🥷 at 2.2 rem, the black of the canvas' fade mask); the pause's word takes `.display--lg`. For the player: the night's corner is 16 px, the streak chip and today's runs 1 px taller, the result's stamp one step larger, a few sizes on the nearer text step.
- **The design system, phase 5: La clave (lab)** (D-533, #1193): `labs/code/style.css` drops its copies of the shell's link button and `.btn`, renames a card's stroke from `.seg` (the shell's segmented control, which leaked onto the SVG lines) to `.trazo`, and is written on the tokens, 37 lint hits to 0 beyond four escapes (the heroes' emoji, the opened code). For the player: the board's corner 16 px, a card 2 px shorter, the "wrong" notice in the brand's pink, a few sizes on the nearer text step.
- **The design system, phase 5: Dominorama (lab)** (D-533, #1193): `labs/dominorama/style.css` drops its copy of the shell's link button and is written on the tokens, 37 lint hits to 0 with no escape; the dominoes' colours are its own `--dm-*` tokens. For the player: cells and rule diamonds with 8 px corners, the broken rule in the system's red, the "wrong" notice and the given-up stamp in the brand's pink, the stamp one step larger.
- **The design system, phase 5: Números explosivos** (lab, D-533, #1193): its stylesheet drops its copy of the shell's link button and writes the board, the explosions, the action bar and the result on the tokens; 36 lint hits to 0 beyond two escapes (the title's bomb emoji and the demo's «¡Limpio!»). For the player: the error colour is the system's red instead of a pale pink, the lit ➕ is orange, the stamp and the small bomb take the nearer text step, and a few corners move 1 or 2 px to the scale.
- **The design system, phase 5: Aletazo** (lab, D-533, #1193): its stylesheet drops its copy of the shell's link button and writes the stage, the HUD, the cards, the countdown and the pause on the tokens; 34 lint hits to 0 beyond one escape (the 🐤 and the short-phone title, sized so 🐤 Jugar stays in view at 320×568). For the player: the pause title takes a title step, and the steps, the stamp, the lives and the notices take the nearer text step.
- **The design system, phase 5: Stack** (lab, D-533, #1193): its stylesheet drops its copy of the shell's link button and writes the cover, the heading, the tower's notices, the pause and the result on the tokens; 22 lint hits to 0 beyond two escapes (the cover's 🗼 and the last word over the tower). For the player: the pause title takes a title step, and «Perfect ×n», the stamp and the heading's 🗼 take the nearer text step.
- **The design system, phase 5: the lab's experiments bar** (`labs/experiments.css`, D-533, #1193): written on the tokens, 5 lint hits to 0; its dark surface is its own token. For the owner: the bar's corner is the panel's 22 px (was 30, so the wrapped many-row bar on the home page keeps its shape), the pressed and ticked pills' text is the system's ink on yellow (the same colour).
- **The design system, phase 5: Tren en Vilo's lab sheet** (D-533, #1193): `labs/bridges/style.css` is written on the tokens, 52 lint hits to 0 beyond two escapes (the cover's train at 2.3 rem, a plank's 3 px corner); the wood, steel and gauge colours are its own `--tv-*` tokens. Nothing changes for players: the game's page uses `cup/games/bridges/style.css`, and the two lab sheets that read this one look the same.
- **The design system, phase 5: Rutas rotas** (D-533, #1193), the first of La Copa's mini-games: its sheet is written on the tokens (24 lint hits to 0, no escape), the board's night, drop and soft red as its own tokens. What the player may notice: the three buttons' label and the stamp take the nearer text step (0.92 → 0.9, 1.3 → 1.2 rem), the solved notice too (1.15 → 1.1 rem), and the small drawing's selection corner is 8 px.
- **The design system, phase 5: Babel** (D-533, #1193): La Copa's tower is written on the tokens (22 lint hits to 0 beyond six allowlisted escapes: the messages over the tower, the end strip's offsets, the masks), its own colours as three tokens. What the player may notice: the 🗼 by the title, the pause's line and the music credit take the nearer text step (2.2 → 2, 1.05 → 1, 0.78 → 0.75 rem).
- **The design system, phase 5: Shinobi** (D-533, #1193): its sheet is written on the tokens (33 lint hits to 0 beyond two allowlisted escapes: the pause's title, the masks), its two shadows as its own tokens. What the player may notice: the night's corner is 16 px (was 18), the streak chip 1 px taller, and the logo, lives, pause line, achievement banner and stamp take the nearer text step.
- **The design system, phase 5: Loteo** (D-533, #1193): its sheet is written on the tokens (40 lint hits to 0 beyond one allowlisted escape, the demo's «¡Listo!»), its board's night, shadow, ink and two reds as its own tokens; the plots' colours are untouched. What the player may notice: a 1 px rounder corner on a small board's plots and the nearer text step for the board's number, the size chip, the stamp and two notices.
- **The design system, phase 5: Tren en Vilo** (D-533, #1193): its sheet is written on the tokens (40 lint hits to 0 beyond one allowlisted escape, a plank's 3 px corner), the meter, planks, steel and warnings as its own tokens with their values unchanged. What the player may notice: 1 px more between planks and inside the meter, the summary's bar fully rounded, and the nearer text step for the stage title, the load line, the stamp and the small notes.
- **The design system, phase 5: Agentes** (D-533, #1193): its sheet is written on the tokens (43 lint hits to 0 beyond one allowlisted escape, the clue's word); the four clue colours are untouched and `palette.test.mjs` still passes, the assassin, reds, flash and stamps' night are its own tokens. What the player may notice: the clue panel's corner is 16 px, the stamps' padding 1 px more at top and bottom, and the nearer text step for the 🔍, the stamps, the demo and a card's clue line.
- **The design system, phase 5: Pintaminas** (D-533, #1193): its sheet is written on the tokens (58 lint hits to 0, no escape), the board's ink, reds, drops and the lever's metal as its own tokens, the paintings untouched. What the player may notice: rounder cells and a 1 px wider gap on the small boards, a 16 px corner on the hard-mode switch, and the nearer text step for the brush, the numbers, the brushes' labels, the buttons and the stamp.
- **The design system, phase 5: the rankings** (D-533, #1193): `ranking.css` writes its last five token colours as tokens and its two off-scale paddings on the scale (7 lint hits to 0), every colour unchanged. What the player may notice: a ranking row 1 px taller (8 px padding) and, at 360 px or less, 1 px more on each side of the ranking's tabs.
- **The design system, phase 5: the recap's table** (D-533, #1193): `recap.css` (the ended cup's and the season's table) is written on the tokens (8 lint hits to 0); the climb's green and the image's drop are its own tokens, every colour unchanged. What the player may notice: the table's text at 0.9 rem (was 0.95 on a computer, 0.88 on a phone), its headings and the ▲▼ at 0.75 rem (were 0.72, 0.8 and 0.74).
- **The design system, phase 5: the month-end window** (D-533, #1193): Uno al día's `month-end.css` is written on the tokens (25 lint hits to 0 beyond eight allowlisted escapes: the rays' and medal's geometry, the room for the ✕, the rays' mask and the place's figure); the veil, the medal's drop and the card's inks are its own tokens, every colour unchanged. What the player may notice: the card's corner is 22 px (was 26) with 2 px more on top, and the kicker (0.78 → 0.75 rem) and «Ver la tabla» (0.95 → 0.9) take the nearer text step.
- **The design system, phase 5: the line and the hand** (D-533, #1193): `linea.css`, shared by Línea de Tiempo and ⏳ Línea Relámpago, is written on the tokens (51 lint hits to 0 beyond one allowlisted escape, the Colocar bar's fade into the shell's night as a fixed value); its drops and the wrong card's red night are its own tokens, every colour unchanged. What the player may notice: the events, slots and the card in the air 1 px taller, and the nearer text step for the hand's title, a hand card, the years, the verdict card's emoji and text, the card in the air's text, the why and the fact.
- **The design system, phase 5: the keypad** (D-533, #1193): `teclado.css`, shared by Toque y Fama and La Copa's 🔢 and 🔤, is written on the tokens (29 lint hits to 0); its drop, the ruled-out row and the ink on a lime chip are its own tokens, every colour unchanged. What the player may notice: the keypad's digits one step smaller (1.7 → 1.6 rem; the keys stay at least 58 px), Probar one step larger, ⌫ and the block hint one step smaller, and a board's rows and clue chips 1 px taller.
- **The design system, phase 5: the splash** (D-533, #1193): `splash.css` is written on the tokens (58 lint hits to 0 beyond twelve allowlisted escapes: the window's night as a fixed value, the hero emoji, the room for the ✕, the cartridges' pixel type and shape); the veil, drop, clip screen and cartridges are its own tokens, every colour unchanged. What the player may notice: the window's corner is 22 px (was 26) with 2 px more at its foot, a game's corner 16 px (was 18), and the nearer text step for the ✕, the kicker, a game's name and text, Play, the title on a short phone (1.9 → 2 rem), the emoji on a short phone (1.7 → 1.6) and the cartridges' sticker and text.
- **The design system, phase 5: `base.css`** (D-533, #1193): the shell's own sheet is written on its tokens (73 lint hits to 0 beyond two allowlisted escapes): 67 token colours by hand become the token or `rgb(var(--x-rgb) / a)`, every value unchanged; the chat and support sheets keep the night as fixed values, since three pages redeclare `--bg1…3` and a token would retint them (the owner's call). What the player may notice: in the chat, 1 px more inside the messages, the input and the unread badge and between messages; the install bubble's corner is 22 px (was 20).
- **The design system, phase 5: the owner's panel** (D-533, #1193): its sheet is written on the tokens (102 lint hits to 0 beyond six allowlisted escapes: the sign-in 🔐, the hour chart's labels and bar corners, the legend swatch, two offsets sized by other elements), its rows' wells, the kinds' tabs and the Quick look's frame as its own tokens, its copies of `.screen`, `.intro-hero`, `.panel` and `.chips` scoped to the page. What the owner may notice: the tiles' corner is 16 px (was 18), a few paddings 1 px more, and the nearer text step for the small labels, the room codes, the bars and the campaign texts.
- **The design system, phase 3b: the full-screen pieces** (D-533, #1200): the components page in the lab shows each overlay of `base.css` in a phone-sized frame, with its real markup: pass the phone with a good and a bad verdict, the cover, the countdown, the bottom sheet open, the room chat's bubble and its sheet, the random-game die, the One-a-day card and the footer's tiles; `.ds-marco`, in the page's own stylesheet, pins each one to its frame instead of the window. Nothing changes for the player.
- **The topbar's «‹ Menú» and the on/off switch are 44 px to the finger** (D-533, U-10): `.back` (drawn 40 px) and `.switch` (34 px) grow their tap area with an invisible band, so nothing on screen moves; the components page's check now measures that band and no longer leaves them out, and both leave DESIGN.md §5.
- **Generala's final table names every box** (D-533): at 320 px «Doble generala» (and «Double generala», «Four of a kind», «General dupla») ended in "…"; the name column now wraps between words onto a second line, that row a little taller, and the score columns keep their width for six players.
- **Ahorcado's lives on one line** (D-533): at 320 px «Normal · 6» was the only one of the three to break after the dot; the control (`.seg--lives`) no longer wraps its labels, so the three read alike, each as wide as its label; at 390 px nothing changes.
- **Números explosivos' errors are easier to read** (lab, D-533): the notice of a pair that doesn't join, the armed "Give up" and a bad stamp were `--red`, about 3.5:1 on the page's night; they are the game's own `--ne-mal` (#ff8a8a, the soft red Loteo and Rutas rotas use for alerts), about 7:1. The shaking number's border keeps `--red`.
- **A faint line is not a placeholder** (D-533): Rutas rotas' and Loteo's stage dots drew their empty ring with `--placeholder`, the token for an input's placeholder; `base.css` gains `--line-faint` (white at 35 %, the same value, documented in DESIGN.md §1) and the dots use it. Nothing changes for players.
- **Pintaminas' hard-mode switch glows on tokens** (D-533): its four flickering colours were `rgba(r, g, b, calc(…))` with raw numbers, which the design lint did not see; they are `rgb(var(--cyan-rgb|--pm-chispa-rgb|--yellow-rgb) / calc(…))`, the same colours and alphas, and the lint now flags an `rgba()` whose alpha is a `calc()` (with its test). Nothing changes for players.
- **A test against half-solved merges**: `tools/agents/conflict-markers.test.mjs` fails, in the `tests` check, when a tracked text file has a line starting with `<<<<<<< ` or `>>>>>>> `, or one that is exactly `=======` (binary files skipped). Nothing changes for players.
- **Toque y Fama: «Probar» fits its key at 320 px**: the design system put Probar one step larger (2 rem), and on a 320 px phone the word filled its 89 px key edge to edge, the slanted letters spilling over (in Spanish, English and Portuguese). Under 375 px it takes the next step down (`--fs-160`); at 390 px nothing changes. Shared by La Copa's 🔢 and 🔤.
- **Loteo's engine test, steady under load**: `plots/engine.test.mjs` bounded how long a board takes to build with a stopwatch (400, 1000 and 2500 ms), which a busy machine stretched, so it failed now and then when many tests ran side by side. It now bounds the work instead, counted by the engine (`trabajo`: candidate boards checked and the solvers' search steps), the same on every run, at about twice what today's boards need. Nothing changes for the player.
- **The design system, phase 7: La Copa, the exact copies** (D-533, #1196, PR 1 of docs/design/cup-unification.md): `cup/style.css` drops its copies of the game shell (screens, fields, the form's error, the segmented control, the result's hero) and 🔍 El caso's scene moves to its own `cup/games/case/style.css`, loaded with its code (D-468); the cup's lint hits go from 309 to 226 (El caso's 70 now counted in its own sheet). For the player: field labels and inputs take the shell's sizes, the join screen's "Soy nuevo / Ya estoy inscrito" fit in one line at 320 px, and the result's trophy is the shell's 4.2 rem. The owner declined the analysis's PRs 6 and 7 (2026-11-05): "Volver al menú" stays, and the cup's colours keep their meaning.
- **The design system, phase 7: La Copa's switches and chips** (D-533, #1196, PR 2): the create screen's 🏁 final uses the shell's row with a switch (the yellow 58 × 34 one of every game), and the three pill toggles of La Copa (the name to sit as, the week's styles, the length shortcuts) are one choice chip in `base.css`, `.chip-btn`, yellow when chosen; the final's ×2 is `base.css`'s `.chip--cyan`, the same colours (D-151). For the player: the chosen name on the join screen is outlined in yellow instead of cyan, the chips share one size, and the 🏁 switch looks like the other games'.
- **The design system, phase 7: La Copa's variants in the shell** (D-533, #1196, PR 3): what La Copa wrote for itself on top of a shared control lives in `base.css` now, for every game: the PIN field with its 👁, the character counter, the date field, the inline link, the danger buttons (`.btn--danger`, red to confirm deleting a cup, soft pink as a ghost to silence the notifications, with `--edge-red` and `--danger-soft`) and the red-framed panel, the button row that wraps, the sheet's head and the dark emoji's outline on a cover; the cup's copies of the choice buttons and the link button are gone. Every colour keeps its value. For the player: the covers' emoji are a touch bigger (the shell's 4.2 rem), "Reportar un problema" reads at 0.95 rem, and the Uno al día "Silenciar" on the home page now has the soft pink it had in La Copa.
- **The design system, phase 7: notices, the snackbar and waiting** (D-533, #1196, PR 4): La Copa's notices (the line under a mini-game, "¡Lo lograste!", a missing player) and its floating "Copiado" are components of `base.css` every game can use, `.notice` (`--good`, `--bad`) and `.snackbar`, and its waiting screen with Retry and a way home is the shared `showWaiting()` (`assets/js/waiting.js`); the components page shows them. Every colour keeps its value; the waiting line has 2 px more room.
- **The design system, phase 7: one how-to-play block** (D-533, #1196, PR 5): La Copa's own rules block, the rules folded under a Cup game's board, is the shared folding panel every home game uses for "🧠 Cómo se juega", and the covers' how-to-play are that same panel, still open on the cover as before. For the player: under the board the rules are a glass panel with the title at the left, in ink, with the ▾; on a cover the title reads "🧠 Cómo se juega" and the block can be folded.
- **The design system, phase 7: La Copa on the tokens** (D-533, #1196): `cup/style.css` is written on the tokens (185 lint hits to 0 beyond two allowlisted escapes, the podium's feet and the day card's emoji); what has no token is La Copa's own `--cp-*`, every colour unchanged. What the player may notice: the nearer text step in the table's day blocks, its legend and the ×2 chip, Tus días' emoji, the week's game names, the length's − / + and number, the words' keypad and the clocks; the day blocks' and the rules' diagrams' corners 8 px; a few gaps 1 or 2 px wider.
- **The design system, phase 7: 🔍 El caso on the tokens** (D-533, #1196): `cup/games/case/style.css` is written on the tokens (70 lint hits to 0 beyond three allowlisted escapes: the bubble's tail, the stamp, a suspect's trade); the criminal's pink, the verdict buttons and the cards' back are its own `--cs-*`, every colour unchanged. What the player may notice: the nearer text step for the clues, the grid's labels, a card's emoji and the 🔍 by the title, and 1 px more inside the cards and between the clues.
- **The folding panel's title is 44 px to the finger** (D-533, U-10): the summary of `details.panel` («🧠 Cómo se juega» and every folding panel) was only its text's height, about 25 px; an invisible band grows its tap area to 44 px, as `.back`'s and `.switch`'s, so nothing on screen moves; the components page's check and the usability agent's `look.mjs` (now counting every `<summary>`) measure it, and it leaves DESIGN.md §5.
- **The design system, phase 6: the lint is a gate** (D-533, #1188): every stylesheet is on the tokens, so `design-lint.test.mjs` (the `tests` check) now fails on any hit not in `docs/design-allowlist.json`, and `node tools/agents/design-lint.mjs --gate` is the same check locally; the ratchet, `docs/design-baseline.json` and the `baseline` subcommand are gone. A new game's stylesheet passes the gate (ADD-GAME.md). Nothing changes for players.
- **Two taps to 44 px, the splash's ✕ off the corner** (U-10): La Copa's create screen «Cambiar» (the time zone) grows to a 44 px tap area with an invisible band, as `.back`'s, so nothing on screen moves; the splash's ✕ (every campaign, and the recap that shares it) sits 12 px from the window's edges instead of 8, clear of its rounded corner at 320 px. La Copa Reinas' cells stay under 44 px at 320 px: an 8-column board cannot fit 8 × 44 px there.
- **Board cells are an exception to the 44 px tap size**: an 8×8 board (Reinas) fits about 35 px cells at 320 px, so the owner made board cells a documented exception (DESIGN.md §4). Cells carry `data-cell` and `look.mjs` skips them; nothing changes for players.
- **README screenshots of La Copa retaken after its move to the tokens** (C-13): the eleven `copa` shots and the five Plots and Paint Mines shots of `cup-new-games`, taken offline and looked at on the contact sheet; the README resealed.
- **A token colour at an alpha draws on older browsers too** (D-533): the design system wrote it as `rgb(from var(--cyan) r g b / 0.6)`, which browsers before Chrome 119, Safari 16.4 and Firefox 128 drop, so those translucent fills, borders and shadows did not draw. Each colour token used that way now has its channels next to it (`--cyan-rgb: 46 230 214`), and the 537 uses in 32 stylesheets are `rgb(var(--cyan-rgb) / 0.6)` (Chrome 65, Safari 12.1); the sheets that redeclare a token (Pintaminas' hard mode, two labs' backgrounds) redeclare its channels on the same line. `tokens-rgb.test.mjs` keeps each pair in sync, and the design lint flags the relative-colour form. Computed colours are identical on 37 screens at 390 px.

## 1.1.1 — 2026-11-04
- **Aletazo (lab): the cover's bird flies like a player.** The demo behind the cover flaps and falls with the
  game's own gravity, planning each flap so it never touches a hoop, instead of gliding on a set path.
- **Aletazo (lab): the time of day changes every 20 points**, not 30: day, afternoon at 20, night at 40.

## 1.1.0 — 2026-11-04
- **🐤 Aletazo, a new one-tap game in the lab's Juegos en prueba** (`/labs/flap/`), inspired by Flappy Bird (Dong Nguyen), credited on the cover: every tap is a wing flap that lifts the bird, gravity brings it down, and it flies through neon hoops (dead center counts double, with a small Shinobi-style celebration) and the single opening of walls, past spinning spikes. A new level every 5 gates, each one faster and tighter; 3 lives; a simple ending with a line about how it went. In Spanish, English and Portuguese. The owner's changes after trying it on the PR preview: the classic 3, 2, 1… ¡A jugar! with the bird flying blurred behind it, then «👆 Toca para aletear» until the first tap; on the cover the demo flies above the card, Jugar is yellow and comes after the language toggle, the title's last O is no longer clipped, and on a short phone the steps fold under «Cómo se juega ▾».

## 1.0.4 — 2026-11-03
- **Rainbow titles no longer cut their last letter**: the slanted display font ran past the box the gradient is painted in, so a final letter (the O of ALETAZO) came out clipped. The right padding each game added to its own title now lives once in `.rainbow` in `base.css`, so every title, present and future, gets it.
- **La Copa's end-to-end test no longer fails after 21:00 in Los Angeles**: it moved the clock a fixed day and three hours to reach day 1, which after 21:00 in the cup's zone landed on day 2 (the reminder and the grace day then failed). It now moves to 03:00 on the start day, whatever the hour it runs.

## 1.0.3 — 2026-11-03
- **The panel's timeline names who saw a campaign** more often: a phone that entered a Cup with its player link or by picking its name (not by joining it) now gives that name, and so does the rankings name, instead of "Someone".

## 1.0.2 — 2026-11-03
- Owner panel, **Today** range: the cards no longer show a percent against yesterday (a partial day against a whole one always read as a drop); they show yesterday's whole-day number instead, with no verdict.

## 1.0.1 — 2026-11-03
- **🥷 Shinobi moves to La Bodega**: it is already published for everyone, so its /labs/ card leaves 🎲 Juegos en prueba for ✨ Mejoras lanzadas as 🚀 Lanzado, keeping its switch.

## 1.0.0 — 2026-11-03
- **Juegos de Salón 1.0** 🎉: the site is mature enough to leave the 0.x versions. From now on a new game or feature raises the middle number, and fixes the last one (D-530).
- Versions: `changelog.mjs` suggests each PR's level from what it changes (a new game or a lab feature out for everyone is a minor, the rest a patch) and warns when an entry picks another.

## 0.247.11 — 2026-11-03
- CONTRIBUTING.md: path for invited collaborators (no fork), a language section, a checklist before opening the PR, and where to ask questions.

## 0.247.10 — 2026-11-03
- **Old worktrees clean themselves up again**: a merged worktree whose only leftovers are regenerated screenshots, promo video renders or splash teasers is now removed at session start, instead of piling up (24 had).

## 0.247.9 — 2026-11-03
- Usability round of 2026-11-03: marketing review recorded (the promo video still predates the new home page cards; the other assets are up to date). Nothing changes for players.

## 0.247.8 — 2026-11-02
- **Labs**: the 🧪 Ribbon de tester card, already on for everyone, moves to La Bodega under ✨ Mejoras lanzadas.

## 0.247.7 — 2026-11-02
- **🥷 Shinobi: a stick too short falls.** It no longer hangs in the air over the gap: with nothing under its tip it swings on down into the gap, and the ninja runs to the pillar's edge and drops after it.
- **🥷 Shinobi: from night to day.** Every 15 points the sky moves on: the night turns to dawn with the moon setting and the sun rising behind the mountains, then the morning, and from 45 points the full day.
- **🥷 Shinobi: a rope that looks like rope.** After a lost life the grapple's rope flies with soft bends, and the ninja climbs it hanging out in the gap, away from the pillar's wall.
- **🥷 Shinobi: a moving pillar no longer jumps after a fall.** It keeps sliding through the fall and the climb back, from where it was.

## 0.247.6 — 2026-11-02
- **🗼 Babel's lab card moves to La Bodega** (✨ Mejoras lanzadas, 🚀 Lanzado): the owner already published it for everyone from /labs/; the card keeps the play button, the Ketchapp credit and the English prototype.

## 0.247.5 — 2026-11-02
- **Tester ribbon, for good**: it no longer depends on its lab flag; every tester key shows it on every screen, and the home page no longer asks the flag itself (with the flag on *all* it would have shown the ribbon to players without a key). The old «tester» chip on the home page goes.

## 0.247.4 — 2026-11-02
- **🗼 Babel**: a lab key's «Simular final» no longer counts as a game played: it sends no usage signal to the panel, does not use up the Uno al día attempt and saves nothing.

## 0.247.3 — 2026-11-02
- **Home page order**: games are sorted again by how often they were finished in the last four weeks.

## 0.247.2 — 2026-11-02
- 🔴 PRs: the owner's Yes now also merges the PR once `tests` and `end-to-end` pass, publishes the site, and closes its approval issue. Before, an approval only turned the check green: the PR waited for someone to merge it, and six approval issues were left open after their PRs merged.

## 0.247.1 — 2026-11-02
- **Shinobi and Babel** keep the «Nuevo» label 10 days from their launch, until 2026-11-11 (the owner's request); a game can now set its own length with `diasNuevo`.

- Tests: the cup store's clock test jumps to day 3 from its window, so it no longer fails late in the evening.

## 0.247.0 — 2026-11-01
- **Bug reports start with a failing test** (D-527, #1090): `feedback.mjs repro` records the test that reproduces a 🐞 bug, and `reply` refuses a bug report without one or a `--no-repro` reason; Shinobi's doubled ninja (#1103) is the first example.

## 0.246.0 — 2026-11-01
- **Labs**: each flag in the lab counts how much testers really use it (aggregate, no player data), and an hourly job marks its /labs/ card **✅ Listo para 🚀** with the numbers once it passes the bar (5 finished uses, 2 keys, 3 days, no errors); the owner still publishes it. Behind its own flag `lab-ready` (D-528, #1089).

## 0.245.2 — 2026-11-01
- **Scheduled launches:** a launch workflow switches flags and splash campaigns at a set hour, as the /labs/ cards and the panel do; Shinobi, Babel and their splash go live at 00:00 Pacific on 2026-11-02 (D-529).

## 0.245.1 — 2026-11-01
- 🧪 Labs (flag `tester-ribbon`): the tester ribbon is on every screen, not only the home page and Babel. It hides while a game is being played, unless that screen has a test control.

## 0.245.0 — 2026-11-01
- **Uno al día** tells the best Babel and Shinobi players apart: instead of cutting at 100, their points go through a soft curve (50 → 46, 100 → 71, 200 → 92), and the result says what the game counts there (D-526).

## 0.244.1 — 2026-11-01
- **Shinobi**: the result screen no longer shows the ninja twice; the score is just the number under the title.

## 0.244.0 — 2026-11-01
- **Babel** pays streaks on top of height: 1 point a floor, +3 for each streak of 3 or more perfects, and +1, +2… up to +5 for each perfect that makes the streak longer. **Babel and Shinobi** no longer stop at 100; La Copa still ranks the day by position, and caps at 100 only in the Grand Final and Uno al día. Scores already saved are kept (D-525).

## 0.243.0 — 2026-11-01
- 🧪 Labs (flag `tester-ribbon`): testers get a ribbon on the right edge, under the top bar, with a shimmering T. Opened, it has the tester sheet (i), a link to Labs and the screen's test control (Simular final in Babel), with a red dot on the folded T where the screen has one; elsewhere only the sheet and Labs. It replaces the home page's «tester» chip and Babel's 🧪 tab while the flag is on.

## 0.242.3 — 2026-11-01
- **La Copa's home card no longer offers a day you just played.** Going back to the menu after a cup day brought the page as it was before (the browser's back cache), still saying ▶ Jugar el día N; the card is now drawn again from what La Copa kept, and checked with the server, when the page comes back or is shown again.

## 0.242.2 — 2026-11-01
- **The language switch shows only flags**: the ES/EN/PT text is gone, so it takes less width; the language name is still read aloud and shown on hover.

## 0.242.1 — 2026-11-01
- **Lab**: the "La Copa: your cup, your place and the day's game on the home page" card moves to La Bodega as 💤 No prosperó, as the owner asked from /labs/ (D-511). Nothing changes for players.

## 0.242.0 — 2026-11-01
- 🏆 **La Copa, the length and the time zone chosen by the admin** (in the lab, flag `copa-crear`, D-521): the new create screen asks when it starts first, then how long with − n days + (3 to 14, shortcuts for 3, 7 and 14), the 🏁 Grand Final a switch from 5 days, and a warning on long cups. The final plays 5 of the cup's games at random. The zone of the cup follows the audience (Chile's time for 🇨🇱) or the admin's phone, with **Cambiar**; a player in another zone sees the closing times in their own hours. The database rules take cups of up to 14 days (publish them on merge).

## 0.241.15 — 2026-11-01
- **Lab**: the 🥇 Uno al día month-end place card moves to La Bodega under ✨ Mejoras lanzadas, already live for everyone.

## 0.241.14 — 2026-11-01
- **A lab 🚀 / 📦 PR with red checks no longer waits forever**: the Mac mini's `lab-publish-watch` treated only a conflict with `main` as stuck, so #1099 sat for hours with `tests` and `end-to-end` red. Red checks that last 15 minutes now send the same fixing session (merge `main`, rerun what was flaky, fix what the branch broke), at most twice per request, and the card fails with Volver a pedir if it does not take (D-486).

## 0.241.13 — 2026-11-01
- **La Copa's «Crea o únete a una Copa» button matches One a Day's «Únete al mes»** (in the lab, flag `copa-contexto`): the invite keeps the plain yellow pill; only the ▶ to play a day stays louder.

## 0.241.12 — 2026-11-01
- **La Copa's home card** (lab, flag `copa-contexto`): with a cup saved before the place and the games were, the day bar showed empty and the card had no text; now the bar fills the card and it says «Día 4 de 7. Hoy: Reinas.», the game read from the cup's calendar.

## 0.241.11 — 2026-11-01
- **Filtering the home page hides Uno al día**: with a kind of game or a search on, only the games that match are shown; "Ver todos" brings the card back.

## 0.241.10 — 2026-11-01
- A 🔴 PR now opens with five plain lines for the owner (what changes, worst case, can it be undone, risk, recommendation), so approving or rejecting is one simple read (docs/LANES.md).

## 0.241.9 — 2026-11-01
- **Uno al día**: on the first day of a month, the month's ranking no longer says "nobody yet" while the card above says you are #1: your own row shows with today's points until the hourly count catches up.
- **Uno al día**: the ranking's Today tab says its points are the game's alone; the streak bonus is added in Month.

## 0.241.8 — 2026-11-01
- 🧪 **«tester» tag on the home page**: with a lab key, a subtle «TESTER» sticker on the title's corner, out of the page's flow so nothing moves (the same word in
  every language) opens a sheet saying what the key gives: /labs/, what is in testing already on, and how to
  comment; with «🧪 Ir a Labs». Everyone else sees the title as before (`public/assets/js/tester-badge.js`).

## 0.241.7 — 2026-11-01
- 🧪 **Babel's music joins Babel's /labs/ card**: no separate «Babel con música» card or flag; the music is behind
  Babel's own flag `stack`, so it launches with the game.

## 0.241.6 — 2026-11-01
- 🧪 `tools/e2e/cup/tournament.mjs` no longer fails on the day summer time ends (a 25-hour day, as
  2026-11-01 in Los Angeles): its advanced clock adds three hours to reach tomorrow's day 1 and the cup's end.

## 0.241.5 — 2026-11-01
- 🚀 **Publishing works again**: every Publish run since the merge lanes (D-519) failed to start, because
  `tests.yml`'s new `lane` job asks for more permissions than `publish.yml` granted it. The site stayed
  at the 2026-11-01 03:51 UTC version; this grants them, and the next merge publishes everything waiting.
- 🧪 `public/cup/store.test.mjs` no longer fails on the day summer time ends (a 25-hour day): the
  advanced clock moves two days and two hours, not two plain days.
