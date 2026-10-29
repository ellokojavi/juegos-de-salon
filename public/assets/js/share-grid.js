/**
 * The spoiler-free emoji grid of a Uno al día share (#889, D-482): the squares of the game's own
 * share card (`resultado().t`, the same La Copa uses), kept to the neutral marks only. Uno al día's
 * share never names the game (#215), so the game's own emoji (👑, ☀️🌙, 🧶, 〰️…), stage numbers,
 * board sizes and times are dropped: what is left is how it went, square by square, as Wordle does.
 *
 * Games whose card would give the answer away get no grid from it: Agentes' card is the board in
 * order, so it shows where every agent is; it shares only the counts (`agentesGrid`, sorted, no
 * positions). Conexiones (retired from the deck) colors each group of the grid: none. The group games
 * build their own card: `vidasGrid` (El Ahorcado's lives, Dudo's dice), `planillaGrid` (Generala's
 * score card) and `disparosGrid` (Batalla Naval's shots in order, never the cells).
 */
export const NEUTRAL = new Set(['🟩', '🟨', '🟧', '🟥', '🟦', '🟪', '⬛', '⬜', '🟢', '🟡', '⚪', '🎯', '✅', '❌', '💡']);
/** Games whose card spoils the answer: no grid, only the score's line as before. */
export const SPOILS = new Set(['conexiones']);
/** At most this many rows, so the message stays short (U-30). */
export const MAX_ROWS = 8;

/** The neutral grid of a game's card, or '' when it has none or would spoil the answer. */
export function shareGrid(id, card) {
  if (id === 'agentes') return agentesGrid(card);
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

/** Agentes without the board: how many agents found (🟩) and missed (🟨), wrong taps (🟥), the assassin (❌). */
export function agentesGrid(card) {
  const n = ch => Array.from(String(card || '')).filter(c => c === ch).length;
  return [ '🟩'.repeat(n('🟩')) + '🟨'.repeat(n('🟨')), '🟥'.repeat(n('🟥')) + (n('💀') ? '❌' : '')].filter(Boolean).join('\n');
}

/** Generala's score card, one square per box in order: 🟩 scored, ⬛ crossed out (rows of numbers and games). */
export const planillaGrid = (tarjeta, filas) => filas.map(f => f.map(c => ((tarjeta?.[c] || 0) > 0 ? '🟩' : '⬛')).join('')).join('\n');

/** Batalla Naval's shots in order, ten a row: 🟦 water, 🟧 hit, 🟥 sunk; never which cell. */
const TIRO = { agua: '🟦', tocado: '🟧', hundido: '🟥' };
export const disparosGrid = results => {
  const marks = results.map(r => TIRO[r] || '').filter(Boolean);
  const rows = [];
  for (let k = 0; k < marks.length && rows.length < MAX_ROWS; k += 10) rows.push(marks.slice(k, k + 10).join(''));
  return rows.join('\n');
};
