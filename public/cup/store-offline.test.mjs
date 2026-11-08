// Run: node public/cup/store-offline.test.mjs
// La Copa offline (D-544): a pending day played with no signal waits on the phone and uploads when the
// signal is back, only while its day is still open; after that it counts as not played.
import assert from 'node:assert/strict';
import { leerCola, anotarInicio, anotarResultado, conCola, subirCola, pendientesCopa, enCola, OUTBOX_KEY } from '../assets/js/cup-outbox.js';
import { createOfflineStore } from './store-offline.js';

const memoria = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), m }; };
const H = 3600000;
const T0 = Date.UTC(2026, 10, 8, 12);
const meta = { days: 3, end: T0 + 48 * H, win: { 1: { a: T0 - 24 * H, b: T0 + 12 * H }, 2: { a: T0, b: T0 + 36 * H }, 3: { a: T0 + 24 * H, b: T0 + 48 * H } } };
const L = { meta, players: { aaaaaa: { name: 'Ana', at: 1 }, bbbbbb: { name: 'Beto', at: 1 } }, results: { 1: { bbbbbb: { s: 5, ms: 1000, t: '', at: 1 } } } };

// The offline store plays from the kept copy and queues
{
  const storage = memoria();
  const copias = { ABCDE: { L, offset: 0, at: T0 } };
  const cuenta = { copia: { leer: c => copias[c] || null } };
  let now = T0;
  const st = createOfflineStore({ cuenta, storage, clock: () => now });
  assert.equal(st.tipo, 'offline');
  await assert.rejects(st.comodin('ABCDE', 1, 'aaaaaa'), { code: 'offline' }, 'the wildcard needs signal');
  await assert.rejects(st.crear('ABCDE'), { code: 'offline' });
  await assert.rejects(st.empezar('ABCDE', 3, 'aaaaaa'), { code: 'ventana' }, 'a day not open yet');
  await assert.rejects(st.empezar('ZZZZZ', 1, 'aaaaaa'), { code: 'sin-copia' }, 'a cup with no copy on this phone');
  const vistos = [];
  st.escuchar('ABCDE', x => vistos.push(x));
  await st.empezar('ABCDE', 1, 'aaaaaa');
  await st.resultado('ABCDE', 1, 'aaaaaa', { s: 7, ms: 2000, t: 'x', r: '' });
  await assert.rejects(st.resultado('ABCDE', 1, 'aaaaaa', { s: 9, ms: 1, t: '', r: '' }), { code: 'ya-jugado' }, 'one attempt, offline too');
  await assert.rejects(st.resultado('ABCDE', 1, 'bbbbbb', { s: 9, ms: 1, t: '', r: '' }), { code: 'ya-jugado' }, 'a day already on the server');
  assert.equal(pendientesCopa(storage), 1);
  assert.ok(enCola('ABCDE', 1, 'aaaaaa', storage));
  const visto = await st.leer('ABCDE');
  assert.equal(visto.results[1].aaaaaa.s, 7, 'the board shows the day as played');
  assert.equal(visto.results[1].bbbbbb.s, 5);
  assert.ok(visto.started[1].aaaaaa);
  assert.equal(L.results[1].aaaaaa, undefined, 'the copy itself is not changed');
  await new Promise(r => setTimeout(r, 5));
  assert.ok(vistos.length >= 2, 'the open board is redrawn');
  now = T0 + 13 * H;
  await assert.rejects(st.empezar('ABCDE', 1, 'aaaaaa'), { code: 'ventana' }, 'by the phone clock the day closed');
}

// The upload: start, then result; a closed day counts as not played; the network keeps it
{
  const storage = memoria();
  const err = code => Object.assign(new Error(code), { code });
  // A fake server: `fallar(ruta)` decides an error for a write; `hay` what get() finds
  const fake = ({ fallar = () => null, hay = new Set() } = {}) => {
    const hechas = [];
    return { hechas,
      update: async c => { const [ruta, v] = Object.entries(c)[0]; const e = fallar(ruta); if (e) throw err(e); hechas.push([ruta, v.s ?? v['.sv']]); },
      get: async ruta => (hay.has(ruta) ? 1 : null) };
  };
  anotarResultado({ code: 'ABCDE', d: 1, pid: 'aaaaaa', b: T0 + 12 * H, at: T0, res: { s: 7, ms: 1, t: '', r: '' } }, storage);
  anotarResultado({ code: 'ABCDE', d: 2, pid: 'aaaaaa', b: T0 + 36 * H, at: T0, res: { s: 3, ms: 1, t: '', r: '' } }, storage);
  anotarInicio({ code: 'ABCDE', d: 3, pid: 'aaaaaa', b: T0 + 48 * H, at: T0 }, storage);

  let r = await subirCola(fake({ fallar: ruta => (ruta.includes('/results/') ? 'offline' : null) }), { storage, now: () => T0 + H });
  assert.deepEqual(r, { cupSent: 0, cupLate: 0, cupDup: 0 });
  assert.equal(leerCola(storage).length, 3, 'a network error keeps everything');

  // The seat refused while the day is open: kept for when the player enters again
  r = await subirCola(fake({ fallar: () => 'permiso' }), { storage, now: () => T0 + H });
  assert.deepEqual(r, { cupSent: 0, cupLate: 0, cupDup: 0 });
  assert.equal(pendientesCopa(storage), 2);

  const ok = fake();
  r = await subirCola(ok, { storage, now: () => T0 + 20 * H });
  assert.deepEqual(r, { cupSent: 1, cupLate: 1, cupDup: 0 }, 'day 1 closed at +12 h: not played; day 2 goes');
  assert.deepEqual(ok.hechas, [['torneos/ABCDE/started/2/aaaaaa', 'timestamp'], ['torneos/ABCDE/results/2/aaaaaa', 3]], 'the start goes before the result');
  assert.equal(leerCola(storage).length, 1, 'a day started and not finished waits');
  assert.equal(pendientesCopa(storage), 0);

  anotarResultado({ code: 'ABCDE', d: 3, pid: 'aaaaaa', b: T0 + 48 * H, at: T0, res: { s: 1, ms: 1, t: '', r: '' } }, storage);
  r = await subirCola(fake({ fallar: () => 'permiso', hay: new Set(['torneos/ABCDE/started/3/aaaaaa', 'torneos/ABCDE/results/3/aaaaaa']) }), { storage, now: () => T0 + 30 * H });
  assert.deepEqual(r, { cupSent: 0, cupLate: 0, cupDup: 1 }, 'played on another phone first: that one stays');
  assert.equal(storage.getItem(OUTBOX_KEY), null, 'an empty queue leaves nothing behind');

  anotarResultado({ code: 'ABCDE', d: 3, pid: 'bbbbbb', b: T0 + 48 * H, at: T0, res: { s: 1, ms: 1, t: '', r: '' } }, storage);
  r = await subirCola(fake({ fallar: () => 'permiso' }), { storage, now: () => T0 + 48 * H + 60000 });
  assert.deepEqual(r, { cupSent: 0, cupLate: 1, cupDup: 0 }, 'refused after the close: not played');
}

// conCola leaves other cups alone
{
  const storage = memoria();
  anotarResultado({ code: 'QQQQQ', d: 1, pid: 'aaaaaa', b: 1, at: 1, res: { s: 1, ms: 1, t: '', r: '' } }, storage);
  assert.equal(conCola(L, 'ABCDE', storage).results[1].aaaaaa, undefined);
}
console.log('✓ store-offline: a pending day of La Copa plays from the kept copy, waits on the phone and uploads only while its day is open (D-544)');
