// Ejecutar: node tools/firebase/rankings-historia.test.mjs
// La historia de La Copa en los rankings (D-212): jugadores heredados, récords de la pestaña "Copa", podios y las copas de cada jugador (D-220).
import assert from 'node:assert/strict';
import { historia, jidHeredado } from './rankings-historia.mjs';
import { nuevaMeta } from '../../public/cup/engine.js';
import { esJid, claveOrden } from '../../public/assets/js/records.js';
import { crearAlmacenLocal } from '../../public/assets/js/jugador-local.js';
import { crearJugador } from '../../public/assets/js/jugador.js';

const meta = (o = {}) => nuevaMeta({ nombre: 'Copa Pirata', dias: 3, inicio: '2026-09-01', admin: 'p00001', creada: 0, cal: ['reinas', 'zip', 'final'], ...o });
const copa = (m, players, results) => ({ meta: m, players, results });
const P = (name, at = 1, co) => ({ name, at, ...(co ? { co } : {}) });
const terminada = copa(meta(), { p00001: P('Pancho', 1, 'CL'), p00002: P('Cata', 1, 'AR'), p00003: P('Javi') }, {
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
assert.deepEqual(cambios[`records/reinas_copa/siempre/${pancho}`], { s: 95, ms: 1000, k: claveOrden(95, 1000), at: 40, n: 'pancho', co: 'CL' });
assert.equal(cambios[`records/zip_copa/siempre/${pancho}`].s, 70);
assert.ok(!Object.keys(cambios).some(r => r.startsWith('records/final')));
assert.ok(!Object.keys(cambios).some(r => r.includes(jidHeredado('labo'))));
// El podio de la copa terminada, con los jugadores heredados
assert.deepEqual(Object.keys(podios).sort(), ['AAAAA', 'BBBBB']);
assert.equal(Object.values(podios.AAAAA.p).find(x => x.l === 1).j, pancho);
// Las banderas (D-219): el jugador heredado, sus récords y el podio llevan el país de la copa
assert.equal(cambios[`jugadores/${pancho}`].co, 'CL');
assert.equal(cambios[`records/reinas_copa/siempre/${pancho}`].co, 'CL');
assert.equal(Object.values(podios.AAAAA.p).find(x => x.n === 'Cata').co, 'AR');
// Las copas de cada jugador (D-220): "Pancho" y "pancho " tienen las dos, cada una con su pid
assert.deepEqual(cambios[`jugadorCopas/${pancho}/AAAAA`], { p: 'p00001', at: 1 });
assert.equal(cambios[`jugadorCopas/${pancho}/BBBBB`].p, 'q00001');
// Uno enlazado a su jugador la anota a ese jugador, también si la copa es del laboratorio
const enlazado = copa(meta({ nombre: 'Piratotes', lab: true }), { s00001: { ...P('Jiri', 5), j: 'jiri0001' } }, {});
assert.deepEqual(historia({ DDDDD: enlazado }, { jugadores: { jiri0001: { n: 'Jiri' } } }, ahora).cambios, { 'jugadorCopas/jiri0001/DDDDD': { p: 's00001', at: 5 } });
// Con --con-laboratorio, la del laboratorio también cuenta
assert.ok(Object.keys(historia({ CCCCC: lab }, {}, ahora, { conLab: true }).cambios).some(r => r.includes(jidHeredado('labo'))));
// Correrlo de nuevo con lo ya escrito no repite nada
const base = { jugadores: {}, records: {}, torneoPodios: {} };
for (const [r, v] of Object.entries(cambios)) {
  const ps = r.split('/'); let o = base;
  for (const p of ps.slice(0, -1)) o = (o[p] ||= {});
  o[ps.at(-1)] = v;
}
assert.deepEqual(historia({ AAAAA: terminada, BBBBB: otra }, base, ahora).cambios, {});
// Lo guardado antes de las banderas las recibe sin reescribirse entero
const sinCo = JSON.parse(JSON.stringify(base));
delete sinCo.jugadores[pancho].co; delete sinCo.records.reinas_copa.siempre[pancho].co; delete sinCo.torneoPodios.AAAAA.p.p00001.co;
assert.deepEqual(historia({ AAAAA: terminada, BBBBB: otra }, sinCo, ahora).cambios, {
  [`jugadores/${pancho}/co`]: 'CL', [`records/reinas_copa/siempre/${pancho}/co`]: 'CL', 'torneoPodios/AAAAA/p/p00001/co': 'CL',
});
// La tabla de partidas parte con lo que cada jugador ya había jugado
const conJuegos = { ...base, jugadores: { ...base.jugadores, zzzzzzzz: { n: 'Zoe', co: 'PE', juegos: { reinas: { n: 3 }, dudo: { n: 2 } } } } };
assert.deepEqual(historia({}, conJuegos, ahora).cambios['records/partidas/siempre/zzzzzzzz'], { s: 5, ms: 0, k: claveOrden(5, 0), at: ahora, n: 'Zoe', co: 'PE' });

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
