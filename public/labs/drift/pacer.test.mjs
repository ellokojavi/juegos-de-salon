/**
 * Drift's pace driver (pacer.js): the intermediate driver's lap, the ghost a run races until the player
 * has a record of their own (the owner, 2026-11-27). In node:
 *   node public/labs/drift/pacer.test.mjs
 */
import assert from 'node:assert/strict';
import * as E from './engine.js';
import { TRACKS, STAGES } from './tracks.js';
import { scenery, solids } from './scenery.js';
import { pacerGhost, PACES } from './pacer.js';
import { better, poseAt } from './ghost.js';
import { defaultsFor, DEFAULT_VIEW } from './tuning.js';

let n = 0;
const ok = (name, fn) => { fn(); n++; console.log('✓', name); };
const armed = id => { const t = E.buildTrack(TRACKS[id]); t.solids = solids(scenery(t, t.setting)); return t; };
const saved = { ...E.TUNING };

for (const view of ['2d', '3d']) ok(`${view}: on every circuit the pace driver laps clean, in about 1.5× par, and its ghost is marked as simulated`, () => {
  Object.assign(E.TUNING, saved, defaultsFor(view));
  for (const id of STAGES) {
    const scheme = view === '3d' ? DEFAULT_VIEW.scheme3d : DEFAULT_VIEW.scheme;
    const gh = pacerGhost(armed(id), { view, reach: DEFAULT_VIEW.reach, scheme: scheme === 'stick' ? 'stick' : 'wheel' });
    assert.ok(gh, `${id}: a clean lap`);
    assert.equal(gh.sim, 'intermediate');
    const r = gh.time / TRACKS[id].par;
    assert.ok(r > 1.25 && r < 1.9, `${id}: ${r.toFixed(2)}× par`);
    assert.ok(poseAt(gh, 0).x !== undefined && poseAt(gh, gh.clock).done, `${id}: a ghost to follow`);
  }
  Object.assign(E.TUNING, saved);
});

ok('the same pace driver for everyone: driven twice, the same ghost', () => {
  assert.deepEqual(pacerGhost(armed(STAGES[0])), pacerGhost(armed(STAGES[0])));
});

ok('a player\'s lap faster than the pace driver beats it', () => {
  const gh = pacerGhost(armed(STAGES[0]));
  assert.ok(better({ time: gh.time - 1 }, gh) && !better({ time: gh.time + 1 }, gh));
  assert.ok(PACES['2d'].intermediate < 1);
});

console.log(`\n${n} tests, all green`);
