// node public/labs/short-cards.test.mjs — a card in /labs/ says what it tries in a few words (D-594): the
// owner reads it on a phone to decide, so its text, the paragraphs under its title, stays within
// MAX_WORDS. What it does in detail lives in its PR, its decision and its game's doc, not on the card.
// A treatment tried inside a card (a .seccion-sub, like Blackjack's felt table) is a card of its own.
// A paragraph with an id is a live status line drawn by the page (offline mode's «Conexión: …»), not text.
// La Bodega is parked (the owner, 2026-11-17): it is outside the check, so a card is short when it enters.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

export const MAX_WORDS = 25;
const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const active = html.slice(0, html.indexOf('<section class="grupo" id="bodega">'));
assert.ok(active.length < html.length, 'La Bodega moved: short-cards.test.mjs reads the cards above it');

/** Words in a card's own text: its paragraphs, a nested sub-card's left out. */
export function words(block) {
  const own = block.replace(/<div class="seccion-sub"[\s\S]*?<\/div>/g, '');
  const text = [...own.matchAll(/<p\b(?![^>]*\bid=)[^>]*>([\s\S]*?)<\/p>/g)].map(m => m[1]).join(' ')
    .replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ');
  return text.split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w)).length;
}

// Each card from its opening tag to the next card (or the end of its group): enough to hold its paragraphs
const starts = [...active.matchAll(/<(section|div) class="(?:panel seccion|seccion-sub)"[^>]*id="(seccion-[\w-]+)"/g)];
const long = [];
starts.forEach((m, i) => {
  const end = Math.min(...[starts[i + 1]?.index ?? Infinity, active.indexOf(`</${m[1]}>`, m.index)]);
  const n = words(active.slice(m.index, end));
  if (n > MAX_WORDS) long.push(`#${m[2]}: ${n} words`);
});
assert.ok(starts.length >= 5, `only ${starts.length} card(s) found in /labs/: did its markup change?`);
assert.deepEqual(long, [], `card text over ${MAX_WORDS} words in public/labs/index.html: say what it tries in one or two short sentences (D-594)\n  ${long.join('\n  ')}`);

// The count catches what it claims to
assert.equal(words('<p class="muted">Uno dos <b>tres</b> — 4.</p><p id="x">no cuenta</p><div class="seccion-sub"><p>tampoco</p></div>'), 4);

console.log(`✓ lab cards short: ${starts.length} card(s) in /labs/, each ${MAX_WORDS} words or fewer`);
