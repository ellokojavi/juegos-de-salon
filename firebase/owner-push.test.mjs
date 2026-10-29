// The owner's release notifications (D-504): `ownerPush/<subId>` holds the owner's own devices'
// subscriptions; only the owner reads or writes it (tools/push/release.mjs reads it as administrator).
import assert from 'node:assert/strict';
import { createDb, loadRules } from '../tools/firebase/rules-sim.mjs';

const OWNER = 'TrNylkeOFXNhnTPWAApebKvbI3F2';
const ID = 'a'.repeat(32);
const sub = (extra = {}) => ({ endpoint: 'https://push.example/x', keys: { p256dh: 'p', auth: 'a' }, at: 1, ...extra });
const db = createDb(undefined, {});
const w = (changes, uid = OWNER) => db.update(changes, { uid });

assert.equal(w({ [`ownerPush/${ID}`]: sub() }), true, 'the owner subscribes a device');
assert.equal(w({ [`ownerPush/${ID}`]: sub({ device: 'iPhone' }) }), true, 'with a name for the device');
assert.equal(w({ [`ownerPush/${ID}`]: sub() }, 'someone'), false, 'a player cannot');
assert.equal(w({ [`ownerPush/${ID}`]: sub() }, null), false, 'nor someone signed out');
assert.equal(w({ 'ownerPush/nothex': sub() }), false, 'the id is the endpoint hash');
assert.equal(w({ [`ownerPush/${ID}`]: sub({ endpoint: 'http://x' }) }), false, 'only https endpoints');
assert.equal(w({ [`ownerPush/${ID}`]: sub({ lang: 'es' }) }), false, 'no other fields');
assert.equal(w({ [`ownerPush/${ID}`]: null }), true, 'the owner removes a device');
const r = loadRules().ownerPush['.read'];
assert.ok(r.includes(OWNER) && r !== true, 'only the owner reads it');
console.log('✓ ownerPush rules');
