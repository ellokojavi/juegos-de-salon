// The panel's 📣 Campaigns (D-454): only the owner writes `splash/`. A campaign's `until` is a day or an
// exact moment in ISO (splash.js, D-529): the `launch` workflow writes moments with the admin key, and the
// panel, which rewrites every campaign at once, was refused (PERMISSION_DENIED) while one was stored.
import assert from 'node:assert/strict';
import { createDb } from '../tools/firebase/rules-sim.mjs';

const OWNER = 'TrNylkeOFXNhnTPWAApebKvbI3F2';
const db = createDb(undefined, {});
const w = (changes, uid = OWNER) => db.update(changes, { uid });

assert.equal(w({ 'splash/flap-soon': { on: true, order: -1, at: 1, until: '2026-11-09T08:00:00Z' } }), true, 'an exact moment as until');
assert.equal(w({ 'splash/aletazo-ya': { on: true, order: 0, at: 1, until: '2026-11-16' } }), true, 'or a day');
assert.equal(w({ 'splash/old': { on: false, order: 3, archived: true } }), true, 'archiving one');
assert.equal(w({ 'splash/x': { on: true, order: 0, until: 'tomorrow' } }), false, 'not any text');
assert.equal(w({ 'splash/x': { on: true, order: 0 } }, 'someone'), false, 'nobody else');
console.log('✓ splash rules');
