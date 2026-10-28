// The lab's 🚀 Publicar button (D-480): only the owner asks for a feature to go live, in its shape.
import assert from 'node:assert/strict';
import { createDb } from '../tools/firebase/rules-sim.mjs';

const OWNER = 'TrNylkeOFXNhnTPWAApebKvbI3F2';
const db = createDb(undefined, {});
const w = (changes, uid = OWNER) => db.update(changes, { uid });
const ask = { state: 'requested', at: 1, title: '🏆 La Copa', note: 'solo en español' };

assert.equal(w({ 'labsPublish/seccion-copa-crear': ask }), true, 'the owner asks');
assert.equal(w({ 'labsPublish/seccion-copa-crear': { ...ask, state: 'pr', pr: 921, branch: 'publish-copa-crear', started: 2 } }), true, 'and the job answers, as administrator, in the same shape');
assert.equal(w({ 'labsPublish/seccion-copa-crear': null }), true, 'the owner cancels');
assert.equal(w({ 'labsPublish/seccion-copa-crear': ask }, 'a-lab-key-holder'), false, 'nobody else');
assert.equal(w({ 'labsPublish/copa': ask }), false, 'the id is a card id');
assert.equal(w({ 'labsPublish/seccion-x': { ...ask, state: 'now' } }), false, 'a state out of the list');
assert.equal(w({ 'labsPublish/seccion-x': { ...ask, note: 'x'.repeat(501) } }), false, 'a short note');
assert.equal(w({ 'labsPublish/seccion-x': { ...ask, run: 'rm' } }), false, 'no other fields');
console.log('✓ labsPublish rules');
