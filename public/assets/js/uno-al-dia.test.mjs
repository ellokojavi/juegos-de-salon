// Ejecutar: node public/assets/js/uno-al-dia.test.mjs
// Uno al día (D-230): el mazo de juegos, la semilla del día, la racha y lo que se anota en el celular.
import assert from 'node:assert/strict';
import {
  JUEGOS_DIA, LANZAMIENTO, SIN_REPETIR, crearCalendario, juegoDel, semillaDel, numeroDel, sumarDias, diasEntre,
  fechaLocal, faltaParaManana, racha, mejorRacha, porJuego, anotar, leer, estado, rutaDel, unoAlDiaVisible, activarUnoAlDia, formaAcceso, elegirForma, KEY,
} from './uno-al-dia.js';
import { JUEGOS } from '../../cup/games/index.js';
import { esCodigo } from '../../cup/engine.js';
import { SUELTOS } from './games.js';

const almacen = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; };
const fechas = (desde, n) => Array.from({ length: n }, (_, i) => sumarDias(desde, i));

// Las fechas
assert.equal(sumarDias('2026-12-31', 1), '2027-01-01');
assert.equal(sumarDias('2026-03-01', -1), '2026-02-28');
assert.equal(diasEntre('2026-10-05', '2026-10-12'), 7);
assert.equal(numeroDel(LANZAMIENTO), 1);
assert.equal(numeroDel(sumarDias(LANZAMIENTO, 11)), 12);
assert.match(fechaLocal(), /^\d{4}-\d{2}-\d{2}$/);
assert.equal(fechaLocal(new Date(2026, 9, 5, 23, 59).getTime()), '2026-10-05', 'la fecha es la del reloj del jugador');
assert.equal(faltaParaManana(new Date(2026, 9, 5, 23, 0).getTime()), 3600000, 'a las 23:00 falta una hora');

// Cada juego del mazo existe en La Copa y se puede generar con la semilla del día
for (const j of JUEGOS_DIA) assert.ok(JUEGOS[j.id]?.generar, `${j.id}: no está en cup/games`);
const dias = fechas(LANZAMIENTO, 400);
for (const f of dias.slice(0, 30)) {
  const s = semillaDel(f);
  assert.ok(esCodigo(s), `${f}: la semilla ${s} no es un código de copa`);
  assert.ok(JUEGOS[juegoDel(f)].generar(s, 1, { lang: 'es' }), `${f}: ${juegoDel(f)} no genera con ${s}`);
}
assert.equal(semillaDel('2026-10-05'), semillaDel('2026-10-05'), 'la misma fecha, la misma semilla');
assert.notEqual(semillaDel('2026-10-05'), semillaDel('2026-10-06'));

// El mazo: cada juego una vez antes de repetir, y ninguno vuelve antes de tiempo
const N = JUEGOS_DIA.length, espera = Math.min(SIN_REPETIR, N - 2);
const salidos = dias.map(juegoDel);
for (let k = 0; k + N <= salidos.length; k += N) {
  assert.equal(new Set(salidos.slice(k, k + N)).size, N, `el mazo ${k / N} repite un juego`);
}
for (let i = 0; i < salidos.length; i++) {
  const antes = salidos.slice(Math.max(0, i - espera + 1), i);
  assert.ok(!antes.includes(salidos[i]), `${dias[i]}: ${salidos[i]} volvió antes de ${espera} días`);
}
assert.equal(juegoDel(sumarDias(LANZAMIENTO, -1)), null, 'antes del lanzamiento no hay juego');
// Los mazos no salen siempre en el mismo orden
assert.notDeepEqual(salidos.slice(0, N), salidos.slice(N, 2 * N), 'el segundo mazo repite el orden del primero');
// Otra instancia da lo mismo (no depende del orden de las consultas)
const otro = crearCalendario();
assert.equal(otro.juegoDel(dias[300]), juegoDel(dias[300]));

// Un juego nuevo entra en el mazo siguiente y no cambia los días que ya pasaron
const nuevo = sumarDias(LANZAMIENTO, 40);
const conNuevo = crearCalendario([...JUEGOS_DIA, { id: 'ahorcado', emoji: '🪢', desde: nuevo }]);
const pasados = fechas(LANZAMIENTO, 40);
assert.deepEqual(pasados.map(f => conNuevo.juegoDel(f)), pasados.map(juegoDel), 'el juego nuevo cambió días pasados');
assert.ok(fechas(nuevo, 2 * (N + 1)).some(f => conNuevo.juegoDel(f) === 'ahorcado'), 'el juego nuevo no salió en los mazos siguientes');

// La racha
const d = { '2026-10-01': {}, '2026-10-02': {}, '2026-10-03': {}, '2026-10-05': {} };
assert.equal(racha(d, '2026-10-05'), 1, 'hoy jugó, ayer no');
assert.equal(racha(d, '2026-10-04'), 3, 'hoy todavía no juega: la de ayer sigue viva');
assert.equal(racha(d, '2026-10-07'), 0, 'dos días sin jugar: se cortó');
assert.equal(mejorRacha(d), 3);
assert.equal(mejorRacha({}), 0);

// Por juego: la tendencia compara los últimos 3 con los 5 de antes
const hist = Object.fromEntries([60, 70, 70, 80, 90, 95].map((s, i) => [sumarDias('2026-10-01', i), { j: 'reinas', s }]));
hist['2026-10-20'] = { j: 'anio', s: 50 };
const [reinas, anio] = porJuego(hist);
assert.equal(reinas.id, 'reinas');
assert.equal(reinas.n, 6);
assert.equal(reinas.mejor, 95);
assert.equal(reinas.ultimos3, 88);
assert.equal(reinas.antes, 67);
assert.equal(reinas.tendencia, 21);
assert.equal(anio.tendencia, null, 'con menos de 4 partidas no hay tendencia');

// Lo que se anota: el primer intento del día queda; los demás solo se cuentan
const st = almacen();
assert.deepEqual(leer(st), { dias: {} });
const a1 = anotar('2026-10-05', { j: 'reinas', s: 87, ms: 102000 }, { storage: st, ahora: 1 });
assert.equal(a1.primera, true);
const a2 = anotar('2026-10-05', { j: 'reinas', s: 100, ms: 50000 }, { storage: st, ahora: 2 });
assert.equal(a2.primera, false);
assert.deepEqual(leer(st).dias['2026-10-05'], { j: 'reinas', s: 87, ms: 102000, at: 1, n: 2 });
st.setItem(KEY, 'no es json');
assert.deepEqual(leer(st), { dias: {} }, 'lo guardado roto se lee vacío');

// El estado de hoy
const st2 = almacen();
const ahora = new Date(2026, 9, 7, 12).getTime();
anotar('2026-10-06', { j: 'conexiones', s: 50, ms: 1 }, { storage: st2 });
let e = estado({ storage: st2, ahora });
assert.equal(e.hoy, '2026-10-07');
assert.equal(e.dia, null);
assert.equal(e.racha, 1);
assert.equal(e.juego, juegoDel('2026-10-07'));
anotar('2026-10-07', { j: e.juego, s: 90, ms: 1 }, { storage: st2 });
e = estado({ storage: st2, ahora });
assert.equal(e.racha, 2);
assert.equal(e.dia.s, 90);

// Dónde se juega
const slugs = Object.fromEntries(SUELTOS.map(g => [g.id, g.slug]));
assert.equal(rutaDel('reinas', slugs), 'queens/?hoy');
assert.equal(rutaDel('linea', slugs), 'cup/suelto/?linea&hoy');
for (const j of JUEGOS_DIA) assert.ok(slugs[j.id] || ['linea', 'numero'].includes(j.id), `${j.id}: sin página para jugarlo`);

// El laboratorio: en el sitio publicado, solo con la marca de /labs/
const lab = almacen();
assert.equal(unoAlDiaVisible({ storage: lab, loc: { hostname: 'juegosdesalon.cl', search: '' } }), false);
activarUnoAlDia(true, lab);
assert.equal(unoAlDiaVisible({ storage: lab, loc: { hostname: 'juegosdesalon.cl', search: '' } }), true);
activarUnoAlDia(false, lab);
assert.equal(unoAlDiaVisible({ storage: lab, loc: { hostname: 'localhost', search: '' } }), true, 'en el sitio local siempre');

// Dónde va en la portada: al lado del dado, salvo que se pruebe la tarjeta desde /labs/ o con ?uad=
const fm = almacen(), sinQ = { search: '' };
assert.equal(formaAcceso({ storage: fm, loc: sinQ }), 'boton');
elegirForma('tarjeta', fm);
assert.equal(formaAcceso({ storage: fm, loc: sinQ }), 'tarjeta');
assert.equal(formaAcceso({ storage: fm, loc: { search: '?uad=boton' } }), 'boton', 'el link manda');
elegirForma('boton', fm);
assert.equal(formaAcceso({ storage: fm, loc: { search: '?uad=tarjeta' } }), 'tarjeta');
assert.equal(formaAcceso({ storage: fm, loc: sinQ }), 'boton');

console.log('uno-al-dia: ok');
