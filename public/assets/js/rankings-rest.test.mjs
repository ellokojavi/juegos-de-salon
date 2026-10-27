// The rankings store reads over REST and loads the SDK only to write (D-470): URLs, order, ties, errors.
import assert from 'node:assert/strict';
import { crearAlmacenFirebase, filasRest } from './jugador-firebase.js';

const BASE = 'https://db.example';
const pedidos = [];
let cargas = 0;
const sdk = async () => { cargas++; return { listo: async () => 'uid1', token: async () => 'tok', update: async c => { sdk.ultimo = c; } }; };
const datos = {
  a: { k: 3, s: 3 }, b: { k: 1, s: 1 }, c: { k: 2, s: 2 }, d: { k: 2, s: 2 }, e: { k: 5, s: 5 },
};
const fetchFn = async url => {
  pedidos.push(url);
  const u = new URL(url), p = u.searchParams;
  if (u.pathname === '/prohibido.json') return { ok: false, status: 401, json: async () => ({}) };
  if (u.pathname === '/torneoPodios.json') return { ok: true, status: 200, json: async () => ({ x: { end: 9 }, y: { end: 4 } }) };
  if (!u.pathname.startsWith('/records/')) return { ok: true, status: 200, json: async () => ({ n: 'Ana' }) };
  assert.equal(p.get('orderBy'), '"k"');
  let filas = filasRest(datos);
  if (p.has('endAt')) filas = filas.filter(f => f.k <= JSON.parse(p.get('endAt')));
  if (p.has('startAt')) filas = filas.filter(f => f.k >= JSON.parse(p.get('startAt')));
  if (p.has('limitToFirst')) filas = filas.slice(0, +p.get('limitToFirst'));
  if (p.has('limitToLast')) filas = filas.slice(-p.get('limitToLast'));
  return { ok: true, status: 200, json: async () => Object.fromEntries(filas.reverse().map(({ jid, ...v }) => [jid, v])) };
};
const A = crearAlmacenFirebase({ fetchFn, sdk, base: BASE });

// Reads: REST, no SDK
assert.deepEqual(await A.get('jugadores/abcdefgh'), { n: 'Ana' });
assert.equal(pedidos.at(-1), `${BASE}/jugadores/abcdefgh.json`);
assert.deepEqual((await A.top('t', 'siempre', 3)).map(f => f.jid), ['b', 'c', 'd'], 'by k, then by key, whatever order JSON brings');
assert.match(pedidos.at(-1), /records\/t\/siempre\.json\?orderBy=%22k%22&limitToFirst=3$/);
const v = await A.vecinos('t', 'siempre', 2, 1);
assert.deepEqual(v.arriba.map(f => f.jid), ['b'], 'ties on k are left out, as endBefore did');
assert.deepEqual(v.abajo.map(f => f.jid), ['a']);
assert.deepEqual(Object.keys(await A.podios(2)), ['y', 'x'], 'podiums oldest first');
await assert.rejects(A.get('prohibido'), e => e.code === 'permiso');
await assert.rejects(crearAlmacenFirebase({ fetchFn: async () => { throw new TypeError('Failed to fetch'); }, sdk }).get('x'), e => e.code === 'offline');
assert.equal(cargas, 0, 'nothing read loaded the SDK');

// Writes, sign-in and the seated paths' token: the SDK, loaded once
await A.update({ 'x/y': 1 });
assert.deepEqual(sdk.ultimo, { 'x/y': 1 });
assert.equal(await A.listo(), 'uid1');
await A.get('invitados/abcdefgh');
assert.equal(pedidos.at(-1), `${BASE}/invitados/abcdefgh.json?auth=tok`, 'seated reads: REST with the ID token');
await A.get('jugadorCopas/abcdefgh');
assert.equal(pedidos.at(-1), `${BASE}/jugadorCopas/abcdefgh.json?auth=tok`);
assert.equal(cargas, 1);
console.log('ok jugador-firebase');
