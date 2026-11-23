/**
 * The party colours (background sparkles, confetti, fireworks), read from the design tokens: offline
 * they are Candlelight's (D-538; the owner, 2026-11-23: the whole palette changes), online the usual
 * ones. White stays. Read when the party starts, so it follows the mode the page is in.
 */
export const PARTY_TOKENS = ['--yellow', '--pink', '--cyan', '--lime', '--purple', '--orange'];
const USUAL = ['#ffd23f', '#ff2e88', '#2ee6d6', '#9dff3a', '#8a4dff', '#ff7a1a'];

export function partyColors(doc = globalThis.document) {
  let read = [];
  try { const css = getComputedStyle(doc.documentElement); read = PARTY_TOKENS.map(v => css.getPropertyValue(v).trim()).filter(Boolean); } catch (_) { /* no page */ }
  return [...(read.length === PARTY_TOKENS.length ? read : USUAL), '#ffffff'];
}
