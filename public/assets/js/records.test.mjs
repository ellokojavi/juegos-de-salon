// Ejecutar: node public/assets/js/records.test.mjs
// Los récords y rankings de los jugadores (D-212): orden, semanas, Todoterreno y medallero.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  nuevoJid, esJid, claveNombre, CLAVE_NOMBRE, hashPinJugador, tablaId, TABLA, PERIODO, semana, claveOrden,
  normalizar, esMejor, ordenar, vistaTabla, todoterreno, podioDe, medallero, ultimasCopas, S_MAX, MS_MAX, limpiarNombre,
} from './records.js';
import { crearAlmacenLocal } from './jugador-local.js';
import { crearJugador, rankingsVisibles, activarRankings, RANKINGS_EN_LABS } from './jugador.js';

// El id de un jugador
let x = 0;
const fijo = () => ((x = (x * 9301 + 49297) % 233280) / 233280);
for (let i = 0; i < 50; i++) assert.ok(esJid(nuevoJid(fijo)));
assert.ok(!esJid('abc'));

// Nombres: el mismo con mayúsculas, tildes o espacios; nunca una clave vacía
assert.equal(claveNombre('  Cata '), 'cata');
assert.equal(claveNombre('CATA'), 'cata');
assert.equal(claveNombre('Ñandú José'), 'nandu-jose');
assert.equal(claveNombre('🎉🎉'), 'sin-letras');
assert.equal(limpiarNombre('  un   nombre  muy largo que no cabe entero  '), 'un nombre muy largo ');
for (const n of ['Javi', 'María José', 'x.y#z', '🙂', 'ab/cd$[e]']) assert.ok(CLAVE_NOMBRE.test(claveNombre(n)), n);

// El hash del PIN depende del jugador: el mismo PIN de dos jugadores no se parece
const h1 = await hashPinJugador('aaaaaaaa', '1234'), h2 = await hashPinJugador('bbbbbbbb', '1234');
assert.match(h1, /^[0-9a-f]{64}$/);
assert.notEqual(h1, h2);

// Tablas: la forma que aceptan las reglas, sin lista de juegos (C-16)
assert.equal(tablaId('reinas'), 'reinas');
assert.equal(tablaId('reinas', 'copa'), 'reinas_copa');
for (const t of ['reinas', 'reinas_copa', 'todoterreno', 'toque-y-fama_solo']) assert.ok(TABLA.test(t), t);
for (const t of ['Reinas', '_copa', 'a/b', 'reinas_']) assert.ok(!TABLA.test(t), t);

// Semanas ISO, con el lunes a medianoche en Chile
assert.equal(semana(Date.UTC(2026, 9, 5, 12)), 's2026-41');           // lunes 5 de octubre
assert.equal(semana(Date.UTC(2026, 9, 5, 2)), 's2026-40');            // en Chile todavía es domingo
assert.equal(semana(Date.UTC(2027, 0, 1, 15)), 's2026-53');           // el 1 de enero de 2027 es de la última de 2026
assert.equal(semana(Date.UTC(2026, 0, 1, 15)), 's2026-01');
for (const p of ['siempre', semana(Date.now())]) assert.ok(PERIODO.test(p));

// Orden: más puntos primero, a igual puntaje menos tiempo
assert.ok(claveOrden(100, 50000) < claveOrden(99, 1000));
assert.ok(claveOrden(100, 1000) < claveOrden(100, 2000));
assert.ok(claveOrden(S_MAX, MS_MAX) < claveOrden(S_MAX - 1, 0));
assert.ok(Number.isSafeInteger(claveOrden(0, MS_MAX)));
assert.deepEqual(normalizar({ s: 87.4, ms: 61234.6 }), { s: 87, ms: 61235, k: claveOrden(87, 61235) });
assert.equal(normalizar({ s: -1, ms: 0 }), null);
assert.equal(normalizar({ s: 'x', ms: 0 }), null);
assert.ok(esMejor({ s: 90, ms: 5 }, null));
assert.ok(esMejor({ s: 90, ms: 5 }, { s: 90, ms: 6 }));
assert.ok(!esMejor({ s: 90, ms: 6 }, { s: 90, ms: 6 }));
assert.ok(!esMejor({ s: 89, ms: 1 }, { s: 90, ms: 600 }));

const filas = ordenar([
  { jid: 'c', s: 80, ms: 1 }, { jid: 'a', s: 100, ms: 9 }, { jid: 'b', s: 100, ms: 9 }, { jid: 'd', s: 100, ms: 3 },
]);
assert.deepEqual(filas.map(f => [f.jid, f.puesto]), [['d', 1], ['a', 2], ['b', 2], ['c', 4]]);

// Vista: el top, y si el jugador quedó más abajo, sus vecinos
const muchas = Array.from({ length: 30 }, (_, i) => ({ jid: `j${String(i).padStart(2, '0')}`, s: 100 - i, ms: 1000 }));
let v = vistaTabla(muchas, 'j03');
assert.equal(v.top.length, 10);
assert.equal(v.yo.puesto, 4);
assert.equal(v.vecinos.length, 0);
v = vistaTabla(muchas, 'j20');
assert.equal(v.yo.puesto, 21);
assert.deepEqual(v.vecinos.map(f => f.puesto), [19, 20, 21, 22, 23]);
v = vistaTabla(muchas.slice(0, 12), 'zzzz', { vecinosLeidos: { arriba: [{ jid: 'q', s: 5, ms: 1 }], yo: { jid: 'zzzz', s: 4, ms: 1 }, abajo: [] } });
assert.ok(v.fuera);
assert.equal(v.yo.jid, 'zzzz');
assert.equal(v.yo.puesto, null);
v = vistaTabla(muchas, null);
assert.equal(v.yo, null);

// Todoterreno: suma lo que hay, solo de los juegos que cuentan
assert.deepEqual(todoterreno({ reinas: { s: 90, ms: 1000 }, zip: { s: 70, ms: 500 }, otro: { s: 100, ms: 1 } }, ['reinas', 'zip', 'tango']), { s: 160, ms: 1500, n: 2 });
assert.equal(todoterreno({}, ['reinas']), null);

// Podio y medallero
const tablaCopa = [
  { pid: 'p1', name: 'Javi', lugar: 1 }, { pid: 'p2', name: 'Cata', lugar: 2 }, { pid: 'p3', name: 'Pancho', lugar: 2 }, { pid: 'p4', name: 'Fran', lugar: 4 },
];
const podio = podioDe(tablaCopa, { p1: { j: 'javi0001' }, p2: { j: 'malo' } });
assert.deepEqual(podio, { p1: { n: 'Javi', l: 1, j: 'javi0001' }, p2: { n: 'Cata', l: 2 }, p3: { n: 'Pancho', l: 2 } });
const med = medallero({
  AAAAA: { name: 'Copa 1', end: 10, p: podio },
  BBBBB: { name: 'Copa 2', end: 20, p: { q1: { n: 'Javier', l: 1, j: 'javi0001' }, q2: { n: 'cata', l: 1 } } },
  CCCCC: { name: 'Copa 3', end: 30, p: { r1: { n: 'Pancho', l: 3 } } },
});
assert.deepEqual(med.map(f => [f.n, f.oro, f.plata, f.bronce, f.puesto]), [
  ['Javier', 2, 0, 0, 1], ['cata', 1, 1, 0, 2], ['Pancho', 0, 1, 1, 3],
]);
assert.deepEqual(ultimasCopas({ A: { name: 'a', end: 1, p: { x: { n: 'X', l: 1 } } }, B: { name: 'b', end: 2, p: {} } }).map(c => c.code), ['B', 'A']);

// El almacén de prueba hace cumplir lo mismo que las reglas: con otro PIN no se entra
const ls = new Map();
const storage = { getItem: k => (ls.has(k) ? ls.get(k) : null), setItem: (k, v) => ls.set(k, String(v)), removeItem: k => ls.delete(k) };
const ahora = { t: Date.UTC(2026, 9, 7, 15) };
const mkJugador = uid => crearJugador({ almacen: crearAlmacenLocal({ storage, uid, now: () => ahora.t }), storage: { ...storage, getItem: k => storage.getItem(`${uid}:${k}`), setItem: (k, val) => storage.setItem(`${uid}:${k}`, val), removeItem: k => storage.removeItem(`${uid}:${k}`) }, now: () => ahora.t, juegos: ['reinas', 'zip'] });

const cel1 = mkJugador('uid1'), cel2 = mkJugador('uid2'), cel3 = mkJugador('uid3');
assert.deepEqual(await cel1.entrar('Javi', '1234'), { estado: 'nuevo', otros: 0 });
const javi = await cel1.crear('Javi', '1234');
assert.ok(esJid(javi.jid));
assert.equal(cel1.yo().n, 'Javi');
// Otro celular con el mismo nombre y PIN entra al mismo jugador
assert.deepEqual(await cel2.entrar(' javi ', '1234'), { estado: 'dentro', jid: javi.jid });
// Con otro PIN no entra: puede crear otro Javi
assert.deepEqual(await cel3.entrar('JAVI', '9999'), { estado: 'nuevo', otros: 1 });
const otroJavi = await cel3.crear('Javi', '9999');
assert.notEqual(otroJavi.jid, javi.jid);
// Crear de nuevo con un PIN que ya entra no duplica: entra
const cel4 = mkJugador('uid4');
assert.equal((await cel4.crear('Javi', '1234')).jid, javi.jid);

// Los récords: el mejor queda, uno peor no lo pisa, y la semana va aparte
let r = await cel1.anotar({ juego: 'reinas', s: 80, ms: 60000 });
assert.ok(r.siempre.nuevo && r.semana.nuevo);
r = await cel2.anotar({ juego: 'reinas', s: 70, ms: 1000 });
assert.ok(!r.siempre.nuevo && !r.semana.nuevo);
r = await cel2.anotar({ juego: 'reinas', s: 80, ms: 50000 });
assert.ok(r.siempre.nuevo);
await cel3.anotar({ juego: 'reinas', s: 95, ms: 90000 });
await cel3.anotar({ juego: 'zip', s: 40, ms: 9000 });
let t = await cel1.tabla('reinas', 'siempre');
assert.deepEqual(t.top.map(f => [f.n, f.s, f.puesto]), [['Javi', 95, 1], ['Javi', 80, 2]]);
assert.equal(t.yo.jid, javi.jid);
// La semana siguiente parte en blanco; la de siempre sigue
ahora.t += 7 * 86400000;
assert.equal((await cel1.tabla('reinas')).top.length, 0);
r = await cel1.anotar({ juego: 'reinas', s: 50, ms: 1000 });
assert.ok(r.semana.nuevo && !r.siempre.nuevo);
assert.equal((await cel1.tabla('reinas')).top.length, 1);
// Rendirse (0 puntos) cuenta como partida, pero no entra a las tablas (#185)
r = await cel2.anotar({ juego: 'tango', s: 0, ms: 5000 });
assert.ok(!r.siempre.nuevo && !r.semana.nuevo);
assert.equal((await cel2.tabla('tango', 'siempre')).top.length, 0);
assert.equal((await cel2.perfil()).juegos.tango.n, 1);
// Todoterreno: la suma de los mejores de cada juego
await cel1.anotar({ juego: 'zip', s: 30, ms: 1000 });
t = await cel1.tabla('todoterreno', 'siempre');
assert.deepEqual(t.top.map(f => [f.n, f.s]), [['Javi', 135], ['Javi', 110]]);
// Las partidas se cuentan, aunque no sean récord
const perfil = await cel1.perfil();
assert.equal(perfil.juegos.reinas.n, 4);
// Cambiar el PIN saca a los otros celulares
await cel1.cambiarPin('4321');
await assert.rejects(cel2.anotar({ juego: 'zip', s: 100, ms: 1 }), /pin/);
assert.equal((await mkJugador('uid5').entrar('Javi', '1234')).estado, 'nuevo');
assert.equal((await mkJugador('uid6').entrar('Javi', '4321')).estado, 'dentro');
// Salir deja el celular sin jugador; los récords quedan
cel1.salir();
assert.equal(cel1.yo(), null);
assert.equal((await cel1.tabla('reinas', 'siempre')).top.length, 2);

// Victorias de los juegos de grupo: suben de a uno, la semana aparte, y una derrota solo cuenta la partida
r = await cel3.anotarVictoria({ juego: 'dudo', gano: true });
assert.deepEqual([r.siempre, r.semana], [1, 1]);
r = await cel3.anotarVictoria({ juego: 'dudo', gano: true });
assert.deepEqual([r.siempre, r.semana], [2, 2]);
assert.deepEqual(await cel3.anotarVictoria({ juego: 'dudo', gano: false }), { gano: false });
assert.equal((await cel3.perfil()).juegos.dudo.n, 3);
t = await cel3.tabla('dudo_victorias', 'siempre');
assert.deepEqual(t.top.map(f => [f.jid === otroJavi.jid, f.s, f.ms]), [[true, 2, 0]]);
// Nadie se suma diez victorias de una: las reglas exigen +1
const db = crearAlmacenLocal({ storage, uid: 'uid3', now: () => ahora.t });
await assert.rejects(db.update({ [`records/dudo_victorias/siempre/${otroJavi.jid}`]: { s: 12, ms: 0, k: claveOrden(12, 0), at: { '.sv': 'timestamp' }, n: 'Javi' } }), /permiso/);
await db.update({ [`records/dudo_victorias/siempre/${otroJavi.jid}`]: { s: 3, ms: 0, k: claveOrden(3, 0), at: { '.sv': 'timestamp' }, n: 'Javi' } });

// Amigos: los que se conocieron en una copa
cel3.conocer({ [javi.jid]: 'Javi' });
t = await cel3.tablaAmigos('reinas', 'siempre');
assert.deepEqual(t.map(f => [f.jid === otroJavi.jid, f.s]), [[true, 95], [false, 80]]);

// En el laboratorio (D-212): en el sitio publicado, solo en el celular que los activó; en pruebas, siempre
if (RANKINGS_EN_LABS) {
  const marca = new Map(), st = { getItem: k => marca.get(k) ?? null, setItem: (k, v) => marca.set(k, v), removeItem: k => marca.delete(k) };
  globalThis.location = { hostname: 'juegosdesalon.cl', search: '' };
  assert.equal(rankingsVisibles(st), false);
  activarRankings(true, st);
  assert.equal(rankingsVisibles(st), true);
  activarRankings(false, st);
  assert.equal(rankingsVisibles(st), false);
  globalThis.location = { hostname: 'localhost', search: '' };
  assert.equal(rankingsVisibles(st), true);
  delete globalThis.location;
}

// Las reglas repiten la forma de las claves de este módulo
const reglas = JSON.parse(await readFile(new URL('../../../firebase/database.rules.json', import.meta.url), 'utf8')).rules;
for (const rama of ['jugadores', 'jugadorKeys', 'jugadorSeats', 'jugadorNombres', 'records', 'torneoPodios']) assert.ok(reglas[rama], `falta la rama ${rama} en las reglas`);
const textoReglas = JSON.stringify(reglas.records);
assert.ok(textoReglas.includes(String(S_MAX)) && textoReglas.includes(String(MS_MAX)), 'las reglas de records usan otros topes');

console.log('records: ok');
