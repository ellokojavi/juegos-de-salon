// Ejecutar: node tools/firebase/rankings-historia.test.mjs
// La historia de La Copa en los rankings (D-212): jugadores heredados, récords de la pestaña "Copa" y podios.
import assert from 'node:assert/strict';
import { historia, jidHeredado } from './rankings-historia.mjs';
import { nuevaMeta } from '../../public/cup/engine.js';
import { esJid, claveOrden } from '../../public/assets/js/records.js';
import { crearAlmacenLocal } from '../../public/assets/js/jugador-local.js';
import { crearJugador } from '../../public/assets/js/jugador.js';

const meta = (o = {}) => nuevaMeta({ nombre: 'Copa Pirata', dias: 3, inicio: '2026-09-01', admin: 'p00001', creada: 0, cal: ['reinas', 'zip', 'final'], ...o });
const copa = (m, players, results) => ({ meta: m, players, results });
const P = (name, at = 1) => ({ name, at });
const terminada = copa(meta(), { p00001: P('Pancho'), p00002: P('Cata'), p00003: P('Javi') }, {
  1: { p00001: { s: 90, ms: 40000, at: 10 }, p00002: { s: 100, ms: 50000, at: 11 }, p00003: { s: 100, ms: 30000, at: 12 } },
  2: { p00001: { s: 70, ms: 1, at: 20 }, p00002: { s: 20, ms: 1, at: 21 } },
  3: { p00001: { s: 100, ms: 1, at: 30 }, p00002: { s: 50, ms: 1, at: 31 }, p00003: { s: 40, ms: 1, at: 32 } },
});
const otra = copa(meta({ nombre: 'Otra', inicio: '2026-09-10' }), { q00001: P('pancho '), q00002: P('Ñandú') }, {
  1: { q00001: { s: 95, ms: 1000, at: 40 }, q00002: { s: 10, ms: 1, at: 41 } },
});
const lab = copa(meta({ nombre: 'Lab', lab: true }), { r00001: P('Labo') }, { 1: { r00001: { s: 100, ms: 1 } } });
const ahora = Date.UTC(2026, 9, 4);

// El jid de un nombre es siempre el mismo y válido
assert.equal(jidHeredado('pancho'), jidHeredado('pancho'));
assert.ok(esJid(jidHeredado('pancho')));
assert.notEqual(jidHeredado('pancho'), jidHeredado('cata'));

const { cambios, gente, podios } = historia({ AAAAA: terminada, BBBBB: otra, CCCCC: lab }, {}, ahora);
// "Pancho" y "pancho " son la misma persona; la del laboratorio no cuenta
assert.deepEqual(gente.map(p => p.clave).sort(), ['cata', 'javi', 'nandu', 'pancho']);
const pancho = jidHeredado('pancho');
assert.deepEqual(cambios[`jugadores/${pancho}`].legado, true);
assert.equal(cambios[`jugadorNombres/pancho/${pancho}`], true);
// El mejor día de cada uno en cada juego suelto, en su tabla de copa; la final no es un juego suelto
assert.deepEqual(cambios[`records/reinas_copa/siempre/${pancho}`], { s: 95, ms: 1000, k: claveOrden(95, 1000), at: 40, n: 'pancho' });
assert.equal(cambios[`records/zip_copa/siempre/${pancho}`].s, 70);
assert.ok(!Object.keys(cambios).some(r => r.startsWith('records/final')));
assert.ok(!Object.keys(cambios).some(r => r.includes(jidHeredado('labo'))));
// El podio de la copa terminada, con los jugadores heredados
assert.deepEqual(Object.keys(podios).sort(), ['AAAAA', 'BBBBB']);
assert.equal(Object.values(podios.AAAAA.p).find(x => x.l === 1).j, pancho);
// Correrlo de nuevo con lo ya escrito no repite nada
const base = { jugadores: {}, records: {}, torneoPodios: {} };
for (const [r, v] of Object.entries(cambios)) {
  const ps = r.split('/'); let o = base;
  for (const p of ps.slice(0, -1)) o = (o[p] ||= {});
  o[ps.at(-1)] = v;
}
assert.deepEqual(historia({ AAAAA: terminada, BBBBB: otra }, base, ahora).cambios, {});

// En la app: quien entra con ese nombre ve sus puntajes y se los queda con su PIN
const ls = new Map();
const storage = { getItem: k => (ls.has(k) ? ls.get(k) : null), setItem: (k, v) => ls.set(k, String(v)), removeItem: k => ls.delete(k) };
ls.set('juegos-de-salon:prueba:records-db', JSON.stringify(base));
const mk = uid => crearJugador({ almacen: crearAlmacenLocal({ storage, uid, now: () => ahora }), storage: { getItem: k => storage.getItem(`${uid}:${k}`), setItem: (k, v) => storage.setItem(`${uid}:${k}`, v), removeItem: k => storage.removeItem(`${uid}:${k}`) }, now: () => ahora });
const cel = mk('u1');
const r = await cel.entrar('Pancho', '1234');
assert.deepEqual(r, { estado: 'nuevo', otros: 0, heredado: pancho, nombreHeredado: 'pancho' });
await cel.reclamar(pancho, '1234');
assert.equal(cel.yo().jid, pancho);
assert.equal((await cel.tabla('reinas_copa', 'siempre')).yo.s, 95);
// Ya tomado: otro celular entra con el mismo nombre y PIN, y con otro PIN ya no se le ofrece
assert.deepEqual(await mk('u2').entrar('pancho', '1234'), { estado: 'dentro', jid: pancho });
assert.deepEqual(await mk('u3').entrar('Pancho', '9999'), { estado: 'nuevo', otros: 1 });

console.log('rankings-historia: ok');
