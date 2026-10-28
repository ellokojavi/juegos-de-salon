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
assert.equal(w({ 'controls/other': { a: true } }), false, 'only skins and features');
console.log('✓ controls rules');
