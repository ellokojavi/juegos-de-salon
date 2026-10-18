// The splash (D-351): when the home page shows it, the campaigns' texts, and the switch.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { shouldShow, CAMPAIGNS, ACTIVE } from './splash.js';
import { activeLine, rewrite } from '../../../tools/agents/splash.mjs';
import { GAMES, SUELTOS } from './games.js';
import { IDIOMAS } from './i18n.js';

const campaigns = { a: { title: { es: 'A' } }, b: { title: { es: 'B' } } };
const today = new Date('2026-10-20T12:00:00');

// Off by default, and nothing shows without a campaign on
assert.equal(shouldShow({ active: null, campaigns, today }), null);
assert.equal(shouldShow({ active: { id: 'zz' }, campaigns, today }), null, 'an id that does not exist');
// On: once per phone
assert.equal(shouldShow({ active: { id: 'a' }, campaigns, today }), 'a');
assert.equal(shouldShow({ active: { id: 'a' }, campaigns, seen: 'a', today }), null, 'already closed');
assert.equal(shouldShow({ active: { id: 'b' }, campaigns, seen: 'a', today }), 'b', 'a new campaign shows again');
// until is inclusive
assert.equal(shouldShow({ active: { id: 'a', until: '2026-10-20' }, campaigns, today }), 'a');
assert.equal(shouldShow({ active: { id: 'a', until: '2026-10-19' }, campaigns, today }), null);
// Never under the scripts; ?splash= always, even if seen or off
assert.equal(shouldShow({ active: { id: 'a' }, campaigns, today, automated: true }), null);
assert.equal(shouldShow({ active: null, campaigns, seen: 'b', forced: 'b', today }), 'b');
assert.equal(shouldShow({ active: null, campaigns, forced: 'nope', today }), null);

// The switch rewrites only its line
assert.equal(activeLine(null), 'export const ACTIVE = null;');
assert.equal(activeLine('a', '2026-11-01'), "export const ACTIVE = { id: 'a', until: '2026-11-01' };");
assert.throws(() => activeLine('a', '1/11'));
const src = readFileSync(new URL('./splash.js', import.meta.url), 'utf8');
assert.match(rewrite(src, activeLine('a')), /^export const ACTIVE = \{ id: 'a' \};$/m);
assert.ok(ACTIVE === null || CAMPAIGNS[ACTIVE.id], `ACTIVE names a campaign that does not exist: ${ACTIVE?.id}`);

// Every campaign: its texts in the four languages, and its games exist
const ids = new Set([...GAMES, ...SUELTOS].map(g => g.id));
for (const [id, c] of Object.entries(CAMPAIGNS)) {
  for (const k of ['title', 'lead', 'kicker', 'close']) {
    if (c[k]) for (const l of IDIOMAS) assert.ok(c[k][l], `${id}.${k} without ${l}`);
  }
  for (const it of c.items || []) {
    for (const f of [it.img, it.video]) if (f) assert.ok(existsSync(new URL(`../../${f}`, import.meta.url)), `${id}: ${f} does not exist`);
    if (it.game) assert.ok(ids.has(it.game), `${id}: game ${it.game} does not exist`);
    else for (const l of IDIOMAS) assert.ok(it.title?.[l] && it.text?.[l], `${id}: an item without its texts in ${l}`);
  }
}
console.log('splash ✓');
