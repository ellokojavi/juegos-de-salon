// Run: node public/assets/js/offline-ready.test.mjs
// The home page's ☁️ button (D-538): four states, read from what the phone keeps, and the sheet's
// lines for each in es/en/pt.
import assert from 'node:assert/strict';
import { stateOf, linesOf, TEXTS, STALE_MS, readState, iconSvg } from './offline-ready.js';

const now = 1_000_000;
assert.equal(stateOf({ supported: false }).state, 'unsupported');
assert.deepEqual(stateOf({ progress: { storing: true, have: 30, total: 120, at: now - 1000 }, now }), { state: 'loading', have: 30, total: 120 });
assert.equal(stateOf({ progress: { storing: true, at: now - STALE_MS - 1 }, have: 30, total: 120, now }).state, 'missing', 'a storing not heard from in a minute stopped');
assert.equal(stateOf({ have: 120, total: 120, now }).state, 'ready', 'every file kept: ready');
assert.equal(stateOf({ have: 119, total: 120, now }).state, 'missing', 'one file short is not ready');
assert.equal(stateOf({ online: true, now }).state, 'loading', 'nothing yet, with signal: about to start');
assert.equal(stateOf({ online: false, now }).state, 'missing', 'nothing yet, no signal: nothing will come');

for (const l of ['es', 'en', 'pt']) {
  for (const k of ['button', 'retry', 'ok', 'ios']) assert.ok(TEXTS[l][k], `${l}: ${k}`);
  for (const st of ['loading', 'ready', 'missing', 'unsupported']) {
    assert.ok(TEXTS[l][st].title, `${l}: ${st} title`);
    const lines = linesOf({ state: st, have: 3, total: 9 }, { lang: l });
    assert.ok(lines.length >= 2 && lines.every(x => typeof x === 'string' && x.length), `${l}: ${st} lines`);
  }
  assert.ok(linesOf({ state: 'missing', have: 3, total: 9 }, { lang: l }).join(' ').includes('3'), `${l}: says how many`);
  assert.equal(linesOf({ state: 'missing', have: 3, total: 9 }, { lang: l, online: false })[1], TEXTS[l].missing.offline, `${l}: no Reintentar advice without signal`);
  assert.equal(linesOf({ state: 'ready' }, { lang: l, steps: 'ios-safari' }).at(-1), TEXTS[l].ios, `${l}: the iPhone line`);
  assert.ok(!linesOf({ state: 'unsupported' }, { lang: l, steps: 'ios-safari' }).includes(TEXTS[l].ios), `${l}: no iPhone line when nothing can be kept`);
}
for (const st of ['loading', 'ready', 'missing', 'unsupported']) assert.ok(iconSvg(st).includes('or-nube'), `${st}: the cloud`);

// readState counts the release's files one by one in its cache
const caches = files => ({
  open: async name => ({
    match: async k => {
      if (name === 'jds-config' && k === 'list') return new Response(JSON.stringify({ release: 'r1', urls: ['./', 'zip/', 'a.js'] }));
      if (name === 'jds-config' && k === 'progress') return new Response(JSON.stringify({ storing: false, at: 0 }));
      if (name === 'jds-release-r1' && files.some(f => k.endsWith(f))) return new Response('x');
      return undefined;
    },
  }),
});
const nav = { serviceWorker: {}, onLine: true };
assert.deepEqual(await readState({ nav, cachesApi: caches(['/', '/zip/', '/a.js']) }), { state: 'ready', have: 3, total: 3 });
assert.deepEqual(await readState({ nav, cachesApi: caches(['/zip/']) }), { state: 'missing', have: 1, total: 3 });
assert.equal((await readState({ nav: {}, cachesApi: caches([]) })).state, 'unsupported', 'no service worker');
assert.deepEqual((await import('./offline-ready.js')).TESTER_STATES.map(([s]) => s), ['loading', 'ready', 'missing', 'unsupported', null], 'the T tab: the four states and the real one');
console.log('✓ offline ready: four states from what the phone keeps, the sheet in three languages');
