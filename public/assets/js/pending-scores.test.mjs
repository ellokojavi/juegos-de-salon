// Run: node public/assets/js/pending-scores.test.mjs
// A game the network did not let save is kept on the phone and sent later (guardarPendiente,
// subirPendientes), into the week it was played, once, and only for the player who played it.
import assert from 'node:assert/strict';
import { crearAlmacenLocal } from './jugador-local.js';
import { crearJugador, guardarPendienteLocal, MAX_PENDIENTES } from './jugador.js';
import { semana, tablaId, SIEMPRE } from './records.js';

const ls = new Map();
const storage = { getItem: k => (ls.has(k) ? ls.get(k) : null), setItem: (k, v) => ls.set(k, String(v)), removeItem: k => ls.delete(k) };
const ahora = { t: Date.UTC(2026, 9, 25, 15) };
const local = crearAlmacenLocal({ storage, uid: 'uid1', now: () => ahora.t });
let sinRed = false;
let cortarDespues = 0;   // the next N writes land on the server, but their answer is lost
const almacen = { ...local, update: async c => {
  if (sinRed) throw new Error('busy');
  await local.update(c);
  if (cortarDespues > 0) { cortarDespues--; throw new Error('cut after the server took it'); }
} };
const J = crearJugador({ almacen, storage, now: () => ahora.t, juegos: [] });
const mica = await J.crear('Mica', '1234');
const jugado = ahora.t;

sinRed = true;
await assert.rejects(J.anotar({ juego: 'zip', s: 100, ms: 114000 }), 'without network, anotar fails');
assert.ok(J.guardarPendiente({ juego: 'zip', s: 100, ms: 114000 }));
assert.equal(J.pendientes().length, 1);
assert.equal(await J.subirPendientes(), 0, 'still without network: nothing sent');
assert.equal(J.pendientes().length, 1, 'and it stays');

sinRed = false;
ahora.t += 8 * 86400000;   // sent the next week: it lands in the week it was played
const [a, b] = await Promise.all([J.subirPendientes(), J.subirPendientes()]);
assert.deepEqual([a, b], [1, 1], 'two calls at once share one run');
assert.equal(J.pendientes().length, 0);
const t = tablaId('zip', '');
assert.equal((await local.get(`records/${t}/${semana(jugado)}/${mica.jid}`))?.s, 100, 'in the week it was played');
assert.equal((await local.get(`records/${t}/${SIEMPRE}/${mica.jid}`))?.s, 100);
assert.equal((await local.get(`jugadores/${mica.jid}/juegos/zip/n`)), 1, 'counted once');

// Another player's game is dropped, not sent as this one's
storage.setItem('juegos-de-salon:jugador:pendientes', JSON.stringify([{ jid: 'zzzzzzzz', juego: 'zip', variante: '', s: 90, ms: 1000, t: ahora.t }]));
assert.equal(await J.subirPendientes(), 0);
assert.equal(J.pendientes().length, 0);

// Exactly once (D-538): a try cut after the server took the counter is not counted again
const eventos = [];
globalThis.dispatchEvent = e => eventos.push(e.detail);
assert.ok(J.guardarPendiente({ juego: 'zip', s: 80, ms: 2000 }));
cortarDespues = 1;
assert.equal(await J.subirPendientes(), 0, 'the answer was lost: it stays queued');
assert.equal((await local.get(`jugadores/${mica.jid}/juegos/zip/n`)), 2, 'the server counted it');
assert.equal(await J.subirPendientes(), 1);
assert.equal((await local.get(`jugadores/${mica.jid}/juegos/zip/n`)), 2, 'and the retry did not count it twice');
assert.deepEqual(eventos.at(-1), { sent: 1, refused: 0, old: 0, full: 0 }, 'the upload is announced for the toast');

// Queued without loading Firebase, with an id; a full queue drops the oldest and says how many
for (let i = 0; i < MAX_PENDIENTES + 3; i++) assert.ok(guardarPendienteLocal({ juego: 'zip', s: 10, ms: 1000 + i }, { storage, now: () => ahora.t + i }));
const cola = J.pendientes();
assert.equal(cola.length, MAX_PENDIENTES, `up to ${MAX_PENDIENTES}`);
assert.equal(cola[0].ms, 1003, 'the oldest went first');
assert.ok(cola.every(x => x.id), 'each has an id');
assert.equal(new Set(cola.map(x => x.id)).size, MAX_PENDIENTES, 'ids are unique');
assert.equal(await J.subirPendientes(), MAX_PENDIENTES);
assert.deepEqual(eventos.at(-1), { sent: MAX_PENDIENTES, refused: 0, old: 0, full: 3 });

// Older than 30 days: dropped and counted
assert.ok(J.guardarPendiente({ juego: 'zip', s: 10, ms: 1000 }));
ahora.t += 31 * 86400000;
assert.equal(await J.subirPendientes(), 0);
assert.deepEqual(eventos.at(-1), { sent: 0, refused: 0, old: 1, full: 0 });
assert.equal(guardarPendienteLocal({ juego: 'zip', s: 10, ms: 1 }, { storage: { getItem: () => null, setItem() {} } }), false, 'no player: nothing kept');
console.log('✓ pending games: kept without network or Firebase, sent once into their week, only for their player, up to 200 for 30 days');
