// The lab's runtime flags (D-498): anyone reads `flags/`, only the owner writes it, in its shape.
import assert from 'node:assert/strict';
import { createDb, loadRules } from '../tools/firebase/rules-sim.mjs';

const OWNER = 'TrNylkeOFXNhnTPWAApebKvbI3F2';
const db = createDb(undefined, {});
const w = (changes, uid = OWNER) => db.update(changes, { uid });

for (const state of ['lab', 'all', 'off']) assert.equal(w({ 'flags/bn-salva': { state, at: 1 } }), true, `the owner sets ${state}`);
assert.equal(w({ 'flags/bn-salva': { state: 'all', at: 1 } }, 'someone'), false, 'nobody else');
assert.equal(w({ 'flags/bn-salva': { state: 'all', at: 1 } }, null), false, 'not signed out');
assert.equal(w({ 'flags/bn-salva': { state: 'some', at: 1 } }), false, 'a state out of the list');
assert.equal(w({ 'flags/bn-salva': { state: 'all' } }), false, 'with its time');
assert.equal(w({ 'flags/bn-salva': { state: 'all', at: 1, who: 'x' } }), false, 'no other fields');
assert.equal(w({ 'flags/Bad_Id': { state: 'all', at: 1 } }), false, 'ids are lowercase, like the cards');
assert.equal(loadRules().flags['.read'], true, 'public to read: every page asks it');
console.log('✓ flags rules');
