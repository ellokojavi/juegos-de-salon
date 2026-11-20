/**
 * The lab's runtime flags by name (D-498), for /labs/, the panel and the tests only. It is apart from
 * flags.js, which almost every page loads, so adding or renaming a flag here does not run the
 * end-to-end scripts of every page (D-515). A new flag is a row here and its card in /labs/.
 */
export const FLAGS = {
  'home-settings': '⚙️ Home page: one ⚙️ settings button holds the language, the sound and the games with no signal, so the top bar is one row',
  'panel-nav-more': '📊 Panel on a phone: five tabs and ☰ More at the bottom, the other sections in a sheet by group',
  'cup-footer': '🏆 La Copa: the board ends with the site footer, its report and leave links as tiles (U-38)',
  'cup-offline': '🏆 La Copa offline: a pending day of a cup this phone opened with signal plays with no signal; the result uploads when the signal is back, if its day is still open (D-544)',
  'cup-talk-hint': '🏆 La Copa: a dismissable balloon on the table that says comments exist, once per phone (D-566)',
  'cup-talk-push': '🏆 La Copa: a notification "💬 they commented on your result" when someone comments on your row, grouped, never at night (D-564)',
  'cup-talk': '🏆 La Copa: today\'s comments on each player stacked on their row of the table; a 💬 opens a text field to add one (D-562)',
  'copa-crear': '🏆 La Copa: the new create screen, with the length from 3 to 14 days and the cup\'s zone, and each player\'s own hours in a cup of another zone (D-521)',
  'copa-jugar': '🏆 La Copa: a gold one-line «🏆 Jugar» button on its home page card when there is no day to play',
  'copa-hoy': '🏆 La Copa: ▶ Jugar hoy on its home page card',
  'copa-espera': '🏆 La Copa: Día N en Xh on its home page card',
  'copa-contexto': '🏆 La Copa: which cup, your place and the day\'s game on its home page card',
  'bn-salva': '🎆 Battleship: Salvo',
  'keyboard-lift': '⌨️ Feedback form above the iOS keyboard',
  'uad-share-grids': '🟩 Uno al día: share grids for Agentes, Dudo, Generala and Battleship',
  'cover-facts': '📖 Game pages: who plays and how long, in the rules',
  'uad-night-totals': '📅 Uno al día: totals written by the hourly rebuild',
  'home-carousels': '🎠 Icon view: the games in rows of three (popular, new, with friends, dexterity and one per type), each game once, in place of the dice, the filters and the list; a tap opens a sheet with the game\'s animation, its ranking, a share button and ▶ Jugar',
  'home-carousels-covers': '🎠 Main page with icons: a tap on an icon goes straight to the game\'s cover, as in production, instead of its sheet',
  'home-pill-bar': '💊 Home page: top bar buttons as pills of one height',
  'cup-back-board': '🏆 La Copa: the header ‹ goes back to the board while playing a day',
  'cup-podium-early': '🏆 La Copa: on the last day, once nothing left to play can change the first three places, the board announces the podium before the cup closes',
  'cup-again': '🏆 La Copa: «Otra copa con este grupo» under a finished cup\'s podium, for its admin: the create screen comes filled from that cup, to check and confirm (#1165)',
  'name-guard': '🛡️ Rankings: offensive names refused on sign-up',
  'uad-clean-hero': '📅 Uno al día: a cleaner points box, your place big, last month\'s crown on its own, the streak in one line',
  'uad-month-end': '🥇 Uno al día: month-end window with your place, a medal for the podium',
  'stack': '🗼 Babel: the game, on the home page, the search and new cups (D-517), with its background music',
  'aletazo': '🐤 Aletazo: the game, on the home page, the search and new cups (D-517\'s way), launched 2026-11-09 at 00:00 Pacific',
  'sudoku': '#️⃣ Sudoku: the game, on the home page, the search and new cups (D-517\'s way), launching 2026-11-11 at 21:00 Pacific',
  'memory': '👀 Memorice: the game, on the home page, the search and new cups (D-517\'s way); its launch date is the owner\'s to pick',
  'dominorama': '🎲 Dominorama: the game, on the home page, the search and new cups (D-517\'s way); prepared, not launched: the owner picks the date',
  'no-double-tap-zoom': '👆 Games: a double tap no longer zooms the page (iPhone)',
  'browser-lang': '🌐 First visit in the browser\'s language (English or Portuguese), not always Spanish (D-536)',
  'babel-tally': '🗼 Babel: the score adds itself up on the end screen, floors + bonuses = points, with its show',
  'word-in-words': '🔤 Home page: Toque y Fama: Palabra gets its own card under the 🔤 Palabras filter (only there: with no filter, Toque y Fama\'s page still picks the number or the word, #767)',
  'game-swipe': '👉 Game covers: swipe left or right to the next or previous game of the list you came from (the home page\'s cards, its filter and search included)',
  'cover-share': '📤 Game covers: a share button in the top bar sends the game\'s link with one line about it',
  'offline': '📴 Offline mode: the app stores the offline-capable games on the phone and opens them with no signal (D-538, PR 2 of 8)',
  'news-once': '📣 Each piece of news told once: no home window on a visit from a notification, no splash for games already played, an ended cup seen on its board is not recapped again (D-546)',
  'routes-hint': '🚇 Broken Routes: a 💡 Hint button on its own page (one player, never La Copa) marks one rectangle of a shortest solution, −3 points each (#1381)',
  'tango-time': '☀️ Tango on its own and in Uno al día (never La Copa): the time scores as in Queens, mistakes cost nothing, a hint adds 15 s',
  'uad-skip-end': '📅 Uno al día: Shinobi and Aletazo go straight to the result, without their own end screen',
  'mistakes-rule': '❌ Logic puzzles: what a mistake costs, in one line under the title while playing (Tango −10 in La Copa, Reinas nothing…)',
  'wobbles-cheers': '⚖️ Tembleque: a balanced drop says one of nine cheers (¡Impecable!, ¡Clavado!, ¡Bravo!…), never the same twice in a row, instead of always ¡Perfecto!',
  'blackjack-felt': '♠️ Blackjack: a felt table, bigger fanned cards with corner indices, the bet as a chip, the shoe as a bar with its red card, each hand\'s result as a stamp',
  'pm-pick-brush': '🖌️ Pintaminas: a game starts with no brush chosen; a tap on the board first asks to pick one, so nobody paints by mistake',
  'cover-dialogs': '🎮 Game covers: under Empezar, Instrucciones and Entrar (or your name) open as dialogs, the rankings open below; no «Volver al menú» and no game name chip on top, ‹ Menú as tall as the icons',
  'install-invite': '📲 Install the app: «Instala Juegos de Salón» in an iridescent card that waits for a first finished game, a ✕ that snoozes 14 then 60 days, an invitation from the top a moment after a game (once a week), iPhone steps that draw Safari\'s buttons with an arrow at its toolbar, and a 📲 tile in the home footer',
  'solo-result-today-card': '📅 A game played on its own: under its result, one cyan line «📅 Uno al día de hoy: 👑 Reinas · Jugar» for whoever has not played today\'s Uno al día yet; never in La Copa or in Uno al día itself (#1597)',
  'lab-ready': '✅ Labs: lab use of each flag is counted, and its card says when it is ready to 🚀 (D-528)',
};

/**
 * When a flag in *lab* is ready to publish (D-528): at least `completions` finished loads by at least
 * `keys` different lab keys over at least `days` days, with at most `errors` loads that failed, all
 * since the flag was last switched. `tools/agents/lab-ready.mjs` applies it; a row of READY_BY
 * overrides it for one flag (a screen few reach asks for less, a big change for more).
 */
export const READY = { completions: 5, keys: 2, days: 3, errors: 0 };
export const READY_BY = {};
