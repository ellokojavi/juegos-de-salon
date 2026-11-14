// The panel's skins and site-feature switches (D-477): only the owner writes `controls/`, in its shape.
import assert from 'node:assert/strict';
import { createDb } from '../tools/firebase/rules-sim.mjs';

const OWNER = 'TrNylkeOFXNhnTPWAApebKvbI3F2';
const db = createDb(undefined, {});
const w = (changes, uid = OWNER) => db.update(changes, { uid });

assert.equal(w({ 'controls/skins/halloween': { mode: 'off', at: 1 } }), true, 'the owner switches a skin off');
assert.equal(w({ 'controls/skins/halloween': { mode: 'dates', from: '2026-10-20', until: '2026-10-31', at: 1 } }), true, 'or moves it');
assert.equal(w({ 'controls/features/support': { footer: true, endings: false, at: 1 } }), true, 'and a feature part');
assert.equal(w({ 'controls/skins/halloween': { mode: 'off' } }, 'someone'), false, 'nobody else');
assert.equal(w({ 'controls/skins/halloween': { mode: 'later' } }), false, 'a mode out of the list');
assert.equal(w({ 'controls/skins/halloween': { mode: 'dates', from: '10-20' } }), false, 'days are full dates');
assert.equal(w({ 'controls/skins/halloween': { mode: 'off', css: 'x' } }), false, 'no other fields');
assert.equal(w({ 'controls/features/support': { footer: 'no' } }), false, 'a part is a boolean');
assert.equal(w({ 'controls/other': { a: true } }), false, 'only skins, features and traction');
// The making-of page's Traction totals (tools/firebase/traction.mjs): five numbers and their date, nothing else
const tr = { total: 2010, week: 633, best: 126, bestDay: '2026-11-07', phones7: 250, phones30: 666, asOf: '2026-11-13', at: 1 };
assert.equal(w({ 'controls/traction': tr }), true, 'the totals and their date');
assert.equal(w({ 'controls/traction': { ...tr, ids: 'x' } }), false, 'no other fields');
assert.equal(w({ 'controls/traction': { ...tr, week: -1 } }), false, 'counts are not negative');
assert.equal(w({ 'controls/traction': { ...tr, asOf: '13/11' } }), false, 'days are full dates');
assert.equal(w({ 'controls/traction': tr }, 'someone'), false, 'nobody else');
console.log('✓ controls rules');
