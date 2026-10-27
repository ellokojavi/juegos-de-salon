// Run: node public/assets/js/transport/seat.test.mjs
import assert from 'node:assert/strict';
import { claimSeat, seatUpdate } from './seat.js';

const tick = () => new Promise(r => setImmediate(r));

/**
 * A fake database whose transactions behave like Firebase's: the update runs on the value this
 * client saw, and the server accepts the result only if the value has not changed since; if it
 * has, the update runs again on the new one. Each step yields, so concurrent claims interleave.
 */
function fakeDb(data = {}) {
  return {
    data,
    async transact(path, update) {
      for (;;) {
        const seen = data[path] ?? null;
        await tick();                                   // the round trip to the server
        const next = update(seen === null ? null : { ...seen });
        await tick();
        if ((data[path] ?? null) !== seen) continue;    // someone wrote first: run again
        if (next === undefined) return { committed: false, value: seen };
        data[path] = next;
        return { committed: true, value: next };
      }
    },
  };
}

const ROLES = ['B', 'C', 'D'];

// The update: a free seat is taken, our own is rewritten, another phone's is left alone
{
  const take = seatUpdate({ uid: 'u1', name: 'Javi' });
  assert.deepEqual(take(null), { name: 'Javi', online: true, uid: 'u1' });
  assert.deepEqual(take({ name: 'Javi', online: false, uid: 'u1' }), { name: 'Javi', online: true, uid: 'u1' });
  assert.equal(take({ name: 'Cata', online: true, uid: 'u2' }), undefined);
}

// Two phones join one room at the same instant: different seats
{
  const db = fakeDb();
  const roles = await Promise.all([
    claimSeat(db, 'ABCD', ROLES, { uid: 'u1', name: 'Javi' }),
    claimSeat(db, 'ABCD', ROLES, { uid: 'u2', name: 'Cata' }),
  ]);
  assert.notEqual(roles[0], roles[1], `both took ${roles[0]}`);
  assert.deepEqual(roles.toSorted(), ['B', 'C']);
  assert.equal(db.data['rooms/ABCD/players/B'].uid !== db.data['rooms/ABCD/players/C'].uid, true);
}

// Five phones for three free seats: three distinct seats, two find the room full
{
  const db = fakeDb();
  const out = await Promise.allSettled(['u1', 'u2', 'u3', 'u4', 'u5']
    .map(uid => claimSeat(db, 'ABCD', ROLES, { uid, name: uid })));
  const seated = out.filter(r => r.status === 'fulfilled').map(r => r.value);
  assert.deepEqual(seated.toSorted(), ROLES);
  const full = out.filter(r => r.status === 'rejected');
  assert.equal(full.length, 2);
  for (const r of full) assert.equal(r.reason.message, 'full');
  // Each seat keeps the phone that got it
  for (const role of ROLES) {
    const holder = out.findIndex(r => r.value === role);
    assert.equal(db.data[`rooms/ABCD/players/${role}`].uid, `u${holder + 1}`);
  }
}

// One seat left and two phones for it: one sits, the other hears the room is full
{
  const db = fakeDb({ 'rooms/ABCD/players/B': { name: 'Javi', online: true, uid: 'u0' } });
  const out = await Promise.allSettled([
    claimSeat(db, 'ABCD', ['C'], { uid: 'u1', name: 'Cata' }),
    claimSeat(db, 'ABCD', ['C'], { uid: 'u2', name: 'Pepe' }),
  ]);
  assert.deepEqual(out.map(r => r.status).toSorted(), ['fulfilled', 'rejected']);
  assert.equal(db.data['rooms/ABCD/players/B'].uid, 'u0', 'a taken seat is never overwritten');
}

// A seat that looked free in the room's snapshot but was taken since is skipped
{
  const db = fakeDb({ 'rooms/ABCD/players/B': { name: 'Javi', online: true, uid: 'u0' } });
  assert.equal(await claimSeat(db, 'ABCD', ['B', 'C'], { uid: 'u1', name: 'Cata' }), 'C');
  assert.equal(db.data['rooms/ABCD/players/B'].name, 'Javi');
}

console.log('seat: ok');
