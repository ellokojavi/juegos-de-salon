// One window per visit on the home page (D-431): what is pending on a phone, in every format it has
// kept, and the single window the gate opens, leaving the rest for later.
import assert from 'node:assert/strict';
import { readPending, choose, candidates, PRIORITY } from './home-windows.js';
import { SEEN_KEY as SPLASH_SEEN_KEY } from './splash.js';
import { MINE_KEY, SEEN_KEY as CUP_SEEN_KEY } from './recap.js';
import { DAILY_KEY, SEASON_SEEN_KEY } from './daily-recap.js';
import { INSTALAR_NO_KEY } from './instalar.js';

assert.deepEqual(PRIORITY, ['recap', 'splash', 'install']);

// The choice: the first by priority opens, the rest wait
assert.deepEqual(choose({ recap: false, splash: [], install: false }), { open: null, later: [] });
assert.deepEqual(choose({ recap: true, splash: ['a', 'b'], install: true }),
  { open: { kind: 'recap' }, later: [{ kind: 'splash', id: 'a' }, { kind: 'splash', id: 'b' }, { kind: 'install' }] });
assert.deepEqual(choose({ recap: false, splash: ['a', 'b'], install: true }),
  { open: { kind: 'splash', id: 'a' }, later: [{ kind: 'splash', id: 'b' }, { kind: 'install' }] }, 'one splash per visit, the next one waits');
assert.deepEqual(choose({ recap: false, splash: [], install: true }), { open: { kind: 'install' }, later: [] });
// What the gate tries, in order: a recap with nothing to show gives way, but never to a second campaign
assert.deepEqual(candidates({ recap: true, splash: ['a', 'b'], install: true }), [{ kind: 'recap' }, { kind: 'splash', id: 'a' }, { kind: 'install' }]);
assert.deepEqual(candidates({ recap: false, splash: [], install: false }), []);

// What a phone keeps, read from its storage
const now = Date.parse('2026-10-25T12:00:00');
const store = o => k => (k in o ? o[k] : null);
const active = [{ id: 'one' }, { id: 'two', until: '2026-10-28' }];
const campaigns = { one: {}, two: {} };
const empty = readPending({ get: store({}), now, active, campaigns });
assert.deepEqual(empty, { recap: false, splash: ['one', 'two'], install: false });
// The splash's seen ids: the list (D-430), and the bare id kept before it
assert.deepEqual(readPending({ get: store({ [SPLASH_SEEN_KEY]: '["one"]' }), now, active, campaigns }).splash, ['two']);
assert.deepEqual(readPending({ get: store({ [SPLASH_SEEN_KEY]: 'one' }), now, active, campaigns }).splash, ['two'], 'the legacy bare id');
assert.deepEqual(readPending({ get: store({ [SPLASH_SEEN_KEY]: '["one","two"]' }), now, active, campaigns }).splash, []);
// A campaign that expired before this phone reached it is gone (D-431 accepts it)
assert.deepEqual(readPending({ get: store({ [SPLASH_SEEN_KEY]: 'one' }), now: Date.parse('2026-10-29T09:00:00'), active, campaigns }).splash, []);
// The install bubble: only on a phone that gets it, until its "no more" ('1')
assert.equal(readPending({ get: store({}), now, active, campaigns, installable: true }).install, true);
assert.equal(readPending({ get: store({ [INSTALAR_NO_KEY]: '1' }), now, active, campaigns, installable: true }).install, false);
// The recap: a cup this phone played that ended less than a week ago, not seen yet
const cup = JSON.stringify([{ code: 'ABCD', fin: now - 86400000 }]);
assert.equal(readPending({ get: store({ [MINE_KEY]: cup }), now, active, campaigns }).recap, true);
assert.equal(readPending({ get: store({ [MINE_KEY]: cup, [CUP_SEEN_KEY]: '["ABCD"]' }), now, active, campaigns }).recap, false);
// Or Uno al día's season: played last month, in the first week of this one, not seen yet
const nov = Date.parse('2026-11-03T12:00:00');
const daily = JSON.stringify({ dias: { '2026-10-20': {} } });
assert.equal(readPending({ get: store({ [DAILY_KEY]: daily }), now: nov, active: [], campaigns }).recap, true);
assert.equal(readPending({ get: store({ [DAILY_KEY]: daily, [SEASON_SEEN_KEY]: '["2026-10"]' }), now: nov, active: [], campaigns }).recap, false);
// Broken storage reads as nothing pending, never as an error
assert.deepEqual(readPending({ get: store({ [MINE_KEY]: '{oops', [SPLASH_SEEN_KEY]: '' }), now, active, campaigns: [] }), { recap: false, splash: [], install: false });
// Under the end-to-end scripts no splash is pending
assert.deepEqual(readPending({ get: store({}), now, active, campaigns, automated: true }).splash, []);

// All of it together: a phone with a recap due, two campaigns and the bubble opens the recap only
const all = readPending({ get: store({ [MINE_KEY]: cup, [SPLASH_SEEN_KEY]: 'tres-juegos-demo' }), now, active, campaigns, installable: true });
assert.deepEqual(choose(all).open, { kind: 'recap' });
console.log('home windows ✓');
