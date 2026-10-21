// Ejecutar: node public/assets/js/uno-al-dia.test.mjs
// Uno al día (D-230): el mazo de juegos, la semilla del día, la racha, lo que se anota en el celular
// y los puntajes de los juegos de grupo (El Ahorcado, Batalla Naval, Dudo).
import assert from 'node:assert/strict';
import {
  JUEGOS_DIA, LANZAMIENTO, SIN_REPETIR, DESDE_GRUPO, DESDE_MAS, DESDE_GENERALA, GRUPO, azarDel, puntajeAhorcado, puntajeNaval, puntajeDudo, CASILLAS_FLOTA, crearCalendario, juegoDel, semillaDel, numeroDel, sumarDias, diasEntre,
  fechaLocal, faltaParaManana, racha, mejorRacha, recorrer, numDia, fechaDeNum, semanaDe, juntar, COMODINES_MAX, porJuego, anotar, leer, estado, rutaDel, formaAcceso, KEY,
} from './uno-al-dia.js';
import { JUEGOS } from '../../cup/games/index.js';
import { esCodigo } from '../../cup/engine.js';
import { GAMES, SUELTOS, SLUGS_SIN_PAGINA } from './games.js';
import { randomLayout, isValidLayout } from '../../battleship/engine.js';

const almacen = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; };
const juegoDiaDesde = id => JUEGOS_DIA.find(j => j.id === id)?.desde;
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

// Cada solitario del mazo existe en La Copa y se puede generar con la semilla del día; cada juego
// de grupo está en la portada
for (const j of JUEGOS_DIA) {
  if (GRUPO.includes(j.id)) assert.ok(GAMES.find(g => g.id === j.id)?.available, `${j.id}: no está en games.js`);
  else assert.ok(JUEGOS[j.id]?.generar, `${j.id}: no está en cup/games`);
}
assert.equal(JUEGOS_DIA.length, 17, '17 games: 13 solo and 4 with their own page (D-334, D-405)');
// D-405: Generala joins on DESDE_GENERALA, the first day of the third deck: no day before it changes
{
  assert.equal(DESDE_GENERALA, '2026-10-23', 'Generala enters with the deck shuffled on 2026-10-23 (D-405)');
  const sin = crearCalendario(JUEGOS_DIA.filter(j => j.id !== 'generala'));
  for (const f of fechas(LANZAMIENTO, diasEntre(LANZAMIENTO, DESDE_GENERALA))) assert.equal(juegoDel(f), sin.juegoDel(f), `${f} changed its game when Generala joined`);
  assert.ok(fechas(DESDE_GENERALA, JUEGOS_DIA.length).map(juegoDel).includes('generala'), 'Generala comes out in the deck shuffled on 2026-10-23');
}
// D-334: the six that join on DESDE_MAS do not change any day before it, and each one comes out in the next two decks
{
  const antes = crearCalendario(JUEGOS_DIA.filter(j => j.desde < DESDE_MAS));
  for (const f of fechas(LANZAMIENTO, diasEntre(LANZAMIENTO, DESDE_MAS))) assert.equal(juegoDel(f), antes.juegoDel(f), `${f} changed its game`);
  const despues = fechas(DESDE_MAS, 2 * JUEGOS_DIA.length + 10).map(juegoDel);
  for (const j of JUEGOS_DIA.filter(x => x.desde === DESDE_MAS)) assert.ok(despues.includes(j.id), `${j.id} never comes out after ${DESDE_MAS}`);
}
assert.ok(JUEGOS_DIA.every(j => j.desde >= LANZAMIENTO), 'ningún juego entra antes del lanzamiento');
const dias = fechas(LANZAMIENTO, 400);
for (const f of dias.slice(0, 30)) {
  const s = semillaDel(f);
  assert.ok(esCodigo(s), `${f}: la semilla ${s} no es un código de copa`);
  if (GRUPO.includes(juegoDel(f))) continue;
  assert.ok(JUEGOS[juegoDel(f)].generar(s, 1, { lang: 'es' }), `${f}: ${juegoDel(f)} no genera con ${s}`);
}
assert.equal(semillaDel('2026-10-05'), semillaDel('2026-10-05'), 'la misma fecha, la misma semilla');
assert.notEqual(semillaDel('2026-10-05'), semillaDel('2026-10-06'));

// El mazo: cada juego una vez antes de repetir, y ninguno vuelve antes de tiempo. Cada mazo tiene
// los juegos que ya habían entrado al barajarlo: el primero, los 7 solitarios; desde el segundo, los
// 10, y con 10 la espera es de 7 días. From the third (2026-10-23), the 16 of D-334 and Generala (D-405).
const salidos = dias.map(juegoDel);
const mazos = [];
for (let k = 0; k < salidos.length;) {
  const n = JUEGOS_DIA.filter(j => j.desde <= dias[k]).length;
  mazos.push({ k, n, espera: Math.min(SIN_REPETIR, n - 2) });
  const mazo = salidos.slice(k, k + n);
  if (mazo.length === n) assert.equal(new Set(mazo).size, n, `el mazo que empieza el ${dias[k]} repite un juego`);
  k += n;
}
assert.deepEqual(mazos.slice(0, 4).map(m => m.n), [7, 10, 17, 17], 'the first deck has 7 games, the second 10 and, from the one shuffled on 2026-10-23, 17 (D-334, D-405)');
assert.equal(dias[mazos[2].k], '2026-10-23', 'the six games of D-334 enter with the deck shuffled on 2026-10-23');
assert.equal(mazos[1].espera, 7, 'con 10 juegos, ninguno vuelve antes de 7 días');
for (const { k, n, espera } of mazos) {
  for (let i = k; i < Math.min(k + n, salidos.length); i++) {
    const antes = salidos.slice(Math.max(0, i - espera + 1), i);
    assert.ok(!antes.includes(salidos[i]), `${dias[i]}: ${salidos[i]} volvió antes de ${espera} días`);
  }
}
for (const id of GRUPO.filter(g => juegoDiaDesde(g) === DESDE_GRUPO)) assert.ok(salidos.slice(0, 7 + 10).includes(id), `${id} no salió en el segundo mazo`);
// Los días antes de que entraran los de grupo no cambian: son los del mazo de 7
const solo7 = crearCalendario(JUEGOS_DIA.filter(j => !GRUPO.includes(j.id)));
const viejos = fechas(LANZAMIENTO, diasEntre(LANZAMIENTO, DESDE_GRUPO));
assert.ok(viejos.length >= 1, 'los de grupo entran después del lanzamiento');
assert.deepEqual(viejos.map(juegoDel), viejos.map(f => solo7.juegoDel(f)), 'sumar los de grupo cambió días ya jugados');
assert.equal(juegoDel(LANZAMIENTO), 'desenredo', 'el día n.° 1 sigue siendo Desenredo');
assert.equal(juegoDel(sumarDias(LANZAMIENTO, -1)), null, 'antes del lanzamiento no hay juego');
// Los mazos no salen siempre en el mismo orden
assert.notDeepEqual(salidos.slice(mazos[1].k, mazos[2].k), salidos.slice(mazos[2].k, mazos[3].k), 'el tercer mazo repite el orden del segundo');
// Otra instancia da lo mismo (no depende del orden de las consultas)
const otro = crearCalendario();
assert.equal(otro.juegoDel(dias[300]), juegoDel(dias[300]));

// Un juego nuevo entra en el mazo siguiente y no cambia los días que ya pasaron
const nuevo = sumarDias(LANZAMIENTO, 40);
const conNuevo = crearCalendario([...JUEGOS_DIA, { id: 'nuevo', emoji: '🆕', desde: nuevo }]);
const pasados = fechas(LANZAMIENTO, 40);
assert.deepEqual(pasados.map(f => conNuevo.juegoDel(f)), pasados.map(juegoDel), 'el juego nuevo cambió días pasados');
assert.ok(fechas(nuevo, 2 * (JUEGOS_DIA.length + 1)).some(f => conNuevo.juegoDel(f) === 'nuevo'), 'el juego nuevo no salió en los mazos siguientes');

// La racha
const d = { '2026-10-01': {}, '2026-10-02': {}, '2026-10-03': {}, '2026-10-05': {} };
assert.equal(racha(d, '2026-10-05'), 1, 'hoy jugó, ayer no');
assert.equal(racha(d, '2026-10-04'), 3, 'hoy todavía no juega: la de ayer sigue viva');
assert.equal(racha(d, '2026-10-07'), 0, 'dos días sin jugar: se cortó');
assert.equal(mejorRacha(d), 3);
assert.equal(mejorRacha({}), 0);

// Los comodines (D-230): uno cada 7 días jugados seguidos, hasta 2; un día sin jugar gasta uno
const seguidos = (desde, n) => Object.fromEntries(fechas(desde, n).map(f => [f, { j: 'reinas', s: 50 }]));
let rc = recorrer(seguidos('2026-10-01', 7), '2026-10-07');
assert.deepEqual([rc.racha, rc.comodines, rc.ganados], [7, 1, ['2026-10-07']], 'a los 7 días, un comodín');
rc = recorrer(seguidos('2026-10-01', 7), '2026-10-09');
assert.deepEqual([rc.racha, rc.comodines, rc.salvados], [7, 0, ['2026-10-08']], 'el 8 no jugó: gastó el comodín y la racha sigue (hoy, el 9, todavía no cuenta)');
rc = recorrer(seguidos('2026-10-01', 7), '2026-10-10');
assert.deepEqual([rc.racha, rc.mejor], [0, 7], 'dos días sin jugar y un solo comodín: se cortó');
rc = recorrer({ ...seguidos('2026-10-01', 7), ...seguidos('2026-10-09', 3) }, '2026-10-11');
assert.deepEqual([rc.racha, rc.salvados], [10, ['2026-10-08']], 'el día salvado no suma, pero la racha sigue');
rc = recorrer(seguidos('2026-09-01', 30), '2026-09-30');
assert.equal(rc.comodines, COMODINES_MAX, 'nunca más de 2');
rc = recorrer({ '2026-10-01': { j: 'x', s: 1 } }, '2026-10-03', { regalos: ['2026-10-01'] });
assert.deepEqual([rc.racha, rc.comodines, rc.salvados], [1, 0, ['2026-10-02']], 'un comodín por invitar salva un día');
rc = recorrer({}, '2026-10-03', { regalos: ['2026-10-01', '2026-10-02', '2026-10-02'] });
assert.equal(rc.comodines, 2, 'los regalos también respetan el tope');
assert.deepEqual(recorrer({}, '2026-10-05'), { racha: 0, comodines: 0, mejor: 0, salvados: [], ganados: [] });

// Los números de día y la semana de una fecha
assert.equal(numDia('2026-10-05'), 20731);
assert.equal(fechaDeNum(20731), '2026-10-05');
assert.equal(semanaDe('2026-10-05'), 's2026-41');
assert.equal(semanaDe('2026-10-04'), 's2026-40', 'el domingo es de la semana anterior');

// Juntar lo de Firebase con lo del celular: lo del celular manda
const sj = almacen();
anotar('2026-10-05', { j: 'reinas', s: 90, ms: 1 }, { storage: sj });
juntar({ dias: { '2026-10-05': { j: 'reinas', s: 10 }, '2026-10-04': { j: 'anio', s: 70, ms: 2 } }, regalos: ['2026-10-03'] }, { storage: sj });
assert.equal(leer(sj).dias['2026-10-05'].s, 90);
assert.equal(leer(sj).dias['2026-10-04'].s, 70);
assert.deepEqual(leer(sj).regalos, ['2026-10-03']);

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

// Dónde se juega (las carpetas, como las arma uno-al-dia-ui.js)
const slugs = Object.fromEntries([...GAMES.filter(g => !g.torneo).map(g => [g.id, g.path.replace(/\/$/, '')]), ...SUELTOS.map(g => [g.id, g.slug])]);
assert.equal(rutaDel('reinas', slugs), 'queens/?today');
assert.equal(rutaDel('linea', slugs, SLUGS_SIN_PAGINA), 'cup/suelto/?timeline-flash&today', 'en inglés también el juego (D-266)');
assert.equal(rutaDel('numero', slugs, SLUGS_SIN_PAGINA), 'cup/suelto/?number&today');
assert.equal(rutaDel('ahorcado', slugs), 'hangman/?today');
assert.equal(rutaDel('batalla-naval', slugs), 'battleship/?today');
assert.equal(rutaDel('dudo', slugs), 'liars-dice/?today');
assert.equal(rutaDel('generala', slugs), 'generala/?today');
for (const j of JUEGOS_DIA) assert.ok(slugs[j.id] || ['linea', 'numero'].includes(j.id), `${j.id}: sin página para jugarlo`);

// Dónde va en la portada: junto a La Copa (D-239), salvo que el link pida otra cosa con ?daily=
const sinQ = { search: '' };
assert.equal(formaAcceso({ loc: sinQ }), 'card');
assert.equal(formaAcceso({ loc: { search: '?daily=button' } }), 'button');
assert.equal(formaAcceso({ loc: { search: '?daily=otra' } }), 'card');
assert.equal(formaAcceso({ loc: { search: '?daily=off' } }), 'off', 'las capturas del README lo esconden');
assert.equal(formaAcceso({ loc: { search: '?uad=boton' } }), 'button', 'los links de antes de D-266 valen igual');
assert.equal(formaAcceso({ loc: { search: '?uad=no' } }), 'off');

// El azar del día: el mismo en todos los celulares, distinto para cada cosa que reparte
const tira = (r, n = 5) => Array.from({ length: n }, () => r());
assert.deepEqual(tira(azarDel('ABCDE', 'flota')), tira(azarDel('ABCDE', 'flota')));
assert.notDeepEqual(tira(azarDel('ABCDE', 'flota')), tira(azarDel('ABCDE', 'dudo:0:A')));
// La flota del celular de Batalla Naval: válida, y la misma con la misma semilla
const flota = randomLayout(10, azarDel(semillaDel(DESDE_GRUPO), 'flota'));
assert.ok(isValidLayout(flota), 'la flota del día es válida');
assert.deepEqual(randomLayout(10, azarDel(semillaDel(DESDE_GRUPO), 'flota')), flota, 'la flota del día es la misma para todos');
assert.notDeepEqual(randomLayout(10, azarDel(semillaDel(sumarDias(DESDE_GRUPO, 1)), 'flota')), flota, 'cada día, otra flota');

// Los puntajes de los juegos de grupo, de 0 a 100
assert.equal(puntajeAhorcado({ vidas: 6, total: 6 }), 100, 'sin errores, 100');
assert.equal(puntajeAhorcado({ vidas: 3, total: 6 }), 50);
assert.equal(puntajeAhorcado({ vidas: 1, total: 6 }), 17);
assert.equal(puntajeAhorcado({ vidas: 0, total: 6 }), 0, 'colgado, 0');
assert.equal(puntajeNaval({ gano: true, disparos: CASILLAS_FLOTA, aciertos: 17 }), 100, 'hundirla sin fallar, 100');
assert.equal(puntajeNaval({ gano: true, disparos: 100, aciertos: 17 }), 40, 'con todo el tablero, el mínimo al ganar');
assert.ok(puntajeNaval({ gano: true, disparos: 50, aciertos: 17 }) > puntajeNaval({ gano: true, disparos: 60, aciertos: 17 }), 'menos disparos, más puntos');
assert.equal(puntajeNaval({ gano: true, disparos: 50, aciertos: 17 }), 76);
assert.equal(puntajeNaval({ gano: false, disparos: 40, aciertos: 5 }), 30, 'perdiendo, 6 por casilla acertada');
assert.equal(puntajeNaval({ gano: false, disparos: 0, aciertos: 0 }), 0);
for (let a = 0; a <= 16; a++) assert.ok(puntajeNaval({ gano: false, disparos: 99, aciertos: a }) < 40, `perder con ${a} aciertos vale menos que ganar`);
assert.equal(puntajeDudo({ gano: true, dados: 5, rondas: 6 }), 100, 'ganar sin perder un dado, 100');
assert.equal(puntajeDudo({ gano: true, dados: 1, rondas: 9 }), 68, 'ganar con un dado, 68');
assert.equal(puntajeDudo({ gano: false, dados: 0, rondas: 3 }), 30, 'perdiendo, 10 por ronda aguantada');
assert.equal(puntajeDudo({ gano: false, dados: 0, rondas: 12 }), 50, 'hasta 50');
for (let r = 0; r < 20; r++) assert.ok(puntajeDudo({ gano: false, dados: 0, rondas: r }) < puntajeDudo({ gano: true, dados: 1, rondas: r }), 'perder vale menos que ganar');

// Los textos de Uno al día no repiten una clave: en un objeto, la segunda pisa a la primera sin aviso
// (pasó con `calendario`: el título del calendario del mes salía como el botón de otra cosa)
{
  const { readFile } = await import('node:fs/promises');
  const fuente = await readFile(new URL('./i18n.js', import.meta.url), 'utf8');
  for (const bloque of fuente.split('\n    uad: {').slice(1)) {
    const cuerpo = bloque.slice(0, bloque.indexOf('\n    },'));
    const claves = [...cuerpo.matchAll(/^      ([A-Za-zÀ-ÿ0-9_]+):/gm)].map(m => m[1]);
    const repetidas = claves.filter((k, n) => claves.indexOf(k) !== n);
    assert.deepEqual(repetidas, [], `textos de Uno al día con claves repetidas: ${repetidas}`);
  }
}

// The dice's faces carry a name in four languages without loading La Copa's rules (D-377): from
// games.js, or from the entry itself for the games only La Copa has, which must say what La Copa says
{
  const { juegosCopa } = await import('../../cup/rules.js');
  const { gameById } = await import('./games.js');
  for (const j of JUEGOS_DIA) {
    const name = gameById(j.id)?.name || j.name;
    for (const l of ['es', 'en', 'pt', 'de']) assert.ok(name?.[l], `${j.id} has its name in ${l} for the dice`);
    if (j.name) for (const l of ['es', 'en', 'pt', 'de']) assert.equal(j.name[l], juegosCopa(l)[j.id].nombre, `${j.id} is named as in La Copa (${l})`);
  }
}

// That no page but La Copa's own loads its rules or engine (D-377) is checked for every game in
// tools/e2e/scope.test.mjs (D-378)
console.log('uno-al-dia: ok');
