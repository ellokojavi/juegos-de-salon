// The achievements told to a player live on the account (the owner: told once, on one phone, is told on every
// phone): a seated phone notes each one once, with a past date; nobody else writes or reads them. Runs the real
// rules (rules-sim.mjs), then the round trip through two phones on the test store (jugador-local.js).
import assert from 'node:assert/strict';
import { createDb } from '../tools/firebase/rules-sim.mjs';
import { crearAlmacenLocal } from '../public/assets/js/jugador-local.js';
import { crearJugador } from '../public/assets/js/jugador.js';
import { missing } from '../public/assets/js/told-sync.js';

const T0 = 1_800_000_000_000, jid = 'abcd1234';
{
  const db = createDb(undefined, { jugadores: { [jid]: { n: 'Ana', at: T0 } }, jugadorSeats: { [jid]: { u1: 'x' } } });
  const w = (uid, path, v, now = T0) => db.update({ [path]: v }, { uid, now });
  assert.equal(w('u1', `jugadorLogros/${jid}/a/night-owl`, T0 - 5), true, 'a seated phone notes a told achievement');
  assert.equal(w('u1', `jugadorLogros/${jid}/a/night-owl`, T0), false, 'once: its date does not move');
  assert.equal(w('u1', `jugadorLogros/${jid}/v/streak-10`, T0), true, 'and a badge shown on the profile');
  assert.equal(w('u2', `jugadorLogros/${jid}/a/xmas`, T0), false, 'another phone, not seated, does not');
  assert.equal(w('u1', `jugadorLogros/${jid}/z/xmas`, T0), false, 'only a and v');
  assert.equal(w('u1', `jugadorLogros/${jid}/a/xmas`, T0 + 3_600_000), false, 'not a date to come');
  assert.equal(w('u1', `jugadorLogros/${jid}/a/xmas`, 'hoy'), false, 'a date, a number');
}

// Two phones, one player: what one phone noted, the other reads (the store shared, each phone its own memory)
{
  const shared = new Map();
  const phone = () => { const m = new Map(); const at = k => (k.includes('prueba') ? shared : m);
    return { getItem: k => at(k).get(k) ?? null, setItem: (k, v) => at(k).set(k, String(v)), removeItem: k => at(k).delete(k), get length() { return m.size; }, key: i => [...m.keys()][i] }; };
  const now = () => T0;
  const sA = phone(), sB = phone();
  const A = crearJugador({ almacen: crearAlmacenLocal({ storage: sA, uid: 'u1', now }), storage: sA, now, esperar: async () => {} });
  await A.crear('Ana', '1234');
  await A.anotarLogros({ a: { 'night-owl': T0 - 10 }, v: { 'streak-10': T0 - 20 } });
  const B = crearJugador({ almacen: crearAlmacenLocal({ storage: sB, uid: 'u2', now }), storage: sB, now, esperar: async () => {} });
  await B.entrar('Ana', '1234');
  assert.deepEqual(await B.logrosContados(), { a: { 'night-owl': T0 - 10 }, v: { 'streak-10': T0 - 20 } }, 'the other phone reads what was told, with its date');
  assert.deepEqual(missing({ x: 1, y: 2 }, { y: 3 }), { x: 1 }, 'only what the other side lacks moves');
}
