// Run: node public/assets/js/pending-scores.test.mjs
// A game the network did not let save is kept on the phone and sent later (guardarPendiente,
// subirPendientes), into the week it was played, once, and only for the player who played it.
import assert from 'node:assert/strict';
import { crearAlmacenLocal } from './jugador-local.js';
import { crearJugador } from './jugador.js';
import { semana, tablaId, SIEMPRE } from './records.js';

const ls = new Map();
const storage = { getItem: k => (ls.has(k) ? ls.get(k) : null), setItem: (k, v) => ls.set(k, String(v)), removeItem: k => ls.delete(k) };
const ahora = { t: Date.UTC(2026, 9, 25, 15) };
const local = crearAlmacenLocal({ storage, uid: 'uid1', now: () => ahora.t });
let sinRed = false;
const almacen = { ...local, update: c => (sinRed ? Promise.reject(Object.assign(new Error('busy'))) : local.update(c)) };
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
console.log('✓ pending games: kept without network, sent once into their week, only for their player');
