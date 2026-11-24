// How the profile is used (D-615): `perfilUso/<jid>/<day>/<field>` is written only by a phone seated as
// that player, one up at a time, capped at 200, with known fields; only the owner reads it. The anonymous
// `perfilPt/` and `perfilIdPt/` counters in the stats day take only known events. The test store
// (jugador-local.js) refuses the same. Runs the real rules in tools/firebase/rules-sim.mjs.
import assert from 'node:assert/strict';
import { createDb, loadRules } from '../tools/firebase/rules-sim.mjs';
import { crearAlmacenLocal } from '../public/assets/js/jugador-local.js';
import { crearJugador } from '../public/assets/js/jugador.js';
import { namedChanges, eventChanges, EVENTS, FIELDS } from '../public/assets/js/profile-usage.js';

const T0 = 1_800_000_000_000;
const OWNER = 'TrNylkeOFXNhnTPWAApebKvbI3F2';
const jid = 'abcd1234', day = '2027-01-15';
const INC = { '.sv': { increment: 1 } };
const base = () => createDb(undefined, { jugadores: { [jid]: { n: 'Ana', at: T0 } }, jugadorSeats: { [jid]: { u1: 'x'.repeat(64) } } });
{
  const db = base();
  const w = (ch, uid = 'u1') => db.update(ch, { uid, now: T0 });
  assert.equal(w({ [`perfilUso/${jid}/${day}/v`]: INC }), true, 'the seated phone counts a visit');
  assert.equal(w({ [`perfilUso/${jid}/${day}/v`]: INC, [`perfilUso/${jid}/${day}/b`]: INC }), true, 'several fields at once');
  assert.equal(db.get(`perfilUso/${jid}/${day}/v`), 2);
  assert.equal(w({ [`perfilUso/${jid}/${day}/v`]: 5 }), false, 'only one up at a time');
  assert.equal(w({ [`perfilUso/${jid}/${day}/v`]: INC }, 'u2'), false, 'another phone may not');
  assert.equal(w({ [`perfilUso/${jid}/${day}/v`]: INC }, null), false, 'nor someone without a session');
  assert.equal(w({ [`perfilUso/${jid}/${day}/z`]: INC }), false, 'unknown field');
  assert.equal(w({ [`perfilUso/${jid}/2027-1-5/v`]: INC }), false, 'a day is YYYY-MM-DD');
  assert.equal(w({ [`perfilUso/${jid}/${day}/s`]: 'x' }), false, 'a number');
  assert.equal(w({ [`perfilUso/${jid}/${day}`]: null }), false, 'a day is not deleted');
  db.set(`perfilUso/${jid}/${day}/p`, 200);
  assert.equal(w({ [`perfilUso/${jid}/${day}/p`]: INC }), false, 'capped at 200');
  // Every field the page writes is one the rules take
  for (const e of Object.keys(FIELDS)) assert.equal(w(namedChanges(jid, [e], Date.UTC(2027, 0, 16, 20))), true, `field for ${e}`);
}
{
  const r = loadRules();
  assert.equal(r.perfilUso['.read'], `auth != null && auth.uid === '${OWNER}'`, 'only the owner reads it');
  assert.equal(r.perfilUso['.write'], undefined, 'nothing written above a player\'s day');
  assert.equal(r.jugadores['.read'], `auth != null && auth.uid === '${OWNER}'`, 'the owner lists the players (accounts by day)');
}
{
  // The anonymous counters: every event the page sends is taken; anything else is refused
  const db = createDb();
  const now = Date.UTC(2027, 0, 15, 20);
  const d = Math.floor(now / 864e5);
  for (const e of EVENTS) assert.equal(db.update(Object.fromEntries(Object.entries(eventChanges([e], now)).map(([k, v]) => [`stats/prod/days/${d}/${k}`, v])), { now }), true, e);
  assert.equal(db.update({ [`stats/prod/days/${d}/perfilPt/20833/nope`]: INC }, { now }), false, 'unknown event');
  assert.equal(db.update({ [`stats/prod/days/${d}/perfilIdPt/20833/abcdefghij`]: 1 }, { now }), true, 'a browser opened it');
  assert.equal(db.update({ [`stats/prod/days/${d}/perfilIdPt/20833/abcdefghij`]: 2 }, { now }), false, 'only 1');
}
{
  // The test store refuses what the rules refuse
  const mem = new Map();
  const storage = { getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k) };
  let t = T0;
  const now = () => t;
  const kinds = [];
  const almacen = crearAlmacenLocal({ storage, now });
  const J = crearJugador({ almacen, storage, now, esperar: async ms => { t += ms; }, alSentar: k => kinds.push(k) });
  const yo = await J.crear('Ana', '1234');
  assert.deepEqual(kinds, ['create'], 'creating is told to the page');
  await J.usoPerfil({ [`perfilUso/${yo.jid}/${day}/v`]: INC, 'perfilUso/zzzz9999/2027-01-15/v': INC });
  assert.equal(await almacen.get(`perfilUso/${yo.jid}/${day}/v`), 1, 'only this player\'s counters are sent');
  await assert.rejects(almacen.update({ [`perfilUso/${yo.jid}/${day}/v`]: 3 }), 'one up at a time');
  await assert.rejects(almacen.update({ [`perfilUso/${yo.jid}/${day}/q`]: INC }), 'unknown field');
  J.salir();
  await J.entrar('Ana', '1234');
  assert.deepEqual(kinds, ['create', 'signin'], 'signing in is told to the page');
}
console.log('✓ profile usage rules');
