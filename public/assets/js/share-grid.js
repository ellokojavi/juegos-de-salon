/**
 * The spoiler-free emoji grid of a Uno al día share (#889, D-482): the squares of the game's own
 * share card (`resultado().t`, the same La Copa uses), kept to the neutral marks only. Uno al día's
 * share never names the game (#215), so the game's own emoji (👑, ☀️🌙, 🧶, 〰️…), stage numbers,
 * board sizes and times are dropped: what is left is how it went, square by square, as Wordle does.
 *
 * Games whose card would give the answer away get no grid: Agentes' card is the board in order, so
 * it shows where every agent is; Conexiones (retired from the deck) colors each group of the grid.
 * Dudo and Generala are dice: their score already says it all. The group games build their card
 * with `vidasGrid` (El Ahorcado: lives left and lost, never the letters).
 */
export const NEUTRAL = new Set(['🟩', '🟨', '🟧', '🟥', '🟦', '🟪', '⬛', '⬜', '🟢', '🟡', '⚪', '🎯', '✅', '❌', '💡']);
/** Games whose card spoils the answer: no grid, only the score's line as before. */
export const SPOILS = new Set(['agentes', 'conexiones']);
/** At most this many rows, so the message stays short (U-30). */
export const MAX_ROWS = 8;

/** The neutral grid of a game's card, or '' when it has none or would spoil the answer. */
export function shareGrid(id, card) {
  if (!card || SPOILS.has(id)) return '';
  const rows = String(card).split('\n')
    .map(row => Array.from(row).filter(c => NEUTRAL.has(c)).join(''))
    .filter(Boolean);
  return rows.slice(0, MAX_ROWS).join('\n');
}

/** A card of lives for a group game played alone (El Ahorcado): 🟩 per life kept, 🟥 per life lost. */
export const vidasGrid = (left, total) => {
  const l = Math.max(0, Math.min(total, left | 0));
  return total > 0 ? '🟩'.repeat(l) + '🟥'.repeat(total - l) : '';
};
