// A flag on *all* moves its card to La Bodega when /labs/ opens (D-534): which cards, dated by the day
// the flag went live, and the lab-only sentence that goes. The DOM move itself: tools/e2e/labs/launched.mjs.
import assert from 'node:assert/strict';
import { launched, ymd, sinParaVerlo } from './launched.js';

const known = { 'copa-x': 1, 'uad-y': 1 };
const at = new Date(2026, 10, 4, 23, 30).getTime();   // local 2026-11-04, late
const flags = { 'copa-x': { state: 'all', at }, 'uad-y': { state: 'lab', at }, 'otra': { state: 'all', at } };
assert.deepEqual(launched(['seccion-copa-x', 'seccion-uad-y', 'seccion-otra', 'seccion-lab-ready'], flags, { known }),
  [{ id: 'seccion-copa-x', launched: '2026-11-04' }], 'only a known flag on all, dated by its own day');
assert.deepEqual(launched(['seccion-copa-x'], { 'copa-x': { state: 'all' } }, { known, today: at }), [{ id: 'seccion-copa-x', launched: '2026-11-04' }], 'without `at`, today');
assert.deepEqual(launched(['seccion-copa-x'], {}, { known }), [], 'no flags saved: lab, as always');
assert.deepEqual(launched(['seccion-copa-x'], { 'copa-x': { state: 'off', at } }, { known }), [], 'off is not launched');
assert.equal(ymd(new Date(2026, 0, 9, 8).getTime()), '2026-01-09');
assert.equal(sinParaVerlo('Hace algo. Para verlo: <code>/cup/?test&amp;lab&amp;demo=decided</code>.'), 'Hace algo.');
assert.equal(sinParaVerlo('Hace algo.'), 'Hace algo.');
console.log('✓ labs launched: a flag on all moves its card to La Bodega, dated by its day');
