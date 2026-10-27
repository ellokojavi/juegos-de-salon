// PIN attempts (D-464): a seat or a key change needs a fresh attempt by the same phone, and a
// player or cup player takes one attempt every 5 s. Runs the real rules in tools/firebase/rules-sim.mjs.
import assert from 'node:assert/strict';
import { createDb } from '../tools/firebase/rules-sim.mjs';

const H = c => c.repeat(64);
const PIN = H('a'), WRONG = H('b'), NEW = H('c');
const T0 = 1_800_000_000_000;
const ok = (r, msg, db) => assert.equal(r, true, `${msg} (${db?.why?.join(', ')})`);
const no = (r, msg) => assert.equal(r, false, msg);

// ---- Players (jugadorKeys / jugadorSeats / jugadorIntentos) ----
{
  const jid = 'abcd1234';
  const db = createDb(undefined, {});
  const attempt = (uid, h, now) => db.update({ [`jugadorIntentos/${jid}`]: { h, u: uid, at: { '.sv': 'timestamp' } } }, { uid, now });
  const seat = (uid, h, now) => db.update({ [`jugadorSeats/${jid}/${uid}`]: h }, { uid, now });

  no(attempt('u1', PIN, T0), 'no attempts on a player with no key');
  ok(db.update({
    [`jugadores/${jid}`]: { n: 'Ana', at: { '.sv': 'timestamp' } },
    [`jugadorKeys/${jid}`]: PIN,
    [`jugadorSeats/${jid}/u1`]: PIN,
  }, { uid: 'u1', now: T0 }), 'a new player is created with its key and first seat in one write', db);

  no(seat('u2', PIN, T0 + 1000), 'the right hash with no attempt is not a seat');
  ok(attempt('u2', WRONG, T0 + 1000), 'an attempt is written', db);
  no(seat('u2', WRONG, T0 + 1100), 'a wrong PIN is not a seat');
  no(attempt('u2', PIN, T0 + 3000), 'a second attempt within 5 s is refused');
  no(attempt('u3', PIN, T0 + 3000), 'also from another phone: the limit is per player');
  ok(attempt('u2', PIN, T0 + 6100), 'after 5 s another attempt goes in', db);
  no(seat('u3', PIN, T0 + 6200), "another phone's attempt does not seat this one");
  ok(seat('u2', PIN, T0 + 6200), 'the attempt with the right PIN seats the phone', db);
  no(seat('u2', PIN, T0 + 6200 + 61000), 'an attempt older than a minute no longer seats');

  no(db.update({ [`jugadorIntentos/${jid}`]: { h: PIN, u: 'u9', at: T0 + 20000 } }, { uid: 'u2', now: T0 + 20000 }), 'an attempt names its own phone');
  no(db.update({ [`jugadorIntentos/${jid}`]: { h: PIN, u: 'u2', at: T0 } }, { uid: 'u2', now: T0 + 20000 }), 'an attempt carries the server time');
  no(db.update({ [`jugadorIntentos/${jid}`]: { h: PIN, u: 'u2', at: { '.sv': 'timestamp' }, x: 1 } }, { uid: 'u2', now: T0 + 20000 }), 'an attempt has nothing else');
  no(db.update({ [`jugadorIntentos/${jid}`]: null }, { uid: 'u2', now: T0 + 20000 }), 'nobody deletes an attempt');

  // Changing the key: a seat alone is not enough, the current PIN has to be proven
  const later = T0 + 200000;
  no(db.update({ [`jugadorKeys/${jid}`]: NEW, [`jugadorSeats/${jid}`]: { u2: NEW } }, { uid: 'u2', now: later }), 'a seated phone cannot change the key without the current PIN');
  ok(attempt('u2', WRONG, later), 'attempt with a wrong current PIN', db);
  no(db.update({ [`jugadorKeys/${jid}`]: NEW, [`jugadorSeats/${jid}`]: { u2: NEW } }, { uid: 'u2', now: later + 100 }), 'a wrong current PIN changes nothing');
  ok(attempt('u4', PIN, later + 6000), 'a phone that is not seated proves the PIN', db);
  no(db.update({ [`jugadorKeys/${jid}`]: NEW }, { uid: 'u4', now: later + 6100 }), 'the key changes only from a seated phone');
  ok(attempt('u2', PIN, later + 12000), 'attempt with the current PIN', db);
  ok(db.update({ [`jugadorKeys/${jid}`]: NEW, [`jugadorSeats/${jid}`]: { u2: NEW } }, { uid: 'u2', now: later + 12100 }), 'the current PIN changes the key and keeps this seat', db);
  assert.deepEqual(db.get(`jugadorSeats/${jid}`), { u2: NEW }, 'the other phones are out');
  ok(db.update({ [`jugadorSeats/${jid}/u2`]: null }, { uid: 'u2', now: later + 13000 }), 'signing out needs no attempt', db);

  // A legacy player (no key yet) is claimed with no attempt, as before
  const old = 'legacy01';
  db.set(`jugadores/${old}`, { n: 'Beto', at: T0, legado: true });
  ok(db.update({ [`jugadorKeys/${old}`]: PIN, [`jugadorSeats/${old}/u5`]: PIN, [`jugadores/${old}/legado`]: null }, { uid: 'u5', now: later }), 'a legacy player is claimed', db);
}

// ---- La Copa (torneoKeys / torneoSeats / torneoIntentos) ----
{
  const code = 'ABCDE', adm = 'adm001', pl = 'pla001', jid = 'adminjid';
  const db = createDb(undefined, {
    torneos: { [code]: { meta: { admin: adm }, players: { [adm]: { name: 'Admin', at: T0, j: jid }, [pl]: { name: 'Pia', at: T0 } } } },
    torneoKeys: { [code]: { [adm]: PIN, [pl]: PIN } },
    torneoSeats: { [code]: { [adm]: { ua: PIN } } },
    jugadorKeys: { [jid]: H('d') },
    jugadorSeats: { [jid]: { ua: H('d') } },
  });
  const attempt = (pid, uid, h, now) => db.update({ [`torneoIntentos/${code}/${pid}`]: { h, u: uid, at: { '.sv': 'timestamp' } } }, { uid, now });
  const seat = (pid, uid, h, now) => db.update({ [`torneoSeats/${code}/${pid}/${uid}`]: h }, { uid, now });

  no(seat(pl, 'up', PIN, T0), 'the cup PIN with no attempt is not a seat');
  ok(attempt(pl, 'up', WRONG, T0), 'a cup attempt', db);
  no(seat(pl, 'up', WRONG, T0 + 100), 'a wrong cup PIN is not a seat');
  no(attempt(pl, 'up', PIN, T0 + 2000), 'a second cup attempt within 5 s is refused');
  ok(attempt(pl, 'up', PIN, T0 + 5100), 'after 5 s', db);
  ok(seat(pl, 'up', PIN, T0 + 5200), 'the right cup PIN seats the phone', db);
  no(attempt('zzz999', 'up', PIN, T0 + 20000), 'no attempts on a cup player with no key');

  // Signing up: the key and the seat are created together, with no attempt
  ok(db.update({ [`torneoKeys/${code}/new001`]: NEW, [`torneoSeats/${code}/new001/un`]: NEW }, { uid: 'un', now: T0 }), 'a new cup player sits with their new key', db);

  // A new PIN for a player: only the admin, and only proving their own PIN
  const t = T0 + 100000;
  const reset = (uid, now) => db.update({ [`torneoKeys/${code}/${pl}`]: NEW, [`torneoSeats/${code}/${pl}`]: null }, { uid, now });
  no(reset('ua', t), "the admin's seat alone cannot give a new PIN");
  no(reset('up', t), 'a player cannot give another a new PIN');
  ok(attempt(adm, 'ua', WRONG, t), 'admin attempt with a wrong PIN', db);
  no(reset('ua', t + 100), "a wrong admin PIN changes nothing");
  ok(attempt(adm, 'ua', PIN, t + 6000), 'admin attempt with their cup PIN', db);
  ok(reset('ua', t + 6100), 'the admin, proving their cup PIN, gives a new PIN', db);
  assert.equal(db.get(`torneoSeats/${code}/${pl}`), null, "the player's phones are out");
  // An admin linked to their player proves the player's PIN instead (D-359: no cup PIN to know)
  const t2 = t + 200000;
  no(db.update({ [`torneoKeys/${code}/${pl}`]: PIN }, { uid: 'ua', now: t2 }), 'stale proof');
  ok(db.update({ [`jugadorIntentos/${jid}`]: { h: H('d'), u: 'ua', at: { '.sv': 'timestamp' } } }, { uid: 'ua', now: t2 }), 'player attempt', db);
  ok(db.update({ [`torneoKeys/${code}/${pl}`]: PIN }, { uid: 'ua', now: t2 + 100 }), "the linked admin's player PIN proves it too", db);

  no(db.update({ [`torneoIntentos/${code}/${pl}`]: null }, { uid: 'up', now: t2 }), 'a player does not delete attempts');
  ok(db.update({ [`torneoKeys/${code}`]: null, [`torneoSeats/${code}`]: null, [`torneoIntentos/${code}`]: null }, { uid: 'ua', now: t2 }), "the admin deletes the cup's keys, seats and attempts", db);
}
console.log('pin-attempts: ok');
