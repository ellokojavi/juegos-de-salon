// Ejecutar: node assets/js/transport/cleanup.test.mjs
import assert from 'node:assert/strict';
import { ROOM_TTL, dayOf, daysToSweep, noteRoom, sweep } from './cleanup.js';

const DAY = 24 * 60 * 60 * 1000;

/**
 * Base de datos falsa que imita las reglas de firebase/database.rules.json:
 * un balde con apuntes de menos de 6 horas no se puede leer ni borrar, y una sala
 * que todavía no vence tampoco se puede borrar.
 */
function fakeDb(now) {
  const data = {};
  const walk = (path, make = false) => {
    const parts = path.split('/');
    let node = data;
    for (const p of parts.slice(0, -1)) {
      if (node[p] === undefined) { if (!make) return [null, null]; node[p] = {}; }
      node = node[p];
    }
    return [node, parts[parts.length - 1]];
  };
  const fresh = bucket => bucket && !(bucket.lastAt < now - ROOM_TTL);
  const api = {
    reads: 0,
    read(path) {
      api.reads++;
      const [node, key] = walk(path);
      const val = node ? node[key] ?? null : null;
      if (path.startsWith('cleanup/days/') && fresh(val)) throw new Error('permission-denied');
      return Promise.resolve(val);
    },
    update(path, changes) {
      for (const [k, v] of Object.entries(changes)) {
        const [node, key] = walk(`${path}/${k}`, true);
        node[key] = v;
      }
      return Promise.resolve();
    },
    remove(path) {
      const [node, key] = walk(path);
      const val = node ? node[key] : null;
      if (path.startsWith('rooms/') && val && val.createdAt > now - ROOM_TTL) throw new Error('permission-denied');
      if (path.startsWith('cleanup/days/') && fresh(val)) throw new Error('permission-denied');
      if (node) delete node[key];
      return Promise.resolve();
    },
    stamp: () => now,
    data,
  };
  return api;
}

// Qué días se revisan
const hoy = 20000;
assert.deepEqual(daysToSweep(null, hoy), [hoy - 8, hoy - 7, hoy - 6, hoy - 5, hoy - 4, hoy - 3, hoy - 2, hoy - 1], 'sin marca se miran los últimos 8 días');
assert.deepEqual(daysToSweep(hoy - 1, hoy), daysToSweep(null, hoy), 'la marca al día igual repasa el rescate de 8 días');
assert.deepEqual(daysToSweep(hoy + 5, hoy), daysToSweep(null, hoy), 'una marca adelantada a mano no salta el rescate');
assert.equal(daysToSweep(hoy - 500, hoy).length, 30, 'nunca más de 30 baldes de una vez');
assert.equal(daysToSweep(hoy - 500, hoy)[0], hoy - 30);
assert.ok(daysToSweep(hoy - 3, hoy).every(d => d < hoy), 'hoy nunca se barre');

// Apuntar una sala la deja en el balde de su día
const t0 = 20000 * DAY + 3 * 60 * 60 * 1000;
let db = fakeDb(t0);
await noteRoom(db, 'ABCD', t0);
assert.deepEqual(db.data.cleanup.days[dayOf(t0)], { lastAt: t0, rooms: { ABCD: true } });

// Un barrido al día siguiente borra la sala vencida, el balde y deja la marca
db = fakeDb(t0);
db.data.rooms = { ABCD: { createdAt: t0, game: 'toque-y-fama' } };
await noteRoom(db, 'ABCD', t0);
const mañana = t0 + DAY;
const r = await sweep(fakeMove(db, mañana), mañana);
assert.deepEqual(r, { days: 1, rooms: 1 });
assert.deepEqual(db.data.rooms, {}, 'la sala vencida se borró');
assert.equal(db.data.cleanup.days[dayOf(t0)], undefined, 'el balde se borró');
assert.equal(db.data.cleanup.sweptDay, dayOf(t0));

// Con la marca puesta, un segundo barrido no vuelve a mirar ese día
const antes = db.reads;
await sweep(fakeMove(db, mañana), mañana);
assert.ok(db.reads - antes <= 9, 'el segundo barrido solo mira el rescate');
assert.equal(db.data.cleanup.sweptDay, dayOf(t0), 'la marca no retrocede');

// Un balde con una sala todavía viva corta el barrido y no se pierde
db = fakeDb(t0);
const ayer = t0 - DAY;
db.data.rooms = { OLDD: { createdAt: ayer }, NEWW: { createdAt: t0 } };
await noteRoom(fakeMove(db, ayer), 'OLDD', ayer);
db.data.cleanup.days[dayOf(ayer)].rooms.NEWW = true;      // sala nueva colada en un balde viejo
db.data.cleanup.days[dayOf(ayer)].lastAt = ayer;
const r2 = await sweep(db, t0);
assert.deepEqual(r2, { days: 0, rooms: 1 }, 'borra la vencida, la viva no se deja');
assert.deepEqual(Object.keys(db.data.rooms), ['NEWW'], 'la sala viva sigue en pie');
assert.ok(db.data.cleanup.days[dayOf(ayer)], 'el balde queda para el próximo barrido');
assert.equal(db.data.cleanup.sweptDay, dayOf(ayer) - 1, 'la marca se queda antes del balde pendiente');

// Un balde que las reglas no dejan leer (apuntes de hace menos de 6 horas) también corta
db = fakeDb(t0);
await noteRoom(db, 'ABCD', t0 - DAY);                      // apuntado recién, en el balde de ayer
db.data.rooms = { ABCD: { createdAt: t0 - DAY } };
const r3 = await sweep(db, t0);
assert.deepEqual(r3, { days: 0, rooms: 0 });
assert.ok(db.data.rooms.ABCD, 'no se toca lo que no se puede leer');
assert.equal(db.data.cleanup.sweptDay, dayOf(t0 - DAY) - 1, 'la marca se queda antes del balde que no se pudo leer');

/** La misma base, pero con el reloj movido (las reglas miran `now`). */
function fakeMove(db, now) {
  const moved = fakeDb(now);
  Object.assign(moved.data, db.data);
  moved.reads = db.reads;
  const sync = () => { db.data.rooms = moved.data.rooms; db.data.cleanup = moved.data.cleanup; db.reads = moved.reads; };
  return new Proxy(moved, { get: (t, k) => {
    const v = t[k];
    if (typeof v !== 'function') return v;
    return (...args) => { const out = v.apply(t, args); sync(); return out; };
  } });
}

console.log('cleanup: todos los tests OK');
