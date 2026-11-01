/**
 * The lab's runtime flags by name (D-498), for /labs/, the panel and the tests only. It is apart from
 * flags.js, which almost every page loads, so adding or renaming a flag here does not run the
 * end-to-end scripts of every page (D-515). A new flag is a row here and its card in /labs/.
 */
export const FLAGS = {
  'copa-crear': '🏆 La Copa: the new create screen',
  'copa-hoy': '🏆 La Copa: ▶ Jugar hoy on its home page card',
  'copa-espera': '🏆 La Copa: Día N en Xh on its home page card',
  'bn-salva': '🎆 Battleship: Salvo',
  'keyboard-lift': '⌨️ Feedback form above the iOS keyboard',
  'uad-share-grids': '🟩 Uno al día: share grids for Agentes, Dudo, Generala and Battleship',
  'cover-facts': '📖 Game pages: who plays and how long, in the rules',
  'uad-night-totals': '📅 Uno al día: totals written by the hourly rebuild',
  'home-pill-bar': '💊 Home page: top bar buttons as pills of one height',
  'cup-back-board': '🏆 La Copa: the header ‹ goes back to the board while playing a day',
  'name-guard': '🛡️ Rankings: offensive names refused on sign-up',
  'uad-month-end': '🥇 Uno al día: month-end window with your place, a medal for the podium',
  'stick': '🥷 Shinobi: the game, on the home page, the search and new cups (D-517)',
  'stack': '🗼 Babel: the game, on the home page, the search and new cups (D-517), with its background music',
  'no-double-tap-zoom': '👆 Games: a double tap no longer zooms the page (iPhone)',
};
