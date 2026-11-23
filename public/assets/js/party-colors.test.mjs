// Run: node public/assets/js/party-colors.test.mjs
// The party colours follow the design tokens, so offline (Candlelight, D-538) the confetti and the
// background sparkles take its palette like every screen; with no page, the usual ones.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { partyColors, PARTY_TOKENS } from './party-colors.js';

const page = vals => ({ documentElement: {} , vals });
globalThis.getComputedStyle = el => ({ getPropertyValue: v => (el === candle.documentElement ? { '--yellow': '#f0d39a', '--pink': '#d9944a', '--cyan': '#c9b48a', '--lime': '#c8c08a', '--purple': '#8c6a4a', '--orange': '#d9944a' }[v] : '') });
const candle = page();
assert.deepEqual(partyColors(candle), ['#f0d39a', '#d9944a', '#c9b48a', '#c8c08a', '#8c6a4a', '#d9944a', '#ffffff'], 'offline: Candlelight');
assert.equal(partyColors(page()).length, PARTY_TOKENS.length + 1, 'no tokens: the usual colours');
assert.equal(partyColors(undefined)[0], '#ffd23f');
// Nothing that throws a party keeps colours of its own
for (const f of ['ui.js', 'achievement-window.js', 'month-end.js']) {
  const src = readFileSync(new URL(`./${f}`, import.meta.url), 'utf8');
  assert.doesNotMatch(src, /\[\s*'#ffd23f',\s*'#ff2e88'/, `${f} uses partyColors(), not its own list`);
}
console.log('✓ party colours: from the tokens, Candlelight offline; sparkles and confetti use them');
