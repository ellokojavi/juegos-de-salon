// Una vuelta de avisar.mjs (D-224) contra una base y un servicio de avisos de mentira: anota lo
// entregado, borra las suscripciones muertas y limpia las copas viejas. Uso: node tools/push/avisar.test.mjs
import assert from 'node:assert/strict';
import { vuelta } from './avisar.mjs';
import { nuevaMeta } from '../../public/cup/engine.js';

let n = 0;
const caso = async (nombre, fn) => { try { await fn(); n++; } catch (e) { console.error(`✗ ${nombre}`); throw e; } };
const HORA = 3600e3;
const TZ = 'America/Santiago';
const meta = nuevaMeta({ nombre: 'Los Primos', dias: 7, inicio: '2026-10-12', tz: TZ, admin: 'aaaaaa', creada: 1 });
const S1 = 'a'.repeat(32), S2 = 'b'.repeat(32);

function base() {
  const datos = {
    torneos: {
      KQRST: { meta, players: { aaaaaa: { name: 'Ana', at: 1 }, bbbbbb: { name: 'Beto', at: 2 } } },
      VIEJA: { meta: { ...meta, end: meta.end - 30 * 24 * HORA } },
    },
    pushCopa: {
      KQRST: { aaaaaa: { [S1]: { dia: true, plazo: true, at: 0 } }, bbbbbb: { [S2]: { dia: true, plazo: true, at: 0 } } },
      VIEJA: { aaaaaa: { [S1]: { dia: true, plazo: true, at: 0 } } },
      BORRADA: { aaaaaa: { [S1]: { dia: true, plazo: true, at: 0 } } },
    },
    push: { [S1]: { endpoint: 'https://fcm.googleapis.com/x', lang: 'es', tz: TZ }, [S2]: { endpoint: 'https://web.push.apple.com/y', lang: 'es', tz: TZ } },
    pushEnviados: {},
  };
  const cambios = [];
  return {
    datos, cambios,
    leer: async ruta => ruta.split('/').reduce((o, k) => o?.[k], datos) ?? null,
    cambiar: async c => { cambios.push(c); },
  };
}
const now = meta.win[2].a + 10 * HORA;

await caso('manda lo que toca y anota lo entregado', async () => {
  const db = base();
  const mandados = [];
  const r = await vuelta({ db, now, log: () => {}, envio: async (sub, aviso) => { mandados.push([sub.endpoint, aviso.body]); return { estado: 201 }; } });
  assert.equal(r.avisos, 2);
  assert.equal(r.entregados, 2);
  assert.equal(mandados.length, 2);
  const c = db.cambios[0];
  assert.equal(c[`pushEnviados/KQRST/${S1}/dia:2`], now);
  assert.equal(c[`pushEnviados/KQRST/${S2}/dia:2`], now);
  // Lo que mira el panel (D-233)
  const dia = Math.floor(now / (24 * HORA));
  assert.deepEqual(c[`stats/prod/days/${dia}/mandados/dia`], { '.sv': { increment: 2 } });
  assert.equal(c['stats/prod/push/vuelta'], now);
  assert.equal(c['stats/prod/push/vivas'], 2);
  assert.equal(c['stats/prod/push/torneos'], 1);
});

await caso('días nuevos de dos copas para un celular: un aviso, anotado en las dos (D-229)', async () => {
  const db = base();
  db.datos.torneos.MNPQR = { meta: { ...meta, name: 'La Oficina' }, players: { cccccc: { name: 'Ana', at: 1 } } };
  db.datos.pushCopa.MNPQR = { cccccc: { [S1]: { dia: true, plazo: true, at: 0 } } };
  const mandados = [];
  const r = await vuelta({ db, now, log: () => {}, envio: async (sub, aviso) => { mandados.push([sub.endpoint, aviso.body]); return { estado: 201 }; } });
  assert.equal(r.avisos, 2, 'Ana, uno con las dos copas; Beto, el suyo');
  assert.ok(mandados.some(([e, b]) => /fcm/.test(e) && b === '🎲 Tienes un día nuevo en 2 copas: Los Primos y La Oficina.'));
  const c = db.cambios[0];
  assert.equal(c[`pushEnviados/KQRST/${S1}/dia:2`], now);
  assert.equal(c[`pushEnviados/MNPQR/${S1}/dia:2`], now);
});

await caso('limpia las copas que terminaron hace más de una semana o que ya no existen', async () => {
  const db = base();
  const r = await vuelta({ db, now, log: () => {}, envio: async () => ({ estado: 201 }) });
  assert.equal(r.limpiadas, 2);
  const c = db.cambios[0];
  for (const code of ['VIEJA', 'BORRADA']) { assert.equal(c[`pushCopa/${code}`], null); assert.equal(c[`pushEnviados/${code}`], null); }
  assert.ok(!(`pushCopa/KQRST` in c));
});

await caso('una suscripción muerta se borra con sus copas; una falla pasajera no se anota', async () => {
  const db = base();
  const r = await vuelta({ db, now, log: () => {}, envio: async sub => (sub.endpoint.includes('apple') ? { estado: 410, muerta: true } : { estado: 429, texto: 'lento' }) });
  assert.deepEqual([r.muertas, r.fallas, r.entregados], [1, 1, 0]);
  const c = db.cambios[0];
  assert.equal(c[`push/${S2}`], null);
  assert.equal(c[`pushCopa/KQRST/bbbbbb/${S2}`], null);
  assert.ok(!(`push/${S1}` in c), 'la del 429 sigue');
  assert.ok(!Object.keys(c).some(k => k.startsWith('pushEnviados/KQRST/')), 'lo que no se entregó se vuelve a intentar');
});

await caso('--simular no manda ni anota', async () => {
  const db = base();
  const lineas = [];
  const r = await vuelta({ db, now, simular: true, log: l => lineas.push(l), envio: async () => { throw new Error('no debía mandar'); } });
  assert.equal(r.avisos, 2);
  assert.equal(db.cambios.length, 0);
  assert.ok(lineas.every(l => l.startsWith('· mandaría')));
});

await caso('lo ya mandado no se repite en la vuelta siguiente', async () => {
  const db = base();
  await vuelta({ db, now, log: () => {}, envio: async () => ({ estado: 201 }) });
  for (const [k, v] of Object.entries(db.cambios[0])) {
    if (!k.startsWith('pushEnviados/KQRST/')) continue;
    const [, code, sub, clave] = k.split('/');
    ((db.datos.pushEnviados[code] ||= {})[sub] ||= {})[clave] = v;
  }
  const r = await vuelta({ db, now: now + 15 * 60e3, log: () => {}, envio: async () => ({ estado: 201 }) });
  assert.equal(r.avisos, 0);
});

await caso('--prueba: solo esa copa, a cada celular, sin anotar ni limpiar (salvo las señales)', async () => {
  const db = base();
  const mandados = [];
  const r = await vuelta({ db, now: meta.win[2].a + 3 * HORA, prueba: 'KQRST', log: () => {}, envio: async (sub, aviso) => { mandados.push(aviso.body); return { estado: 201 }; } });
  assert.deepEqual([r.avisos, r.entregados, r.limpiadas], [2, 2, 0]);
  assert.deepEqual(mandados, ['Así se verán los avisos de esta copa.', 'Así se verán los avisos de esta copa.']);
  // Solo las señales del panel (D-233): nada en pushEnviados ni limpiezas
  assert.deepEqual(Object.keys(db.cambios[0]).filter(k => !k.startsWith('stats/')), []);
  assert.deepEqual(Object.values(db.cambios[0]).find(v => v?.['.sv']), { '.sv': { increment: 2 } });
});

await caso('--simular no escribe nada, ni las señales', async () => {
  const db = base();
  await vuelta({ db, now, simular: true, log: () => {}, envio: async () => ({ estado: 201 }) });
  assert.equal(db.cambios.length, 0);
});

await caso('Uno al día: manda el de hoy, lo anota y borra lo de una suscripción que ya no existe', async () => {
  const db = base();
  const { numDia } = await import('../../public/assets/js/uno-al-dia.js');
  const t = Date.parse('2026-10-07T13:10:00Z');   // 10:10 en Santiago
  const n = numDia('2026-10-07');
  db.datos.pushDia = { [S1]: { h: 9, d: true, r: true, w: true, u: n - 1, c: 3, k: 0, m: 3, at: 0 }, ['c'.repeat(32)]: { h: 9, at: 0 } };
  db.datos.pushEnviadosDia = {};
  const mandados = [];
  await vuelta({ db, now: t, log: () => {}, envio: async (sub, aviso) => { mandados.push(aviso.body); return { estado: 201 }; } });
  assert.ok(mandados.some(b => /Uno al día n\.° \d+ ya está\. 🔥 Racha: 3 días\./.test(b)), mandados.join(' | '));
  const c = Object.assign({}, ...db.cambios);
  assert.equal(c[`pushEnviadosDia/${S1}/dia:${n}`], t);
  assert.equal(c[`pushDia/${'c'.repeat(32)}`], null);
  assert.equal(c[`stats/prod/days/${Math.floor(t / 864e5)}/mandados/uad-dia`]?.['.sv']?.increment, 1);
});

console.log(`avisar: ${n} casos en verde`);
