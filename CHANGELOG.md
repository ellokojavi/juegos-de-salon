# Changelog

## 0.234.20 — 2026-10-29
- **Titles no longer flash in another font**: every page preloads Bangers, the titles' font, next to Nunito, so the title shows in its own font from the start instead of switching a moment later.

## 0.234.19 — 2026-10-29
- La Copa: the day's result screen now loads on its own the first time it opens, so the Cup starts a little lighter (#860).

## 0.234.18 — 2026-10-28
- La Copa: the join screen (sign up or sit back down) now loads on its own the first time it opens, so the Cup starts a little lighter (#860).

## 0.234.17 — 2026-10-28
- **La Copa loads lighter for players**: the create-a-Cup screen (the week, the weekend and the picked games) is now its own file (`cup/create.js`), fetched only when someone creates a Cup; everyone who only plays one downloads about 500 lines less. Nothing changes on screen (#860).

## 0.234.16 — 2026-10-28
- **Lab (night totals, D-500): One a Day's month ranking agrees with your big number**: your row in the Month and Friends tabs on /today/ now includes today's points that the hourly count has not added yet, and moves to the place those points give it, so it shows the same total as the big number and the "te faltan" line.

## 0.234.15 — 2026-10-28
- **A cleaner panel header**: the environment is always Live and has no selector, the room or cup
  code search is gone, the 📊 chip is an icon, and 🔔 is an icon in the top bar next to the owner's
  photo, dim until this device is on, with its short messages fading after a few seconds.

## 0.234.14 — 2026-10-28
- **"New" lasts a week** (D-507): a game wears the "New" label for seven days after launch instead of fourteen, so the home page only marks Tren en Vilo today.

## 0.234.13 — 2026-10-28
- **The panel's 🔔 turns on**: it was refused (PERMISSION_DENIED) when the phone's clock ran a little
  ahead of Firebase's, since the rules ask the record's time to be no later than now; the time is now
  the server's.

## 0.234.12 — 2026-10-28
- **La Copa's demos can play ¿Dónde queda?**: it was in the pool of games without demo scores, so a demo Cup that drew it would have broken; the new manifest check found it (#855, phase 6).

## 0.234.11 — 2026-10-28
- **Merges go live faster**: publishing retests only what main gained since the PR passed, runs no longer queue behind each other, a Pages 5xx is retried, and `docs/facts.json` no longer carries the version that made open PRs conflict (D-506).

## 0.234.10 — 2026-10-28
- **Which games La Copa can play lives in each game's entry**: a game's place in the pool an admin picks the days from is now `copa: { pozo }` in `games.js`, and `cup/engine.js` builds the pool from there in the same order, so no Cup changes (#855, phase 4).

## 0.234.9 — 2026-10-28
- **☀️ Tango: 🏳️ Give up**, as in Queens: it asks to confirm, shows the solution and the game gives 0 points.

## 0.234.8 — 2026-10-28
- **The home page shows your One a Day place right after you play**: coming back from today's game (with "back" or the menu) no longer shows ▶ Jugar hoy, whose tap rolled the die again; the card shows the month's place and points.

## 0.234.7 — 2026-10-28
- **☕ Buy me a coffee counts real payments only**: the panel's "paid" now needs Stripe's payment id in the way back (`?support=thanks&session=…`), counted once per device; without it the thank-you does not open, so a reopened tab or a typed address neither thanks anyone nor shows as a payment. The false "paid" of Oct 26 2026 was removed from the stats.

## 0.234.6 — 2026-10-28
- 🎃 Halloween: the big frights are now part of the Halloween skin for everyone, a different one every 40 seconds on the home page (💀, 🕷️, 👀 or 🧟, never the same twice in a row).

## 0.234.5 — 2026-10-28
- **A teaser engine for the splash**: the rules for a teaser that builds expectation without giving
  the game away (`marketing/splash/TEASERS.md`), the engine every teaser runs on
  (`marketing/splash/teaser/_teaser.js`), and `teaser.mjs new <name> <game>` to start one. Stack's and
  Stick Ninja's teasers now run on it, looking the same; a test checks the rules it can.

## 0.234.4 — 2026-10-28
- **Times show the same everywhere**: every clock and best time now uses one minutes:seconds formatter (`assets/js/time-format.js`), so a time over an hour reads `1:02:10` on every page instead of `62:10` on some (#860).

## 0.234.3 — 2026-10-28
- **La Copa loads a little lighter**: the admin screen is now its own file (`cup/admin.js`), fetched only when the Cup's admin opens it, so players who never manage a Cup don't download it. Nothing changes on screen (#860).

## 0.234.2 — 2026-10-28
- **The 🧱 Stack and 🥷 Stick Ninja teasers are cryptic now**: they no longer show how the games are
  played. The view circles a tall tower already built and climbs it into the stars ("Llegar al cielo es
  el objetivo"); the ninja runs to the edge of its pillar and stays there looking at the next one ("El
  ninja enfrenta una misión nunca antes vista"). Both still off, waiting for the owner.

## 0.234.1 — 2026-10-28
- **Which games come out in Uno al día lives in each game's entry**: the date a game joins the daily deck, the day it leaves and whether it is a group game are now `unoAlDia` in `games.js`, and `uno-al-dia.js` builds its list from there, in the same order, so no day's game changes (#855, phase 3).

## 0.234.0 — 2026-10-28
- **The owner is notified when a change goes live** (D-504): the panel's 🔔 subscribes a device, and
  each publish sends it `✅ v<version> en vivo · PR #<n>` with what launched and one tap to where it is
  seen (📣 Campaigns at that campaign, the lab, the game…), or `❌` with the run if it did not publish.
  Every PR now says where it is seen (`Ver en:`). Players see no change.

## 0.233.3 — 2026-10-28
- **What a game reuses of La Copa lives in its own entry**: Línea de Tiempo's and Toque y Fama's Cup files are listed as `reuses` in `games.js`, and the end-to-end scope reads them from there instead of a list of its own (#855, phase 2). Nothing changes for players.

## 0.233.2 — 2026-10-28
- 🎃 Halloween: the 🦇 that crosses the home page now flies head first (right to left), and only bats and ghosts rise from the floor; spiders, skulls, beetles, pumpkins and cobwebs no longer float up.
- 🧪 Lab: big Halloween frights on the home page, a giant 💀 leaning in from the side, a huge 🕷️ running across, 👀 blinking in the dark or a 🧟 shambling up from below (flag `season-scares`).

## 0.233.1 — 2026-10-28
- **Rooms open the same way in every game**: creating and joining a room in El Ahorcado, Generala, Dudo, Batalla Naval, Toque y Fama and Línea de Tiempo now goes through one shared module (`assets/js/room-flow.js`), with nothing different for players (#860).

## 0.233.0 — 2026-10-28
- **Panel: the Timeline lists every campaign seen, with who.** A new 📣 *Campaigns seen* kind shows
  who saw which splash campaign and who opened the donation card, next to feedback sent; skins are
  not campaigns. /privacy/ says it, and the names go at 24 months like the others (D-503).

## 0.232.7 — 2026-10-28
- **The lab's dominoes puzzle is now Dominorama**: Pips is a registered name, so the game, its folder (`/labs/dominorama/`) and its id (`dominorama`) took the new one; `/labs/pips/` redirects there, and the cover still credits NYT's Pips as its inspiration.

## 0.232.6 — 2026-10-28
- **🥂 The toast to support now reaches regulars**: it waits only for 5 visit days in four weeks, counted back from what each phone already keeps; the 10 finished games it also asked for only counted La Copa's, so it had shown to no one. Every finished game is now counted on the phone, never sent (D-502).

## 0.232.5 — 2026-10-28
- **The 🧱 Stack teaser now looks like the game**: it is drawn with the game's own isometric scene
  (now `public/labs/stack/scene.js`, shared by both) instead of a flat side view, and a teaser in the
  splash is centered on a computer, where it sat to the left. Still off, waiting for the owner.
- **The 🥷 Stick Ninja teaser now looks like the game too**: drawn with the game's own scene (now
  `public/labs/stick/scene.js`) instead of its own pixel art with a full moon and black pillars. A new
  test (`marketing/splash/teaser.test.mjs`) fails if a teaser draws nothing with its game's code.

## 0.232.4 — 2026-10-28
- **Lab: the 💬 feedback form stays above the iPhone keyboard** (#883): on iOS the keyboard covered the Send button and the card could not scroll to it. Behind `flag('keyboard-lift')`, the layer now ends where the keyboard starts and scrolls to Send, through a shared `visualViewport` helper (`assets/js/keyboard.js`). Checked: Hangman and Toque y Fama use their own keys, and La Copa's PIN and name fields sit in the page, which iOS scrolls on its own; `overscroll-behavior: none` was already on `html` and `body`.

## 0.232.3 — 2026-10-28
- **Search engines read the home page in its own language.** The English, Portuguese and German home pages now give search engines their own name (Party Games, Jogos de Salão, Salonspiele) instead of the Spanish one. A new check (`tools/e2e/structured-data.mjs`) opens every indexed page in a browser and fails when its structured data says something the page does not show, such as a «Cómo se juega» answer that differs from the rules on the cover (#883).

## 0.232.2 — 2026-10-28
- **The animated covers rest when you scroll away**: the demos on the covers of Bridges, Where in the World, Stack and Stick stop drawing while they are off the screen and pick up when they come back, so a phone spends less battery. Nothing changes on screen (#883).

## 0.232.1 — 2026-10-28
- **The room chat no longer covers buttons**: in every room game the 💬 bubble now sits in a strip of its own at the bottom of the screen, and the screen ends above it, so it never hides the right end of ¡CALZO!, ¡A JUGAR!, Me paso or ¡Zarpar! (one shared rule in `base.css` replaces each game's own padding; Julepe's sticky bar stops above the bubble).
- **Tools:** `look.mjs --chat` mounts the room chat on any screen and names the buttons its bubble covers; `liars-dice/rooms-classic.mjs` with `SICILIANA=1` now always doubts the game's first bid, and checks that every phone shows the siciliana line and the same two-dice loss.

## 0.232.0 — 2026-10-28
- **Lab: El Camaleón 🦎, a party game for one phone passed around** (#898): 3 to 8 players, a grid of 16 words on a topic, and one hidden chameleon who does not know the secret word. One clue each, a vote, and a caught chameleon still escapes by guessing the word; first to 5 points wins. Six topics with our own words in Spanish, English, Portuguese and German. Inspired by The Chameleon, by Big Potato Games, as the cover and the lab say. Under Juegos en prueba in `/labs/`, behind the lab key.

## 0.231.1 — 2026-10-28
- **Uno al día's totals are counted by the server, in the lab**: with a lab key, your phone only uploads what you played and the server adds up the month's points, the +10 per friend, the week and the best streak every hour, the same for everyone; /today/ shows today's points at once with your phone's own count until then (#854, D-500).

## 0.231.0 — 2026-10-28
- **What is tried in the lab now goes live with a switch** (D-498): La Copa's new create screen and Battleship's Salvo each have a flag the owner turns to 🚀 Everyone from the panel (📣 Campaigns → 🚩 Lab flags) or from its card in `/labs/`, at once and without a new version; ↩️ takes it back to the lab.

## 0.230.2 — 2026-10-28
- **One place per game, phase 1 (#855).** `games.js` becomes the games manifest: each game's search
  keywords now live in its own entry, and `search.js` reads them from there instead of keeping a list
  of its own. Nothing changes for players: the 🔎 search finds the same games by the same words.
  `manifest.test.mjs` fails if a hand-kept list comes back.

## 0.230.1 — 2026-10-28
- **Rooms and Cup podiums are now the night's job** (D-499, #854): phones no longer sweep expired rooms; a nightly job deletes them from every closed cleanup bucket, however old, plus the rooms no bucket names (`room-sweep.mjs`). A finished Cup's podium is saved only by the nightly `cup-podiums` job the night after its close; the app no longer writes it, and the rules refuse it. Nothing changes on screen.

## 0.230.0 — 2026-10-28
- **Dudo's classic rules, for everyone**: the setup has a **📜 Reglas clásicas** switch, off by default: nobody opens in aces, into aces is half plus one, calzar in a duel and with one die at any time, and the open obligada round when someone is down to one die. Under it, a folded **Variantes** row with Pasar and Dudar a la siciliana. The first time you can calzar, a line says what it is. Until now only with a lab key; the lab card moves to La Bodega (D-495).

## 0.229.18 — 2026-10-28
- **«Cómo se juega» starts collapsed on every game cover.** El Ahorcado, Batalla Naval and Toque y Fama showed their rules open; now, like Línea de Tiempo, Dudo and Generala, they are a panel you tap to open, so the cover stays short. The text is still in the page for search engines (U-39).

## 0.229.17 — 2026-10-28
- **Panel, 📣 Campaigns:** a splash card's **Quick look 👀** now sits next to **Live Preview 🔎** (the old 👁 Preview, renamed on every Campaigns card).

## 0.229.16 — 2026-10-28
- **🎲 Dudo, 🧪 classic rules in a room (lab)**: a room with the classic rules now opens. The Firebase rules did not accept the `traditional`, `pasar` and `siciliana` settings in a room's config, so creating the room (and the rematch) failed with "permission denied" for everyone; until now the classic rules had only been played on one phone. Found by a playtest with 2, 3, 4 and 5 phones (D-490).
- The room's lobby says the table plays the classic rules, and which variants are on, so a guest knows before the ace will not open.
- A guest without a lab key, in a room whose host chose the classic rules, plays them and now also gets the one-time line that explains calzar.
- In the open obligada round, your own strip shows one ❓ per die you hold (it showed a single ❓ with three dice).

## 0.229.15 — 2026-10-28
- **Dudo's 🧪 classic rules explain themselves**, in the lab (playtest): a face a rule closes says why under the faces ("Esta ronda no se abre en ases", the obligada round's fixed face), also when tapped; the one-time calzar line says when it opened because you have one die; the siciliana reveal says why two dice go; and the pass button is honest about the hand ("Tienes mano para pasar", or "Paso de farol" with a line saying it can be doubted). The pass-the-phone screen and the notices are opaque from the first frame, over an empty table.

## 0.229.14 — 2026-10-28
- **Panel:** the 📣 Campaigns tab 🎨 Skins is now 🎨 Site skins, matching 🧩 Site features.

## 0.229.13 — 2026-10-28
- **Labs**: La Bodega's ✨ Mejoras lanzadas folds by when each improvement launched (one fold per week this month, one per month before, the newest open) and has a 🔎 search box, so the list stays short as it grows.

## 0.229.12 — 2026-10-28
- **Dudo, 🧪 classic rules (lab):** with the **Pasar** variant on, a pass now counts. Before, the
  pass was dropped: against the phone the game froze the first time the phone passed, and on one
  phone the same player was asked again. Found playtesting the lab (D-490).
- **Dudo, doubting a pass (lab):** the reveal shows only the hand that passed, without the
  "Había N…" count, since only that hand is judged; in a room the header says "X dudó del paso de Y"
  instead of "X calzó".

## 0.229.11 — 2026-10-28
- **Two "coming soon" splash campaigns, off:** 🥷 `ninja-pronto` ("¿Llegará al otro lado?": under a
  full moon a ninja's stick tips toward the far pillar and the moon goes dark before it lands) and
  🧱 `stack-pronto` ("¿Hasta dónde llega?": a neon tower climbs into the stars until the last slab
  stops in the air). Teasers of Stick Ninja and Stack, still in the lab, with no name or link; both
  are listed in the panel's 📣 Campaigns for the owner to turn on. Drawn by `marketing/splash/teaser/ninja.html`
  and `stack.html` (sharing `_common.js`) and recorded by `teaser.mjs`.

## 0.229.10 — 2026-10-28
- **Panel, 📣 Campaigns:** each splash card has a folded **Quick look** that shows the real splash, as a small phone, without leaving the panel. 👁 Preview still opens the home page to try it.

## 0.229.9 — 2026-10-28
- **Panel:** the 📣 Campaigns tab "Splash" is now "Splash screens".

## 0.229.8 — 2026-10-28
- **"Cómo se juega" says each mode right** (D-488): a solo mode now reads "o solo" instead of "solo contra el celular" (Timeline, Generala, Hangman and Bulls and Cows have no rival in solo), a game against the phone keeps "contra el celular" (Liar's Dice, Battleship), and the two-player games say "1 o 2 jugadores… Los dos en un mismo celular" instead of "De 1 a 2… Todos". In all four languages; the FAQPage JSON-LD picks it up on its own.

## 0.229.7 — 2026-10-28
- **Battleship Salvo (lab): the last shot reads right**: with one ship left, the status says "Marca 1 casilla" instead of "Marca 1 casillas" (and the same in English, Portuguese and German). Found by a playtest of the lab mode.

## 0.229.6 — 2026-10-28
- **Labs**: La Bodega shows all its launched improvements again: one card had lost its closing tags and hid the 28 cards after it inside itself. `public/labs/bodega.test.mjs` now checks that the page's tags close.

## 0.229.5 — 2026-10-28
- **La Copa: the link of an archived cup shows its podium, for everyone** (D-492): a cup that ended more than two years ago no longer says "No encontramos una copa con ese código"; its link shows the cup's name, when it ended and its podium 🥇🥈🥉, with buttons to create a new cup with the same name and to see the medal table. Until now only lab key holders saw it (D-478). Its lab card moves to La Bodega.

## 0.229.4 — 2026-10-28
- **Panel**: the "Don't count this browser" checkbox next to Environment is no longer lab-only (D-493); its lab card moves to La Bodega.

## 0.229.3 — 2026-10-28
- **Dudo says "quinas"**: with the Chilean names on, the fives are "quina" / "quinas", as at a Chilean table, not "quintas" (D-491).
- **Classic rules (lab):** the obligada round's short notice now says who may still change the face, and your own hidden die in the top strip is a die-sized ❓ (D-491).

## 0.229.2 — 2026-10-28
- **Lab:** Battleship's Salvo mode moves to La Bodega as 💤 No prosperó: the owner discarded it (nobody liked it). The switch stays behind the lab key.

## 0.229.1 — 2026-10-28
- **«Cómo se juega» says who plays and how, for everyone**: its first line in Timeline, Bulls and Cows, Hangman, Liar's Dice, Generala and Battleship gives the players and minutes, one phone, several or alone, and that it is free with nothing to install and no account; search engines read it too. Launched from the lab at the owner's request (D-488).

## 0.229.0 — 2026-10-28
- **Dudo, 🧪 classic rules (lab):** going into aces is half plus one; calzar also in a duel and, with one die, at any time; the obligada round is announced to the whole table and played open (you see the others' die, not yours), and another player with one die may change the face; a folded **Variantes** row adds Pasar and Dudar a la siciliana; the first time calzar opens, a line says what it is (D-490).

## 0.228.2 — 2026-10-28
- **La Copa and Uno al día: the Toque y Fama number day is now "Toque y Fama: Número"** (en *Bulls and Cows: Number*, pt *Toque e Fama: Número*, de *Bullen und Kühe: Zahl*), the same pattern as the word day and the home page's Número / Palabra toggle, and it fits on one line on the calendar (#830, U-5).

## 0.228.1 — 2026-10-28
- **Dudo (lab): traditional rules.** A new setup switch, 🧪 Classic rules, only for lab key holders: nobody opens a round in aces, and the first time a player drops to one die they open an obligada round, with no wild aces and no change of pinta (D-487, #897). Off by default; everyone else plays as before.

## 0.228.0 — 2026-10-28
- **Battleship has a Salvo mode, in the lab**: each turn you fire as many shots as ships you have afloat; mark the cells, tap ¡Fuego! once and see every answer together. It is chosen in ¿Cómo jugamos? (one phone, against the phone or two phones) and only shows with a lab key; classic stays the default (#894, D-489).

## 0.227.10 — 2026-10-28
- **Lab: "How to play" says who plays and how**: in Timeline, Bulls and Cows, Hangman, Liar's Dice, Generala and Battleship, the first line of "How to play" now says how many play and for how long, whether on one phone, several or alone, and that it is free with nothing to install and no account. It sits inside the rules, never as a separate FAQ (D-488). Only with a lab key.

## 0.227.9 — 2026-10-28
- **A lab feature published with 🚀 Publicar para todos no longer stalls on a conflict**: if its PR collides with another change to `/labs/`, the Mac mini brings it up to date within about 20 minutes, or the card shows ❌ with Volver a pedir (D-486). Sessions no longer stop waiting on a conflict GitHub reports by mistake right after a push.

## 0.227.8 — 2026-10-28
- **Uno al día shares its result in squares for everyone** (D-485): the share text adds the spoiler-free 🟩🟨🟥 grid tried in the lab (D-482), never naming the game. Its lab card moves to La Bodega.

## 0.227.7 — 2026-10-27
- **👑 Reinas: a texture per region, for everyone**: each region of the board carries a subtle texture over its color (lines, dots, a grid), so players who do not tell the colors apart can still read it. Validated in the lab, published at the owner's request from /labs/; its card moves to La Bodega (#896, D-481).

## 0.227.6 — 2026-10-27
- **👑 Reinas (lab): the region textures are subtler**: half the ink and 1 px lines, at the owner's request, since the first ones read too strong. Regions still tell apart under simulated deuteranopia (#896, D-481).

## 0.227.5 — 2026-10-27
- **Toque y Fama: the lab's ✏️ Notes on the keypad are gone** (D-483, revoked): the owner tried the idea and discarded it, since switching to notes costs key time during the game for little gain. The long press to strike a digit stays as it was (#895).

## 0.227.4 — 2026-10-27
- **👑 Reinas: each region has a soft texture over its color** (lines, dots, a grid), so players who
  do not tell colors apart well can still see the regions. For now only in the lab (#896, D-481).

## 0.227.3 — 2026-10-27
- **Panel → 📣 Campaigns: rename a campaign.** The ✏️ button on each campaign gives it your own name for sorting them out; it shows across the section (queue, overlaps, How they did), with the title players read beneath it. Players never see it; an empty name goes back to the title. Saved in Firebase `splash/<id>/label`.

## 0.227.2 — 2026-10-27
- **Owner panel:** 👥 Group and 🧍 Individual now each count and list only their own games (D-484). Group's "Offline games" log no longer shows solo games, and Individual has its own log. "Finished on one phone" and Individual's "finished" no longer mix the two domains. A new end-to-end script opens every panel view and fails on errors, broken values, overflow or mixed domains.

## 0.227.1 — 2026-10-27
- **Lab:** 🚀 Publicar para todos sees the owner signed in on the panel, without signing in again on /labs/ (D-480).

## 0.227.0 — 2026-10-27
- **📅 Uno al día shares a spoiler-free grid, in the lab** (#889, D-482): with a lab key, the
  shared result adds the game's own squares (🟩🟨🟥…) without the game's emoji, numbers or times, so it
  still does not say which game it was (#215). El Ahorcado shares its lives (🟩 kept, 🟥 lost).
  Agentes gets none (its card is the board, it would show where the agents are), nor Dudo, Generala
  and Batalla Naval. One helper, `public/assets/js/share-grid.js`; listed in /labs/.

## 0.226.0 — 2026-10-27
- **Toque y Fama: deduction notes, in the lab** (#895, D-483). Under the keypad, ✏️ Notes turns a tap
  into a mark: 🚫 not in the number, ? maybe, ★ sure. ⌨️ Back to typing turns it off; the marks last
  the game. Same rules and score, so it works the same solo, in rooms, in Uno al día and in La Copa.
  Only with a lab key.

## 0.225.1 — 2026-10-27
- **The site footer on the one-player games' covers too**: Reinas, Zip, Tango, Conexiones and the rest now close their cover (the screen before Empezar) with the same footer as the group games, with 💬 Sugerencias y comentarios and ☕ Invítame un café, without the funny phrase. Never while playing, nor on the result, nor in Uno al día's game (U-38).
- **No more "minijuegos"**: one game is not smaller than another. The share message and the home page's description now say "juegos para jugar solo" in the four languages.

## 0.225.0 — 2026-10-27
- **Lab:** 🚀 Publicar para todos on each card being tried, for the owner only (D-480). After confirming, the card says it is not immediate and follows the request: the PR that works on it, its checks and its preview, until it is live or why it could not be done.

## 0.224.2 — 2026-10-27
- **Uno al día**: on /today/, a day uploaded more than a day late now shows 0 points in the calendar and its detail, with a short note that it counts for the streak, not for points, so the days add up to the season total (#879). The on-time window (`onTime`) has one definition in `daily-points.js`, shared by the browser and the backfill.

## 0.224.1 — 2026-10-27
- **The site's footer outside the games, for everyone.** The home page's violet-sunset footer (💬 Suggestions and ☕ Buy me a coffee) now closes Rankings and Uno al día, with the funny line, and each game's cover and La Copa's entrance, without it; never while playing or on a result. Its lab card moves to La Bodega.

## 0.224.0 — 2026-10-27
- **📣 Campaigns, the control center** (owner's panel, D-477): three tabs, each saying what is on today: 📣 Splash (as before), 🧩 Site features (☕ Buy me a coffee, with a switch for the home footer link and another for the end-of-game invitation, and its numbers) and 🎨 Skins (each seasonal template comes on by its own days every year, or on the days set there, or is switched off). The switches are saved in Firebase `controls/` and reach players on their next visit, with no PR; with nothing saved the site stays as it was.

## 0.223.2 — 2026-10-27
- **La Copa** (lab): the link of a cup archived two years after it ended shows its name, when it ended and its podium, with buttons to create a new cup with the same name and to see the medal table, instead of "No encontramos una copa con ese código" (D-478).

## 0.223.1 — 2026-10-27
- **Uno al día's history is also indexed by day** (D-475): each day played goes to `unoAlDiaDias/<n>/<jid>` too, so the panel, the nightly points rebuild, the weekly report and the ideas agent read only the days they need instead of everyone's whole history, once `tools/firebase/uad-index.mjs --apply` has copied the older days. Nothing changes for players.

## 0.223.0 — 2026-10-27
- **🔢 Toque y Fama: the 100 points belong to whoever deduces** (D-453, out of the lab): in Jugar solo, La Copa's 🔢 and the Final's number round you start at 100 and each guess the clues had already ruled out takes off 15 (minimum 10 if solved). The finished board marks those guesses with ⚠️ for everyone, and La Copa's breakdown counts them. The rules texts changed in four languages; the lab card moved to La Bodega.

## 0.222.20 — 2026-10-27
- **The site's footer outside the games (lab).** With a lab key, the home page's violet-sunset footer (💬 Suggestions and ☕ Buy me a coffee) also closes Rankings and Uno al día, with the funny line, and each game's cover and La Copa's entrance, without it. Never while playing or on a result screen.

## 0.222.19 — 2026-10-27
- **Home page footer**: the rotating phrases are bolder. 20 of the softest ones (the wifi, Netflix and IKEA pickup lines, the coffee-mug mottos, the limp puns) were replaced, and 50 new ones were added: now 150 per language, in all four, about drinking rounds, cheating at the table, exes and shameless flirting, still with nothing crude.

## 0.222.18 — 2026-10-27
- **Lab:** whatever is launched for everyone moves to La Bodega (D-479). The 🎃 Halloween card, already launched, now waits folded under ✨ Mejoras lanzadas; a test keeps launched cards out of the groups on trial.

## 0.222.17 — 2026-10-27
- **Owner panel**: live rooms are read without their messages. Each room now keeps its own count of messages by type, and the panel shows Moves, Chat and Last move from it, with the same numbers (D-474, #848).

## 0.222.16 — 2026-10-27
- **Frequently asked questions, out of the lab**: the separate ❓ block under "How to play" is gone, at the owner's call (one block explaining the game is enough). Instead, search engines now read each game's "How to play" itself as its question and answer (FAQPage structured data), in Timeline, Bulls and Cows, Hangman, Liar's Dice, Generala and Battleship. Players see no change (#887).

## 0.222.15 — 2026-10-27
- **Behind the scenes**: a nightly job can move finished Cups older than two years, old usage days and old daily tables out of the live database into an archive, so what players and the panel download stops growing with the past (D-476). It only moves things once the owner switches it on.

## 0.222.14 — 2026-10-27
- **The 🚂 "Something new is coming…" teaser loads five times lighter**: its 8-second clip is now a looping MP4 (74 KB) instead of a 373 KB GIF, with its first frame as the poster; `marketing/splash/teaser.mjs` makes MP4s from now on (#846).

## 0.222.13 — 2026-10-27
- **Frequently asked questions, in the lab**: under "How to play" in Timeline, Bulls and Cows, Hangman, Liar's Dice, Generala and Battleship there is a collapsed ❓ block with three questions: how many play and for how long, one phone or several, and whether it is free. The answers come from each game's data, in the four languages. For now only lab key holders see it (#887, W1.2 of #883).

## 0.222.12 — 2026-10-27
- **Less Firebase download** (D-473, #848): the Uno al día season recap on the home page reads only the season's top and your own row, not the whole table, and the owner's panel downloads only the Cups and feedback of the period it shows.

## 0.222.11 — 2026-10-27
- **Privacy**: the names typed in games are deleted from the usage statistics after 24 months, and /privacy/ now says so in the four languages; the counts without names stay (D-472).

## 0.222.10 — 2026-10-27
- **Rooms:** a new room is accepted only together with its cleanup note, and a cleanup bucket's clock is refreshed only on recent days, so every room is swept when it expires (D-469).

## 0.222.9 — 2026-10-27
- **Rankings load lighter**: the tables at the end of a game, on /today/, in /records/ and the home page's Uno al día place are read without opening a live connection to the server, which now opens only when a score is saved or a player signs in. Pages load about 110 kB less, and many more people can play at once on the free plan (D-470).

## 0.222.8 — 2026-10-27
- **Panel (lab): Don't count this browser.** A checkbox next to Environment keeps that browser's play and visits on the live site out of Live, in a new My devices environment (D-471).

## 0.222.7 — 2026-10-27
- **Rooms:** the database rules check each room's settings, seats and messages against what the games send, and a cleanup bucket's clock only moves forward (D-469).
- **Reports:** each pass of the 🐞 inbox upload creates at most 20 issues and warns when more are waiting (D-469).

## 0.222.6 — 2026-10-27
- **Search engines**: every game page on the home page and the four language doors now carry structured data (JSON-LD: the game's name in four languages, free, no account, number of players), and the site has a `sitemap.xml` with the doors' language alternates and a `robots.txt` that names it. All of it is generated from `games.js` by `node tools/release/og.mjs cards` and checked by `og.mjs check`, so it cannot fall behind; lab pages stay out (#887).

## 0.222.5 — 2026-10-27
- **Panel: ☕ Buy me a coffee as a campaign.** 📣 Campaigns shows its funnel in the range: invitations at the end of games, cards opened, taps to Stripe and payments, with their rates, one bar per day and a CSV.

## 0.222.4 — 2026-10-27
- **Sound comes back after a call or a lock on iPhone**: iOS left the audio "interrupted" and the games stayed silent until the page was reloaded; now it resumes on the next tap and when you return to the tab (#890).

## 0.222.3 — 2026-10-27
- **Labs: Stack and Stick rest while paused.** A game left paused stops redrawing after a second and wakes on the tap back, so it no longer drains the battery on the table (#892).

## 0.222.2 — 2026-10-27
- **La Copa and its games load half as much**: each page now downloads only the game being played, with its own styles, instead of all seventeen Cup games and every Timeline deck. `/zip/` goes from 140 requests and 2.5 MB to 67 and 1.2 MB, `/cup/` from 141 and 2.5 MB to 66 and 1.2 MB, `/where/` from 2.7 MB to 1.6 MB. Same games, same look (D-468).

## 0.222.1 — 2026-10-27
- **Tren al Vilo**: when the train tries to cross, the bridge's beams now pass in front of it instead of behind, in both the pixel and the neon styles.

## 0.222.0 — 2026-10-27
- **Splash campaigns: conversion, in the panel** (D-466): after a campaign's Play, the game it opened
  counts as started and finished (once per tap, in that tab, within 2 hours), and 📣 Campaigns'
  📊 How they did shows the % of taps that finished a game and conversion over phones reached, per
  campaign and per day. Anonymous counters, as before.

## 0.221.2 — 2026-10-27
- **Faster updates**: after a new version is published, a returning player downloads only the files that changed, not the whole site again. Each file is stamped with a hash of its own content instead of the release number (D-467, #847).

## 0.221.1 — 2026-10-27
- **PIN attempts**: signing in with a name and PIN, sitting in La Copa with the cup PIN and re-entering after a lost session now take one attempt every 5 seconds per player; a quick retry after a typo waits a moment on its own, and if it still can't, the screen says to wait a few seconds (D-464).
- **Changing a PIN**: the player card asks for the current PIN before the new one, and La Copa's admin confirms with their own PIN (the cup one, or their player's) before giving someone a new PIN (D-464).

## 0.221.0 — 2026-10-27
- **🔒 Privacy page** (`/privacy/`, in the four languages): what the games keep on your phone and in our database, why, for how long, who else sees it, a word for children and parents, and how to ask us to see or delete your data at hola@juegosdesalon.cl. Linked from the home page footer and from the note under the email field of every feedback form.
- **Feedback emails don't wait forever**: an email address left for a reply is deleted when we answer or, if there was no answer, after 90 days, and the form's note now says so (D-463).

## 0.220.1 — 2026-10-27
- **A tap outside a splash no longer loses it, for everyone** (D-462): closing a campaign window by tapping outside it, or with Escape, leaves it for another visit; closing it that way a second time, or with ✕, "Ahora no" or any of its buttons, marks it as seen. It was tried in the lab first.

## 0.220.0 — 2026-10-27
- **📊 How the splash campaigns did, in the panel** (D-461): 📣 Campaigns now shows, for the chosen
  range, each campaign's phones reached, % that tapped through, % that closed it, its share of home
  page views and how long the window stayed open, with one bar per day it was shown. Exposure counts
  the days a campaign was actually shown, so switching it off and on again does not dilute it, and it
  says whether a campaign is still finding new phones. The window counts what it does (shown, first
  time on a phone, tapped, closed, seconds open) as anonymous daily counters; a preview never counts.

## 0.219.16 — 2026-10-27
- **Home page footer: the violet sunset, for everyone.** The home page ends in a glow of the site's purple and pink, the rotating phrase in white, and 💬 Suggestions and ☕ Buy me a coffee as frosted buttons with a color circle above each label. Its lab card moves to La Bodega.

## 0.219.15 — 2026-10-27
- **Faster text on a first visit, and no call to Google:** the Bangers and Nunito fonts are now served by the site itself, preloaded by every page, instead of through Google Fonts. Text no longer waits on three hops to Google's servers, and opening a game no longer tells Google who is playing. The letters look exactly the same, in the four languages.

## 0.219.14 — 2026-10-27
- **¿Dónde queda? loads ten times lighter on a phone**: the Earth's satellite images are now WebP, and the sharp 4096 px one is downloaded only on big screens or when zooming in. A phone's first look at the globe drops from 2.1 MB of images to 0.2 MB, and zoomed in over a city from 2.7 MB to 1.3 MB; a computer from 2.1 MB to 0.9 MB. Same look (D-460).

## 0.219.13 — 2026-10-27
- **Uno al día:** a day's points count only for today's puzzle, give or take a day for time zones, and once that day's attempt has started. Days played offline still go up to your history and keep your streak; uploaded later, they add no points. The nightly recount of the season follows the same rule (D-465).

## 0.219.12 — 2026-10-27
- **A tap outside a splash no longer loses it, in the lab** (D-462): closing a campaign window by tapping outside it, or with Escape, leaves it for another visit; closing it that way a second time, or with ✕, "Ahora no" or its button, marks it as seen, as before. Only with a lab key for now.

## 0.219.11 — 2026-10-27
- **💬 Suggestions and comments: the page behind stays put.** While the feedback form is open over the page, the screen behind it no longer scrolls: only the card moves, and closing it returns to the same place.

## 0.219.10 — 2026-10-27
- **Online rooms: one phone per seat.** Two phones that join a room at the same instant now always get different seats; when only one seat is left, one sits and the other is told the room is full. A seat is taken with a transaction that leaves a seat held by another phone alone (`transport/seat.js`, #850).

## 0.219.9 — 2026-10-27
- **Home page footer (lab): the violet sunset.** With a lab key, the home page ends in a glow of the site's purple and pink, the rotating phrase in white, and 💬 and ☕ as frosted buttons with a color circle above each label. Chosen from the twelve variants in /labs/footer/.

## 0.219.8 — 2026-10-27
- **Hardening**: the room's QR code is drawn with a copy of its library served by the site itself (`assets/js/vendor/qrcode.js`, qrcode-generator 1.4.4, MIT), loaded by one shared module (`assets/js/qr.js`) instead of seven copies of the same code; a notification only opens pages of this site (anything else opens the home page); and the owner's panel does not show inside another site's frame.

## 0.219.7 — 2026-10-27
- **Lab: the home page footer, twelve ways** (`/labs/footer/`): the card, the felt and the ticket are out; today's footer (and with color), three neons, three sunsets and four speech bubbles for the 🎲, each with the rotating phrase and an opinion.

## 0.219.6 — 2026-10-27
- **The 🥂 toast to support the site waits for regular players** (D-458): when it is turned on, the splash shows only on a phone with 5 or more visit days in the last four weeks and 10 or more finished games that has not paid yet; a new player never sees it on a first visit. Any campaign can use the same rule. Nothing changes today: the campaign is still off.

## 0.219.5 — 2026-10-27
- **Lab: the home page footer, seven ways** (`/labs/footer/`): today's footer, a playing card, the green felt, a neon sign, a ticket, a sunset and a comic speech bubble, each with the rotating phrase, 💬 and ☕, and an opinion. One button changes the phrase, another adds a third option.

## 0.219.4 — 2026-10-26
- **Toque y Fama:** 🔢 Número or 🔤 Palabra is picked with a two-button toggle at the top of the game, like Loteo's variants, on both pages, instead of a fourth mode. The home page has a single Toque y Fama: Palabra is gone from its list, its filters and its search (it still plays in Uno al día and La Copa).

## 0.219.3 — 2026-10-26
- **☕ Support: a warmer thank-you.** After buying a coffee, the thank-you now reads "¡Gracias por tu café!" and invites the player back to play, in the four languages.

## 0.219.2 — 2026-10-26
- **Email replies to players always thank them for their time**: every one of the ten openings, in the four languages, now opens with a thank-you (owner's request: one that went out as "Te debíamos unas respuestas" read dry). Nothing changes on the site.

## 0.219.1 — 2026-10-26
- **Rankings:** the list of how many times you played each game comes folded, with the total in its title, so the rankings show first (a player asked for it by email). Out of the lab, for every player.
- **Toque y Fama:** one card on the home page for the number and the word; 🔤 Palabra is a mode inside the game (a player asked for it by email). Out of the lab, for every player.

## 0.219.0 — 2026-10-26
- **☕ Buy me a coffee, for everyone:** the home page footer and the end of some finished games now offer a voluntary contribution through Stripe, from US$1, for every player, not only lab key holders. The card moves to La Bodega in /labs/.

## 0.218.14 — 2026-10-26
- **Home page footer (lab)**: with a lab key, the footer's options (💬 Suggestions and comments,
  ☕ Buy me a coffee) sit under a thin rule with a 🎲, as two outlined, unfilled buttons in a
  two-column grid, so they read as the site's corner and not as more game cards. A new option is one
  more button in the grid; an odd one spans the row. Without a key the footer is unchanged.

## 0.218.13 — 2026-10-26
- **Panel**: a 🧪 Labs link at the end of the section menu opens `/labs/`.

## 0.218.12 — 2026-10-26
- **☕ Buy me a coffee (lab):** the pay button and the 🥂 splash now open the live Stripe payment page: payments are real. Still only for lab key holders.

## 0.218.11 — 2026-10-26
- **☕ Buy me a coffee (lab):** the Keanu Reeves clip on the support card is bigger and sits under the title; on the smallest phones it shrinks so the card still fits.

## 0.218.10 — 2026-10-26
- **🥂 Brindis splash (off):** its "Apoyar Juegos de Salón" button goes straight to the Stripe payment page instead of opening the support card first.

## 0.218.9 — 2026-10-26
- **Tren en Vilo: the stage confetti falls in front**: it was hidden behind the stage summary, which now sits just under it.

## 0.218.8 — 2026-10-26
- **☕ Buy me a coffee (lab):** the support card shows a small clip beside its title, Keanu Reeves saying thank you, and still fits a small phone without scrolling.

## 0.218.7 — 2026-10-26
- **🥂 A new splash campaign, off for now:** "¡Un brindis por ti!", Leonardo DiCaprio raising his glass, invites players to support the site and opens the support card. It goes on from the panel once support leaves the lab.

## 0.218.6 — 2026-10-26
- 📣 **▶ Jugar in the Tren en Vilo window opens the game already started**, past its cover (`?play`).
- 📣 **The Tren en Vilo window's clip is quicker**: 10 seconds instead of 17.

## 0.218.5 — 2026-10-26
- **☕ Buy me a coffee (lab):** the pay button now opens a real Stripe checkout in sandbox mode, so the whole flow, Stripe and the thank-you on return, can be tried in the lab with a test card. Players see no change (D-449).

## 0.218.4 — 2026-10-26
- 📣 **The Tren en Vilo window fits the screen like the others**: on a computer its clip filled the screen and left ▶ Jugar below the fold; now the clip takes the height left by its heading and card.

## 0.218.3 — 2026-10-26
- **📣 Campaigns, redesigned** (D-454): an off campaign folds to its emoji and title, and a tap opens it. Each card shows its status under the title, the days as two pills (Starts Now → Ends Never) that open the phone's calendar with one tap, a 1 week / 2 weeks / 1 month selector, and its place in the order (↑ 1 of 3 ↓) next to Preview.

## 0.218.2 — 2026-10-26
- **🎃 Halloween reaches every player** on the home page and Rankings until October 31: a pumpkin favicon, a pumpkin glow, a cobweb, bats, spiders and skulls among the particles, a bat that crosses and a ghost that sometimes peeks. The games stay as they are (D-457).

## 0.218.1 — 2026-10-26
- 📣 **The Tren en Vilo window no longer flashes the finished bridge** before its clip starts: it opens on the clip's first frame.
- 🚅 **Tren en Vilo has a modern icon**: the bullet train of the game instead of the steam engine, on the home page, its card and its link.
- ☁️ **Tren en Vilo's clouds look natural**: each one is a few puffs of its own shape, spread across the sky, instead of three identical ones stacked.

## 0.218.0 — 2026-10-26
- **🎃 Halloween on the home page and Rankings (lab)**: from October 26 to 31, a pumpkin favicon, a pumpkin glow in the background, a cobweb in the corner, 🎃 👻 🦇 in the hero's emoji cycle, bats, spiders, bugs and skulls among the background particles, a bat that crosses once and a ghost that sometimes peeks. The games stay as they are. Built as templates, so the next dates are one row each. For now only with a lab key, to look at before it goes out to everyone (D-457).

## 0.217.0 — 2026-10-26
- 🚂 **Tren en Vilo is out of the lab, for everyone.** Reinforce the track with beams over a gap and test whether the train crosses: five stages in seven minutes, from a bright morning to the night. It is on the home page (✨ Nuevo), in Uno al día from October 27 and in La Copa, in Spanish, English, Portuguese and German, with its ranking, its share card and the 🐞 report.
- 📣 **A window on the home page announces it**, with a clip of a bridge built and crossed and a button to play; it replaces the "Algo nuevo se viene…" teaser.

## 0.216.2 — 2026-10-26
- **Stick Ninja (lab): the climb back after a lost life looks real.** The ninja peeks up from below, throws the grapple in an arc, the rope snaps taut on the edge, and the ninja climbs hand over hand and pulls itself over the top, in about 2.6 seconds instead of a quick jump.

## 0.216.1 — 2026-10-26
- **👁 Previewing a campaign shows only that campaign** (D-454): the panel's Preview (`?splash=`) no longer gives way to a La Copa or Uno al día recap this phone still had to see.

## 0.216.0 — 2026-10-26
- **📣 The owner runs the home page's campaigns from the panel** (D-454): a new Campaigns section, made for the phone, with each campaign's on switch, its start and end days, the order when several overlap and a preview. A change reaches the home page on the next visit, with no new version. Players see nothing different: the same campaign, on the same days.

## 0.215.2 — 2026-10-26
- 🐹 **Tren en Vilo (lab): the mole's tunnel stands out.** It is dug brown earth with a light rim, so it
  shows against the purple rock at any time of day; before, its dark bore all but vanished in the night's rock.

## 0.215.1 — 2026-10-26
- **Tren en Vilo (lab): steel is only the look of the later stages.** Wood and steel are no longer mixed: levels 1 and 2 are built in wooden planks and levels 3 to 5 in steel beams, with the same budget, cost and strength. The picker and the separate steel reserve are gone; on steel stages the counter reads «Acero» and shows gray bars.

## 0.215.0 — 2026-10-26
- **Stick Ninja (lab) has its leaderboard**, like every game played alone: under 🥷 Play, the Stick Ninja leaderboard (Week · All time · Friends) and signing in with a name and PIN; on the result, how the run did against your record or "Want this game to count on the leaderboard?", and the table. In English, like the game. This phone's best moves in with the steps.

## 0.214.7 — 2026-10-26
- 🐹 **Tren en Vilo (lab): the mole and the stone towers, redrawn.** The mole tapers to its snout, with fur
  along its back, whiskers, a tail and big spade hands with claws; scared, it shows its teeth and kicks its
  feet. Its tunnel is a smooth bore with a rim of loose earth instead of a stack of squares. The towers over
  the banks are dressed stone, in courses of staggered blocks.

## 0.214.6 — 2026-10-26
- 🚤 **Tren en Vilo (lab): the boat and the wakeboarder, redrawn.** The boat has white topsides with a pink
  stripe, an arched wake tower, a raked windscreen, a driver at the wheel and white water at the bow and stern.
  The rider wears a helmet and leans back against the pull, knees and elbows bent, both hands on the handle;
  the fall throws the board away, and in the water the vest keeps them afloat. The wave glows at its crest and
  throws spray.

## 0.214.5 — 2026-10-26
- **Tren en Vilo (lab): the day really goes by.** Stage 1 is a bright blue morning with white clouds, the middle ones head into a pink-and-gold sunset, the last is at night; in the house style every stage had looked like night.
- **Tren en Vilo (lab): the train always stands out.** Each stage picks the bullet train's color only among those that contrast with its sky (pearl in the morning, all seven at night).

## 0.214.4 — 2026-10-26
- **Stick Ninja's cover (lab) breathes**: room between the run, 🥷 Play, "🏆 Best" (now centered under the button) and the steps; the tagline wraps evenly and the steps leave no word alone on a line.

## 0.214.3 — 2026-10-26
- **Stick Ninja (lab): a lost life climbs back up.** After a fall that leaves lives, a rope shoots up from below the screen and hooks the pillar, the ninja climbs it and hops back on top, in about a second (the wait went from 1.5 s to about 1.1 s).

## 0.214.2 — 2026-10-26
- 🚂 **Tren en Vilo (lab): a polished scene.** The moon is a real crescent: its shadow follows the moon's own
  outline instead of a dark disc over the halo. The stars are round and the brightest twinkle, the sun has a soft
  glow, the sun or moon shimmers on the water, the cliffs and rock pillars show their layers (the pillars wider
  at the foot, with foam where the water meets them), and the birds have a body, a tail, an eye and full wings.

## 0.214.1 — 2026-10-26
- **Tren en Vilo (lab): skip a stage.** While the game is in the lab, a ⏭ button by the clock jumps to the next stage without building, to try the later ones. A skipped stage counts as passed with all its wood spent.

## 0.214.0 — 2026-10-26
- **Stick Ninja (lab) has three lives**: a run no longer ends on the first fall. A fall darkens one of the three ❤️ at the top of the night ("❤️ 2 lives left", "Last life!") and the ninja is back on the same pillar with the score kept and the flag streak gone; the third fall ends the run. The cover's first step says so.

## 0.213.0 — 2026-10-26
- **Toque y Fama, in the lab: the 100 points go to whoever deduces.** A new score rule is being tried for 🔢 (Jugar solo, La Copa and the Final's round): start at 100 and lose 15 for each guess the earlier clues had already ruled out. Scores still count with today's rule for everyone; with a lab key, the finished board marks those guesses with ⚠️ and says what the new rule would have given (D-453).

## 0.212.0 — 2026-10-26
- **Tren en Vilo (lab): steel beams.** On the heavier crossings (levels 3 to 5) a small reserve of steel (2 m) comes beside the wood: a 🪵 Madera / 🔩 Acero picker chooses what the next beam is laid in. Steel snaps at twice the strain of wood and costs no wood. Wood and steel each have their own texture: wood a warm rod with a grain, steel a thicker cold rod with a bright edge and rivets that heats to pink and red under strain. The steel left shows as gray bars beside the planks.

## 0.211.13 — 2026-10-26
- **Tren en Vilo (lab): the wood left is shown as planks**, one per meter above the counter, emptying as you build; the last plank is shorter when the budget has decimals.

## 0.211.12 — 2026-10-26
- **Línea de Tiempo:** after a solo game, "La línea quedó así" no longer sits against the share button.

## 0.211.11 — 2026-10-26
- **Toque y Fama, in the lab:** one card on the home page for the number and the word; 🔤 Palabra is now a mode inside the game (a player asked for it by email).

## 0.211.10 — 2026-10-26
- **Rankings, in the lab:** the list of your games played comes folded, with the total in its title, so the rankings show first (a player asked for it by email).

## 0.211.9 — 2026-10-26
- **Línea de Tiempo's tagline no longer reads as a football game**: "from history to soccer" became
  "from history to music" in the four languages, on the home card, the page's description and its
  link card (feedback #771).
- **The home page's order** was recounted from the games finished in the last four weeks (D-361).

## 0.211.8 — 2026-10-26
- **Rankings:** a finished game's score is no longer lost to a bad connection. It is tried again twice (as soon as the phone is back online, or after a few seconds); if it still can't go, it waits on the phone ("No signal: your score goes up to the leaderboard as soon as you're back online") and is sent the next time a page opens or the signal returns, into the week it was played. A player had lost a 100/100 Zip on a weak signal.

## 0.211.7 — 2026-10-26
- 🚂 Tren en Vilo (lab): its cover steps fit in 280 characters again (U-18): the first step no longer opens with "La vía ya está puesta", and the scoring line reads "Suman las etapas superadas, la madera que sobra…".

## 0.211.6 — 2026-10-26
- **Skipped emails to hola@ no longer vanish** (D-452). The processes round lists every email the support agent skipped, with when, the masked sender and why, and the owner can read their text with `node tools/agents/inbox.mjs skipped`; it stays on the owner's machine, never on GitHub. Nothing changes for players.

## 0.211.5 — 2026-10-26
- **🏆 A finished Cup's champions reach the medal table within the hour of its close**, instead of a day late in winter time (D-450).

## 0.211.4 — 2026-10-26
- **🏆 Every finished Cup's champions reach the medal table, even if nobody opens the Cup again** (D-450). The podium used to be saved only when someone opened the Cup after it ended, so the Reno Farewell Cup and Copa Originales were missing; they are in now, and a nightly job saves any that is missing.

## 0.211.3 — 2026-10-25
- **☕ Invítame a un café opens as a card over the screen** (D-449), like the share sheet, instead of a page of its own: from the home page footer or the end of a game, it rises from the bottom with one sentence, how paying works, the button and "Ahora no", and fits a small phone in every language. Stripe brings the donor back to the home page, where the thank-you opens the same way. Still in the lab, only with a lab key.

## 0.211.2 — 2026-10-25
- **🎲 Dudo's tagline names the shake:** "Agita el cacho, apuesta cuántos dados hay en la mesa y aguanta la cara." (and "Shake the cup…", "Sacuda o copo…", "Schüttle den Becher…"), on the home page, its own page and its link card.
- **While your dice are still to roll, the round no longer tells you to bid:** whoever opens it reads "Abres tú la ronda." until the dice are out, and then "Abres la ronda: apuesta lo que quieras.", as before.

## 0.211.1 — 2026-10-25
- **🚂 Tren en Vilo (lab): drawn in the house style.** Players said its pixel art didn't look like the rest of the app, so the lab's game is now drawn like Stick Ninja: smooth shapes and soft glows on the home page's night, cliffs and pillars as dark silhouettes with a neon edge, beams as glowing yellow rods that turn pink and red as they stretch. The train is a chrome bullet train with the same nose at both ends and small wheels under a low skirt, so it glides along the deck, in one of seven colors drawn at random for each stage ("🚄 Los colores del tren bala" shows them all). The day still goes by along the five stages, in the house's colors. The visitors (the saucer and its fish, the whale, the boat and its wakeboarder, the mole, the birds) are redrawn in the same style, and "🛸 Los visitantes" shows them up close. The whale leaps out steeply. "👾 La versión anterior, en pixel" on the lab card keeps the old art to compare; La Copa's screen keeps it too.

## 0.211.0 — 2026-10-25
- **☕ Invítame a un café, in the lab** (D-448): voluntary support through a Stripe Payment Link, in the first person. Lab key holders see it in two quiet places: always in the home page footer, under 💬 Sugerencias y comentarios, and at the end of a finished game, from the device's sixth game, at most once a week and never on the same ending as the inbox. Its page says the games stay free and opens Stripe; until the payment link is set, its button simulates the payment and shows the thank-you. Nothing changes for other players.

## 0.210.0 — 2026-10-25
- **🎲 Dudo: shake the phone to roll your dice, now for everyone** (D-447). Each round your hand becomes a green cloth with bigger dice, face down; shake the phone and they roll in 3D, faster with every shake while the phone rattles with them, and when your hand stops they stay as they fell, which is what you rolled. Then the cloth turns back into your hand. It comes on by default (🫨 Agitar para tirar, on the names screen); a computer, or an iPhone that doesn't allow motion, gets a 🎲 Tirar los dados button.
- **⏱️ 30 segundos por turno**, also on the names screen and off by default: whoever doesn't bid, doubt or call it exactly in time loses a die, without the table being revealed, and opens the next round.

## 0.209.0 — 2026-10-25
- **🎲 Dudo, in the lab: shake the phone to roll your dice.** With a lab key, setup offers 🫨 Agitar para tirar: each round, while your dice are still to roll, your hand becomes a green cloth with bigger dice, and you shake the phone to roll them. While it shakes, they roll in 3D, like the home page's 🎲 random-game die, spinning faster with every shake while the phone rattles with them, and they keep rolling as long as you shake; when your hand stops they slow down on their own and stay as they fell, which is what you rolled, and the cloth turns back into your hand with the dice lined up as always. An iPhone asks for the motion permission with one tap; a computer, or a phone without a sensor, gets a 🎲 Tirar los dados button.
- **⏱️ 30 seconds per turn, also in the lab:** whoever doesn't bid, doubt or call it exactly in time loses a die, without the table being revealed, and opens the next round. The clock shows on your own turn and pauses under a reveal, a pass screen or a hidden page (U-20). Both switches are off by default, and in a room the creator's choice applies to everyone. Listed in /labs/ under ✨ Mejoras en prueba.

## 0.208.6 — 2026-10-25
- **🎲 Dudo only asks the opener to bid.** In a room, at the start of each round every phone read "Abre la ronda: apuesta lo que quieras.", even those that weren't opening. The others now read "Chan abre la ronda." (in all four languages); the opener's phone keeps the invitation, now "Abres la ronda: …", in the second person like the other languages. Against the phone, while it opens, you read that it does.

## 0.208.5 — 2026-10-25
- **🎲 Dudo no longer says "Le toca a null" in a room.** While the table waited for everyone's dice after a *¡Dudo!* or a *¡Calzo!*, nobody had the turn and the header printed `null`. It now says who called it ("Chan dudó de 7 quintas") over the line that names whose dice are missing, and while the dice are being rolled it names who opens the round.

## 0.208.4 — 2026-10-25
- **🚂 Tren en Vilo (lab): the deck comes laid.** The train always needs the road across the gap, so every stage now starts with it, one beam per square from bank to bank, and those beams can't be removed: a tap on one says the train needs it, and 🧹 Clear leaves them. They still count as wood, so the counter starts at the gap's width. A long beam drawn over the deck no longer lays a second copy of it.

## 0.208.3 — 2026-10-25
- **🚂 Tren en Vilo can be played in La Copa**, for the owner's one-day cup of 2026-10-25 (it is not in the pool, so no create screen offers it): the lab's bridge builder with the cup's clock and texts in the four languages. Everyone builds the same five crossings, one notch harder than the lab's (catalog levels 2, 3, 3, 4, 5), in 7 minutes; the score is the lab's (stages, wood saved, solidity, speed), with its breakdown on the result. The Grand Final does not repeat it (`NOT_IN_FINAL`).
- The lab's page draws with the same code: its scene (canvas, pixel art, strain gauge) moved to `labs/bridges/scene.js`, shared with the cup's screen.

## 0.208.2 — 2026-10-25
- **🥷 Stick Ninja: no more stars** (the owner's request). The ⭐ under the bridge, the tap to flip the ninja under it and the crash if it stayed upside down are gone; a tap while running does nothing now. The cover's third step tells about the moving pillars instead.

## 0.208.1 — 2026-10-25
- **🥷 Stick Ninja: moving pillars and narrower ones** (the owner's feedback). From the 10th pillar on, some pillars slide back and forth along a dashed rail: a few and slowly at first, more and faster as you go. The stick counts where the pillar is when it lands, and the pillar stops there, so aim where it will be. A flag on one is the new 🎯 Moving target achievement. Later in the run the pillars get narrower too, down to just over the flag's width.

## 0.208.0 — 2026-10-25
- **🥷 Stick Ninja, a new game in the lab** (D-446), inspired by Stick Hero (Ketchapp): hold to stretch the stick, let go and it falls across the gap. Land its tip on the next pillar's flag for a perfect: +1, then +2, +3… for each one in a row, with a pulse of light from the flag, which stays gold. Tap while running to hang under the bridge and grab the ⭐, and flip back before the pillar. Achievements pop up as you go (your first flag, streaks, stars, a new best, 10, 25, 50 points…).
- Today's course is the same for everyone, and the result lists today's runs on the phone, so a group can pass it around and compare. In English only for now, at `/labs/stick/` with a lab key.
- **Tests:** a PR that adds a game's end-to-end script and measures it in `durations.json` no longer runs every script: that file only groups the scripts, as `docs/TEST-SCOPE.md` already said, but next to any other change it used to count as the e2e tools changing.

## 0.207.2 — 2026-10-25
- **🧱 Stack (lab) pauses when you are interrupted**: a call, switching to another app or locking the screen freezes the block where it was, under "⏸️ Paused · Tap to continue". The tap back only resumes and never drops the block; before, it dropped the block wherever it happened to be, and you could lose for having been interrupted.
- **Your best is kept the moment you beat it**, not only at the end, so a game the phone closes halfway still keeps your record.

## 0.207.1 — 2026-10-25
- **🧱 Stack (lab) looks like the rest of Juegos de Salón**: the tower now stands on the app's purple night with its floating dots, instead of a background of its own, and fades into it at the bottom. The blocks take the house's neon colors (pink, orange, yellow, lime, cyan, purple), changing as the tower grows. The game screen gets a heading like the other games, with the name and your best, which lights up when you beat it. The score is yellow, and "💬 Leave a comment" sits under the tower.
- **A perfect drop is a small party**: a glowing outline with sparks, "Perfect ×n" in the rainbow of the titles, and confetti when a streak grows the block back.

## 0.207.0 — 2026-10-25
- **🧱 Stack, a new game in the lab** (D-445), inspired by Stack (Ketchapp): a block slides over the tower and a tap drops it. Whatever hangs over the edge is cut off, so the next block is smaller; a block dropped exactly on the one below cuts nothing, and four of those in a row grow the block back. Miss the tower and the game ends; the score is the height, and your best stays on the phone. In English only for now, at `/labs/stack/` with a lab key.
- A tap counts at the moment the finger touches the screen, not at the next frame, so a slower phone does not play a harder game.

## 0.206.0 — 2026-10-25
- **La Copa: the ×2 wildcard is no longer lost.** Whoever reaches the Grand Final without having used it gets it on its own on the last day they played before the final (day 6, or an earlier one if they skipped it), marked with a gold **×2 auto**. On day 6 the card and the game's cover warn: "No has usado tu comodín ×2. Se aplicará hoy automáticamente." In the 3-day cups and the weekend cup, which have no final, it goes on the last day played, and the warning shows on the last day. It also counts in the cups already running (the ones already over keep their table and podium); not in one the admin ended early (D-444).

## 0.205.5 — 2026-10-25
- **La Copa: the "Tus copas" status line shows at once, and no longer takes a row of its own.** The phone keeps a small copy of each cup's state for the list, so the line is drawn with the list and corrected after the cup is read; this phone's cups are read right away instead of after the player's cups from other phones. The line now takes the place of "name · code", in the state's color (yellow to play, cyan when played, grey otherwise), and the cup's code goes next to its name.

## 0.205.4 — 2026-10-24
- **La Copa: new wording for the "Tus copas" status line**, the owner's copy: ▶ "Día 4: ¡entra a jugar!", "hoy último día para jugar", "tienes 2 días por jugar"; ⏸ "termina tu juego"; ✅ "Ya jugaste: día 5 abre en …"; 🚪 "Eliminado". In the four languages.

## 0.205.3 — 2026-10-24
- **Every email leaves from hola@juegosdesalon.cl, and each one proves it** (D-443): `send-mail.py` refuses any other sender (no fallback to the owner's personal Gmail), reads each email's copy in Gmail's Sent folder to confirm it left from hola@, and before writing to a player sends the owner a weekly test email first. If the check fails, nothing goes out and the report stays pending until the alias is fixed (`send-mail.py --check`).

## 0.205.2 — 2026-10-24
- **🕵️ Agentes: no clue is pink any more.** A player read the pink agents as mistakes; the third clue's
  color is now blue, so red stays only for the assassin and for errors. A test
  (`public/cup/games/agents/palette.test.mjs`) keeps every clue color out of the reds, pinks and the
  marks' yellow (D-442).

## 0.205.1 — 2026-10-24
- **🕵️ Agentes: no more clue cards that depend on where you live.** A player found JULIO among the winter agents: that is winter in Santiago and summer in Madrid. The seasons no longer carry months, in Spanish (JULIO, ENERO, SEPTIEMBRE, MARZO, ABRIL, MAYO) and Portuguese (JULHO, JANEIRO, SETEMBRO, MARÇO, ABRIL, MAIO), nor EASTER for SPRING in English; they get ABRIGO, BRONCEADO, TULIPÁN, BELLOTA, COSECHA, MARRÓN (and their Portuguese and English counterparts) instead. A test stops a month from coming back into a season.
- In Spanish, PASCUA no longer tempts NAVIDAD (in Chile, Pascua *is* Christmas, so tapping it was right and still cost points; it is HALLOWEEN now), and CLIMA and LLUVIA no longer tempt TIEMPO (in Spanish tiempo is also the weather; they are REGLA and BALANZA, as in English).
- **🕵️ Agentes respects the cup's audience** (D-187), like the other games: a 🌎 Global cup no longer deals the clues only Chile knows (CHILE, DIECIOCHO, FERIA) or Brazil's (BRASIL, ARRAIAL), nor words that mean something else elsewhere (COCHE, TACO, ONCE, CABRITAS, MARRAQUETA…; PIX, CEP, BRIGADEIRO…). A 🇨🇱 Chile cup keeps the Chilean ones. Standalone and Uno al día play the whole deck, as before.
- **SUERTE, LUCK and SORTE no longer tempt bad luck** (GATO, ESPEJO, MARTES; CAT, MIRROR, LADDER; GATO, ESPELHO, TREZE): bad luck is luck too, so tapping them was right and still cost 40. They are ÉXITO, RIQUEZA, TALENTO now (and the same in English and Portuguese).
- **More temptations that were right answers:** COCINA no longer tempts REFRIGERADOR (it is DORMITORIO), DORMIR / SLEEP no longer tempt NOCHE / NIGHT (they tempt CAFÉ / COFFEE), and GLÜCK no longer tempts ZUFALL in German (it is TALENT).

## 0.205.0 — 2026-10-24
- **La Copa: "Tus copas" says where you stand in each cup.** Under each cup in course, a line tells the player whether a day is ready to play (▶, or "play it today" when it closes tonight), half played (⏸), already played and when the next day opens (✅), or how long until the cup starts (⏳); out of the cup shows 🚪. With a single day to play, tapping the cup opens that day. Tried in the lab and published the same day at the owner's request; kept in La Bodega as launched. `/cup/?test&demo=mine` seeds one cup per status.

## 0.204.3 — 2026-10-24
- **Pending work can no longer be forgotten quietly** (D-441): a daily check on GitHub keeps one "Pending work" issue with any pull request that is stuck and any branch holding work that never reached the site, and closes it when nothing is left; a session waiting for its pull request now reads GitHub another way when the first is refused, and says so instead of retrying in silence. Nothing changes for players.

## 0.204.2 — 2026-10-24
- **The agents' daily round can no longer stop unnoticed** (D-440): it now runs as a scheduled task the owner can see from the phone, its instructions live in the repo, and if a day goes by without it GitHub opens a "Processes round missed" issue that closes itself when the round catches up. The ideas agent waits for answers to its last questions before proposing more. Nothing changes for players.

## 0.204.1 — 2026-10-23
- **🎉 La Copa de fin de semana closed for new cups** (D-439): the owner's one-off weekend cup for friends is created, so no create screen offers the 3 × 3 cup any more. The cups already created play their three days as before.

## 0.204.0 — 2026-10-23
- **🎉 La Copa de fin de semana, for everyone until Sunday night, in Spanish** (D-439): a new length when creating a cup on a Spanish screen, **3 days with 3 games each day**. 🎲 draws nine different games, three a day; each day is played as one, the three games one after the other, and its score is the average of the three, which hands out the usual points by place. No final; everything else as in a normal cup. The option disappears at the end of Sunday, October 25 (Pacific time); the cups already created play on.

## 0.203.1 — 2026-10-23
- **🏆 La Copa de 3 días has no final** (D-438, in the lab): three games of the pool, each worth its points. The wildcard can go on any day, the last day closes with the cup (no grace day) and breaks a tie, and day 3 sends the usual "day opened" notification. The 3-day test cups from before keep their final.

## 0.203.0 — 2026-10-23
- **🏆 La Copa de 3 días, in the lab** (D-437): on the new create screen, a lab key holder chooses up front how long the cup lasts, next to when it starts: 3 days (two games and the final) or 7 (six games and the final). Three draws a week of two games under "Los 3 días", and the final replays both. The 3-day cup existed only for testing (`?three`, D-100); the screen of before is unchanged.

## 0.202.5 — 2026-10-23
- **Generala:** when the dice come up 3‑4‑5‑6‑1 and Escalera is still free, a line under the dice
  says it is a straight too: the 1 also goes after the 6. Tried in the lab, now for everyone; its
  card moved to La Bodega (feedback #736).

## 0.202.4 — 2026-10-23
- **Generala, in the lab:** when the dice come up 3‑4‑5‑6‑1 and Escalera is still free, a line under
  the dice says it is a straight too: the 1 also goes after the 6. A player wrote in thinking it was
  an error (feedback #736). It shows only with a lab key, listed in /labs/ under Mejoras en prueba.

## 0.202.3 — 2026-10-23
- **Uno al día: the ranking shows sooner, for everyone** (D-436, out of the lab, its card in La Bodega 🚀): /today/ draws the month's ranking once and keeps it while the page refreshes, shows the list seen last today while the new one arrives instead of "Cargando…", and reads its data once.

## 0.202.2 — 2026-10-23
- **Uno al día, in the lab: the ranking shows sooner.** With a lab key, /today/ draws the month's ranking once and keeps it while the page refreshes, shows the list seen last today while the new one arrives instead of "Cargando…", reads the table and last month's champion together, and reuses the read the page just made (D-436, card `#seccion-uad-ranking-rapido`).
- For everyone: the home page no longer draws its last-visit copy (D-435) from a link with `?daily=` (Uno al día next to the die), whose layout the copy does not have, nor saves one from it.
- For everyone: with `?daily=button`, the home page draws Uno al día's button next to the die again (an error had left it out).

## 0.202.1 — 2026-10-23
- **⚡ La portada al tiro, for everyone** (D-435, validated in the lab): from the second visit of the day the list of games, La Copa and Uno al día show with the page's first paint, from a copy of the list the phone keeps, and once today's Uno al día is played its card's place in the month refreshes on its own. Its card moves to La Bodega, 🚀 Lanzado.

## 0.202.0 — 2026-10-23
- **⚡ La portada al tiro, in the lab** (D-435, card in `/labs/`): from the second visit of the day the list of games, La Copa and Uno al día show with the page's first paint (1.4 s instead of 2.9 s on a slow 4G), from a copy of the list the phone keeps, and the real cards take its place unchanged. Once today's Uno al día is played, its card's place in the month refreshes on its own, without opening Uno al día.
- For everyone: the home page reserves the right space for the filters (two rows) and shows the 🏅 rankings button from the start, so the list no longer jumps down when the page's code arrives (layout shift at 320 px from 0.127 to 0.02).

## 0.201.2 — 2026-10-23
- **Uno al día's card on the home page arrives together with La Copa**: the empty 📅 card no longer shows for a moment before turning into the real one (320 ms on a slow 4G). Two modules it imports (`fin.js`, `daily-points.js`) and the traffic module with the three it brings were fetched one after another; now they are preloaded with the page, and `home-preload.test.mjs` fails if one goes missing again.
- Counting the visit (`trackVisit`, D-208) no longer holds up the home page's list: it loads on its own.

## 0.201.1 — 2026-10-23
- **🍹 Julepe leaves the home page for the lab's 📦 La Bodega** (D-434, the owner's request): its dimmed "Próximamente" card is gone from the home page, and it is no longer in the 🔎 search. The game is kept, unchanged, at `/labs/julep/`, behind the lab's key, folded in La Bodega's 🎲 Juegos guardados; the old links (`/julep/`, `/julepe/`, room invitations included) lead there, and without a key to the menu.

## 0.201.0 — 2026-10-23
- **👈 Leaving mid-game asks first, for everyone** (D-432): a back swipe (the iPhone's edge swipe, Android's Back) or «‹ Menú» during a game opens «¿Salir de la partida?» with ▶ Seguir jugando and Salir. Validated in the lab; its card moves to La Bodega, 🚀 Lanzado.
- **📅 Uno al día's first attempt counts from its start, for everyone** (D-433): a solo game left halfway goes on where it was (and Uno al día goes straight to it, without the die); a group game left halfway, or a day that ends unfinished, counts 0; with a player, also across phones.
- **🏆 La Copa's clock no longer resets on another phone, for everyone** (D-433): a day resumed where its save is missing goes on from when it started, and says so.

## 0.200.17 — 2026-10-23
- **🏆 La Copa's clock change can be tried in one tap** (D-433, lab): the lab card «La Copa: el reloj no vuelve a cero en otro celular» now opens a sample cup (`?test&lab&demo=resumed`, only on the phone) where your day started 4 minutes ago on another phone; «Seguir jugando» goes on from about 4:00 and says so.

## 0.200.16 — 2026-10-23
- **👈 «‹ Menú» mid-game asks too** (D-432, lab): tapping the header's Menú during a game opens the same «¿Salir de la partida?» as the back swipe; Salir goes to the menu.
- **📅 Uno al día goes straight to an attempt left halfway** (D-433, lab): the home page's ▶ and /today/'s Jugar skip the die and open today's game, saying «▶ Seguir jugando» for a solo game.

## 0.200.15 — 2026-10-23
- **👈 A back swipe mid-game asks before leaving** (D-432, lab): with a lab key, the iPhone's edge swipe and Android's Back no longer take the game away. They open «¿Salir de la partida?» with ▶ Seguir jugando and Salir. Every game gets it, and Back works as usual once the game is over.
- **📅 Uno al día: the first attempt counts from its start** (D-433, lab): with a lab key, leaving a bad attempt no longer lets you replay the same board from zero. A solo game left halfway goes on where it was, with its time; a group game left halfway, or a day that ends unfinished, counts 0. With a player, this also holds across phones (`unoAlDiaInicio/` in the Firebase rules).
- **🏆 La Copa: the clock does not reset on another phone** (D-433, lab): with a lab key, a day resumed where its save is missing keeps its clock from when it started, and the screen says so.

## 0.200.14 — 2026-10-23
- **🏆 La Copa's and 📅 Uno al día's recaps, for everyone** (D-423, D-424, validated by the owner in the lab): when a cup you played ends, or a month of Uno al día, your next visit to the home page tells how it ended, once. Their lab cards move to La Bodega, 🚀 Lanzado.
- **🪟 One window per visit on the home page, for everyone** (D-431, validated by the owner in the lab): the recap, the novelty splash and the add-to-home-screen bubble no longer pile up. At most one opens per visit, in that order, and the rest wait for the next visit. With two splash campaigns on, a player sees one per visit, in order. The lab card moves to La Bodega, 🚀 Lanzado.

## 0.200.13 — 2026-10-22
- **🧪 In the lab: one window per visit on the home page** (D-431, the owner's request): the La Copa or Uno al día recap, the novelty splash and the add-to-home-screen bubble no longer pile up. At most one opens per visit, in that order, and the rest wait for the next visit. With two splash campaigns on, a player sees one per visit, in order. Only with a lab key until the owner validates it (D-409).

## 0.200.12 — 2026-10-22
- **🚂 A teaser over the home page, through October 28** (D-430, the owner's request): "Muy pronto · Algo nuevo se viene…", a pixel-art train that stops at the edge of a gap at sunset, with no name and no link. In Spanish for Spanish players and in English for everyone else.
- **Splash windows queue up:** with more than one campaign on, a player sees them in the order they were turned on, and closing one opens the next. Each one is still seen once per phone.

## 0.200.11 — 2026-10-22
- **Uno al día breathes under the header:** its calendar and title start 16 px lower, no longer pressed against the language buttons. The ▶ Jugar button still shows without scrolling, down to a 320×568 phone.

## 0.200.10 — 2026-10-22
- **One fixed link turns on the lab in every PR preview** (D-429): the previews front page saves a lab key opened as `ellokojavi.github.io/juegos-de-salon-previews/?key=…`, even when no PR is open. Nothing changes for players.

## 0.200.9 — 2026-10-22
- **Each PR gets a preview on GitHub Pages** (D-429): a link on the PR to the change running before it merges, so review rounds happen there instead of a PR per round. Previews are marked `noindex`, live apart from the real site, clean themselves up when the PR closes, and their plays count as test traffic, not in the panel or the rankings. Nothing changes for players.

## 0.200.8 — 2026-10-22
- **Releases get faster, with the same checks** (D-428): La Copa's languages test runs in four parallel parts instead of one six-minute job, and the test groups are re-measured every day, so the end-to-end check takes 6–7 minutes instead of 8–10. Sessions no longer run locally the whole end-to-end suite that GitHub runs anyway. Nothing changes for players.

## 0.200.7 — 2026-10-22
- **La Copa, in the lab:** the recap of an ended cup on the home page shows the same final table image the cup shares from its podium: the trajectory day by day and the first three on gold, silver and bronze plates (D-427).

## 0.200.6 — 2026-10-22
- **On a small phone, 🎲 Crear al azar brings the week into view** (D-425, lab): if the days are below the screen's edge, rolling scrolls the page so you see the cards spin.

## 0.200.5 — 2026-10-22
- **🎲 Crear al azar spins the cards** (D-425, lab): when you roll the week while creating a cup, each day's card runs through random games like a slot machine and lands one after the other, in under a second.

## 0.200.4 — 2026-10-22
- **README, half the size**: what a visitor needs first (the pitch, The Cup, One a Day, the games) comes first, the developer and owner material follows under its own heading, and repeated detail now points to each game's spec and the decisions.

## 0.200.3 — 2026-10-22
- **🏆 Creating a cup in the lab, after the owner tried it** (D-425): the yellow button now says **🎲 Crear al azar** and draws the whole week again; the 🔒 locks are gone (a day can still be changed or moved by hand); the sheet closes with a yellow **Listo**; and "When it starts" says each day of the week, with Now instead of Today: **Ahora (jue)**, **Mañana (vie)**, Otra fecha.

## 0.200.2 — 2026-10-22
- **La Copa:** Thursday Guys #4's recap goes first on its players' home page, even if another cup of theirs ended after it (D-426).

## 0.200.1 — 2026-10-22
- **La Copa:** the players of Thursday Guys #4 see the recap of their cup on the home page when it ends, without a lab key: the owner opened it for them while the window is still in the lab (D-426).

## 0.200.0 — 2026-10-22
- **🏆 Creating a cup, a new screen in the lab** (D-425): for lab key holders only, the week is in view from the start; **🎲 Another week** draws again and keeps the days locked with 🔒; four week styles (⚖️ Balanced, 🧩 Puzzles, 🧠 Trivia and words, ✨ What's new); tapping a game opens a sheet with the 13 games and what each one is, to replace, swap or move a day and pick its version. The PIN goes once with 👁, and the language, audience and custom link fold into "More options". The form is about 40% shorter. Everyone else keeps the screen of before.

## 0.199.0 — 2026-10-22
- **Uno al día, in the lab:** when a month ends, the first visit to the home page in the next week tells whoever played it how the season ended: who won, your place and points, the top 10 with each player's place week by week, "the new season has begun" and 📅 Ir a Uno al día. Once per season; La Copa's recap goes first if both are due. Only with a lab key until the owner validates it; `/?recap=season-demo` shows a made-up October (D-424).
- **Uno al día:** a new notification on the 1st to the 3rd of the month, for whoever has One a Day's notifications on and played the month before: "🏆 Terminó la temporada de octubre. Toca para ver el ranking final.", which opens that season's recap (D-424).
- **Uno al día:** the nightly points rebuild also keeps each season's places by week (`uadTemporada/`, public to read, written only by the administrator) (D-424).

## 0.198.0 — 2026-10-22
- **La Copa, in the lab:** when a cup you played ends, the next time you open the home page a window tells you how it ended: who won and your place, the final table with a small line of each player's place day by day and the places they climbed or lost, and 🏆 Ver la copa. Once per cup, during the week after it ended; that visit, the news splash waits for the next one. Only with a lab key until the owner validates it; `/?recap=demo` shows it with the demo cup (D-423).
- **La Copa:** the notification that a cup ended now ends with "Toca para ver la tabla final." in the four languages (D-423).

## 0.197.0 — 2026-10-22
- **🕵️ Agentes leaves the lab, in Conexiones' place** (D-421): the one-player Codenames is on the home page with the ✨ Nuevo label, at `/agents/`, in the four languages, each with its own deck of about 118 clues. It joins La Copa's pool and its demo calendars, the Gran Final plays it whole, and Uno al día deals it from 2026-10-24. Standalone it is a random board every time.
- **🔗 Conexiones goes to 📦 La Bodega:** off the home page, the search, the pool of new cups and Uno al día (from 2026-10-24). Its page `/connections/` still opens, the lab lists it folded in La Bodega, and the cups created before keep playing it.
- `/labs/agents/` is now a bridge to `/agents/`.

## 0.196.3 — 2026-10-22
- **🧪 The lab's 📦 La Bodega in two subgroups** (D-422, the owner's request): 🎲 Juegos guardados (El caso and La clave, 💤 they did not prosper, and Cuarto Rey, 👋 it left the home page) and ✨ Mejoras lanzadas (the six improvements that reached everyone, 🚀). The cards stay folded to their title.

## 0.196.2 — 2026-10-22
- **👑 Cuarto Rey leaves the home page for the lab's 📦 La Bodega** (D-420, the owner's request): it is no longer on the home page, in 🎲 Juego al azar, in the 🔎 search or in the home page's link cards. The game is kept, unchanged, at `/labs/fourth-king/`, behind the lab's key, folded in La Bodega like the other stored projects; the old links (`/fourth-king/`, `/cuarto-rey/`) lead there, and without a key to the menu.

## 0.196.1 — 2026-10-22
- **La Copa:** the 🏁 Grand Final's folded rules say once that games without a short version are played whole with new content, instead of repeating it on every such round.
- **Lab:** the practice of 🏁 La Gran Final, which has no week, says it is five short rounds again.

## 0.196.0 — 2026-10-22
- **La Copa:** the 🏁 Grand Final now repeats the week's games, one round of each in the order they were played, instead of five fixed rounds that could bring back games the cup never played (D-418). The five games with a short version play it; any other game (Zip, Tango, Conexiones, ¿Dónde queda?…) is played whole with new content. The waiting room lists the rounds and "Ronda i de n" counts them. Finals that opened before October 22 noon (Pacific) keep their five rounds.
- **La Copa:** between the final's rounds, the running score is the average of the rounds played so far, out of 100 (as D-417 decided, for any number of rounds).

## 0.195.11 — 2026-10-22
- **🏁 La Gran Final shows your running score on the right scale** (D-417): between rounds it now reads the average of your rounds so far out of 100 ("Vas con 100 de 100…"), the same scale as the result, instead of mixing an average with a maximum of 100 per round ("60 de 300"). Scoring does not change (player's report, #637).

## 0.195.10 — 2026-10-22
- **Processes:** every ready PR gets auto-merge without asking; the only exception is the owner explicitly saying not to auto-merge it (D-419).

## 0.195.9 — 2026-10-22
- **La Copa: a player who joined with their player and whose phone lost its session can play again.** Before, "Ya estoy inscrito" hid the PIN field and answered "Ese PIN no es el de…" without asking for one; now it explains that the phone lost the player's session and asks for the player's PIN (a new cup PIN from the administrator works too). D-416.

## 0.195.8 — 2026-10-21
- **Home page:** once played, the 🔥 streak of the Uno al día card goes in the line under your place («871 pts · 🔥 6») instead of a row of its own.

## 0.195.7 — 2026-10-21
- **Uno al día:** each friend you invite who finishes their first Uno al día adds +10 pts to your month, for everyone (it was in the lab).

## 0.195.6 — 2026-10-21
- **Home page:** the 📅 Uno al día card opens your Uno al día, and its button plays today's game right away; once played, it shows your place in the month big, with the points under it.

## 0.195.5 — 2026-10-21
- **Uno al día:** the ranking on /today/ can be shared as a picture, with a short line and the link to play (your invite link if you are signed in). Once you have played, the ranking comes before today's block. «Compartir mi resultado» and the «Por juego» block leave /today/ (the result card of the game keeps its share).

## 0.195.4 — 2026-10-21
- **Uno al día:** your place in the month («#3 del mes · te faltan…») has its own line from the start, with the last one known, so the page no longer shifts down when the ranking answers.

## 0.195.3 — 2026-10-21
- **Uno al día:** your month's points on /today/ match the ranking and no longer jump when it loads. The days your 🧊 saved now count on the server too, so the streak bonus continues after them, and the month's totals are recalculated every night.

## 0.195.2 — 2026-10-21
- **Uno al día, in the lab:** each friend you invite who finishes their first Uno al día adds +10 pts to your month, once per friend; and on the home page the 📅 card opens your Uno al día while its «▶ Jugar hoy» goes straight to today's game («✅ Tus puntos» once played).

## 0.195.1 — 2026-10-21
- **Uno al día:** the wildcards and the invite are one box: how many you have, what a wildcard does, how to earn one, and the Invitar button.

## 0.195.0 — 2026-10-21
- **Uno al día has points:** every day adds the game's score plus a streak bonus (+5 a day, up to +50) to a monthly season, with its own ranking. /today/ opens with your points, your place and who you have to pass, the days left in the month and how points are earned; the calendar shows what each day added, and tapping a day shows its details. The 📅 card on the home page now opens Uno al día, and its Jugar rolls the die. Last month's winner wears a 🏆 next to their name. October's season was filled in from everyone's history, and November starts from 0. In the four languages.

## 0.194.8 — 2026-10-21
- **Uno al día, in the lab:** the real screen redesigned on the site's own layout, like /today/: one box for the season, points and today, fewer boxes overall, a single sign-in nudge, /today/'s calendar with the day's details right under it, «Compartir mi resultado» once today is played, four-point rules and a tidier footer.

## 0.194.7 — 2026-10-21
- **Uno al día, in the lab:** the points show at once from this phone; the place and the ranking fill in after, and the days already counted are no longer read one by one.

## 0.194.6 — 2026-10-21
- **Processes:** a change that only touches the lab takes a fast lane: the session makes it and checks it at 320 px itself, without the review agents, and runs only the tests for what changed (D-413).

## 0.194.5 — 2026-10-21
- **Uno al día, in the lab:** big centered title with the gradient, yellow points no longer cut, a plain «Jugar» button, the invite card under the calendar, and a day's details float over the calendar (✕, another day or a tap outside closes them).

## 0.194.4 — 2026-10-21
- **Lab, Uno al día:** the real screens get the owner's touches: the title "Uno al día" on the right, the month's points bigger and in the titles' rainbow, "quedan X días" in white (the owner's choice for the season's end), one invite card with the +10 pts, a tap on a calendar day shows its details (game, score, streak bonus, points or the 🧊 that saved it), and a footer with home, rankings, today's game and 💬 Sugerencias y comentarios (D-412).

## 0.194.3 — 2026-10-21
- **Lab, Uno al día points:** "Tu Uno al día" works with real data (`/labs/daily-score/live/`): your month's points and place, who to pass next, the champion's 🏆, the streak bonus and the month's calendar. Its ranking is the same one 🏅 Rankings and Uno al día's result show, with a lab key (D-412).

## 0.194.2 — 2026-10-21
- **Lab, Uno al día points:** the owner's answers are in the prototype: a "¿Cómo se ganan los puntos?" link under the chase line, the season's end shown three ways to choose from, a 🏆 champion badge for last month's winner, +10 points for inviting a friend, and Uno al día's notices and links opening your Uno al día. A lab key holder's points are now saved in Firebase, checked by the rules against their history (D-412).

## 0.194.1 — 2026-10-21
- **La Copa:** in 🔢 Toque y Fama: adivina el número, tapping a box chooses where the next digit goes, for everyone, as in Toque y Fama. Validated in the lab; its card moves to La Bodega, 🚀 Lanzado (D-409).

## 0.194.0 — 2026-10-21
- **Lab: Uno al día points** (`/labs/daily-score/`): a design prototype for a monthly Uno al día score and ranking. Each day adds the game's 0–100 score plus a streak bonus (+5 per day, up to +50); a wildcard 🧊 saves the streak and its bonus. The home card would open the player's Uno al día hub (points and rank first, then play, streak, wildcards, ranking and calendar) instead of rolling the dice. Screens, navigation map and open questions; it saves nothing.

## 0.193.2 — 2026-10-21
- **La Copa, in the lab:** in 🔢 Toque y Fama: adivina el número, tapping a box chooses where the next digit goes, as in Toque y Fama. Only with a lab key until the owner validates it (D-409).

## 0.193.1 — 2026-10-21
- **The home page no longer scrolls behind the open share card** (owner's report): with the card open, swiping moves only the card, and closing it leaves the home page where it was.

## 0.193.0 — 2026-10-21
- **Toque y Fama:** tap a box to choose where the next digit goes, instead of always filling left to right: handy once you know where a digit goes. It was asked for by a player (#604), tried in the lab and now reaches everyone; the hint under the keypad explains it in the four languages.

## 0.192.0 — 2026-10-21
- **🎬 The home page's share button now plays the new 40-second video right in the card** (D-410), as a tall vertical video with two tabs, 🇪🇸 Español and 🇬🇧 English. Spanish opens on the Spanish video and every other language on the English one; it starts on its own, muted, and the two ways to share stay underneath: "Invitar a jugar" and "Compartir el video", which sends the link of the video on show. The card now opens in all four languages. The video itself is new too (v7): it shows the five games added since the last one (Generala, Julepe, Rutas rotas, Loteo and Pintaminas) and has an English version.

## 0.191.1 — 2026-10-21
- **Processes:** every change goes to Labs first unless the owner says otherwise (D-409). The owner's one-tap decisions answer **Yes, in Labs**, **Yes, and publish** or **No**, and whatever is behind the lab key is listed in `/labs/` (a test checks it).

## 0.191.0 — 2026-10-21
- **Loteo:** the four buttons below the board go in two rows of two, all the same size: ↩️ Deshacer and 🧹 Borrar todo on top, 💡 Ayuda and 🏳️ Rendirse below. No label breaks into two lines on a small phone or in German (#441).
- **Toque y Fama, in the lab:** tapping a box chooses where the next digit goes, instead of always filling left to right (#604). Only with a lab key until it is validated (D-395).
- **Processes:** a one-tap decision whose Yes has no actions, or does nothing while its text says it queues or builds work, is refused when the issue is opened (#607).

## 0.190.2 — 2026-10-21
- **The home page announces the three new logic games** (Rutas, Loteo and Pintaminas) in the promotional splash, through Friday, October 23 (D-351). Each phone sees it once: closing it or opening a game hides it for good.

## 0.190.1 — 2026-10-21
- **📐 Loteo's waiting room no longer jumps when you switch between Números and Servicios**: the demo board keeps its space while the next one loads, and both variants put the title at the same height (owner's report).

## 0.190.0 — 2026-10-20
- **Owner's panel: 🕑 Timeline** (D-408). A new section lists the key events one by one, with who and when (Pacific time): games that reached an ending (rooms, offline, One a Day, La Copa days), cups created, joined or finished, and feedback sent. Filter by kind, count by day, week or month and by hour of day, and tap a period to list only its events; ⬇︎ CSV included. Nothing changes for players.

## 0.189.4 — 2026-10-20
- **📝 Generala explains every box**: under "¿Cómo se juega?" a new list says what each box asks for and what it is worth, normal and on the first roll: Unos a Seises, Escalera, Full, Póker, Generala and Doble generala, in the four languages (owner's request).

## 0.189.3 — 2026-10-20
- **Generala:** the estimated time now reads 5–30 min instead of 15–30: a solo game takes about 3 to 5 minutes. It changes on the home page, the game's page and its link card.

## 0.189.2 — 2026-10-20
- **📝 Generala says it is like Kniffel or Yatzy**, on its home card and its link card in the four languages, and searching "kniffel" or "yatzy" finds it in every language (owner's request).

## 0.189.1 — 2026-10-20
- **Generala:** at the end of a solo game, the ranking (and "make it count?") no longer sits flush against the "Cambiar de modo / Volver al menú" row; everything under the buttons is spaced 12 px apart.

## 0.189.0 — 2026-10-20
- **📝 Generala opens from the home page** (D-405): it leaves "Próximamente", carries the ✨ Nuevo label for two weeks and joins 🎲 Juego al azar, the favorites and the search like any other game. Roll five dice up to three times and fill your card, on one phone, several phones or solo.
- **Generala joins Uno al día from October 23**, the first day of the next deck, so no day already played changes: on its day `/generala/?today` plays solo with the same dice for everyone, and scores a third of the total, up to 100 (D-247).

## 0.188.3 — 2026-10-20
- **Home page filters**: the shortcuts (🔎, ⭐ Favoritos, ✨ Nuevos, 🔥 Populares) are now outlined and the types filled, so the two rows read as two kinds of filter; the chosen one is the same cyan in both (D-407).

## 0.188.2 — 2026-10-20
- **Lab: 💊 Píldoras de filtros** (D-406): a page to compare six ways the home page filter rows could look, with the pros and cons of each.

## 0.188.1 — 2026-10-20
- **🔎 Search in Portuguese and German** (D-404): every game, and La Copa, can now be found by what it is in all four languages ("dados", "Würfel", "quebra-cabeça", "Rätsel"…), and searching a kind of tournament (3 or 7 days, Chile, Brazil) finds La Copa. A new game cannot ship without its search keywords in the four languages: a test asks for them.

## 0.188.0 — 2026-10-20
- **🔎 Search on the home page, for everyone** (D-403): a 🔎 pill next to ✨ Nuevos and 🔥 Populares opens a search box with a dropdown of games while typing, by name or by what they are (logic, dice, words…).
- **Lab**: the home page experiments, 🔎 Buscar and 🎉 Splash, move to La Bodega marked 🚀 Lanzado.

## 0.187.18 — 2026-10-20
- **Lab search (?search): the 🔎 no longer shrinks when the search opens** (D-402): it keeps the pill's size and only slides into place.

## 0.187.17 — 2026-10-20
- **Lab search (?search): closing no longer flickers** (D-402): the field folds back into the 🔎 in one smooth motion instead of freezing and the magnifier blinking.

## 0.187.16 — 2026-10-20
- **Lab search (?search): the 🔎 opens and closes smoothly** (D-402): the field grows out of the 🔎 pill exactly where it sits and folds back into it, its magnifier never jumps, and the pills under it fade out and back in while it moves, instead of vanishing and popping back.

## 0.187.15 — 2026-10-20
- **A decisions index left behind by other PRs no longer fails the next PR** (D-401). The `tests` check rebuilds it and warns; the processes round brings it up to date on main.

## 0.187.14 — 2026-10-20
- **Addresses without empty `=`.** Choosing a filter on the home page, or opening a lab link with its key, no longer turns `?test&lab` into `?test=&lab=`.

## 0.187.13 — 2026-10-20
- **Lab search: the 🔎 pill opens and closes with a motion** (D-398). The field grows out of the pill and folds back into it.

## 0.187.12 — 2026-10-20
- **Auto-merged PRs merge about two minutes sooner** (D-400). The `end-to-end` check no longer holds itself open for the app's PR monitor; sessions learn of the merge with `tools/agents/wait-pr.mjs`.

## 0.187.11 — 2026-10-20
- **Lab: «‹ Lab» centered in the experiments bar.** Its text sat at the top of its pill, higher than the checkboxes next to it.

## 0.187.10 — 2026-10-20
- **Lab: the home page experiments bar opens with the newest experiment on** (D-399). The others can be ticked on top of it, and it lists the newest first.

## 0.187.9 — 2026-10-20
- **Lab search: games whose name matches come first** (D-397). In the home page search's dropdown, a match in the game's name ranks above its keywords, its type and its description: "toque" now starts with Toque y Fama.

## 0.187.8 — 2026-10-20
- **Home page search (lab):** the 🔎 pill goes first in its row, left of ⭐ Favoritos (D-396).

## 0.187.7 — 2026-10-20
- **Lab only behind its key:** the home page's search (`?search`), the experiments bar (`?lab`) and the preview of a splash campaign that is not on now open only for whoever holds a lab key; everyone else sees the home page as it is (D-395).

## 0.187.6 — 2026-10-20
- **Nothing changes for players.** Behind the scenes, the design decisions moved from one 700 KB file to one file each (`docs/decisions/`), with a generated index in `docs/DECISIONS.md` (D-394): cheaper to read, no merge collisions, and checked by the tests.

## 0.187.5 — 2026-10-20
- **Home page search (lab, `?search`):** on a computer, ↓ and ↑ move through the dropdown, Enter opens the selected game (or filters on «Ver los n juegos»), and Escape folds the dropdown before closing the search (D-393).

## 0.187.4 — 2026-10-20
- **A push to a PR tests only what changed since it last passed** (D-392). A fix, a changelog entry or the agents' commits after a green run no longer rerun the whole PR's end-to-end scope; the first push, or one after a red run, still tests it all.

## 0.187.3 — 2026-10-20
- **Fewer end-to-end tests on each PR** (D-391). The scope reads what a page loads on demand (`import('…')`, `new URL('…')`), so a home page or lab search change runs 8 jobs instead of 76, and a new test stops any file or script the scope cannot place.

## 0.187.2 — 2026-10-20
- **Lab: the home page search is a 🔎 pill with a dropdown** (D-390). The pill sits next to ✨ Nuevos and 🔥 Populares and opens into a field in their place; while typing, a dropdown names up to five games (a tap opens one) and "Ver los n juegos" filters the list. The list does not move while typing.

## 0.187.1 — 2026-10-20
- **Lab: the home page's experiments in one card, picked with checkboxes** (D-389). 🎉 Splash and 🔎 Buscar are now one 🏠 Experimentos de la portada card. The bar on the home page has a box per experiment, to try none, one or several at once.

## 0.187.0 — 2026-10-20
- **Home page search, in the lab** (D-387). With `?search` (a switch on the lab's home page bar), a box above the filters narrows the list while typing: by a game's name in any language, its tagline, its type or its keywords in Spanish and English ("lógica", "dados", "dice", "cards", "map"). Accents and capitals do not count, it combines with the type filters, and "Ver todos" clears it. Players do not see it yet.

## 0.186.22 — 2026-10-20
- **Pips (lab): 🎲 Empezar fits on a short phone.** At 320×568 the cover's demo board shrinks, so the start button shows without scrolling (U-39).

## 0.186.21 — 2026-10-20
- **Pips (lab): every zone in one piece.** Some boards had a zone split into two cells that did not touch. Now every zone is a single block. Today's boards may change for anyone who reloads.

## 0.186.20 — 2026-10-19
- **Pips (lab): no more stuck dominoes.** A domino dragged and let go outside the board, or interrupted (by Limpiar, Deshacer or a second finger), could leave a copy floating over the board. Now it always goes away.

## 0.186.19 — 2026-10-19
- **Pips (lab): bigger dominoes in the tray.** The dominoes to choose from are about 10% larger, still four to a row.

## 0.186.18 — 2026-10-19
- **Pips (lab): bigger dominoes.** The dominoes in the tray and the cells of the board are larger, so they are easier to grab and drag. On a short screen the board shrinks a little so the tray stays in view.
- **Pips (lab): the rules under the board.** A folded "¿Cómo se juega?" under the buttons brings back the cover's three steps without leaving the game.

## 0.186.17 — 2026-10-19
- **Pips (lab): boards that do not all add up.** The zones now mix `=`, `≠`, `<` and `>` with the numbers, so you deduce more and add up less. There are fewer one-cell zones, and a domino never lies inside a single zone. Each board still has exactly one answer (D-386).
- **Pips (lab): a bigger board on the cover.** The board that solves itself on the cover is larger, so its dominoes stand out.

## 0.186.16 — 2026-10-19
- **Pips (lab):** the diamond with each zone's rule now sits inside its cell, and a tap on it lights up its whole zone. Dominoes can be dragged onto the board (or held to lift them), and moved once placed; one tap turns a domino, and turning it no longer moves the rest of the screen. New ↩️ Deshacer and 🧹 Limpiar buttons (D-385).

## 0.186.15 — 2026-10-19
- ⏱ **Loteo and Reinas show the time again while you play**, since how fast you finish gives you points (D-384, a player's request).

## 0.186.14 — 2026-10-19
- 🐞 **Your comments and emails reach us within about 5 minutes**: the upload of feedback reports moved from a GitHub schedule (which ran about 4 times a day) to the Mac mini (D-382).

## 0.186.13 — 2026-10-19
- **Marketing: a post and an image for Reddit r/chile.** "Solo o con amigos": a 1080×1350 image with six real screens and the post's text, in `marketing/reddit-chile/` (D-356, U-40).

## 0.186.12 — 2026-10-19
- **Pips, a dominoes puzzle, in the lab.** Lay every domino on the board so each colored zone keeps its rule: its pips add up to a number, are all equal or all different, or add up to less or more than a number. Three boards from easy to hard against the clock, the same for everyone each day. Inspired by Pips, from The New York Times Games. Only for lab testers for now.

## 0.186.11 — 2026-10-19
- **Marketing: promotional material looks like the app.** Every promotional item uses the app's colors and fonts (Bangers and Nunito), never a look-alike (U-40, D-380).

## 0.186.10 — 2026-10-19
- **Behind the scenes:** the game-ideas agent now ranks games by games finished in the last four weeks, the same count that orders the home page, so it no longer raises a false "order drifted" alarm.

## 0.186.9 — 2026-10-19
- **No clock at the top while playing La Copa's games**: the ⏱ that counted up next to each game (and next to the ⏳ countdowns of Rutas rotas, Zip, Desenredo and Línea Relámpago) is gone. Your time is still measured the same way and shows at the end: on the result, the standings and the share text (D-379, #442).

## 0.186.8 — 2026-10-19
- **Faster checks on each PR.** A change to one game now runs that game's end-to-end scripts and La Copa's, not half the suite, and each PR shows its test scope in the run's summary (D-378). Nothing changes for players.

## 0.186.7 — 2026-10-19
- **Faster checks for La Copa's changes.** The home page and the games that are not La Copa's no longer load La Copa's rules and engine, so a change to La Copa runs about half as many end-to-end scripts (D-377). Nothing changes for players.

## 0.186.6 — 2026-10-19
- **La Copa: eliminated players stand apart.** Whoever is out of the cup now shows faded in the table, with the days they will not play replaced by one "Eliminado" pill, a faded line in the day-by-day chart, and the same in the image shared with the group (🚪 and ELIMINADO). They no longer show "-2J" games left (D-376).

## 0.186.5 — 2026-10-19
- **Back from the dice, the home page is ready at once.** If you rolled 🎲 and went back before the game loaded, the dice used to stay over the home page for a few seconds and 🎲 would not roll again; now it shows only on the game it opened (D-375).

## 0.186.4 — 2026-10-18
- **Softer "Nuevo" and "Popular" labels.** The stickers on the game cards keep their shine and their little wobble, but now blend with the card: a see-through fill, a thin edge in their own color and a gentler glow (D-373).

## 0.186.3 — 2026-10-18
- **🎲 Juego al azar picks among every game.** With a type filter on, the dice used to pick only among those games (with 🎲 Cartas/Dados, always Dudo); now it is always general, over every game, leaving out only La Copa and the games that need a group (D-374).

## 0.186.2 — 2026-10-18
- **🎲 Juego al azar skips Cuarto Rey.** The dice no longer lands on a game that needs a group gathered (three or more players): whoever rolls it may be alone. The same goes for 🎲 Jugar otro after Uno al día. Cuarto Rey stays on the home page and in its filter (D-374).

## 0.186.1 — 2026-10-18
- **The floating filters stay put after a tap.** Scrolled down the home page, tapping a game type or ✨ Nuevos / 🔥 Populares used to drop the floating menu back to its place when the result was short; now it keeps floating over the first card until you scroll up.
- **Lab: the home page experiments go to La Bodega.** Everything they tried already reached everyone, so the card is kept folded in 📦 La Bodega (D-372).

## 0.186.0 — 2026-10-18
- **The home page shows what is popular and what is new.** The three games people finished most in the last four weeks wear a 🔥 Popular label, and two new chips above the game types, ✨ Nuevos and 🔥 Populares, show only the new games or only the popular ones, with ⭐ Favoritos beside them. Scrolling down, the floating filters now carry the name Juegos de Salón; a tap on it goes back to the top.

## 0.185.3 — 2026-10-18
- 💬 **The feedback forms ask for a name or nickname**, not a full name: "¿Cómo te llamamos?" on La Copa's 🐞 and "Nombre o apodo (opcional)" in Sugerencias y comentarios and the lab forms, in the four languages, and the browser suggests the first name instead of the full one.

## 0.185.2 — 2026-10-18
- 📧 **A reply in the player's own email thread no longer quotes their email**, which they see right above; 🐞 reports are still quoted (D-370).

## 0.185.1 — 2026-10-18
- 📧 **Replies to players who suggested a change** follow one standard (thanks, what changed, what stayed the same), go out once the change is live, and close the issue with the `replied` label and a quote of what we answered (D-368).

## 0.185.0 — 2026-10-18
- 🔢 **Toque y Fama on two phones: both guess at once.** No more waiting for the rival's turn: each one
  guesses at their own pace, whoever cracks it waits for the other, and fewer guesses wins (the same
  number is a tie). The right of reply stays only on one phone, which keeps its turns. A player's idea
  (#538, D-367).

## 0.184.5 — 2026-10-18
- **Feedback issues no longer show a player's full name**: each word is reduced to its first letter and asterisks (`C******* A*******`), and the email mask now keeps the first and last letter of each side of the @ (`j********n@g********m`). The address stays private, as before (D-366).

## 0.184.4 — 2026-10-18
- **Lab: the app's name on the floating menu, and ⭐ Favoritos beside Nuevos and Populares.** Among the home page's experiments in the lab, the filters that float while scrolling now carry "🎲 Juegos de Salón" on top (a tap goes back up), and the favorites chip joins the new row with its name. Nothing changes for players yet.

## 0.184.3 — 2026-10-18
- **Loteo: the board no longer shifts while you play.** The line above it (the plot size, a mistake, a hint) now keeps one fixed height, so the grid stays in the same place whatever it says.

## 0.184.2 — 2026-10-18
- **Lab: the home page's experiments now open on the real home page.** On an iPhone the filters did not stay on top while scrolling the lab's home page; now `/labs/home/` opens the home page itself with the experiments bar, so it behaves as it will for players. Nothing changes for players.

## 0.184.1 — 2026-10-18
- **Lab: "Nuevo" and "Populares" filters on the home page.** Two more chips above the game types, to see only the new games or the three most popular, can be tried from the lab's home page experiments. Nothing changes for players yet.

## 0.184.0 — 2026-10-18
- **The home page puts the most played games first, every week.** The order of the games now follows the games people finished in the last four weeks, and it updates itself once a week; new games still go on top while they say "New".

## 0.183.1 — 2026-10-18
- **A game-ideas agent for the owner.** A new agent reads the panel's numbers, the lab and what players asked for, and proposes up to three ideas a week (meta-game, existing games, new games with their inspiration credited) as one-tap decisions, each with evidence, cost, a prototype path and the number that would prove it; its ledger remembers what the owner answered. Nothing changes for players yet.

## 0.183.0 — 2026-10-18
- **No cup PIN when you have a player**: signed in with your player, you create, join and come back to a cup with no PIN of its own; your player's name and PIN are enough. Without a player, the cup PIN works as before (D-359).

## 0.182.1 — 2026-10-18
- **A La Copa the admin ended early no longer breaks the owner's panel or the weekly report**: Firebase hands the day windows back as an array with an empty first slot, and ending a cup early tripped over it.

## 0.182.0 — 2026-10-18
- **Your usual name and PIN carry your La Copa history**: with no player signed in on the phone, creating, joining or entering a cup with the name and PIN of your player signs you in as that player, so the cup and its podium count for you. A podium saved before you signed in gets your name once you enter that cup as your player (D-358).

## 0.181.3 — 2026-10-18
- **La Copa champions add up every win of the same person**: a win by name alone now joins the player with that name, when there is only one, so someone who won with their player and then without it no longer shows twice with one gold each (D-357).

## 0.181.2 — 2026-10-18
- **All promotional material has its home in `marketing/`** (D-356): the share cards' drawing moves to `marketing/share-cards/` (the same drawing: the cards do not change), and every promotional file the site serves (share cards, splash clips, the email header, the video's thumbnail) names its asset in `marketing/registro.json`, checked by `marketing/served.test.mjs`. Nothing changes for players.

## 0.181.1 — 2026-10-18
- **Every splash campaign gets a usability review before it goes live, and is kept in `marketing/splash/`** (D-355). `covers.mjs check` flags a PR that turns on or changes a campaign, each campaign has a screen for `look.mjs` and the language tests, and its folder keeps a README and screenshots in the four languages.
- **The splash says "¡Upa, papá! Tres juegos nuevos" in Spanish**, and opening it no longer draws a frame around "Ahora no": the focus goes to the window (the keyboard still sees the ring).

## 0.181.0 — 2026-10-18
- **Simpler result screens: each thing said once** (C-19, D-353).
  - In La Copa's standalone games, "How your score was calculated" is folded under the buttons and
    no longer repeats the total or the time.
  - The One a Day card drops "Today: X points" and folds "Invite a friend".
  - "Want this game to count on the leaderboard?" is now one line with its Sign in button, instead
    of the whole form.
  - The Cup's podium names the champion once and has a single share button.
  - Batalla Naval puts its buttons right under the result and no longer repeats the shots in the
    subtitle.
  - Julepe says "1 julepe".

## 0.180.0 — 2026-10-18
- **A promotional splash for the home page** (D-351): a window over the home page, with the page darkened behind, to tell players about something new (three new games, a new mode): each game shows a few seconds of real play and opens with ▶ Play. It is off by default; the owner turns on one campaign at a time with `node tools/agents/splash.mjs on <id>`, and each phone sees it once. `?splash=<id>` previews any campaign. Try it in the lab, at `/labs/splash/`.

## 0.179.4 — 2026-10-18
- **Tren en Vilo (lab): the day goes by.** The first stage is in the morning, with a blue sky and the sun up; the middle ones head into sunset; the last one is at night.

## 0.179.3 — 2026-10-18
- **The owner's panel is in English.** Everything in `/panel/` (sections, notes, dates, game names) now reads in English; the games are unchanged.

## 0.179.2 — 2026-10-18
- **Tren en Vilo (lab): each level is harder than the one before.** The crossings are sorted into levels by how much wood their bridge needs, from about 9 to 12 m at level 1 up to 29 to 36 m at level 5, with the heavier train on the bigger ones.

## 0.179.1 — 2026-10-18
- **Batalla Naval: "¡Ganaste!" when you win.** Beating the phone, in One a Day or in a room, the result title now tells the player on this phone that they won, instead of "¡Ganó Jugador 1!" with their name or the placeholder (#503).

## 0.179.0 — 2026-10-18
- **Every result screen shows where to go next, in the same place** (C-19, D-343). In One a Day,
  every game ends with the same card, right under the score: share, 🎲 play another, replay today's,
  and 📅 back to One a Day, all visible without scrolling (no more "Change mode" or duplicated menu buttons in
  El Ahorcado, Batalla Naval and Dudo). A Cup day puts "Back to the board" first, with the breakdown
  folded; the Cup's podium now has 🏠 back to the menu; and `/today/` offers "Replay today's" too.

## 0.178.2 — 2026-10-18
- **The "Sign in" button on the One a Day card fits inside its frame again**: in the one-line version
  under a result, the button stuck out of the box.

## 0.178.1 — 2026-10-18
- **La Copa: the "last chance" notice reads at once.** The deadline notification for someone who already missed the day before now says first what happens ("Si no lo juegas, quedas fuera de la copa") and then why ("ya te perdiste el anterior"), so "lo" points to today's day and not the one missed; in its last hour it says "1 hora", not "1 horas", in the four languages.
- **Tren en Vilo (lab): its steps match how it is played today.** One drag now lays several beams and the budget is wood, so the steps say "tender vigas" and "con poca madera", and the score names the solidity too; a stroke that cannot be split into beams no longer says "Muy larga: una viga mide hasta 2 cuadros", which contradicted the long strokes.
- **La Copa: "Cómo funciona" tells the out rule.** It now says that letting 2 days in a row go by without playing leaves you out of the cup, with your points still in the table, so nobody meets the rule for the first time in the warning.

## 0.178.0 — 2026-10-18
- **The owner's panel, by domain.** `/panel/` is now read as Summary, Group, Individual, La Copa, Uno al día, Users, Traffic and Health, each with an operational pulse against the period before, a diagnosis and a trend, with the versions marked on every timeline and a CSV of every table. To feed it, the site now counts finished games, replays, shares, how long since the last visit and how often a browser comes back, and keeps a random id per browser to count users and cohorts, with no name or anything else tied to it.

## 0.177.4 — 2026-10-17
- **Tren en Vilo (lab): long strokes.** A straight drag longer than one beam lays a beam at every grid step, so the whole deck goes in with a single drag.

## 0.177.3 — 2026-10-17
- **Tren en Vilo (lab): many more crossings.** Each level now draws from 5 to 8 different crossings instead of 2, so a game is one of about 11,000 combinations instead of 32; each one has a readable, solid bridge as its solution.

## 0.177.2 — 2026-10-17
- **Tren en Vilo (lab): join a beam in the middle of another.** A beam can now start or end in the middle of a two-square beam, and it joins there with a bolt like any other, with no need to lay two short ones.

## 0.177.1 — 2026-10-17
- **Desenredo's result screen drops the 🧶 card under the score**: it only repeated the score. It
  still goes in the shared result.

## 0.177.0 — 2026-10-17
- **La Copa: out after two days in a row without playing.** Whoever lets two days in a row close without playing them (each with its grace day) is out of the cup: their points stay in the table, in grey with 🚪, but they can't play any more days and nobody waits for them. The day before, the board and the reminder warn them, and the admin can bring them back with «Devolver a la copa».

## 0.176.6 — 2026-10-17
- **Lab keys open at once.** A new key for the lab works the moment it is given, and a removed one stops right away: the keys now live in the database, not in the site's code.

## 0.176.5 — 2026-10-17
- **Every page is checked to open.** A new end-to-end smoke test opens every page of the site and fails if one throws an error or stays blank; each change runs the least testing that keeps the site safe, by level.

## 0.176.4 — 2026-10-17
- **Start without scrolling.** On every game's first screen the start button (or the choice of how to play) now comes right after the title, and «How to play» goes below it, so on a small phone you see how to start without scrolling. A test checks it for every game, at two phone sizes and in the four languages.

## 0.176.3 — 2026-10-17
- **Tren en Vilo (lab): the boat raises the orange flag whenever the rider is in the water.** Also when the wake rider falls, not only when they sink, as on a real wakeboard boat.

## 0.176.2 — 2026-10-17
- **Tren en Vilo (lab): the gauge fits the scene.** It is 10% smaller, says "Carga" on top, and its plate is the night sky over a strip of water and rock.

## 0.176.1 — 2026-10-17
- **Tren en Vilo (lab): a clearer strain gauge.** It is bigger, its needle always shows the load right now (back to zero when nothing weighs on the bridge), and the peak is a red arrow outside the dial, with "máx." and its number.

## 0.176.0 — 2026-10-17
- **Tango: ↩️ Undo.** Under the board, to the left of Clear all, a button takes back the last tap or Clear all, one per tap, down to the start, in La Copa, the standalone game and One a Day. A mistake already counted and a hint stay in the score (the rules say so in the four languages); undoing the tap that just broke a rule forgives it, like tapping that cell again (D-342).

## 0.175.2 — 2026-10-17
- **Tren en Vilo (lab): more time to read each stage's summary.** It now stays 10 seconds before moving on by itself.

## 0.175.1 — 2026-10-17
- **La Copa: a day's cover no longer cuts the top bar.** Before playing a day, the top-left button already says "‹ Volver a la copa", so the "🏆 La Copa" chip beside it steps aside; on a 320 px phone (and in German even at 390 px) it was cut to "🏆 …".

## 0.175.0 — 2026-10-17
- **💬 Suggestions and comments, everywhere:** at the end of every game (group, solo, minigames, One a Day and La Copa's podium) a quiet link, after the buttons, opens a short form for a suggestion, a comment, a game idea or a problem, with an optional kind. It shows at most once a day and rests for two weeks after you write; the home page footer always has it (D-341, U-38).

## 0.174.8 — 2026-10-16
- **The home page no longer jumps while it loads.** The language buttons, the random game die, the
  filters and the game list have their place from the first moment, so on a slow network the
  page stays still instead of everything moving down when the games arrive.

## 0.174.7 — 2026-10-16
- **Tren en Vilo (lab): a summary for each stage passed.** A congratulation opens with the wood used, the peak strain against the cheapest bridge, the time and the stage's points; it goes with a tap or on its own after 6 seconds, with a bar that shows it, and the clock waits meanwhile.

## 0.174.6 — 2026-10-16
- **Tren en Vilo (lab): the visitors show up.** They come sooner (5 to 25 s into their stage), move on to the next stage instead of being lost when you pass one quickly, and hand over to another when they don't fit the crossing.

## 0.174.5 — 2026-10-16
- **Tren en Vilo (lab): the title shows the train.** Next to its weight, each stage draws its train in small (the locomotive and a wagon with its load), so "heavier" has a picture.

## 0.174.4 — 2026-10-16
- **Tren en Vilo (lab): the game loads again, and the gauge holds its reading.** A merge had left a comment unopened in the game's script, and the page stayed blank; and when a test ends, the strain needle now stays on the peak (100 % if a beam snapped) instead of dropping to zero.

## 0.174.3 — 2026-10-16
- **Tren en Vilo (lab): bridges a person would build.** The solution shown at the end, and the minimum each stage is measured against, are now trusses with room to spare (at most 85 % strain), not the tangle of stays that barely held; the wood budgets move a little with them.

## 0.174.2 — 2026-10-16
- **Tren en Vilo (lab): a crossing is not a joint.** Where a beam crosses another, or runs over a bolt it doesn't end at, it now passes in front with a dark edge, so it no longer looks joined there.

## 0.174.1 — 2026-10-16
- **Tren en Vilo (lab): a strain gauge while the train crosses.** A dial at the top of the board moves with how hard the bridge is working, keeps a red mark at the peak and a white one at the cheapest bridge's; after a pass, a moment to read it before the next stage.

## 0.174.0 — 2026-10-16
- **Tren en Vilo (lab): solidity counts.** A bridge that works less hard than the cheapest known one earns up to 3 points per stage; the notice says each bridge's peak strain, and the final table shows wood, strain and points per stage with a short legend. The score is now 10 per stage, up to 5 for saving wood, up to 3 for solidity and up to 10 for speed.

## 0.173.21 — 2026-10-16
- **Tren en Vilo (lab): heavier trains look heavier.** The first stage pulls old passenger cars; the next ones carry crates, logs, coal and containers, and the two heaviest come with a green freight locomotive.

## 0.173.20 — 2026-10-16
- **Tren en Vilo (lab): a tidier game screen.** The stage is now the screen's title, with the train's weight under it and always in view (it was a sign that slid over the board and went away); the progress dots and the clock sit on one line above it.

## 0.173.19 — 2026-10-16
- **Tren en Vilo (lab): the cover breathes.** After the train leaves, the empty bridge rests 3 to 5 seconds before the next one comes, instead of looping right away.

## 0.173.18 — 2026-10-16
- **Tren en Vilo (lab): the snapped beams stop blinking.** After a failed test they blink red for 8 seconds and then go quiet, and a new stage never starts with them.

## 0.173.17 — 2026-10-16
- **Tren en Vilo (lab): the lab's guests can call the visitors.** The links that bring the UFO, the whale, the mole or the green boat right away work again on the site for whoever entered the lab with a key; players without one still only meet them by chance.

## 0.173.16 — 2026-10-16
- **Tren en Vilo (lab): the visitors only come by chance.** The links that called the UFO, the whale, the mole or the green boat right away no longer work on the site; they stay for testing in the workshop.

## 0.173.15 — 2026-10-16
- **Tren en Vilo (lab): the wake rider can sink.** A fourth act for the green boat (`?wake=sink`): the rider goes under, only the head pops up, and the boat comes back for them with a small orange flag raised.

## 0.173.14 — 2026-10-16
- **Tren en Vilo (lab): the wake rider holds a rope.** The green boat has a tower roof at its stern, and a black rope runs from it to the rider's hands while carving and jumping (let go when falling).

## 0.173.13 — 2026-10-16
- **Tren en Vilo (lab): the green boat can be seen on a phone.** It comes out from just behind a cliff, slower, instead of from the screen's edge, so on narrow water it no longer crosses in four seconds half hidden.

## 0.173.12 — 2026-10-16
- **Tren en Vilo (lab): a fourth visitor.** A petrol-green boat crosses the water with a wake surfer riding its wave: carving it, jumping off its crest, or falling in and getting picked up as the boat turns back (`?wake`, `?wake=carve|jump|fall`).

## 0.173.11 — 2026-10-16
- **Tren en Vilo (lab)** budgets metres of wood again, as in the tests: each beam costs its length.

## 0.173.10 — 2026-10-16
- **Tren en Vilo, in the lab** (`/labs/bridges/`): build a bridge with wooden beams so the train crosses, over five stages against the clock, drawn in pixel art. Only in the lab for now.

## 0.173.9 — 2026-10-16
- **Docs:** D-337 records the 1.5 s wait before Tango marks a clash.

## 0.173.8 — 2026-10-16
- **La Copa:** a day's card now says how long its game stays open: "Puedes jugarlo hasta mañana a las 23:59 (48 h)", in the four languages. Every day except the final has 48 hours (that day and the next one).

## 0.173.7 — 2026-10-16
- **La Copa: "Tus copas" keeps every finished cup.** "Mostrar copas terminadas" now lists all the cups you played, newest first, instead of only those that ended in the last week.

## 0.173.6 — 2026-10-16
- **Tango (La Copa): a clash turns red 1.5 s after you move on.** Breaking a rule and then tapping another cell (or filling the board) no longer paints the red, plays the error sound and bumps the counter in the same instant: they wait 1.5 s, so the player can finish the thought. What counts in the score does not change.

## 0.173.5 — 2026-10-16
- **A dragged card no longer stays floating on screen.** If the finger was lifted where the browser did not report it (it happened when creating a Cup: the 🖌️ Pintaminas card stayed stuck over La Copa's Administrar), the card now always comes down. This applies to every drag: La Copa's week, Línea de Tiempo, Dónde and Batalla Naval.

## 0.173.4 — 2026-10-16
- **La Copa: on a day's cover, the top-left button is "‹ Volver a la copa".** Before playing a day, it now says so and returns to the cup's board instead of the app's menu, and the "Volver a la copa" button at the bottom of that screen is gone.

## 0.173.3 — 2026-10-15
- **The "New" sticker turns around:** it is now dark, with the home page title's rainbow running through its letters; it keeps its white edge, glow and wobble.

## 0.173.2 — 2026-10-15
- **The "New" label is a sticker:** on the home page it now sits a bit tilted, with a white edge and a shadow, as if stuck on the card; it keeps its rainbow, glow and wobble.

## 0.173.1 — 2026-10-15
- **The "New" label shines:** on the home page it now carries the title's flowing rainbow, with a soft glow and a little wobble now and then (still, with reduced motion).

## 0.173.0 — 2026-10-15
- **Uno al día has 16 games:** 🚇 Rutas rotas, 📐 Loteo, 🖌️ Pintaminas, 〰️ Zip, ☀️ Tango and 📍 ¿Dónde queda? join the daily challenge from October 23 (the days already set don't change). A game with versions is played in its usual one, the same for everyone (D-334).
- **New games on top:** while a game says "New", its card is right after La Copa on the home page, instead of last (D-335).

## 0.172.0 — 2026-10-15
- **Three new games out of the lab: 🚇 Rutas rotas, 📐 Loteo and 🖌️ Pintaminas**, now on the home page in the four languages and in La Copa (D-332). Rutas rotas joins every subway line by turning parts of the board, Loteo splits the board into plots, and Pintaminas paints the grid to uncover a hidden picture. Each one plays a new board every time, with rankings, sharing and the 🐞 report like the other games.
- **Pick the version you play:** Pintaminas has easy and ⚡ hard (two colors), and Loteo has 🔢 Numbers and ⚡💧 Utilities. On their own page you pick it before Start, the phone remembers it, a link can say it (`?mode=hard`), and each version has its own ranking. Both versions score from 0 to 100 (D-331).
- **La Copa chooses the version for everyone:** when the week has Pintaminas or Loteo, whoever creates the cup picks below the week which version everybody plays that day, and the day says it under the game's name (D-331).
- **"New" on the home page:** a new game says so next to its name for two weeks (D-333).

## 0.171.13 — 2026-10-15
- **Faster checks on pull requests:** the end-to-end tests now run only the scripts whose pages load what a PR changed; a change to one lab game runs one to three scripts instead of 61, and anything shared or unclear still runs them all (D-329).

## 0.171.12 — 2026-10-15
- **Support doubts stay private:** when the team isn't sure how to answer a player's email, the details go to the owner's inbox and only a pointer with a Gmail link is public (D-328).

## 0.171.11 — 2026-10-15
- **Emails to hola@juegosdesalon.cl get their answer in the same thread:** the reply to someone who wrote by email now arrives as a reply to their own message, and every reply invites them to answer that email or use the 🐞 button. Kind emails get a short thank-you; the owner's own address can be listed (privately, off the repo) to skip the one-email-a-day limit while testing (D-327).

## 0.171.10 — 2026-10-15
- **📅 ¿En qué año? (What Year?): the d. C. / a. C. switch only shows when the theme has events before Christ**, today only Historia. In every other theme the year is always AD and there is one less thing on screen (D-326).

## 0.171.9 — 2026-10-15
- **📅 ¿En qué año? (What Year?):** the "a. C." label next to the boxes has a bit more room from the last digit.

## 0.171.8 — 2026-10-15
- **📅 ¿En qué año? (What Year?): getting close always counts.** The margin is wider (a third of the event's age, at least 12 years) and the score no longer drops to 0 at its edge: half the margin is worth 50 points, the edge 20, and beyond it a few more. 1990 answered as 1980 now gives 26 points instead of 0 (D-325).

## 0.171.7 — 2026-10-15
- **📅 ¿En qué año? (What Year?): a BC answer can no longer slip by.** With a. C. on, it shows next to the boxes before OK; switching between d. C. and a. C. keeps the year already typed; and the reveal says "Tu respuesta: 622 a. C." instead of "Año: …", so the player's answer is not mistaken for the real year (a friend's report: "Año: 622 a. C." looked like a wrong year).

## 0.171.6 — 2026-10-15
- **A rematch that can't open its room says so:** in every game with rooms (Ahorcado, Batalla Naval, Dudo, Generala, Julepe, Línea de Tiempo, Toque y Fama), the Revancha button says "Abriendo sala…" while the new room opens, and if it fails, for example without signal, the room's message now shows under the button and the button works again to retry. Before, nothing visible happened: in some games the button stayed dead, and the failure showed up on the owner's Health panel as an unhandled error (D-322).

## 0.171.5 — 2026-10-14
- **Rooms no longer leak:** a new room and its note in the cleanup index are now one write, so a room created on a bad connection (the create timed out and the player tried again) is still deleted once it expires; before, it could stay in the database forever. New `tools/firebase/unnoted-rooms.mjs` finds the rooms that leaked before this, and the rules let a code be noted again the same day (D-321).

## 0.171.4 — 2026-10-14
- **Rooms after a dropped connection:** when a phone locks or loses signal right after a move, Firebase sends that move again on reconnecting, and the room turned the repeat away because it already had it. The game never noticed, but the page counted it as a failure, and it showed up on the owner's Health panel as a Batalla Naval "PERMISSION_DENIED". Now that repeat is no longer counted as a failure (a move that really didn't get through still is), and the presence writes no longer leave errors unhandled either (D-320).

## 0.171.3 — 2026-10-14
- **A room that won't open:** in every game with rooms, the button now says "Abriendo sala…" or "Entrando…" while it tries, and the previous error goes away; before, it only went dim with the old message still on screen and looked frozen. If the room can't be reached, a "📱 Jugar en un celular" button under the message goes straight to one-phone mode, and tapping create or join again tries once more (D-319).

## 0.171.2 — 2026-10-14
- **The workshop speaks English** (D-316, phase 3): the tools, the end-to-end scripts, the
  workflows, the agents and their GitHub labels have English names, commands, messages and
  comments (`tools/agents/processes.mjs check`, `tools/release/readme.py check`,
  `tools/e2e/look.mjs … --width 320`, the `tests` and `end-to-end` checks). Nothing changes for
  players.

## 0.171.1 — 2026-10-14
- **Link previews:** the title on the cards that WhatsApp and other chats show for a link is no longer cut on the right (the N of SALÓN).
- **🐞 Feedback replies:** the email shows the game's header, quotes each comment whole in grey italics above its answer, and keeps a plain-text version for mail apps without images (D-317).

## 0.171.0 — 2026-10-14
- **🐞 Feedback with an optional email:** every comment form (lab, La Copa and the end of each lab game) has an optional "Your email" field, which says it's only used to reply to you, that it's never published and that it's deleted afterwards. When the comment is resolved, the player gets a friendly email in their language from hola@juegosdesalon.cl (D-317).

## 0.170.7 — 2026-10-14
- **The repository speaks English** (D-316): everything internal (documents, decisions, code,
  tool messages, commits, PRs and GitHub issues) is now written in English, at the owner's request.
  This first step translates the living instructions (`CLAUDE.md`, the three agents, the
  promo-video skill, `CONTRIBUTING.md`, the READMEs of `tools/e2e/` and `firebase/`) and the texts
  the bots post on GitHub (feedback, dilemmas, one-tap decisions, "main is red"). Nothing changes
  for players: the app keeps its four languages, Spanish by default.

## 0.170.6 — 2026-10-14
- **Línea de Tiempo y ⏳ Línea Relámpago:** el acierto también cuenta el dato de la carta, en el veredicto bajo la carta con su año, como el error; se cierra solo cuando se vacía su barra de 6 s (o antes con un toque) y en Línea Relámpago el reloj se pausa mientras se lee. Sale la franja chica sobre el botón de colocar, que no se notaba (pedido del dueño, D-314).

## 0.170.5 — 2026-10-14
- **🚇 Rutas (laboratorio):** el tablero no marca qué piezas o bordes ya calzan: las líneas mismas muestran dónde se cortan, y descubrirlo es parte del juego (#359). Se quita la marca `.unida`, que no tenía estilo.

## 0.170.4 — 2026-10-14
- **🕵️ Agentes (laboratorio):** 18 pistas nuevas de ideas (MIEDO, SUERTE, LIBERTAD, SILENCIO…), con palabras que las evocan sin ser de su rubro, para pensar un poco más (pedido de Cris, #383). Entran al tablero del día desde el 16 de octubre; los días anteriores no cambian.
- **📐 Loteo (laboratorio), modo ⚡💧 Servicios:** el último tablero es siempre el más difícil de los dos 8×8 (#401), y el primer paso dice que los lotes son rectangulares (#397).

## 0.170.3 — 2026-10-14
- **📐 Loteo, modo ⚡💧 Servicios (laboratorio):** el aviso de un lote con dos íconos iguales dice la cantidad en cifras, «Tiene 2 ⚡: cada lote lleva uno.», como el de números («Tiene 2 números…») (U-5).
- **Marketing:** revisión del 2026-10-14; «Se vienen cositas» al día y los demás assets con los mismos pendientes de ayer (U-34).

## 0.170.2 — 2026-10-13
- **📐 Loteo (laboratorio), modo ⚡💧 Servicios más difícil** (D-312): los tres últimos tableros ya no
  muestran ningún lote obvio de entrada y piden deducciones más profundas; los íconos quedan cerca de
  los del lote vecino. La portada lo explica, y al llegar a los difíciles un aviso dice cómo pensarlos:
  si un lote deja una casilla sin lote posible, no va.

## 0.170.1 — 2026-10-13
- **Agentes: los botones del resultado, a la vista:** el tablero destapado ahora va plegado en el panel «🗺️ El tablero entero», como los repasos de los otros juegos. Abierto, sus 15 cartas dejaban «Compartir mi resultado» y «Otro tablero» bajo el pliegue del celular (C-8, D-309).

## 0.170.0 — 2026-10-13
- **📐 Loteo: el modo ⚡💧 Servicios (laboratorio)** (D-311). En la portada, un selector cambia de
  🔢 Números a ⚡💧 Servicios: la grilla trae ⚡ y 💧, y hay que dividirla en lotes todos del mismo
  tamaño (arriba dice cuántas casillas), cada uno con exactamente un ⚡ y un 💧. Son cinco tableros
  contra el reloj, de 6×6 en lotes de 3 a 8×8 en lotes de 8, cada uno con una sola solución que se
  deduce sin adivinar. El celular recuerda el modo y el link lo lleva (`?mode=utilities`).

## 0.169.2 — 2026-10-13
- **Aire entre el tablero y los botones, en todos los juegos:** el primer botón queda a la misma distancia del tablero (o del resumen de la partida) en todas las pantallas. Antes, en Agentes, Caso, Tango, Zip, Desenredar, Línea de Tiempo, Generala, Batalla Naval y en varias pantallas de resultado, los botones quedaban casi pegados (U-11, D-309).

## 0.169.1 — 2026-10-13
- **📐 Loteo (laboratorio):** su emoji pasa a ser la escuadra 📐, en la portada, el laboratorio y lo
  que se comparte (pedido del dueño).

## 0.169.0 — 2026-10-13
- **📐 Loteo (laboratorio, nuevo)** (D-310), inspirado en Shikaku: divide el tablero en rectángulos,
  cada uno con un solo número, que dice cuántas casillas tiene. Se arrastra de una esquina a otra
  para dibujar cada lote, y tocarlo lo borra. Son cinco tableros contra el reloj: dos para calentar
  (5×5 y 6×6) y tres difíciles (7×7, 7×7 y 8×8), cada uno con una sola solución que se deduce sin
  adivinar; el de hoy es el mismo para todos. Abajo, ↩ Deshacer, 🧹 Borrar y 🏳️ Rendirse.

## 0.168.10 — 2026-10-13
- **Números explosivos (laboratorio):** en «Cómo se juega», los pares de ejemplo «(7 y 7)» y «(4 y 6)» ya no se parten entre dos líneas en un celular chico (U-12).
- **Marketing:** revisión del 2026-10-13. El video promocional suma dos pendientes: la tarjeta de Uno al día dice «Jugar el de hoy» (hoy «Jugar hoy», D-305) y Reinas no muestra ↩️ Deshacer (D-283) (U-34).

## 0.168.9 — 2026-10-12
- **🚇 Rutas rotas (laboratorio): la portada dice que cada línea se une con su mismo color**
  («Une cada color en una línea, sin cortes entre piezas.»), y la tarjeta del laboratorio también.
  Un jugador no se había dado cuenta de que el color tenía que calzar.

## 0.168.8 — 2026-10-12
- **💥 Números explosivos (laboratorio): un par que no se une se suelta entero** (pedido del dueño).
  Tiemblan los dos y dice por qué, como antes, pero ya no queda elegido el segundo: la jugada
  siguiente parte de cero.

## 0.168.7 — 2026-10-12
- **Herramientas: CI y publicación más rápidos.** Las pruebas de punta a punta corren en grupos
  parejos según lo que tarda cada guion, todos a la vez, con el segundo intento y las capturas por
  guion dentro del grupo; los guiones esperan a que la pantalla esté lista en vez de pausas fijas
  (D-307). Y publicar no repite la punta a punta si el árbol que llega a main ya la pasó en su PR
  (D-308).

## 0.168.6 — 2026-10-12
- **🐞 El formulario de comentarios ya no muestra lo que se envía por dentro** (D-306): se fue el
  desplegable "Lo que se envía junto", que mostraba los datos técnicos tal cual. Se siguen mandando
  igual, para entender el reporte.
- **Laboratorio: cada comentario dice con qué llave se entró** (D-306), aunque no se escriba el
  nombre: así el dueño sabe a quién preguntarle. Nunca viaja la llave, solo su nombre.
- **Herramientas:** el feedback llega como issue en GitHub cada 15 minutos, no cada hora.

## 0.168.5 — 2026-10-12
- **Herramientas: publicar sin choques ni sorpresas.** La entrada del CHANGELOG de cada PR va sin
  número en `changelog/<rama>.md` y la versión se pone sola al fusionar (D-300); los números de
  decisión se reservan con `tools/agents/decision.mjs reservar` y `DECISIONES.md` se junta sola al
  traer main (D-301); el sitio se publica solo si la punta a punta de main pasa (D-302); un solo
  push al terminar (D-303); y la revisión de usabilidad según la etapa del juego: corta en el
  laboratorio y completa en el PR que lo saca (D-304).
- **Pruebas de punta a punta:** no corren en un PR que solo toca el taller de los agentes, las
  reglas de Firebase o los otros workflows, y un guion que falla se repite una vez: si pasa, el
  check queda en verde con un aviso "Intermitente" que lo nombra (D-299).

## 0.168.4 — 2026-10-12
- **Portada: las píldoras de La Copa y Uno al día, abajo a la izquierda** (D-305). Los jugadores y
  los días de La Copa, y la racha o cómo vas hoy en Uno al día, quedan al pie de cada tarjeta y a la
  misma altura en las dos, aparte del texto de arriba.
- **Uno al día: "Jugar el de hoy" pasa a "Jugar hoy"** (D-305), en la portada, en el desafío de un
  amigo y en los juegos que abren con el de hoy. Cabe en la píldora también en un celular angosto.

## 0.168.3 — 2026-10-12
- **🖌️ Pintaminas (laboratorio): cada dibujo con sus colores de verdad** (pedido del dueño): la luna
  amarilla, el cactus verde, la bota café, la frutilla roja con hojas verdes, el árbol verde con el
  tronco café. Se suman el café, el blanco y el rosado. Los tableros (y sus links) son los mismos.

## 0.168.2 — 2026-10-12
- **🧪 Laboratorio: La Bodega, plegada.** Sus juegos se ven solo con su título y un toque los abre
  para ver de qué se tratan y jugarlos; así no tienen el mismo peso que los proyectos activos.

## 0.168.0 — 2026-10-12
- **💥 Números explosivos (laboratorio, nuevo)** (D-297), inspirado en Number Match: haz estallar de a
  pares los números iguales o que suman 10, si están juntos en línea, hasta dejar el tablero limpio.
  Sin pares, ➕ copia abajo los que quedan (3 por partida). Cada par estalla, una fila entera explota
  y se va, y al limpiarlo todo explota. El tablero del día siempre tiene salida.

## 0.167.3 — 2026-10-12
- **🚇 Rutas pasa a llamarse Rutas rotas** (pedido del dueño): las líneas parten cortadas y hay que
  unirlas. Cambia el nombre en la portada, el laboratorio y lo que se comparte; el link
  (`/labs/routes/`) y su señal de uso siguen iguales.

## 0.167.2 — 2026-10-12
- **🖌️ Pintaminas (laboratorio):** en el modo difícil, las cerezas salen rojas con el tallo verde,
  como son; los otros dibujos siguen con colores al azar.

## 0.167.1 — 2026-10-12
- **🧪 Laboratorio: las portadas al día.** Pintaminas cuenta el modo de dos colores y la ayuda; Rutas,
  que las piezas quedan al revés y que deshacer y reiniciar son gratis; Agentes, las marcas 📌. Las
  tarjetas del laboratorio también.
- **Herramientas:** `tools/agents/portadas.mjs revisar` muestra la portada de cada juego que toca un PR
  y avisa si el juego cambió y su portada no; el agente de usabilidad lo corre en cada PR (U-36).

## 0.167.0 — 2026-10-12
- **🖌️ Pintaminas (laboratorio): 🏳️ Rendirse** (D-296), junto a la ayuda. Pide un segundo toque,
  destapa el dibujo y el puntaje vale la parte que alcanzaste a pintar.

## 0.166.1 — 2026-10-12
- **🚇 Rutas (laboratorio):** al girar, el rectángulo da media vuelta como un solo bloque, alrededor de
  su centro, y así se ve por qué las cartas quedan dadas vuelta. Las reglas no cambian. Y un botón
  ↩ Deshacer, junto a Reiniciar y Rendirse: el giro deshecho no cuenta.

## 0.166.0 — 2026-10-12
- **🚇 Rutas (laboratorio): la portada enseña a jugar.** El tablero parte desordenado y se arma en 5 o 6
  jugadas, mostrando las dos clases: girar una carta sola o cambiar de lugar dos vecinas. Al armarse,
  la ruta se ilumina.
- **🖌️ Pintaminas (laboratorio): la portada juega una partida de verdad**, de a una casilla y en el
  orden en que se deduciría, hasta mostrar el dibujo; con el modo difícil, de dos colores. La palanca dice «Modo fácil» o «⚡ Modo difícil»,
  la placa lleva grabado el recorrido de la palanca, y al pasar al modo difícil un destello cubre toda la vista.

## 0.165.2 — 2026-10-12
- **🧪 Laboratorio:** una línea separa los proyectos activos de La Bodega.

## 0.165.1 — 2026-10-12
- **🚇 Rutas (laboratorio):** mientras se juega no se muestra el título, y Reiniciar y Rendirse van en
  una fila, así se ven sin bajar en un celular chico. La tarjeta para compartir muestra también las
  etapas que faltaron.

## 0.165.0 — 2026-10-12
- **🚇 Rutas (laboratorio): reloj y puntaje por capas** (D-295). Siete minutos para las cinco etapas.
  Cada etapa completada vale 17 y, encima, hasta 10 por rapidez y 5 por giros: completar más siempre
  gana. Y un botón para rendirse.

## 0.164.0 — 2026-10-12
- **🚇 Laboratorio: Rutas** (D-293, D-294), el tercer proyecto activo. Nueve piezas de un plano de
  metro: arrastra para marcar un rectángulo y, al soltar, gira media vuelta. Une todas las líneas en el
  mínimo de giros, como un golf, en cinco etapas cada vez más difíciles; reiniciar es gratis. Inspirado
  en Junction Nine, con el link en la portada.

## 0.163.2 — 2026-10-12
- **🖌️ Pintaminas (laboratorio):** la 💡 Ayuda pide un segundo toque antes de cobrar, como en El caso,
  y una ayuda pagada se puede volver a ver gratis. En el modo difícil, el segundo color lleva rayas, para
  quien no distingue bien los colores.
- **🧪 Laboratorio:** los links del texto (el crédito a cada juego original) van en un celeste más claro, que se lee mejor.

## 0.163.1 — 2026-10-11
- **🖌️ Pintaminas (laboratorio):** el modo difícil también cambia el fondo de la página, a un azul noche
  eléctrico.

## 0.163.0 — 2026-10-11
- **🖌️ Pintaminas (laboratorio): 💡 Ayuda** (D-292). Si te trabas, la ayuda marca una casilla que se
  puede deducir y los números que lo explican, por 10 puntos. Y el interruptor del modo difícil brilla
  entero y parpadea al azar.

## 0.162.0 — 2026-10-11
- **🖌️ Pintaminas (laboratorio): modo difícil** (D-291). Un interruptor de palanca en la portada que,
  al subirlo, se electrifica: el tablero pasa a dos colores, con tres pinceles, y el puntaje vale
  ×1.5 (hasta 150).

## 0.161.1 — 2026-10-11
- **🖌️ Pintaminas (laboratorio):** los pinceles dicen «Pinta» (con un color que cambia en cada
  tablero) y «No pinta», y los dibujos ahora son irregulares: ya no se adivinan por espejo (D-290).

## 0.161.0 — 2026-10-11
- **🖌️ Laboratorio: Pintaminas, un Buscaminas de colores** (D-289), el segundo proyecto activo.
  Cada número dice cuántas de sus 8 vecinas son de su mismo color: tinta o fondo. Pinta la grilla
  sin adivinar y aparece un dibujo. El tablero de cada día es el mismo para todos. Inspirado en
  ColorSweeper, con el link en la portada.

## 0.160.1 — 2026-10-11
- **🕵️ Agentes (laboratorio):** al final, una línea separa el resultado del formulario de comentarios.

## 0.160.0 — 2026-10-11
- **🕵️ Agentes (laboratorio): se entiende y varía** (D-288). La portada cuenta el juego en una
  línea: «Cada palabra es el nombre en clave de un espía. Con las pistas, encuentra a los tuyos.»
  Y hay 100 pistas en vez de 40: el tablero de cada día las recorre todas, y una pista no vuelve
  antes de 15 días. El resultado ya no repite el crédito a Codenames, que sigue en la portada.

## 0.159.0 — 2026-10-11
- **🕵️ Agentes (laboratorio): más difícil y con colores** (D-287). El tablero pasa a 15 cartas, con
  4 pistas, una de ellas de solo 2 agentes. Las 3 neutrales y el asesino se parecen a alguna pista,
  así que ya no se descartan a primera vista. Cada pista tiene su color: el cartel y sus agentes lo
  llevan, y los de pistas ya cerradas se apagan.

## 0.158.2 — 2026-10-11
- **🕵️ Agentes (laboratorio): un toque que dura de más ya no confunde.** Mantener apretada una
  carta la marca 📌 sin destaparla, y si el toque duraba un poco más de la cuenta la carta quedaba
  marcada en silencio y parecía elegida: la pista no avanzaba. Ahora el borde se va llenando mientras
  se aprieta, y al marcar el juego dice «📌 Marcada, sin destapar. Tócala para destaparla.».

## 0.158.1 — 2026-10-11
- **🕵️ Agentes (laboratorio): la cuenta 3, 2, 1 antes de jugar**, la misma de La Copa, que ahora
  vive en `assets/js/cuenta-regresiva.js` para que la usen también los juegos del laboratorio.

## 0.158.0 — 2026-10-11
- **🕵️ Agentes (laboratorio): marcas antes de arriesgar.** Mantén apretada una carta para marcarla
  sin destaparla: 📌 sospecha, otra vez 🚫 descartada (así no la destapas por error), otra vez sin marca.
  Como las notas de Toque y Fama.

## 0.157.2 — 2026-10-11
- **🕵️ Agentes (laboratorio):** el resultado ya no muestra la grilla de emojis, que repetía el
  tablero de abajo; va solo en el mensaje para compartir.
- **🕵️ Agentes: la trampa, explicada.** Al final dice con qué pista tentaba el asesino («💀 Caíste
  con RÍO: parecía de MAR, pero no era de los tuyos.»), también si lo esquivaste, y la carta del
  asesino lo dice debajo.

## 0.157.1 — 2026-10-11
- **🕵️ Agentes (laboratorio): portada y animaciones.** La portada juega sola una pista: la lupa
  encuentra a los agentes y al final aparece el asesino. Entre pistas, a la que se cierra le cae un
  sello (Completa, Cortada o Pasada) y la siguiente llega girando, con su palabra descifrándose. El
  asesino sacude el tablero con un destello rojo. El final es un sello según cómo salió: ¡Misión
  cumplida! con confeti, Misión a medias, o en rojo Misión fracasada o Te descubrió el asesino. Y
  con un link de semilla, la portada ya no escribe "null".

## 0.157.0 — 2026-10-11
- **🕵️ Laboratorio: Agentes, un Codenames mini** (D-286), el primer proyecto activo. El juego te da
  una pista con su número («MAR · 3») y tú encuentras a tus agentes entre 12 palabras, sin tocar
  las neutrales ni al asesino. Tres pistas, puntaje de 0 a 100, el mismo tablero para todos cada
  día. La portada dice que está inspirado en Codenames, con el link a su página oficial. Solo en
  español, para probarlo con amigos.

## 0.156.3 — 2026-10-11
- **🏆 La Copa: si el celular dejó de entrar como tu jugador, te pide el PIN** (D-285). Antes, con el
  día abierto, Empezar podía decir "El tiempo para jugar este día ya se terminó." cuando lo que
  pasaba era que el celular había perdido su sesión (o el admin te dio un PIN nuevo). Ahora lleva a
  escribir el PIN con tu nombre ya elegido, y con eso juegas; si ya habías jugado y el resultado no
  alcanzó a enviarse, sigue guardado en el celular y se envía al volver al día.

## 0.156.2 — 2026-10-11
- **🧪 Laboratorio: una llave por persona** (D-284). Cada persona invitada entra con su propio link,
  y sacarla ya no obliga a cambiarles la llave a las demás. Las llaves se dan y se quitan con
  `tools/agents/llave-labs.mjs`.

## 0.156.1 — 2026-10-11
- **Herramientas:** si una casilla de un toque no puede fusionar, dice por qué (por ejemplo, un
  conflicto con main) en vez de "Command failed". Y las pruebas frenan una decisión repetida o fuera
  de orden en `docs/DECISIONES.md`.

## 0.156.0 — 2026-10-11
- **👑 Reinas: ↩️ Deshacer** (D-283): quita el último gesto (un toque, un arrastre o un Borrar
  todo), uno a uno hasta el comienzo, sin tocar el reloj. En La Copa, en el juego suelto y en Uno al
  día. Rendirse pasa a su propia línea. Lo pidió un jugador por 🐞.

## 0.155.0 — 2026-10-11
- **🔍 El caso: las pistas usadas se tachan solas** (D-282): una pista se tacha sola cuando ya
  marcaste a todas las personas que nombra. El ✓ sigue sirviendo para tachar antes o destachar.
  Lo pidió un jugador por 🐞.

## 0.154.0 — 2026-10-11
- **🧪 Laboratorio: Proyectos activos y La Bodega** (D-280). `/labs/` se ordena en dos grupos: lo que
  se está probando y, en 📦 La Bodega, los proyectos que no prosperaron, que se siguen pudiendo jugar.
  El caso y La clave pasan a La Bodega; Proyectos activos queda vacío por ahora.
- **🧪 Laboratorio con puerta** (D-281). Sin la llave del link que manda el dueño, cualquier página de
  `/labs/` lleva al menú sin mostrarse; la llave queda guardada en el celular. Nada del laboratorio
  se indexa (tampoco `/labs/case/` ni sus puentes), y el README ya no lo enlaza.

## 0.153.2 — 2026-10-11
- **Herramientas: las casillas de un toque, más firmes** (D-273): marcar varias casi juntas ya no
  pierde ninguna, fusionar un PR ya no cierra el que estaba montado sobre él, y un PR que no se
  pudo fusionar se informa como falla.

## 0.153.1 — 2026-10-11
- **Herramientas: el feedback 🐞 dice quién lo mandó** (D-279): el issue de cada reporte suma el
  nombre que el jugador escribió, para hacerle seguimiento.

## 0.153.0 — 2026-10-11
- **⏳ Línea de Tiempo: los seis mazos cuentan su dato** (D-277). Música, Cultura pop, Brasil y Fútbol
  suman un dato en cada carta, como Chile e Historia, revisados contra fuentes. Y el de Mekano ya no
  dice que Viñuela llegó después: el programa partió con él y con Verónica Calabi. Sale la carta de
  cuando la FA levantó la prohibición al fútbol femenino: las fuentes no se ponen de acuerdo en el año.

## 0.152.0 — 2026-10-11
- **⏳ Línea de Tiempo, 📅 ¿En qué año? y La Copa: cada carta cuenta algo** (D-277). En vez de "iba
  entre 1925 y 1980", el veredicto de un error cuenta un dato del hecho, un porqué o una anécdota
  ("El Muro lo abrió un error…"). Contra el reloj (⏳ Línea Relámpago y ¿En qué año?), el reloj se
  pausa mientras se lee, hasta 6 segundos. Al acertar, el dato aparece en una franja abajo que se va
  sola, sin frenar el juego. Al terminar, tocar un hito de la línea muestra su dato. Por ahora, en
  los mazos de Chile e Historia.

## 0.151.0 — 2026-10-11
- **⏳ Línea de Tiempo, 📅 ¿En qué año? y La Copa: cartas que se pueden situar** (D-278). Salen 23
  cartas: las que decían su año (las Constituciones de 1833, 1925 y 1980, la final de Italia 90, la
  Eco-92) y las que no se podían situar, porque el hecho se repitió (el incendio de Valparaíso, los
  terremotos de Santiago y Valparaíso) o porque era una época y no un hecho (la era del swing, el
  punk, la cumbia). Música suma 12 hitos puntuales, como la muerte de Freddie Mercury o el Nobel de
  Dylan, y su bajada pasa a ser "De Beethoven a Taylor Swift".

## 0.150.0 — 2026-10-11
- **🏅 Rankings: que cuente la partida que acabas de jugar** (D-274): si terminas sin haber entrado,
  un bloque te ofrece entrar con tu nombre y un PIN, y esa partida (o tu victoria) se anota.
- **Toque y Fama, Generala y Ahorcado** muestran en su portada los mejores puntajes jugando solo.
- **🪢 Ahorcado jugando solo tiene ranking**: de 0 a 100 según las vidas que te quedaron.

## 0.148.4 — 2026-10-11
- **Herramientas: el agente de procesos dirige a los otros** (D-276): una sola ronda diaria en el
  Mac lanza a los agentes de documentación y de usabilidad cuando hay algo que revisar, y revisa lo
  que entregan. Lo que el dueño encarga pasa por él.

## 0.148.3 — 2026-10-11
- **Herramientas: el feedback 🐞 lo atiende el agente de procesos** (D-275): cada reporte que llega
  desde la app se vuelve un issue (con el texto, sin el nombre de quien lo manda), y la ronda diaria
  lo arregla, lo pregunta o lo cierra diciendo por qué.

## 0.148.2 — 2026-10-11
- **Herramientas: un agente de procesos** (D-273): una ronda diaria cierra lo que quedó abierto
  (PR que esperan, avisos viejos) y convierte un error que se repite en una prueba que lo frena
  sola. Lo que necesita al dueño llega en un issue con casillas Sí/No: marcar una lo cumple al
  instante. El aviso "main en rojo" se cierra solo cuando main vuelve a verde.

## 0.148.1 — 2026-10-11
- **Compartir la app también cuenta la app instalable y los idiomas** (D-272): el mensaje de
  "Invitar a jugar" suma 📲 que se agrega a la pantalla de inicio y avisa cuando te toca jugar, y 🌎
  que está en español, inglés, portugués y alemán.

## 0.148.0 — 2026-10-11
- **Compartir la app cuenta todo lo que hay** (D-271): el mensaje de "Invitar a jugar", en el
  celular y en el computador, suma 📅 Uno al día y 🏅 los rankings a La Copa, los juegos en grupo,
  los de jugar solo y el "sin cuenta". El del video suma el desafío de cada día, y la tarjeta del
  link nombra Uno al día y los minijuegos. El agente de documentación los revisa en cada ronda para
  que no se queden atrás.

## 0.147.2 — 2026-10-10
- **🔐 La clave:** en la animación de la portada también se mueven los trazos blancos de la base:
  todo parte al azar y se va acomodando hasta formar la palabra.

## 0.147.1 — 2026-10-10
- **🔐 La clave:** la animación de la portada termina en la clave dibujada con sus trazos, sin
  escribirla como texto (el título ya la dice).

## 0.147.0 — 2026-10-10
- **🔐 La clave, en el laboratorio** (D-270): cuatro cartas transparentes esconden un código de 5 cifras. Hay que
  ponerlas sobre la base y girar y voltear cada una hasta que los trazos formen las cifras, sin trazos
  encima de otros (se ven rayados). En español, también con una palabra de letras de catorce
  segmentos y cartas de dos caras. En `juegosdesalon.cl/labs/code/`.

## 0.146.1 — 2026-10-10
- **🧪 Laboratorio:** se van los Acertijos (D-269): el dueño los probó y no le gustaron.

## 0.145.0 — 2026-10-10
- **🤔 Acertijos, en el laboratorio** (D-269): cinco acertijos con truco en los que la respuesta obvia
  no es la buena. Hay que tocar, elegir y arrastrar, con pistas y un narrador burlón, y al final se
  deja un comentario. En `juegosdesalon.cl/labs/riddles/`.

## 0.144.0 — 2026-10-10
- **🔍 El caso, en un solo lugar** (D-267): `juegosdesalon.cl/labs/case/` es el juego completo, en
  los cuatro idiomas, y el prototipo se va. Sin elegir nada es el caso del día, el mismo para todos;
  al recargar sigue donde ibas; al terminar se comparte el mismo caso, se juega otro o el de hoy, y
  se deja un comentario. `/case/` lleva ahí.
- **🔍 El caso: "💬 Dejar un comentario"** (D-268): al final de la portada, de la prueba y del juego
  (no durante la cuenta); en el resultado, el formulario abierto, al final de todo.

## 0.143.0 — 2026-10-10
- **🔗 Los links, en inglés** (C-18, D-266): además de las carpetas, los parámetros y sus valores.
  Una sala es `?room=ABCD`, una partida repetible `?seed=K7Q2X`, el modo de prueba `?test`, Uno al
  día `?today`, y los avisos abren `&day=3`, `&mute` y `&notif=deadline`. Los links de antes
  (`?sala=`, `?semilla=`, `?prueba`, `?hoy`…) siguen funcionando y quedan en inglés en la barra al
  abrirse. El panel también: `#/cup/OFICI`, `#/game/hangman`, `#/room/ABCD`.

## 0.142.3 — 2026-10-10
- **🎬 Marketing: teaser de El caso** (`marketing/caso-teaser/`): 6 s en vertical y un GIF para
  WhatsApp, que invitan a probar el juego del laboratorio y a dejar un comentario.

## 0.142.2 — 2026-10-10
- **🔍 El caso (laboratorio): "¿Qué te pareció?"** (D-265): al terminar el caso del día, un
  formulario para dejar un comentario, con el caso adjunto.
- **🔍 El caso (laboratorio):** el marcador ya no muestra "null" cuando no se ha pedido ayuda.

## 0.142.1 — 2026-10-10
- **🔍 El caso, más para pensar** (D-264): tocar una pista ilumina solo a quien nombra ("a la
  izquierda de Omar": Omar), no a todo el grupo.

## 0.142.0 — 2026-10-10
- **🔍 El caso: 💡 Ayuda** (D-263): si te trabas, te dice a quién mirar y qué pistas juntar, y las
  destaca en la lista. Resta 15 puntos.
- **🔍 El caso, más claro:** las pistas que comparan dos grupos ya no hablan de grupos que comparten
  a alguien.

## 0.141.1 — 2026-10-10
- **🧪 Laboratorio, solo con lo nuevo** (D-262): queda El caso. Se van la práctica de cada juego de
  La Copa, las demos, la Copa de 3 días, Uno al día, Agregar a inicio y el link viejo `/labs/de/`,
  que ya estaban para todos.

## 0.141.0 — 2026-10-10
- **🔍 El caso, todavía más difícil** (D-260): pistas condicionales ("Si Óscar es criminal, Rodrigo es
  inocente") y de parejas ("Ana y Beto son los dos inocentes o los dos criminales"), y de cada semilla
  se arman cuatro casos y se juega el que más hace pensar.
- **🔍 El caso: no se tantea** (D-261): marcar a alguien que todavía no se puede deducir cuenta como
  error, sin decir si estaba bien.
- **🔍 El caso:** el caso se arma mientras se lee la antesala, así que "Empezar" y "Probar primero" no
  se traban; y "Gonzalo e Isabel", no "y Isabel".

## 0.140.1 — 2026-10-10
- **🔍 El caso, sin repetir:** al acertar, el mensaje dice solo "¡Bien! Tati es inocente."; su pista
  entra destacada arriba de la lista, sin repetirse debajo de la grilla. Se va la explicación de cómo
  tocar las pistas y tacharlas: se entiende sola. Los mensajes de acierto y de error se van solos (el
  acierto a los 2,5 s, el error a los 4 s).

## 0.140.0 — 2026-10-10
- **🔍 El caso, más difícil** (D-259): las pistas se eligen para que haya que combinarlas, con más
  comparaciones ("hay más criminales arriba de Ana que entre los vecinos de Beto"), pares e
  impares, y una nueva: "Exactamente uno de Ana y Beto es criminal". Sigue sin haber que adivinar nunca.
- **🔍 El caso:** el prototipo del laboratorio tiene la misma dificultad que el juego de La Copa (usa el
  mismo motor), la prueba de La Copa es un caso completo y lo dice, y en una comparación cada lado se
  ilumina con su color, en la grilla y en la frase.

## 0.139.0 — 2026-10-10
- **La cuenta del 3, 2, 1 ya no es tiempo de juego** (D-258): en todos los juegos de La Copa, el
  reloj parte cuando el "¡A jugar!" se fue de la pantalla y el tablero está a la vista; en El caso,
  además, cuando las cartas terminaron de darse vuelta.
- **🔍 El caso:** las letras y los números de la grilla, más grandes.

## 0.138.3 — 2026-10-09
- **🔍 El caso, más cuidado al empezar** (D-257): en la antesala, el título lleva la lupa y los
  colores que se mueven, como en el prototipo; y las cartas se dan vuelta recién cuando se fue el
  "3, 2, 1, ¡A jugar!", no mientras la cuenta las tapa.

## 0.138.2 — 2026-10-09
- **🔍 El caso:** el link "¿Cómo se juega?" de arriba abre las reglas y baja hasta ellas con un
  scroll suave, en vez del salto del ancla (sin animación si el celular pide reducir movimiento).

## 0.138.1 — 2026-10-09
- **🔍 El caso, con toda la experiencia en el laboratorio** (D-257): el botón de El caso en `/labs/`
  abre el juego de La Copa, con su portada animada, la prueba, el 3, 2, 1, el juego y el resultado
  con su desglose. El caso del día del prototipo queda como segundo botón.

## 0.138.0 — 2026-10-09
- **🔍 El caso, listo como juego de La Copa** (D-257), por ahora en el laboratorio: en español,
  inglés, portugués y alemán, con su portada animada en la antesala (cartas que se dan vuelta solas y
  una lupa que las recorre), la sesión de prueba y el desglose del puntaje: 100 con el caso resuelto,
  menos 10 por error. Se juega en `/case/`; una copa todavía no lo puede elegir.

## 0.137.0 — 2026-10-09
- **🔍 El caso, más vivo** (D-256): las cartas se dan vuelta al empezar para descubrir a los
  sospechosos; la elegida se acerca con un zoom suave; al marcar cae un sello (😇, 🔪 o ❌) con un
  destello verde, rosado o rojo; y al resolver el caso pasa una ola por la grilla. **Tocar una pista
  ilumina en la grilla a las personas de las que habla**, y la última pista va arriba y destacada,
  con letra más grande. Las reglas pasan al final, y la lupa acompaña al título.

## 0.136.0 — 2026-10-09
- **🔍 El caso, en el laboratorio** (D-256): un prototipo de misterio para probar con amigos, solo en
  español. Veinte sospechosos y pistas que siempre dicen la verdad: descubre quién es criminal sin
  adivinar. Hay un caso nuevo cada día, el mismo para todos, y el resultado se comparte. Está en
  `/labs/case/`.

## 0.135.0 — 2026-10-09
- **La portada, de lo más jugado a lo menos** (D-255): después de La Copa vienen Toque y Fama,
  Línea de Tiempo, Reinas y Tango, y así hasta los que menos se juegan; los que vienen
  "Próximamente" siguen al final.

## 0.134.1 — 2026-10-09
- **🏅 Rankings con medalla**: el botón de rankings de la portada, la página de rankings y el ranking
  de Uno al día pasan del 🏆 a la 🏅, para no confundirlos con La Copa, que sigue con su 🏆.

## 0.134.0 — 2026-10-09
- **🧶 Desenredo: Reiniciar nivel**: un botón bajo el tablero devuelve los nudos a donde partió el
  nivel, para empezarlo de nuevo cuando el enredo se complicó. Como Borrar todo en Zip y Reinas,
  el primer toque lo arma y el segundo lo hace, y el reloj sigue corriendo.

## 0.133.2 — 2026-10-09
- **La copa global, dicha sin nombrar países**: el aviso de la invitación pasa a "🌎 Copa global:
  solo temas que se conocen en todo el mundo", en vez de nombrar a Chile y Brasil.

## 0.133.1 — 2026-10-09
- **La hoja con el video, solo en español** (D-254): el video promocional está en español, así que
  en inglés, portugués y alemán el botón de compartir vuelve a compartir directo, como antes.

## 0.133.0 — 2026-10-09
- **Compartir, desde la portada, muestra el video** (D-253): el botón de compartir abre una hoja con el video
  promocional, que se reproduce ahí mismo al tocarlo, y dos opciones: **Invitar a jugar**, el
  mensaje de siempre con la tarjeta de la portada, o **Compartir el video**, un mensaje con el link
  del video en YouTube para mandarlo por WhatsApp u otra app.

## 0.132.1 — 2026-10-09
- **Ninguna copia de trabajo queda sin uso** (D-252): al empezar cada sesión de Claude se borran,
  además de las fusionadas, las copias vacías y las abandonadas (sin PR y quietas más de tres días,
  con su rama guardada antes en GitHub), también las de la app. Sin cambios para quien juega.

## 0.132.0 — 2026-10-09
- **🩺 Salud, una sección nueva del panel** (D-251): cuántas cargas no arrancaron, cuántas tuvieron
  errores, cuáles son esos errores (en qué página, en qué navegador, en qué versión y desde cuándo) y
  cuánto tarda cada página en poder jugar. Lo anota el vigía (`vigia.js`), un script chico que cada
  página carga antes que todo lo demás, así que avisa también cuando lo que falla son los módulos. Sin
  IP, sin dirección completa y del navegador solo su familia y versión. Un punto rosado en la
  navegación avisa si hoy o ayer alguna página no arrancó.

## 0.131.0 — 2026-10-09
- **🏁 La Gran Final: las rondas de todos** (#259): en la tabla del día de la final, bajo el
  puntaje y el tiempo de cada jugador va su tarjeta de cinco rondas (⏳75 🔢85 👑100 🔤60 📅90),
  para comparar en qué ronda ganó o perdió cada uno. La pidió un jugador por 🐞.

## 0.130.0 — 2026-10-08
- **〰️ Zip: diez niveles y listo** (D-250): ya no hay niveles sin fin. Son diez, de 4 × 4 a 7 × 7,
  y quien los resuelve todos termina ahí con 100 puntos, sin esperar el reloj; entre ellos gana
  quien terminó antes. Antes, seguir resolviendo después del décimo hacía perder el desempate. El
  encabezado dice "Nivel 3 de 10" y va en una sola línea también en portugués, igual que en Desenredo.

## 0.129.1 — 2026-10-07
- **Toque y Fama: la fama es verde y el toque amarillo**, como en Wordle (#196): en las letras de
  🔤 Palabra, en las pistas de 🔢 Número y del juego de sala, y en la tarjeta de Palabra
  (🟩 fama, 🟨 toque, ⬛ no está). Antes la fama era amarilla, que en Wordle quiere decir "en otro lugar".

## 0.129.0 — 2026-10-06
- **Entrar, arriba y a la vista** (D-249): sin nombre y PIN tus partidas no quedan en ningún
  ranking, y la invitación quedaba al final, bajo las reglas. Ahora es una tarjeta con su botón
  "Entrar" justo bajo "Empezar" y "Volver al menú" en cada juego, bajo el puntaje al terminar y, en Uno al día, antes de los
  botones del resultado y antes de la racha en su página.

## 0.128.2 — 2026-10-06
- **Portada: lo que viene, al final**: Generala y Julepe, que todavía dicen "Próximamente", van al
  final de la lista, con y sin filtro, y ya no quedan entre los juegos que se pueden abrir.

## 0.128.1 — 2026-10-06
- **Portada: el idioma a un lado, las acciones al otro**: en la barra de arriba, el selector de
  idioma va a la izquierda y el sonido, los rankings y compartir a la derecha, en dos bloques. En
  un celular angosto, si no caben juntos, las acciones bajan a una segunda línea.

## 0.128.0 — 2026-10-06
- **📝 Generala, próximamente** (D-246, D-248): la portada anuncia el juego de dados, todavía sin
  abrirlo. Ya está hecho entero: cinco dados, hasta tres tiros por turno guardando los que sirven, y
  una planilla de once casillas que la app suma sola. Se va a jugar en un celular (2 a 6), en varios
  celulares con sala y chat, o solo, con récord y ranking; en portugués se llama General. Al abrirse
  entra a Uno al día, con los mismos dados para todos (D-247).

## 0.127.3 — 2026-10-06
- **¿Dónde queda?: el reloj ya no tapa "‹ Laboratorio"** (D-203): en la prueba del laboratorio, la
  píldora con 🧪 y el reloj va en la barra, entre volver y 🔊, sin pisarlos. En los celulares más
  angostos queda solo el 🧪, o solo el reloj. En los demás juegos de La Copa, el reloj ya no se
  parte en dos líneas.

## 0.127.2 — 2026-10-06
- **Cuarto Rey: la mesa en inglés del README, con cuatro jugadores**: la captura salía con un quinto
  "undefined ♂", porque el guion llenaba todas las filas de la mesa recordada aunque trajera menos
  nombres. Ahora quita las filas que sobran, fija el género de cada jugador (antes heredaba los de
  otra prueba), comprueba que la mesa sea la del guion, y las capturas de Cuarto Rey están rehechas.

## 0.127.1 — 2026-10-06
- **¿Dónde queda?, sin el globo dibujado al cargar** (D-245): el globo espera a la imagen satelital
  y aparece con un fundido, en vez de mostrarse dibujado por un instante.

## 0.127.0 — 2026-10-06
- **El español, con la bandera de España** (D-244): en el selector de idioma, ES lleva 🇪🇸 en vez
  de 🇨🇱, para que las cuatro banderas digan el idioma. La temática Chile y las copas para Chile no cambian.

## 0.126.1 — 2026-10-06
- **Uno al día, más claro en tu página** (D-230): el calendario muestra en cada día jugado el puntaje
  de 0 a 100 en una píldora, como en La Copa; "Hoy jugaste" lleva el emoji del juego (👑 Reinas: 87
  puntos); dice "Próximo juego en 7 h"; y los comodines explican para qué sirven: salvan tu racha el
  día que no juegas.

## 0.126.0 — 2026-10-06
- **El botón de compartir, a color** (D-243): la caja va celeste y la flecha rosada, con la sombra
  de los botones de la página, en vez del blanco que se veía apagado al lado de 🔊 y 🏆.

## 0.125.0 — 2026-10-06
- **El botón de compartir, con el ícono de siempre** (D-242): arriba a la derecha de la portada, el
  📤 pasa a ser la flecha que sale de una caja, la de compartir del celular, y se ve igual en todos.

## 0.124.0 — 2026-10-06
- **⭐ Favoritos, en la misma fila que los tipos** (D-241): la ficha va primera, junto a Palabras,
  Lógica, Cultura y Cartas/Dados, así los filtros ocupan una línea menos. En los celulares más
  angostos, donde no cabe, sigue arriba de los tipos.

## 0.123.0 — 2026-10-06
- **La Copa y Uno al día, mitad y mitad** (D-239): en la portada, Uno al día pasa a una tarjeta al
  lado de La Copa, con el emoji a la izquierda del título. Los títulos de las dos van en color,
  dorado y celeste, para distinguirlas de los juegos, y en La Copa jugadores y días caben en una
  línea. El dado vuelve a decir **Juego al azar**.

## 0.122.0 — 2026-10-06
- **Juegos favoritos** (D-238): cada juego de la portada tiene una ☆ en la esquina. Al tocarla,
  queda entre tus favoritos, y arriba de los tipos aparece **⭐ Favoritos**, que deja ver solo esos.
  Se guardan en tu celular, sin cuenta. Lo pidió un amigo (#233).

## 0.121.0 — 2026-10-06
- **Uno al día, para todos** (D-230): en la portada, al lado de **🎲 Al azar**, está **📅 Uno al
  día**: cada día un juego sorpresa, el mismo desafío para todos. Lleva tu racha, con comodines 🧊,
  un calendario y cómo te va en cada juego; con tu nombre y PIN entras a los rankings de hoy, de la
  semana y de rachas, e invitas a amigos a superarte. Si quieres, te avisa cada día a la hora que
  elijas. Hoy es el **Uno al día n.° 1**.
- **El globo para agregar la app a inicio, para todos** (D-232): en el celular, la portada invita a
  agregar Juegos de Salón a la pantalla de inicio, con los pasos de tu celular. La ✕ lo cierra para
  siempre.

## 0.120.2 — 2026-10-06
- **Uno al día: el recordatorio es el aviso de la app** (D-230): se saca "Agregar recordatorio" al
  calendario del celular; el recordatorio de cada día es el aviso diario, a la hora que elegiste. El
  calendario de tu página vuelve a llamarse "Calendario". En el laboratorio.

## 0.120.1 — 2026-10-06
- **Uno al día sin el recordatorio de más** (D-230): con los avisos activos, `/today/` ya no ofrece
  agregar un recordatorio al calendario, que repetía el aviso. En el laboratorio.

## 0.120.0 — 2026-10-06
- **Uno al día, más simple al terminar, en el laboratorio** (D-230): en El Ahorcado, Batalla Naval y
  Dudo ya no sale la revancha (la tarjeta ofrece jugar otro o repetir el de hoy), y bajo el resultado
  queda un solo ranking, el de Uno al día. "Agregar al calendario" pasa a **⏰ Agregar recordatorio**,
  con una línea que dice para qué sirve. El panel del dueño mide qué se hace en Uno al día.

## 0.119.1 — 2026-10-06
- **Del dado al juego, sin pantalla vacía** (D-237): en Juego al azar y Uno al día, el dado queda
  en pantalla mientras el juego carga y se desvanece recién cuando el juego está listo debajo.

## 0.119.0 — 2026-10-06
- **Uno al día en el panel del dueño** (D-230): cuántas partidas de Uno al día se juegan y de qué
  juego, cuántos vuelven al día siguiente y a la semana, sus rachas y las invitaciones aceptadas.
  Para el jugador no cambia nada; Uno al día sigue en el laboratorio.

## 0.118.0 — 2026-10-06
- **Avisos de Uno al día, en el laboratorio** (D-230): la segunda vez que juegas, puedes pedir un
  aviso diario a la hora que elijas (9:00, 13:00 o 19:00). Te avisa que el de hoy ya está, a las
  21:00 si tu racha está por cortarse, y los lunes cómo te fue la semana. Nunca de noche, a lo más
  dos al día, y se calman solos si dejas de jugar. En la app instalada, el ícono muestra un 1
  mientras falta el de hoy. Sin avisos, puedes agregarlo a tu calendario.

## 0.117.0 — 2026-10-06
- **Uno al día con rankings, comodines e invitaciones, en el laboratorio** (D-230): entrando con
  tu nombre y PIN, tu Uno al día pasa de un celular a otro y entra a los rankings de hoy, de la
  semana y de rachas. Cada 7 días seguidos ganas un comodín 🧊, que salva tu racha si un día no
  juegas. Puedes invitar a un amigo: le llega "Sara te desafía" con tu racha, juega el mismo desafío,
  ven quién ganó y tú ganas un comodín.

## 0.116.0 — 2026-10-06
- **Uno al día suma El Ahorcado, Batalla Naval y Dudo, en el laboratorio** (D-230): desde el 12 de
  octubre el dado también puede caer en ellos. Abren directo, sin elegir modo: El Ahorcado con una
  palabra del mazo, Batalla Naval y Dudo contra el celular. La palabra, la flota del celular y los
  dados son los mismos para todos ese día. El puntaje va de 0 a 100: en El Ahorcado, por las vidas
  que te quedan; en Batalla Naval, por los disparos que usaste o los barcos que tocaste; en Dudo,
  por los dados que te quedan o las rondas que aguantaste.

## 0.115.0 — 2026-10-06
- **Uno al día, en el laboratorio** (D-230): un botón nuevo en la portada, al lado de Juego al
  azar. El dado rueda y cae en el juego de hoy, el mismo desafío para todos. Al terminar ves tu
  racha y puedes compartir el resultado sin decir qué juego tocó, o tirar el dado por otro juego. En
  `/today/` están tu racha, un calendario del mes y cómo te va en cada juego. Por ahora entran los 7
  juegos de La Copa que se juegan solos, y todo se guarda en el celular. Se activa en `/labs/`,
  donde también se puede probar con una tarjeta junto a La Copa en vez del botón.

## 0.114.2 — 2026-10-06
- **Cambiar el PIN va en "Juegas como"** (D-236): al tocar tu nombre se despliegan Cambiar el PIN,
  con una línea que explica para qué sirve, y Salir. En Rankings queda solo **Tus partidas**, con
  cuántas veces jugaste cada juego.

## 0.114.1 — 2026-10-06
- **Del dado al juego, sin corte** (D-235): en Juego al azar, el dado se desvanece en el fondo
  de la app y el juego aparece con un fundido, en vez de cambiar de golpe.

## 0.114.0 — 2026-10-06
- **"Tus copas" separa las terminadas** (D-234): en la portada de La Copa, las copas que ya
  terminaron llevan la etiqueta **Terminó** y no se ven de entrada. Para verlas, se prende
  **Mostrar copas terminadas**, al pie de la lista.

## 0.113.0 — 2026-10-05
- **Un globo en la portada invita a agregar la app a inicio, en el laboratorio** (D-232): con un
  toque en **Agregar** salen los pasos de tu celular (Safari o Chrome, en iPhone o Android); en
  Android, si Chrome lo ofrece, su propio botón de instalar. La ✕ lo cierra para siempre. Se
  activa en `/labs/` para probarlo.

## 0.112.0 — 2026-10-05
- **Los avisos se miden en el panel** (D-233): cuántos celulares los tienen, cuántos avisos se
  mandan y se tocan por tipo, cuántos abren la app instalada y a qué hora pasó la última vuelta,
  para notar si GitHub dejó de mandarlos. Para el jugador no cambia nada.

## 0.111.1 — 2026-10-05
- **El selector de idioma lleva las banderas también en el celular** (D-231): antes, en una
  pantalla angosta quedaban solo ES EN PT DE. Ahora la bandera va arriba de cada código, sin
  que el selector crezca, y en una pantalla ancha va al lado, como siempre.

## 0.111.0 — 2026-10-05
- **Avisos más justos** (D-229): a lo más 2 por copa al día, y si se vencen dos días a la vez,
  van en un aviso. Al tocarlo abre el día que avisa, listo para jugar, y en Android trae los botones
  **Jugar** y **Silenciar esta copa**. Si tienes días nuevos en varias copas, llega uno solo. Si la
  copa termina empatada arriba, el aviso nombra a todos los que ganaron.

## 0.110.0 — 2026-10-05
- **Avisos de La Copa para todos** (D-228): la 🔔 de cada copa ya no está solo en el laboratorio.
  Quien la activa recibe en el celular cuándo se abre un día, cuándo se le acaba el plazo para
  jugarlo, La Gran Final y quién ganó. En iPhone, con la app agregada a inicio.

## 0.109.1 — 2026-10-05
- **La campana de avisos aparece en la app del iPhone** (D-227): el iPhone abre la app agregada a
  inicio en la portada, sin lo que se activó en Safari, así que la campana no salía. Ahora sale
  siempre en esa app, y los pasos para agregarla dicen cómo volver a la copa: con su código, tu
  nombre y tu PIN.

## 0.109.0 — 2026-10-05
- **Compartir la app manda imagen y texto** (D-226): el 📤 de la portada manda la tarjeta de Juegos
  de Salón y un mensaje con cuántos juegos hay, La Copa, para jugar en grupo o solo, y el link.
  Los dos en el idioma en que se mira la app. En un computador se copia el texto, como antes.

## 0.108.1 — 2026-10-05
- **Los avisos de La Copa ya tienen su clave** (D-225): con ella se pueden mandar de verdad, todavía
  en el laboratorio. En iPhone, la app agregada a inicio desde una copa con los avisos del
  laboratorio activados ya muestra la campana: antes no la veía, porque no comparte lo guardado en
  Safari.

## 0.108.0 — 2026-10-05
- **Los avisos de La Copa llegan de verdad, en el laboratorio** (D-224): cuando se abre un día,
  cuando se te acaba el plazo para jugarlo, en La Gran Final (con tu lugar en la tabla) y al
  terminar la copa; al admin, cuando alguien se inscribe. Nunca de noche, en tu idioma y a tu
  hora. Los manda GitHub cada 15 minutos; se abren a todos cuando el dueño vea llegar uno.

## 0.107.0 — 2026-10-05
- **Avisos de La Copa, en el laboratorio** (D-223): una campana en cada copa para activar los
  avisos al celular, con la oferta después de jugar, el permiso del sistema, un aviso de
  confirmación y los ajustes. En iPhone, los pasos para agregar la app a inicio. Todavía no se
  mandan avisos: se activa en `/labs/` para probarlo.

## 0.106.1 — 2026-10-05
- **La app instalada se llama Juegos de Salón** (D-222), o Party Games, Jogos de Salão o
  Salonspiele, según el idioma elegido. Antes decía solo "Juegos", y en iPhone tomaba el nombre del
  juego que estaba abierto. Quien ya la instaló la ve con el nombre nuevo al reinstalarla.

## 0.106.0 — 2026-10-05
- **"Tus copas" te sigue a cualquier celular** (D-220): si entras con tu nombre y PIN de jugador,
  la portada de La Copa muestra también las copas que juegas en otros celulares. Al abrir una, tu
  nombre ya está elegido y solo falta el PIN de esa copa.

## 0.105.0 — 2026-10-05
- **La app se puede instalar de verdad** (D-221): íconos para Android y iPhone, y un service worker
  que todavía no guarda nada. Es el primer paso de los avisos de La Copa al celular, para quien los
  quiera ([PWA-NOTIFICACIONES.md](docs/PWA-NOTIFICACIONES.md)). Nada cambia al jugar.

## 0.103.0 — 2026-10-05
- **`/records/` más fácil de leer** (D-219): arriba el Ranking general y una tabla nueva, Más
  partidas jugadas; abajo, un filtro entre 🎮 Juegos y 🏆 Copas. Línea Relámpago es una sola ficha
  con sus temáticas adentro.
- **La bandera junto a cada nombre** en todos los rankings, el medallero y las últimas copas.

## 0.102.2 — 2026-10-05
- **Lo de después de fusionar se hace solo** (D-218): las reglas de Firebase se publican en cada
  fusión, antes que el sitio; las copias de trabajo ya fusionadas se borran al empezar cada sesión
  de Claude, y GitHub borra la rama. Sin cambios para quien juega.

## 0.102.1 — 2026-10-05
- **Rankings: tu partida aparece apenas terminas** en Línea Relámpago y en Toque y Fama solo. La
  tabla del final se leía mientras la partida se guardaba y salía sin ella; ahora se vuelve a leer
  cuando queda guardada (en los juegos de La Copa ya era así).

## 0.102.0 — 2026-10-05
- **Los rankings, para todos** (D-217): ya no hace falta activarlos en `/labs/`. El 🏆 de la
  portada lleva a `/records/`; cada juego muestra su ranking (récords o victorias) y la invitación a
  entrar con nombre y PIN, y La Copa muestra sus campeones.

## 0.101.1 — 2026-10-05
- **Los PR se fusionan solos cuando pasan sus pruebas** (D-216): cada PR listo lleva el auto-merge
  de GitHub, y `main` exige, además de `pruebas`, un check que resume todas las pruebas en Chrome
  (`punta-a-punta`). Sin cambios para quien juega.

## 0.101.0 — 2026-10-05
- **Cada juego con su ranking, en el laboratorio** (D-215): los juegos de grupo (Línea de Tiempo,
  Toque y Fama, El Ahorcado, Dudo y Batalla Naval) cuentan las victorias de cada jugador, de la
  semana y de siempre, con su tabla en la intro. Toque y Fama solo y Línea Relámpago (una tabla por
  temática) guardan su récord de 0 a 100. `/records/` suma las dos secciones.

## 0.100.0 — 2026-10-05
- **Rankings, en el laboratorio** (D-212): con un nombre y un PIN de 4 dígitos, sin cuenta y en
  cualquier celular, los juegos sueltos guardan tu mejor puntaje y cuentan tus partidas. Cada juego
  tiene su ranking (semana, siempre, amigos de La Copa y Copa) con tus vecinos si quedaste abajo;
  `/records/` suma el Todoterreno y el medallero de La Copa. Por ahora solo en los celulares que
  los activan en `/labs/`. La historia de La Copa ya está cargada: quien jugó antes reclama sus
  puntajes al entrar con su nombre.

## 0.99.7 — 2026-10-05
- **Cuarto Rey: el pase del celular en una sola pantalla** (D-213): lo que pasó ("¡Salud!", quién
  toma) y "Pásale el celular a X" se ven juntos, y solo avanza el botón "¡Dame la carta!": ya no se
  cierra solo ni con un toque en cualquier parte.
- Cuarto Rey: las cifras y las letras de las cartas en la letra de los números, como en los demás
  juegos, y los botones de género de 44 px. La mesa recordada se conserva.
- Panel: las partidas de Cuarto Rey dicen cómo terminaron (quién sacó el cuarto rey y con cuántas
  cartas).

## 0.99.6 — 2026-10-05
- **Las reglas se revisan solas** (D-213): una prueba exige a cada juego su motor con tests, su
  gancho de pruebas y su especificación, o una excepción con su decisión; el revisor de la
  documentación avisa de números de decisión que faltan, estados sin marcar, IDs repetidos y rutas
  que no existen. Las pruebas en Chrome toman un puerto libre y cierran su navegador al terminar,
  así que varias sesiones pueden probar a la vez. Sin cambios para quien juega.

## 0.99.5 — 2026-10-05
- **Las reglas, en un solo lugar** (D-213): los cánones dicen la regla de hoy y se pusieron al día
  con las decisiones que los habían dejado atrás (la privacidad de las partidas sin red, la semilla
  y sus excepciones, el pase del celular, lo que se preselecciona, los modos de un juego de grupo).
  Las decisiones tienen un estado cerrado, un índice por tema y una tabla de rutas de entonces y de
  hoy; los requerimientos ya no repiten IDs y cada juego tiene su especificación con la misma
  plantilla. Sin cambios para quien juega.

## 0.99.4 — 2026-10-04
- **El filtro de la portada, en inglés en la URL** (D-214): `?type=logic`, `?type=tabletop`, en vez
  de `?tipo=logica` o `?tipo=mesa`. Los links viejos siguen filtrando lo mismo.

## 0.99.3 — 2026-10-04
- **Panel: en qué idioma se jugó** (D-211): cada copa, sala y partida sin red lleva una etiqueta
  con su idioma (ES, EN, PT, DE; las dos si en una sala cada uno jugó en el suyo), y hay un
  desglose de copas por idioma y del idioma de cada juego.

## 0.99.2 — 2026-10-04
- **Panel: quién juega sin red** (D-210): las partidas contra el celular, en un celular o en
  solitario muestran el nombre que la persona ya usa en la app, con su bandera, y cómo terminaron
  (quién ganó, o el puntaje y el tiempo jugando solo). La sección Juegos las lista todas.

## 0.99.1 — 2026-10-04
- **Panel: la bandera junto a cada nombre** (D-209), también en "va primero", en los retirados y
  en la historia de una copa. Quien se inscribió antes de que La Copa guardara el país lo anota
  solo la próxima vez que abre su copa.
- Panel: los juegos de La Copa jugados sueltos salen con su nombre, no con su clave.

## 0.99.0 — 2026-10-04
- **El panel se navega** (D-207): cuatro secciones —Ahora, La Copa, Juegos, Audiencia— y una ficha
  por cada copa, juego y sala. La de una copa trae la tabla completa, una grilla de cada jugador
  por cada día y su historia evento por evento. Cada cifra de Ahora abre la lista que la suma, la
  vista queda en la URL y las horas son del Pacífico. Cada nombre lleva la bandera de su país: La
  Copa lo guarda ahora al inscribirse, y los reportes 🐞 también.
- **El tráfico del sitio, aunque nadie juegue** (D-208): visitas, páginas vistas, de dónde llegan
  (solo el dominio), por qué link, primera vez o vuelve, aparato, país y cuántas visitas llegan a
  jugar, en la sección nueva 📈 Tráfico del panel. Los links que comparte la app llevan `de=link`
  al final: WhatsApp no dice de dónde viene nadie.
- Arreglo: una copa que el admin terminó antes ya no sale en curso en el panel.

## 0.98.2 — 2026-10-04
- **Publicar es más rápido** (D-204, D-205): las pruebas de punta a punta más largas corren en
  partes a la vez, la versión se pone al publicar y no en cada PR (dos cambios abiertos ya no
  chocan), y un cambio que solo trae documentación no espera esas pruebas. Si fallan después de
  fusionar, se abre un aviso solo. Para quien juega no cambia nada.

## 0.98.1 — 2026-10-04
- **README: capturas rehechas en todas las secciones** después de la mudanza a `public/` (D-192),
  con los emojis de Apple y las salas en el Firebase real. La del cuarto rey ya no sale con el
  confeti tapando la instrucción, y los guiones de sala de Toque y Fama y Batalla Naval abren el
  segundo celular en el servidor propio de la sesión, no en el 8765 (D-135).

## 0.98.0 — 2026-10-04
- **¿Dónde queda? a pantalla completa** (D-203): el globo ocupa toda la pantalla, en el celular y
  en el computador. La ciudad, el reloj, las reglas plegadas, la brújula, + y − y Confirmar flotan
  encima.

## 0.97.0 — 2026-10-04
- **¿Dónde queda?: el mapa se gira con dos dedos** (D-200), como en los mapas del celular. Con el
  mapa girado aparece una brújula sobre + y −; tocarla vuelve a poner el norte arriba.
- **¿Dónde queda?: el zoom llega a 64 veces** (D-202, antes 16), para que el dedo pueda apuntar
  dentro de los 25 km del 🎯.
- **¿Dónde queda?: se acabó el polo mal parchado** (D-201). Las imágenes nítidas que se cargan al
  acercar estaban cortadas corridas: sobre el Ártico aparecía África estirada. Se rehicieron todas.

## 0.96.0 — 2026-10-04
- **Todas las pantallas, probadas en todos los idiomas** (D-199): cada juego tiene una prueba que
  recorre sus pantallas en español, inglés, portugués y alemán, y avisa si algo quedó sin traducir,
  a medio armar o fuera de la pantalla. Las pruebas de La Copa, Línea de Tiempo, los errores de sala
  y los links con idioma ahora prueban también el alemán, y cualquier idioma que se sume.
- **Palabra en alemán**: la nota de las diéresis es más corta y el botón "Zurück zum Menü" vuelve a
  caber en la pantalla.

## 0.95.0 — 2026-10-04
- **Ya no hay minijuegos** (D-198): Conexiones, Reinas, Tango, Zip, Desenredo, ¿Dónde queda?,
  ¿En qué año? y Toque y Fama: Palabra son juegos como los demás. Viven en la raíz (`/queens/`,
  `/tango/`, `/connections/`…) y los links con `/minigames/` siguen andando. La Copa dice "un
  juego distinto cada día" en los cuatro idiomas, y el panel los cuenta como juegos.

## 0.94.0 — 2026-10-04
- **🇩🇪 El alemán, para todos** (D-197): sale del laboratorio. El toggle ofrece DE en cualquier
  celular y `juegosdesalon.cl/de/` deja la app en alemán, con su tarjeta para los chats
  (Salonspiele). El link del laboratorio, `/labs/de/`, ahora lleva a `/de/`, y el laboratorio ya
  no muestra la sección del alemán. Quien tenía la marca del laboratorio deja de ver 🧪 y 🐞.

## 0.93.0 — 2026-10-03
- **Portada: los filtros quedan pegados arriba** (D-196). Al bajar por la lista, los tipos de
  juego (Palabras, Lógica, Cultura, Cartas/Dados) se quedan a mano. Elegir uno desde abajo lleva
  la lista a su primera tarjeta.

## 0.92.1 — 2026-10-03
- **Laboratorio alemán: el idioma ya no se queda pegado en alemán** (D-195). Con otro idioma
  elegido, "‹ Menú" lleva al menú de siempre en ese idioma (antes llevaba a la portada del
  laboratorio, que está en alemán). En alemán sigue volviendo al laboratorio.

## 0.91.0 — 2026-10-03
- **Sin destello de idioma** (D-194): al abrir una página en inglés, portugués o alemán ya no se
  ven los textos en español una fracción de segundo antes de cambiar.
- **Laboratorio alemán** (D-194): todo el alemán pasa a Hochdeutsch común para Alemania, Austria
  y Suiza (con ß, sin palabras ni referencias de un solo país). Una copa con palabras en alemán cambia de día a medianoche de
  Europa central (Berlín, Viena, Zúrich), y las instrucciones de Palabra y del Ahorcado dicen que
  las diéresis van sin puntos (Ä es A) y la ß como SS.

- **Las direcciones pasan al inglés** (D-192): `/hangman/`, `/cup/`, `/timeline/`, `/bulls-and-cows/`,
  `/liars-dice/`, `/battleship/`, `/julep/`, `/fourth-king/` y `/minigames/<slug>/`. Los links
  viejos siguen andando: cada ruta en español es una página puente que manda a la nueva con todo
  lo que traía (la sala, el nombre de la copa, el idioma) y con la misma tarjeta para los chats.
  Nada guardado cambia: los ids de los juegos son los de siempre.
- **El sitio vive en `public/`** y es lo único que se publica, con un workflow que corre las
  pruebas antes: si una falla, el sitio no cambia. `docs/`, `tools/`, las reglas de Firebase y el
  video dejan de ser públicos.
- **El taller, ordenado:** `tools/` por función (`release/`, `firebase/`, `generators/`, `agents/`,
  `e2e/<juego>/`), un minijuego de La Copa por carpeta (`cup/games/<slug>/`) y el import map de
  versiones armado solo, sin lista que mantener.

## 0.90.6 — 2026-10-03
- **README al día, con capturas** (C-13): la tabla de juegos suma los minijuegos que se juegan
  sueltos desde la portada (`tools/release/hechos.mjs` ahora lee `SUELTOS`, así que uno nuevo aparece
  solo), con sus nombres en la tabla de idiomas. Se rehicieron las capturas de todas las
  secciones con las fuentes reales; el pie de Cuarto Rey "Cheers!" pasa a "Who drinks", porque
  esa pantalla cambia de título según la carta.
- **"Actualiza el README" es una pasada entera** (CLAUDE.md): bloques generados, prosa y capturas.

## 0.90.5 — 2026-10-03
- **⚓ Batalla Naval: la pantalla baja hasta ¡Zarpar!** (#47): en un celular chico, al poner el
  quinto barco, si "⚓ ¡Zarpar!" no se ve, la pantalla baja sola hasta él. Pasa una vez, al
  completar la flota (tocando, arrastrando o con Al azar), y nunca a mitad de un arrastre.

## 0.90.4 — 2026-10-03
- **💬 El aviso del chat ya no se come los toques** (#48, U-12): la etiqueta que asoma junto a la
  burbuja cuando llega un mensaje deja pasar los toques, así que tocar "🔁 Revancha" (o lo que
  quede debajo) hace lo que dice el botón. El chat se abre con la burbuja. Vale para los seis
  juegos con chat; los lectores de pantalla siguen oyendo cada mensaje.

## 0.90.3 — 2026-10-03
- **☀️ Tango: el choque se marca al tocar otra casilla** (#135): sin la espera de 500 ms. Un sol
  de paso que rompe una regla se pinta en rojo (con sonido y vibración) recién cuando el jugador
  toca otra casilla, que es cuando el puntaje lo cobra: lo rojo es lo que cuenta. El puntaje no
  cambia. Con el tablero lleno, el último choque se ve sin sonar ni contar.
- **El sol dado se distingue del jugado** (#61): ámbar más intenso y borde propio.

## 0.90.2 — 2026-10-03
- **🏆 La Copa: cuatro dilemas de usabilidad resueltos.**
  - El recordatorio del día abre con el emoji del minijuego ("⏳ Hoy toca Línea Relámpago."), sin
    emoji en medio de la frase (#114, U-2).
  - La bienvenida del admin con link propio dice una sola vez que cierre la inscripción, con el
    porqué al lado (#102).
  - Los botones de Administrar dicen la acción: "📤 Invitar al grupo", "📤 Recordar el juego de
    hoy" y "📤 Compartir la tabla" (#65, U-5, U-17).
  - Si el 1.° y el 2.° empatan en puntos, el podio y el resumen dicen qué desempató: "⚖️ Empate en
    68 puntos: desempató quien ganó más días." "Cómo funciona" cuenta el desempate (#79).

## 0.90.1 — 2026-10-03
- **☀️ Tango: el sol de paso ya no se marca como choque en iPhone** (U-20, reporte 🐞 del 2-oct).
  Para poner una luna hay que pasar por el sol; si se tocaba dos veces rápido la misma casilla,
  iOS podía tomar el segundo toque como zoom y el sol quedaba en rojo. El tablero ya no acepta
  ese gesto (`touch-action: manipulation`, como el teclado de los juegos).

## 0.90.0 — 2026-10-03
- **🇩🇪 El alemán, en el laboratorio** (D-191): la app entera en alemán (Salonspiele) para que la
  revisen amigos que lo hablan, en `/labs/de/`. Solo ese celular ofrece DE en el toggle; ahí los
  "‹ Menü" vuelven al laboratorio y 🐞 en la barra de arriba manda comentarios con su contexto
  (`node tools/firebase/reportes.mjs`). Es un borrador con glosario fijo: ver `docs/ALEMAN.md`.
- **Arreglos para todos**, que salieron de medir el alemán a 320 px: los acentos de los títulos
  con degradado ya no salen cortados (SALÓN, SALÃO); la barra de arriba no se parte en dos líneas
  (el nombre del juego se corta con "…"); Palabra ya no muestra "null", su teclado deja un hueco
  donde el español tiene la Ñ y el botón Probar va a lo ancho; el título de la pestaña de La Copa
  sale en el idioma de quien mira.
- **Reglas de Firebase:** una copa puede guardar `lang: "de"`.

## 0.89.0 — 2026-10-03
- **🧶 Desenredo sale del laboratorio** (D-190): su tarjeta ya no dice "Próximamente" y se juega
  suelto desde el menú, en `/minigames/untangle/`. En La Copa se puede elegir para cualquier día,
  como los demás minijuegos.

## 0.88.0 — 2026-10-03
- **🎲 Juego al azar** (D-188): un botón bajo el título del menú tira un dado blanco en 3D con un
  juego en cada cara; rueda, rebota, cae en uno y lo abre. Nunca sale La Copa, y si hay un filtro
  de tipo puesto, sale uno de esos. Se probó primero en el laboratorio.

## 0.87.1 — 2026-10-03
- **Tango: las casillas que no se pueden cambiar llevan un candado chico** en la esquina: las que
  vienen puestas (candado blanco) y las que reveló una pista (candado cian, como su borde). La
  esquina superior izquierda queda libre de las marcas = y ≠, que van en los otros bordes.

## 0.87.0 — 2026-10-03
- **La Copa: el público se elige entre 🌎 Global, 🇨🇱 Chile y 🇧🇷 Brasil** (D-187). Global deja
  fuera lo que se conoce solo en Chile o en Brasil (lo que antes era "Internacional"). Chile y
  Brasil suman los temas de su país y dejan fuera los del otro. Una copa para Brasil juega
  también la temática Brasil de Línea de Tiempo. La invitación y el tablero dicen el público.

## 0.86.0 — 2026-10-03
- **La Copa puede ser internacional** (D-186): al crearla se elige "Con temas locales" o
  "Internacional". La internacional deja fuera lo que se conoce solo en Chile o en Brasil: la
  temática Chile de Línea de Tiempo, las grillas de Conexiones con palabras locales, algunas
  palabras chilenas y las ciudades chilenas y brasileñas que no son capitales. La invitación y el
  tablero lo dicen. Las copas de siempre no cambian.

## 0.85.4 — 2026-10-02
- **🧶 Desenredo: instrucciones más cortas** (U-18, D-184): de 337 a 209 caracteres. La meta va
  primero y no se repite lo que muestra el dibujo de ejemplo.
- **Reglas para instrucciones concisas** (U-18): la meta primero, a lo más 3 puntos y el puntaje
  en una frase. Una prueba frena las que pasen de 280 caracteres, en los tres idiomas.
- **Desenredo: cuerdas menos onduladas** (D-185): la segunda onda queda a menos de la mitad y la
  curva más tensa.

## 0.85.3 — 2026-10-02
- **🧶 Desenredo: cuerdas más naturales** (D-183): cada cuerda lleva una segunda onda, más corta y
  suave, y una textura de dos cabos (uno oscuro y uno claro) que se alternan como en una cuerda
  torcida.

## 0.85.2 — 2026-10-02
- **🧶 Desenredo: los hilos son cuerdas** (D-182): con una curva leve, un poco más gruesos y con
  textura de cuerda torcida. Cada hilo tiene su forma y la mantiene al moverlo. Las reglas no
  cambian: un cruce sigue siendo el de la línea recta.
- **Desenredo: el nudo que arrastras ya no desaparece** mientras lo mueves. Chocaba con un estilo
  del arrastre de Línea de Tiempo.

## 0.85.1 — 2026-10-02
- **🧶 Desenredo, usabilidad:** la bajada del menú y de la tarjeta social queda en una frase, como
  la de los demás minijuegos; ya no repite con palabras los niveles y los minutos que la tarjeta
  dice en cifras (U-5, U-8). Al terminar, el contador de cruces vacío deja de abrir un hueco entre
  el tablero y el aviso del final (U-11).
- **Tarjetas para compartir: una imagen atrasada ya no se publica** (D-181). La de Desenredo había
  salido con las píldoras desalineadas, el mismo error de 0.84.2 y 0.84.3, porque se hizo desde
  una rama anterior al arreglo. Cada imagen guarda ahora la huella del dibujo y de los textos con
  que se hizo; si no coinciden con los de hoy, las pruebas del PR y `set-version.py` lo detienen.

## 0.85.0 — 2026-10-02
- **🧶 Desenredo, minijuego nuevo en el laboratorio** (D-179): el Untangle de Simon Tatham. Nudos
  unidos por hilos que se cruzan; se arrastran hasta que ningún hilo cruce a otro. Diez niveles de
  6 a 15 nudos y cuatro minutos, como Zip: 10 puntos por nivel. Entra al pozo de La Copa con su
  propia habilidad (espacial) y tiene su página suelta en `/minijuegos/desenredo/`.

## 0.84.4 — 2026-10-02
- **Línea de Tiempo: el año del veredicto, grande.** Después de colocar una carta, el año en que
  pasó es lo que se viene a mirar: ahora ocupa el ancho de la carta (antes era del tamaño del
  texto). Vale también para el minijuego de Línea de Tiempo de La Copa.
- **La tarjeta de La Copa resalta en el menú**: un degradé dorado, rosa y morado que se mueve
  despacio y un borde dorado, para invitar a armar un torneo de varios días. Con "reducir
  movimiento" queda quieto.

## 0.84.3 — 2026-10-02
- **Julepe vuelve a tener su tarjeta para compartir al día:** aunque está apagado, su página sigue
  y su link se comparte, pero la tarjeta se había quedado como en 0.35.2. Ahora la rehace la misma
  herramienta que las demás, con la bajada nueva, las píldoras centradas y el reloj ⏱️ a color.

## 0.84.2 — 2026-10-02
- **Tarjetas para compartir (lo que se ve al pegar un link en WhatsApp) sin textos desalineados:**
  en las píldoras de jugadores y duración, el texto queda a la misma altura en las dos, y el reloj
  ⏱️ sale a color. Los acentos de los títulos (SALÓN, ¿EN QUÉ AÑO?, ¿DÓNDE QUEDA?, LÍNEA DE
  TIEMPO) ya no salen cortados. Las imágenes traen las bajadas cortas nuevas, y la del menú suma 🏆.

## 0.84.1 — 2026-10-02
- **Conexiones, Reinas, Zip y los demás, jugados desde la portada, ya no se presentan como de
  La Copa:** su antesala no dice "Minijuego de La Copa" ni "no cuenta para ninguna copa" (U-8).
  Son juegos de juegosdesalon.cl; La Copa los agrupa. En el laboratorio sigue el aviso de que es
  una práctica.

## 0.84.0 — 2026-10-02
- **Textos de explicación más cortos en todos los juegos** (D-177, U-8): reglas, ayudas, modos,
  antesalas de La Copa, Administrar y las frases del menú bajan un 37 %. Cada regla se dice una
  vez por pantalla, con frases completas.
- **Reglas que no coincidían con el juego, corregidas:** El Ahorcado en varios celulares es por
  turnos; en Julepe se dice por turno si vas (no "en secreto"), montar es superar la mayor del palo
  de salida y el plato solo crece con dos julepeados o más; Dudo explica cómo se pasa a ases y
  cuándo se puede calzar; Línea de Tiempo dice cómo se gana; Toque y Fama explica el empate por
  réplica; el chancho de Cuarto Rey ya no promete anotarse "en cualquier momento".
- **La Copa:** el aviso de que los días cerrados quedan en 0 sale desde el día 3 (el día 2 el
  día 1 sigue en su día de gracia), también en la invitación; con la copa llena, quien llega lee
  que está llena; "Cómo funciona" ya no le da día de gracia a la final; la sesión de prueba avisa
  que es más corta que el juego y no cuenta.
- **Una palabra por concepto** (U-5): tachar, el celular, jugador, administrador, vidas en El
  Ahorcado, sorbos y "¿Cuántas manos?" en Julepe. Las reglas de Línea de Tiempo quedan plegadas.

## 0.83.1 — 2026-10-02
- **La Copa: en Administrar, la invitación sigue mientras alguien pueda entrar** (D-176). Antes
  desaparecía apenas partía la copa, aunque la inscripción tardía siguiera abierta. Ahora está
  mientras la inscripción esté abierta y haya cupo, y ya partida dice "📅 Ya partió: va en el día
  3 de 7 y todavía puedes entrar." en vez de cuándo parte. El botón del tablero sigue solo antes
  de partir.

## 0.83.0 — 2026-10-02
- **La Copa llega al menú.** Su tarjeta ya no dice "Próximamente": se abre desde la portada y su
  botón "‹ Menú" vuelve al menú. El laboratorio (`/labs/`) sigue para probar, con la Copa de 3
  días (D-175).

## 0.82.4 — 2026-10-02
- **Arreglo: la invitación a una copa en inglés o portugués abre la copa.** El link lleva el idioma
  (`?pirata&lang=pt`, D-170) y, al sacarlo de la barra, el resto quedaba como `?pirata=`, que La Copa
  no reconocía: se abría la portada. Ahora se saca solo el `lang=`. Las copas en español no estaban
  afectadas, porque su link no lleva idioma.

## 0.82.3 — 2026-10-02
- **"‹ Laboratorio" en una sola línea** (U-12): en la práctica de un minijuego con nombre largo
  (¿Dónde queda?, Toque y Fama: Palabra), el botón de volver partía y dejaba el ‹ solo arriba.

## 0.82.2 — 2026-10-02
- **La Copa: cuando falta uno solo, el aviso va en singular** (U-6). El recordatorio dice
  "👀 Falta por jugar hoy: Pancho.", la tabla parcial "Falta que juegue: Pancho." y, al terminar
  antes, "Falta que juegue el día 7: Cata. … se queda sin los puntos". Con dos o más, igual que antes.
  En inglés la misma frase sirve para uno o varios; en portugués también va en singular.

## 0.82.1 — 2026-10-02
- **La Copa: en Administrar, sin hueco vacío sobre los botones** de "Terminar la copa antes",
  "Tabla final" y "Eliminar la copa" (U-11). El aviso de error va debajo del botón, como en
  Nombre de la copa y Jugadores, y vacío no ocupa lugar.

## 0.82.0 — 2026-10-02
- **📍 ¿Dónde queda? sale del laboratorio** (D-174): su tarjeta ya no dice "Próximamente" y se
  juega suelto desde el menú, en `/minijuegos/donde/`, como los otros minijuegos de La Copa.

## 0.81.0 — 2026-10-01
- **Lo que se comparte con imagen ya no repite la imagen en el texto** (D-171). La tabla parcial
  lleva la cabecera y quién falta, sin la tabla escrita; la tabla final, la cabecera y las medallas;
  el resultado del día, solo la cabecera; y jugar solo, la cabecera y el reto. Todo lo demás está en
  la imagen.

## 0.80.0 — 2026-10-01
- **La Copa y sus minijuegos, en inglés y portugués** (D-170). Todo se traduce: la portada, crear
  la copa, el tablero, las reglas de cada minijuego, el desglose del puntaje, Administrar y los
  reportes. El idioma se cambia con el toggle de la portada, de la invitación o del minijuego.
- **Cada copa elige el idioma de sus palabras** al crearla (parte en el de quien la crea):
  Conexiones y Toque y Fama: Palabra se juegan con las mismas palabras para todos, y la
  invitación, los recordatorios, la tabla y los resultados que se comparten van en ese idioma.
  Lo personal (la pantalla) va en el de cada uno.
- **Contenido propio por idioma**, no traducido: grillas de Conexiones en inglés y en portugués,
  palabras secretas de cinco letras en cada idioma (sin Ñ fuera del español) y los nombres de
  países y ciudades de ¿Dónde queda?.
- **Los minijuegos sueltos de la portada** (Conexiones, Palabra, ¿En qué año?, Reinas, Tango,
  Zip) ya no dicen "🇪🇸 In Spanish": se juegan en el idioma de quien juega.
- **El selector de idioma (🇨🇱 ES · 🇬🇧 EN · 🇧🇷 PT) se toca más fácil:** sus botones miden 44 px
  de alto, como todos los demás (C-8). Vale para todos los juegos.

## 0.79.0 — 2026-10-01
- **Reinas: arrastrar desde una X las borra.** Es lo contrario de arrastrar desde una casilla
  vacía: el dedo borra las X por donde pasa y deja las reinas como estaban (D-168).
- **Reinas: 🧹 Borrar todo** deja el tablero en blanco para empezar de nuevo, con un segundo toque
  para confirmar, como en Tango. El reloj sigue corriendo (D-169).

## 0.78.0 — 2026-10-01
- **Reinas: arrastrar pinta X.** Arrastrar el dedo (o el mouse) desde una casilla vacía llena de X
  las casillas vacías por donde pasa: una fila o una columna se descarta de una pasada, como en el
  Queens de LinkedIn. Las reinas y las X que ya estaban no se tocan; el toque y el toque largo
  siguen igual (D-166).
- **Reinas: tocar otra vez una reina la cambia por una X**, y un tercer toque deja la casilla
  vacía. La X ya no depende de saber que existe el toque largo, que sigue funcionando (D-167).

## 0.77.0 — 2026-10-01
- **Todo lo que se comparte sigue un mismo estándar** (D-165). Cada mensaje abre con una cabecera
  —"🏆 *La Copa: Valdenenas* · Día 3 de 7", "📊 … · Tabla de posiciones · día 3 de 7",
  "🃏 *Julepe* · Sala WFBN"—, una idea por línea, y el link solo en la última. Cuando va una
  imagen, lleva arriba la misma cabecera y abajo el mismo link.
- **La Copa: el resultado del día se comparte con imagen**, que dice de qué copa y de qué día es,
  quién jugó, el puntaje, el tiempo y la tarjeta de colores.
- **La Copa: la tabla es una sola.** Desde el gráfico, "Tabla parcial", "Resumen final", el podio o
  exportar, se manda la misma imagen con el texto completo. Terminada, dice "Tabla final".
- **Jugar solo un minijuego también se comparte**, con la misma imagen de resultado y un reto: los
  minijuegos sueltos y el modo solo de Toque y Fama y de Línea de Tiempo.
- **Las invitaciones a una sala** llevan la cabecera del juego y el link en su propia línea.
- Sin menú para compartir (computador), la imagen se descarga y el texto queda copiado.
