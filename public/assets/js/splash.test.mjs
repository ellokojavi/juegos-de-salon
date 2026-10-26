// The splash (D-351): what the home page shows and in what order, the campaigns' texts, and the switch.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { queue, seenIds, campaignLang, fromRemote, loadActive, CAMPAIGNS, ACTIVE } from './splash.js';
import { activeLine, rewrite, turnOn } from '../../../tools/agents/splash.mjs';
import { GAMES, SUELTOS } from './games.js';
import { IDIOMAS } from './i18n.js';

const campaigns = { a: { title: { es: 'A' } }, b: { title: { es: 'B' } }, c: { title: { es: 'C' } } };
const today = new Date('2026-10-20T12:00:00');

// Off by default, and nothing shows without a campaign on
assert.deepEqual(queue({ active: [], campaigns, today }), []);
assert.deepEqual(queue({ active: [{ id: 'zz' }], campaigns, today }), [], 'an id that does not exist');
// On: once per phone
assert.deepEqual(queue({ active: [{ id: 'a' }], campaigns, today }), ['a']);
assert.deepEqual(queue({ active: [{ id: 'a' }], campaigns, seen: ['a'], today }), [], 'already closed');
assert.deepEqual(queue({ active: [{ id: 'b' }], campaigns, seen: ['a'], today }), ['b'], 'a new campaign shows again');
// until is inclusive
assert.deepEqual(queue({ active: [{ id: 'a', until: '2026-10-20' }], campaigns, today }), ['a']);
assert.deepEqual(queue({ active: [{ id: 'a', until: '2026-10-19' }], campaigns, today }), []);
// Several on: in the order they were turned on, without the ones closed or expired
const three = [{ id: 'a', until: '2026-10-19' }, { id: 'b' }, { id: 'c' }];
assert.deepEqual(queue({ active: three, campaigns, today }), ['b', 'c']);
assert.deepEqual(queue({ active: three, campaigns, seen: ['b'], today }), ['c']);
assert.deepEqual(queue({ active: [{ id: 'c' }, { id: 'b' }], campaigns, today }), ['c', 'b'], 'the order of ACTIVE, not of CAMPAIGNS');
// Never under the scripts; ?splash= always, alone, even if seen or off
assert.deepEqual(queue({ active: three, campaigns, today, automated: true }), []);
assert.deepEqual(queue({ active: three, campaigns, seen: ['b'], forced: 'b', today }), ['b']);
assert.deepEqual(queue({ active: [], campaigns, forced: 'nope', today }), []);
// What a phone remembers: a list, and the bare id it kept before reads as a list of one
assert.deepEqual(seenIds(null), []);
assert.deepEqual(seenIds('tres-juegos-demo'), ['tres-juegos-demo']);
assert.deepEqual(seenIds('["a","b"]'), ['a', 'b']);
// A campaign in Spanish and English: Spanish for Spanish, English for the rest
assert.equal(campaignLang({ langs: ['es', 'en'] }, 'es'), 'es');
assert.equal(campaignLang({ langs: ['es', 'en'] }, 'pt'), 'en');
assert.equal(campaignLang({}, 'de'), 'de');

// The switch rewrites only its line, and turning one on adds it at the end of the queue
assert.equal(activeLine([]), 'export const ACTIVE = [];');
assert.equal(activeLine([{ id: 'a', until: '2026-11-01' }, { id: 'b' }]), "export const ACTIVE = [{ id: 'a', until: '2026-11-01' }, { id: 'b' }];");
assert.throws(() => activeLine([{ id: 'a', until: '1/11' }]));
assert.deepEqual(turnOn([{ id: 'a' }], 'b', '2026-11-01'), [{ id: 'a' }, { id: 'b', until: '2026-11-01' }]);
assert.deepEqual(turnOn([{ id: 'a' }, { id: 'b' }], 'a', '2026-11-01'), [{ id: 'a', until: '2026-11-01' }, { id: 'b' }], 'again: a new date, same place');
const src = readFileSync(new URL('./splash.js', import.meta.url), 'utf8');
assert.match(rewrite(src, activeLine([{ id: 'a' }])), /^export const ACTIVE = \[\{ id: 'a' \}\];$/m);
assert.ok(Array.isArray(ACTIVE), 'ACTIVE is a list (a queue)');
for (const a of ACTIVE) assert.ok(CAMPAIGNS[a.id], `ACTIVE names a campaign that does not exist: ${a.id}`);

// Every campaign: its texts in the four languages, and its games exist
const ids = new Set([...GAMES, ...SUELTOS].map(g => g.id));
for (const [id, c] of Object.entries(CAMPAIGNS)) {
  // A campaign limited to some languages (`langs`) has those, and English for the rest
  const langs = c.langs ?? IDIOMAS;
  if (c.langs) assert.ok(c.langs.includes('es') && c.langs.includes('en'), `${id}: langs without es or en`);
  for (const k of ['title', 'lead', 'kicker', 'close']) {
    if (c[k]) for (const l of langs) assert.ok(c[k][l], `${id}.${k} without ${l}`);
  }
  for (const it of c.items || []) {
    for (const f of [it.img, it.video, it.still]) if (f) assert.ok(existsSync(new URL(`../../${f}`, import.meta.url)), `${id}: ${f} does not exist`);
    if (it.game) assert.ok(ids.has(it.game), `${id}: game ${it.game} does not exist`);
    else if (it.title || it.text || it.href) for (const l of langs) assert.ok(it.title?.[l] && it.text?.[l], `${id}: an item without its texts in ${l}`);
    else assert.ok(it.img, `${id}: a teaser (an item with no texts) without its picture`);
  }
}
console.log('splash ✓');

// from is inclusive too: a scheduled campaign waits for its day (D-454)
assert.deepEqual(queue({ active: [{ id: 'a', from: '2026-10-20' }], campaigns, today }), ['a']);
assert.deepEqual(queue({ active: [{ id: 'a', from: '2026-10-21' }], campaigns, today }), []);
// The panel's switches in Firebase: only the ones on, by order; nothing written means ACTIVE holds
assert.equal(fromRemote(null), null);
assert.equal(fromRemote('x'), null);
assert.deepEqual(fromRemote({ b: { on: true, order: 2, until: '2026-11-01' }, a: { on: true, order: 1, from: '2026-10-30' }, c: { on: false, order: 0 } }),
  [{ id: 'a', from: '2026-10-30' }, { id: 'b', until: '2026-11-01' }]);
assert.deepEqual(fromRemote({ c: { on: false, order: 0 } }), [], 'all off is off, not ACTIVE');
assert.deepEqual(await loadActive({ fetchFn: async () => { throw new Error('offline'); } }), ACTIVE, 'no network: ACTIVE');
