// Tests de los juegos de La Copa: node public/cup/games/juegos.test.mjs
import assert from 'node:assert/strict';
import { hash32, azar } from './semilla.js';
import * as numero from './number/engine.js';
import * as linea from './timeline/engine.js';
import * as anio from './year/engine.js';
import * as reinas from './queens/engine.js';
import * as tango from './tango/engine.js';
import * as zip from './zip/engine.js';
import * as desenredo from './untangle/engine.js';
import * as letras from './word/engine.js';
import { PALABRAS, PALABRAS_EN, PALABRAS_PT, PALABRAS_DE } from './word/palabras.js';
import * as conexiones from './connections/engine.js';
import * as final from './final/engine.js';
import * as donde from './where/engine.js';
import { CIUDADES } from './where/ciudades.js';
import { MAPA } from './where/mapa.js';
import { GRILLAS } from './connections/grillas.js';
import * as GRILLAS_MOD from './connections/grillas.js';
import * as GRILLAS_EN from './connections/grillas-en.js';
import * as GRILLAS_PT from './connections/grillas-pt.js';
import * as GRILLAS_DE from './connections/grillas-de.js';
import { PAISES, CIUDADES as NOMBRES_CIUDADES } from './where/nombres.js';
import { JUEGOS } from './index.js';
import { temasDeLaCopa } from './mazos.js';
import { camino } from './queens/ui.js';

let n = 0;
const test = (name, fn) => { try { fn(); n++; } catch (e) { console.error(`✗ ${name}`); throw e; } };
const CODIGOS = ['KQRST', 'ABCDE', 'ZZZZZ', 'MNPQR', 'HJKLM', 'WXYZA', 'BCDFG', 'TUVWX'];

test('semilla: determinista y distinta por día y por sal', () => {
  assert.equal(hash32('KQRST:1:x'), hash32('KQRST:1:x'));
  assert.notEqual(hash32('KQRST:1:x'), hash32('KQRST:2:x'));
  const a = azar('KQRST', 1, 'a'), b = azar('KQRST', 1, 'a');
  assert.deepEqual([a.real(), a.real()], [b.real(), b.real()]);
  const x = azar('KQRST', 1, 'a').barajar([1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(x.slice().sort(), [1, 2, 3, 4, 5, 6, 7, 8]);
});

test('número: cifras distintas, mismo para todos, puntaje de 10 a 0', () => {
  for (const c of CODIGOS) {
    const p = numero.generar(c, 2);
    assert.equal(p.secreto.length, 4);
    assert.equal(new Set(p.secreto).size, 4);
    assert.deepEqual(numero.generar(c, 2), p);
  }
  const p = { cifras: 4, secreto: '1234' };
  const e1 = numero.estado(p, ['1234']);
  assert.ok(e1.resuelto && e1.fin);
  assert.equal(numero.puntaje(e1), 100);
  const e2 = numero.estado(p, ['5678', '1243']);
  assert.equal(e2.fin, false);
  assert.equal(numero.tarjeta(e2), '⚪⚪⚪⚪\n🟢🟢🟡🟡');
  const e3 = numero.estado(p, Array(10).fill('5678'));
  assert.ok(e3.fin && !e3.resuelto);
  assert.equal(numero.puntaje(e3), 0);
  assert.equal(numero.puntaje(numero.estado(p, [...Array(9).fill('5678'), '1234'])), 10);
});

test('temas: línea, años y final distintos', () => {
  for (const c of CODIGOS) {
    const t = temasDeLaCopa(c);
    assert.equal(new Set([t.linea, t.anio, t.final]).size, 3);
  }
});

test('línea: 10 cartas de años separados, jugadas en cualquier orden', () => {
  for (const c of CODIGOS) {
    const p = linea.generar(c, 1);
    const todas = [p.base, ...p.mano];
    assert.equal(todas.length, 10);
    const ys = todas.map(x => x.year).sort((a, b) => a - b);
    for (let i = 1; i < ys.length; i++) assert.ok(ys[i] - ys[i - 1] >= 2, `${c} ${ys}`);
    assert.ok(todas.every(x => x.texto && x.emoji));
  }
  // El modo solo de Línea de Tiempo deja fuera las cartas vistas hace poco (D-34, D-142);
  // sin `excluir`, la copa reparte exactamente lo mismo que antes
  const br = linea.generar('KQRST', 1, { tema: 'brasil', lang: 'pt' });
  assert.equal(br.tema, 'brasil');
  assert.deepEqual(linea.generar('KQRST', 1, { tema: 'brasil', lang: 'pt', excluir: [] }), br);
  const ids = [br.base, ...br.mano].map(x => x.id);
  const otra = linea.generar('KQRST', 1, { tema: 'brasil', excluir: ids });
  assert.equal(otra.mano.length, 9);
  assert.ok([otra.base, ...otra.mano].every(x => !ids.includes(x.id)));
  const p = { base: { id: 'b', year: 1950 }, mano: [{ id: 'x', year: 1900 }, { id: 'y', year: 2000 }, { id: 'z', year: 1960 }] };
  // Primero la de 2000 (bien, al final), después 1960 mal puesta al principio, después 1900 bien
  const e = linea.estado(p, [{ c: 'y', at: 1 }, { c: 'z', at: 0 }, { c: 'x', at: 0 }]);
  assert.deepEqual(e.marcas, [true, false, true]);
  assert.deepEqual(e.linea.map(x => x.year), [1900, 1950, 1960, 2000]);
  assert.ok(e.fin && !e.mano.length);
  assert.equal(linea.puntaje(e), 67); // 2 de 3, de 0 a 100 (D-113)
  assert.equal(linea.tarjeta(e), '🟩🟥🟩');
  assert.equal(e.historia[1].entre[0].year, 1950); // la 1960 iba después de 1950
  // Una carta repetida o que no está en la mano no cuenta
  assert.equal(linea.estado(p, [{ c: 'y', at: 1 }, { c: 'y', at: 0 }, { c: 'nada', at: 0 }]).marcas.length, 1);
});

test('año: margen según antigüedad y puntos', () => {
  assert.equal(anio.puntos(1990, 1990), 100);
  assert.equal(anio.margen(1990), 9);
  assert.equal(anio.puntos(1990, 1999), 0);
  assert.ok(anio.puntos(476, 500) > 80);
  assert.equal(anio.puntos(-2560, -2560), 100);
  assert.equal(anio.puntos(1990, 'x'), 0);
  assert.equal(anio.marca(1990, 1990), '🎯');
  assert.equal(anio.marca(1990, 1991), '🟩');
  assert.equal(anio.marca(1990, 2030), '⬛');
  const p = anio.generar('KQRST', 6);
  assert.equal(p.hitos.length, 6);
  assert.notEqual(p.tema, linea.generar('KQRST', 1).tema);
  const e = anio.estado(p, p.hitos.map(h => h.year));
  assert.ok(e.fin);
  assert.equal(anio.puntaje(e), 100); // el promedio de los seis, de 0 a 100 (D-113)
  assert.equal(anio.anioLabel(-44), '44 a. C.');
});

test('dónde queda: distancia, puntos y marcas', () => {
  // Santiago–Buenos Aires son unos 1.140 km
  const km = donde.distancia([-33.45, -70.67], [-34.60, -58.38]);
  assert.ok(km > 1100 && km < 1180, String(km));
  assert.equal(donde.distancia([10, 20], [10, 20]), 0);
  // Por el lado corto: de un lado al otro de la línea de cambio de fecha hay poco
  assert.ok(donde.distancia([-18, 179.5], [-18, -179.5]) < 120);
  assert.equal(donde.puntos(0), 100);
  assert.equal(donde.puntos(500), 80);   // 4 puntos por cada 100 km
  assert.equal(donde.puntos(2500), 0);
  assert.equal(donde.puntos(9000), 0);
  assert.equal(donde.puntos(NaN), 0);
  assert.equal(donde.marca(20), '🎯');
  assert.equal(donde.marca(400), '🟩');
  assert.equal(donde.marca(1000), '🟨');
  assert.equal(donde.marca(1900), '🟧');
  assert.equal(donde.marca(3000), '⬛');
  assert.equal(donde.km(1250), '1.250 km');
  assert.equal(donde.nombre({ ciudad: 'Valparaíso', pais: 'Chile' }), 'Valparaíso, Chile');
  assert.equal(donde.nombre({ ciudad: 'Singapur', pais: 'Singapur' }), 'Singapur');
});

test('dónde queda: el globo va y vuelve', () => {
  const centros = [[10, -40], [-33, -70], [60, 100], [0, 180], [-80, 20]];
  for (const c of centros) for (const [lat, lon] of [[-33.45, -70.67], [64.15, -21.94], [1.29, 103.85], [0, 0], [-41.29, 174.78], [-18.14, 178.44]]) {
    const [x, y, prof] = donde.ver(donde.vector(lat, lon), c);
    if (prof <= 0) continue;
    const [la, lo] = donde.tocado(x, y, c);
    assert.ok(Math.abs(la - lat) < 1e-9 && Math.abs(((lo - lon + 540) % 360) - 180) < 1e-9, `${lat},${lon} desde ${c} → ${la},${lo}`);
  }
  // El centro de la vista se ve en el medio, de frente; lo de las antípodas no se ve
  assert.deepEqual(donde.ver(donde.vector(-33, -70), [-33, -70]).map(n => Math.round(n * 1e9) / 1e9), [0, 0, 1]);
  assert.ok(donde.ver(donde.vector(33, 110), [-33, -70])[2] < 0);
  assert.equal(donde.tocado(0.8, 0.8, [0, 0]), null);
  // El punto medio queda a la misma distancia de los dos
  const m = donde.medio([-33.45, -70.67], [52.37, 4.9]);
  assert.ok(Math.abs(donde.distancia(m, [-33.45, -70.67]) - donde.distancia(m, [52.37, 4.9])) < 1);
  assert.match(MAPA.d, /^M-?\d+ -?\d+l/);
});

test('dónde queda: todos los países del mundo, sin repetir ni equivocar', () => {
  const capitales = CIUDADES.filter(c => c.capital);
  // Los 193 de la ONU y sus dos observadores (el Vaticano y Palestina)
  assert.equal(capitales.length, 195);
  assert.equal(new Set(capitales.map(c => c.pais)).size, 195);
  assert.equal(new Set(capitales.map(c => c.iso)).size, 195);
  assert.equal(new Set(CIUDADES.map(c => `${c.ciudad}|${c.pais}`)).size, CIUDADES.length, 'ciudad repetida');
  // Las que decidió el dueño
  assert.equal(capitales.find(c => c.pais === 'Bolivia').ciudad, 'La Paz');
  assert.equal(capitales.find(c => c.pais === 'Países Bajos').ciudad, 'Ámsterdam');
  for (const c of CIUDADES) {
    assert.ok([1, 2, 3].includes(c.nivel), c.ciudad);
    assert.ok(c.lat > -90 && c.lat < 90 && c.lon >= -180 && c.lon <= 180, c.ciudad);
    assert.match(c.iso, /^\d{3}$/, c.ciudad);
    assert.ok(!/'/.test(c.ciudad + c.pais) || /'s$/.test(c.ciudad), `${c.ciudad}: apóstrofo recto`);
  }
  // Cada país tiene una sola capital y cada ciudad de un país con capital usa el mismo nombre de país
  const paises = new Set(capitales.map(c => c.pais));
  for (const c of CIUDADES) assert.ok(paises.has(c.pais), `${c.ciudad}: país "${c.pais}" sin capital`);
  for (const n of [1, 2, 3]) assert.ok(CIUDADES.filter(c => c.nivel === n).length >= 40, `pocas de nivel ${n}`);
});

test('dónde queda: cada ciudad cae sobre tierra dibujada en el mapa', () => {
  // Lo que se dibuja, no los bordes originales: una simplificación mal hecha borró Nueva Zelanda y Japón
  const anillos = MAPA.d.split('z').filter(Boolean).map(p => {
    const n = p.match(/-?\d+/g).map(Number);
    let x = n[0], y = n[1];
    const r = [[x, y]];
    for (let k = 2; k < n.length; k += 2) { x += n[k]; y += n[k + 1]; r.push([x, y]); }
    return r;
  });
  const dentro = ([px, py], r) => {
    let si = false;
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const [xi, yi] = r[i], [xj, yj] = r[j];
      if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) si = !si;
    }
    return si;
  };
  const aLaCosta = ([px, py], r) => {
    let min = Infinity;
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const [ax, ay] = r[j], [bx, by] = r[i], dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
      const t = L ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L)) : 0;
      min = Math.min(min, Math.hypot(px - ax - t * dx, py - ay - t * dy));
    }
    return min;
  };
  const lejos = [];
  for (const c of CIUDADES) {
    const ps = [0, 3600, -3600].map(k => [c.lon * donde.UNIDADES_POR_GRADO + k, c.lat * donde.UNIDADES_POR_GRADO]);
    if (anillos.some(r => ps.some(p => dentro(p, r)))) continue;
    // Una ciudad en la costa puede quedar un poco al agua por la simplificación: hasta 0,2° (unos 20 km)
    const d = Math.min(...anillos.map(r => aLaCosta(ps[0], r))) / donde.UNIDADES_POR_GRADO;
    if (d > 0.2) lejos.push(`${c.ciudad} (${d.toFixed(2)}°)`);
  }
  assert.deepEqual(lejos, [], `ciudades en el agua: ${lejos.join(', ')}`);
});

test('dónde queda: cinco ciudades, de la fácil a la difícil, de países distintos', () => {
  for (const c of CODIGOS) for (let d = 1; d <= 7; d++) {
    const p = donde.generar(c, d);
    assert.deepEqual(p, donde.generar(c, d));
    assert.equal(p.ciudades.length, donde.CIUDADES_POR_JUEGO);
    assert.deepEqual(p.ciudades.map(x => x.nivel), donde.NIVELES);
    assert.equal(new Set(p.ciudades.map(x => x.pais)).size, 5);
  }
  assert.notDeepEqual(donde.generar('KQRST', 1), donde.generar('KQRST', 2));
  const p = donde.generar('KQRST', 3);
  // Acertar todas es 100; una jugada guardada vale lo mismo al recargar
  const e = donde.estado(p, p.ciudades.map(c => donde.jugada(c.lat, c.lon)));
  assert.ok(e.fin);
  assert.equal(donde.puntaje(e), 100);
  assert.equal(donde.tarjeta(e), '🎯🎯🎯🎯🎯');
  const lejos = donde.estado(p, p.ciudades.map(c => [-c.lat, c.lon > 0 ? c.lon - 180 : c.lon + 180]));
  assert.equal(donde.puntaje(lejos), 0);
  const medio = donde.estado(p, [[p.ciudades[0].lat, p.ciudades[0].lon]]);
  assert.ok(!medio.fin);
  assert.equal(medio.actual, p.ciudades[1]);
  assert.equal(donde.puntaje(medio), 100);
});

test('grillas: 12, bien formadas', () => {
  assert.ok(GRILLAS.length >= 12);
  assert.equal(new Set(GRILLAS.map(g => g.id)).size, GRILLAS.length);
  for (const g of GRILLAS) {
    assert.equal(g.grupos.length, 4, g.id);
    const todas = g.grupos.flatMap(x => x.palabras);
    assert.equal(todas.length, 16, g.id);
    assert.equal(new Set(todas).size, 16, `${g.id}: palabra repetida`);
    for (const w of todas) {
      assert.equal(w, w.toLocaleUpperCase('es'), `${g.id}: ${w} no va en mayúsculas`);
      assert.ok(w.length <= 14, `${g.id}: ${w} es muy larga`);
    }
    assert.ok(g.grupos.every(x => x.nombre && x.nombre.length <= 40), g.id);
  }
});

test('conexiones: aciertos, errores, a una y puntaje', () => {
  const p = conexiones.generar('KQRST', 3);
  assert.equal(p.orden.length, 16);
  assert.deepEqual(conexiones.generar('KQRST', 3), p);
  const [g0, g1, g2, g3] = p.grupos.map(g => g.palabras);
  const mal = [g0[0], g0[1], g0[2], g1[0]];
  assert.ok(conexiones.aUna(p, mal));
  assert.ok(!conexiones.aUna(p, [g0[0], g0[1], g1[0], g1[1]]));
  let e = conexiones.estado(p, [mal, g0, mal]); // el repetido no cuenta
  assert.equal(e.errores, 1);
  assert.deepEqual(e.resueltos, [0]);
  assert.equal(e.restantes.length, 12);
  e = conexiones.estado(p, [mal, g0, g1, g2, g3]);
  assert.ok(e.fin && !e.perdio);
  assert.equal(conexiones.puntaje(e), 95);
  assert.equal(conexiones.tarjeta(e).split('\n')[0], '🟨🟨🟨🟩');
  const m2 = [g2[0], g3[0], g2[1], g3[1]];
  const m3 = [g2[0], g3[0], g2[2], g3[2]];
  const m4 = [g2[0], g3[0], g2[3], g3[3]];
  e = conexiones.estado(p, [g0, mal, m2, m3, m4]);
  assert.ok(e.fin && e.perdio);
  assert.equal(conexiones.puntaje(e), 5);
  assert.ok(conexiones.repetido([mal], mal.slice().reverse()));
});

test('reinas: solución única, reglas y puntaje', () => {
  for (const c of CODIGOS) for (const n of [8, 6]) {
    const p = reinas.generar(c, 4, { n });
    assert.equal(reinas.resolver(p, 3), 1, `${c} ${n}`);
    assert.equal(new Set(p.zonas).size, n);
    // la solución cumple: una por fila, columna y zona, sin tocarse
    const marcas = new Array(n * n).fill(reinas.VACIO);
    p.sol.forEach((col, r) => { marcas[r * n + col] = reinas.REINA; });
    assert.ok(reinas.resuelto(p, marcas));
  }
  const p = reinas.generar('KQRST', 4);
  const toques = i => [reinas.toque(i)]; // un toque pone la reina (D-103, D-167)
  const bien = p.sol.flatMap((col, r) => toques(r * p.n + col));
  let e = reinas.estado(p, bien);
  assert.ok(e.fin); assert.equal(e.errores, 0); assert.equal(reinas.puntaje({ ...e, ms: 20000 }), 100);
  // una reina al lado de otra es un error
  const c0 = p.sol[0], vecina = 1 * p.n + (c0 === 0 ? 1 : c0 - 1);
  e = reinas.estado(p, [...toques(c0), ...toques(vecina)]);
  assert.equal(e.errores, 1);
  assert.ok(e.conflictos.has(vecina));
  // Puntúa el tiempo, no los errores (D-107): 100 hasta 30 s, parejo hasta 10 a los 5 min
  assert.equal(reinas.puntaje({ fin: true, errores: 12, ms: 25000 }), 100);
  assert.equal(reinas.puntaje({ fin: true, errores: 0, ms: 165000 }), 55);
  assert.equal(reinas.puntaje({ fin: true, errores: 0, ms: 300000 }), 10);
  assert.equal(reinas.puntaje({ fin: true, errores: 0, ms: 900000 }), 10);
  assert.equal(reinas.puntaje({ fin: false, errores: 0, ms: 1000 }), 0);
  assert.equal(reinas.tarjeta({ fin: true, ms: 83000 }), '👑 ⏱ 1:23 ✅');
  // Rendirse termina con la solución a la vista y 0 puntos, también en la final (D-110)
  const r = reinas.estado(p, [0, reinas.RENDIRSE]);
  assert.ok(r.fin && r.rendido); assert.equal(r.marcas.filter(v => v === reinas.REINA).length, p.n);
  assert.equal(reinas.puntaje({ ...r, ms: 1000 }), 0);
  assert.equal(final.puntosRonda.reinas(r), 0);
  assert.equal(reinas.tarjeta(r), '👑 🏳️');
  // Arrastrar pinta X: el arrastre rápido no salta casillas (D-166)
  assert.deepEqual(camino(8, 0, 7), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(camino(8, 7, 4), [6, 5, 4]);
  assert.deepEqual(camino(8, 3, 27), [11, 19, 27]);
  assert.deepEqual(camino(8, 0, 18), [9, 18]);
  assert.deepEqual(camino(8, 5, 5), []);
  // El toque largo pone y saca la X, y no cuenta como error ni como reina
  e = reinas.estado(p, [reinas.toqueLargo(5), reinas.toqueLargo(6), reinas.toqueLargo(6)]);
  assert.equal(e.marcas[5], reinas.MARCA); assert.equal(e.marcas[6], reinas.VACIO); assert.equal(e.errores, 0);
  // El toque cicla vacía → reina → X → vacía (D-167); la reina que pasa a X no es error
  const ciclo = k => reinas.estado(p, Array(k).fill(reinas.toque(5))).marcas[5];
  assert.deepEqual([0, 1, 2, 3, 4].map(ciclo), [reinas.VACIO, reinas.REINA, reinas.MARCA, reinas.VACIO, reinas.REINA]);
  assert.equal(reinas.estado(p, [reinas.toqueLargo(5), reinas.toque(5)]).marcas[5], reinas.VACIO);
  e = reinas.estado(p, [...toques(c0), ...toques(vecina), ...toques(vecina), ...toques(vecina), ...toques(vecina)]);
  assert.equal(e.errores, 2); assert.equal(e.marcas[vecina], reinas.REINA);
  // Borrar todo deja el tablero en blanco; los errores quedan y se puede seguir jugando (D-169)
  e = reinas.estado(p, [...toques(c0), ...toques(vecina), reinas.toqueLargo(5), reinas.BORRAR]);
  assert.ok(e.marcas.every(v => v === reinas.VACIO)); assert.equal(e.errores, 1); assert.ok(!e.fin);
  e = reinas.estado(p, [...toques(c0), reinas.BORRAR, ...bien]);
  assert.ok(e.fin); assert.equal(e.errores, 0);
  // Las partidas de antes de D-167 guardaban el toque como el índice: pone o saca la reina
  e = reinas.estado(p, [reinas.toqueLargo(5), 5]);
  assert.equal(e.marcas[5], reinas.REINA);
  assert.equal(reinas.estado(p, [5, 5]).marcas[5], reinas.VACIO);
  assert.equal(reinas.estado(p, [c0, vecina]).errores, 1);
});

test('tango: solución única, reglas y puntaje', () => {
  for (const c of CODIGOS) {
    const p = tango.generar(c, 4);
    assert.equal(tango.resolver(p, 3), 1, c);
    assert.equal(tango.violaciones(p, p.sol).size, 0);
    for (const [i, v] of Object.entries(p.dadas)) assert.equal(p.sol[i], v);
  }
  const p = tango.generar('KQRST', 4);
  const jugadas = [];
  p.sol.forEach((v, i) => { if (!tango.esDada(p, i)) { jugadas.push(i); if (v === tango.LUNA) jugadas.push(i); } });
  const e = tango.estado(p, jugadas);
  assert.ok(e.fin); assert.equal(tango.puntaje(e), 100);
  // Borrar todo deja solo las dadas; una pista revela una casilla correcta, fija, y cuesta 15
  const conPista = tango.estado(p, [jugadas[0], tango.BORRAR, { h: tango.pista(p, tango.inicial(p)) }]);
  assert.equal(conPista.pistas, 1);
  assert.equal(conPista.g.filter(Boolean).length, Object.keys(p.dadas).length + 1);
  const fija = [...conPista.fijas][0];
  assert.equal(conPista.g[fija], p.sol[fija]);
  assert.equal(tango.estado(p, [{ h: fija }, fija]).g[fija], p.sol[fija]);   // la revelada no se toca
  assert.equal(tango.puntaje({ fin: true, errores: 1, pistas: 2 }), 60);
  // La pista arregla primero una casilla mal puesta
  const mal = tango.inicial(p); const libre = p.sol.findIndex((v, i) => p.dadas[i] === undefined);
  mal[libre] = p.sol[libre] === tango.SOL ? tango.LUNA : tango.SOL;
  assert.equal(tango.pista(p, mal), libre);
  // tres soles seguidos rompen la regla
  const g = new Array(36).fill(tango.VACIO); g[0] = g[1] = g[2] = tango.SOL;
  assert.ok(tango.violaciones({ n: 6, marcas: [] }, g).has(0));
  // El choque del último toque queda pendiente: contado, pero se perdona si se vuelve a esa
  // casilla, y deja de estar pendiente al tocar otra (#135). La pantalla lo marca recién ahí.
  assert.equal(e.pendiente, -1);
  const L = p.sol.map((v, i) => i).filter(i => !tango.esDada(p, i));
  const choca = (pre, i) => p.sol[i] === tango.LUNA && tango.estado(p, [...pre, i]).mal.size > tango.estado(p, pre).mal.size;
  const paso = L.find(i => choca([], i));
  assert.ok(paso !== undefined);
  const otra = L.find(i => i !== paso);
  const ahora = tango.estado(p, [paso]);
  assert.equal(ahora.pendiente, paso); assert.equal(ahora.errores, 1);
  assert.equal(tango.estado(p, [paso, paso]).errores, 0);   // el sol de paso a la luna no cuenta
  const dejado = tango.estado(p, [paso, otra]);
  assert.equal(dejado.errores, 1 + (dejado.pendiente >= 0 ? 1 : 0)); assert.notEqual(dejado.pendiente, paso);
});

test('zip: solución única, trazo y niveles', () => {
  for (const c of CODIGOS) {
    const p = zip.generar(c, 4);
    assert.equal(zip.resolver(p, 3), 1, c);
    assert.ok(zip.valido(p, p.sol));
    assert.ok(Object.keys(p.numeros).length <= 16, `${c}: demasiados números`);
  }
  const p = zip.generar('KQRST', 4);
  assert.ok(zip.estado(p, p.sol).fin);
  assert.ok(!zip.valido(p, p.sol.slice(1)));          // no parte en el 1
  assert.ok(!zip.puedeIr(p, p.sol.slice(0, 3), p.sol[0])); // no se vuelve a pisar
  // Llegar al último número sin pasar por todas: se avisa cuántas faltan y no se sigue
  const q = { n: 3, numeros: { 0: 1, 2: 2 } };        // 1 arriba a la izquierda, 2 arriba a la derecha
  const corto = [0, 1, 2];
  assert.equal(zip.estado(q, corto).faltan, 6);
  assert.ok(!zip.puedeIr(q, corto, 5));
  // Los niveles: los mismos para todos, del más chico al más grande
  assert.deepEqual(zip.nivel('KQRST', 1, 0), zip.nivel('KQRST', 1, 0));
  assert.equal(zip.nivel('KQRST', 1, 0).n, 4);
  assert.equal(zip.nivel('KQRST', 1, 20).n, 7);
  for (let k = 1; k < zip.TAMANOS.length; k++) assert.ok(zip.TAMANOS[k] >= zip.TAMANOS[k - 1]);
  assert.equal(zip.puntaje({ hechos: 4 }), 40);
  assert.equal(zip.puntaje({ hechos: 14 }), 100);
  assert.equal(zip.TIEMPO_MS, 180000);
});

test('desenredo: siempre tiene solución, empieza enredado y los niveles crecen (D-179)', () => {
  const D = desenredo;
  for (const c of CODIGOS) for (let k = 0; k < D.NIVELES; k++) {
    const p = D.nivel(c, 3, k);
    assert.equal(p.n, D.NUDOS[k], `${c} nivel ${k}`);
    assert.equal(p.sol.length, p.n); assert.equal(p.inicio.length, p.n);
    assert.ok(D.resuelto(p, p.sol), `${c} nivel ${k}: la solución tiene cruces`);
    assert.ok(D.cruces(p.hilos, p.inicio).total >= Math.min(5, p.hilos.length / 2), `${c} nivel ${k}: empieza casi resuelto`);
    // Todo en enteros y adentro del tablero
    for (const q of [...p.sol, ...p.inicio]) assert.deepEqual(D.dentro(q), q);
    // Ningún nudo con menos de dos hilos ni hilos repetidos
    const grado = new Array(p.n).fill(0);
    for (const [a, b] of p.hilos) { grado[a]++; grado[b]++; }
    assert.ok(grado.every(g => g >= 2), `${c} nivel ${k}: nudo suelto`);
    assert.equal(new Set(p.hilos.map(h => h.join('-'))).size, p.hilos.length);
  }
  // El mismo para todos, distinto por día
  assert.deepEqual(D.generar('KQRST', 1, { n: 9 }), D.generar('KQRST', 1, { n: 9 }));
  assert.notDeepEqual(D.generar('KQRST', 1, { n: 9 }).inicio, D.generar('KQRST', 2, { n: 9 }).inicio);
  for (let k = 1; k < D.NIVELES; k++) assert.ok(D.NUDOS[k] > D.NUDOS[k - 1]);
});

test('desenredo: qué cuenta como cruce', () => {
  const { seCruzan, cruces } = desenredo;
  assert.ok(seCruzan([0, 0], [10, 10], [0, 10], [10, 0]));     // una X
  assert.ok(!seCruzan([0, 0], [10, 0], [0, 5], [10, 5]));      // paralelos
  assert.ok(seCruzan([0, 0], [10, 0], [5, 0], [20, 0]));       // encimados en la misma recta
  assert.ok(seCruzan([0, 0], [10, 0], [5, 0], [5, 9]));        // uno termina sobre el otro
  assert.ok(!seCruzan([0, 0], [10, 0], [11, 0], [20, 0]));     // en la misma recta, sin tocarse
  // Hilos con un nudo en común no se cuentan entre sí
  assert.equal(cruces([[0, 1], [0, 2]], [[0, 0], [100, 0], [0, 100]]).total, 0);
  // Un hilo encima de un nudo ajeno cuenta, aunque no cruce ningún otro hilo
  const c = cruces([[0, 1], [2, 3]], [[0, 0], [200, 0], [100, 5], [100, 300]]);
  assert.deepEqual(c.encima, [[2, 0]]);
  assert.equal(c.total, 1);
  // Amontonar los nudos no resuelve nada (la trampa clásica)
  const p = desenredo.nivel('KQRST', 1, 4);
  assert.ok(cruces(p.hilos, p.sol.map(() => [500, 500])).total > 0);
});

test('desenredo: la cuerda es una curva leve, fija para cada hilo (D-182)', () => {
  const { cuerda, trazoCuerda, ONDA, ONDA_MAX } = desenredo;
  const bez = (a, [c1, c2], b, t) => [0, 1].map(k => (1 - t) ** 3 * a[k] + 3 * (1 - t) ** 2 * t * c1[k] + 3 * (1 - t) * t * t * c2[k] + t ** 3 * b[k]);
  for (let sem = 0; sem < 200; sem++) {
    const a = [100 + sem, 200], b = [800, 300 + 2 * sem];
    const c = cuerda(a, b, sem);
    let lejos = 0;
    for (let t = 0; t <= 1; t += 0.05) lejos = Math.max(lejos, desenredo.distancia(bez(a, c, b, t), a, b));
    // Se aparta poco de la recta: lo que se ve es lo que se cuenta como cruce
    assert.ok(lejos <= Math.min(ONDA_MAX, ONDA * Math.hypot(b[0] - a[0], b[1] - a[1])) + 0.5, `semilla ${sem}: ${lejos}`);
    assert.deepEqual(cuerda(a, b, sem), c);
  }
  // Hay de las dos formas, en S y en arco
  const formas = new Set(Array.from({ length: 40 }, (_, s) => {
    const [c1, c2] = cuerda([0, 0], [900, 0], s); return Math.sign(c1[1]) === Math.sign(c2[1]) ? 'arco' : 'ese';
  }));
  assert.equal(formas.size, 2);
  assert.match(trazoCuerda([0, 0], [900, 0], 3), /^M0 0(C[-\d. ]+)+ 900 0$/);
});

test('desenredo: la segunda onda de la cuerda, chica y apagada en las puntas (D-183)', () => {
  const { puntosCuerda, ONDA, ONDA_MAX, ONDA2_MAX } = desenredo;
  for (let sem = 0; sem < 200; sem++) {
    const a = [60 + 3 * sem, 120], b = [900, 200 + 3 * sem];
    const P = puntosCuerda(a, b, sem), L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    // Nace y termina justo en los nudos
    assert.deepEqual(P[0].map(Math.round), a); assert.deepEqual(P.at(-1).map(Math.round), b);
    // Con las dos ondas sigue cerca de la recta: los cruces se cuentan sobre ella
    const lejos = Math.max(...P.map(p => desenredo.distancia(p, a, b)));
    assert.ok(lejos <= Math.min(ONDA_MAX, ONDA * L) + ONDA2_MAX + 0.5, `semilla ${sem}: ${lejos}`);
    assert.deepEqual(puntosCuerda(a, b, sem), P);
  }
  // La segunda onda se nota: la cuerda no es la misma curva lisa de antes
  const liso = puntosCuerda([0, 0], [900, 0], 4, { onda2: 0 }), ondulado = puntosCuerda([0, 0], [900, 0], 4);
  assert.ok(Math.max(...liso.map((p, i) => Math.abs(p[1] - ondulado[i][1]))) > 3);
});

test('desenredo: puntaje, tarjeta y fin de la partida', () => {
  const D = desenredo;
  assert.equal(D.puntaje({ hechos: 0 }), 0);
  assert.equal(D.puntaje({ hechos: 7 }), 70);
  assert.equal(D.puntaje({ hechos: 10 }), 100);
  assert.equal(D.tarjeta({ hechos: 3 }), '🧶 🟩🟩🟩');
  assert.equal(D.tarjeta({ hechos: 0 }), '🧶 ⬛');
  assert.ok(D.finPartida({ hechos: 10, usado: 1000 }));
  assert.ok(D.finPartida({ hechos: 2, usado: D.TIEMPO_MS }));
  assert.ok(!D.finPartida({ hechos: 9, usado: D.TIEMPO_MS - 1 }));
});

test('sesión de prueba: otro contenido que el del día (D-103)', async () => {
  const { JUEGOS, codigoEnsayo } = await import('./index.js');
  for (const c of CODIGOS) {
    assert.notEqual(codigoEnsayo(c), c);
    assert.match(codigoEnsayo(c), /^[A-HJ-NP-Z]{5}$/);
    const real = JUEGOS.linea.generar(c, 1), prueba = JUEGOS.linea.ensayo(c, 1);
    assert.notEqual(prueba.tema, real.tema);
    assert.notEqual(JUEGOS.anio.ensayo(c, 6).tema, JUEGOS.anio.generar(c, 6).tema);
    assert.equal(JUEGOS.conexiones.ensayo(c, 3).id, 'ensayo');
    assert.notEqual(JUEGOS.letras.ensayo(c, 5).secreto, JUEGOS.letras.generar(c, 5).secreto);
    assert.equal(JUEGOS.zip.ensayo(c, 1).tiempo, 60000);
    const dia = JUEGOS.donde.generar(c, 1).ciudades.map(x => x.ciudad);
    assert.ok(JUEGOS.donde.ensayo(c, 1).ciudades.every(x => !dia.includes(x.ciudad)));
    for (const id of Object.keys(JUEGOS)) assert.ok(JUEGOS[id].ensayo, `${id} sin sesión de prueba`);
  }
});

test('letras: palabras válidas, pistas por letra y puntaje', () => {
  assert.ok(PALABRAS.length >= 100);
  assert.equal(new Set(PALABRAS).size, PALABRAS.length);
  for (const w of PALABRAS) assert.ok(letras.valido(w), w);
  const p = letras.generar('KQRST', 5);
  assert.ok(PALABRAS.includes(p.secreto));
  assert.deepEqual(letras.generar('KQRST', 5), p);
  const r = letras.responder('CAMPO', 'MANGO');
  assert.deepEqual(r.marcas, ['-', 'f', 't', '-', 'f']); // la A y la O en su lugar, la M en otro
  assert.equal(r.famas, 2); assert.equal(r.toques, 1);
  assert.ok(!letras.valido('CASAS'));
  const e = letras.estado({ ...p, secreto: 'MANGO' }, ['CAMPO', 'MANGO']);
  assert.ok(e.resuelto && e.fin);
  // CAMPO encuentra A y O en su lugar; MANGO la saca en 2: 5 letras × 10 + 50 − 5 = 95 (D-108)
  assert.equal(e.encontradas, 5);
  assert.equal(letras.puntaje(e), 95);
  // Quien se acercó gana más que quien no, y una fama repetida no suma de nuevo
  const cerca = letras.estado({ ...p, secreto: 'MANGO' }, ['CAMPO', 'CAMPO', 'TANGO']);
  assert.equal(cerca.encontradas, 4); assert.equal(letras.puntaje(cerca), 40);
  const lejos = letras.estado({ ...p, secreto: 'MANGO' }, ['CAMPO']);
  assert.equal(letras.puntaje(lejos), 20);
  assert.equal(letras.puntaje(letras.estado({ ...p, secreto: 'MANGO' }, ['MANGO'])), 100);
  assert.ok(letras.puntaje({ encontradas: 5, resuelto: true, usados: 8 }) > letras.puntaje({ encontradas: 5, resuelto: false, usados: 8 }));
  assert.equal(letras.tarjeta(e).split('\n')[1], '🟨🟨🟨🟨🟨');
});

test('final: cinco rondas, promedio de 0 a 100', () => {
  const p = final.generar('KQRST', 7);
  assert.equal(p.linea.mano.length, 3);
  assert.equal(p.numero.secreto.length, 3);
  assert.equal(p.reinas.n, 6);
  assert.equal(p.letras.max, 6);
  assert.equal(p.anio.hitos.length, 2);
  const lineaPerfecta = (() => { let j = []; for (const c of p.linea.mano) { const l = linea.estado(p.linea, j).linea; j = [...j, { c: c.id, at: linea.huecoCorrecto(l, c) }]; } return linea.estado(p.linea, j); })();
  const perfecto = {
    linea: lineaPerfecta,
    numero: numero.estado(p.numero, [p.numero.secreto], final.NUMERO_INTENTOS),
    reinas: { fin: true, errores: 0 },
    letras: letras.estado(p.letras, [p.letras.secreto]),
    anio: anio.estado(p.anio, p.anio.hitos.map(h => h.year)),
  };
  assert.equal(final.puntaje(perfecto), 100);
  assert.equal(final.puntaje({}), 0);
  assert.equal(final.tarjeta(perfecto), '⏳100 🔢100 👑100 🔤100 📅100');
});

// El desglose del puntaje explica la cuenta con frases completas (D-106)
{
  const { desglose } = await import('../desglose.js');
  const { LOCALES } = await import('../rules.js');
  const T = LOCALES.es;
  const fmt = (t, v) => t.replace(/\{(\w+)\}/g, (_, k) => v[k]);
  const mmss = ms => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;
  const pa = anio.generar('KQRST', 3);
  const casos = {
    numero: numero.estado(numero.generar('KQRST', 2), ['1234', numero.generar('KQRST', 2).secreto]),
    conexiones: { resueltos: [0, 1, 2], errores: 2 },
    reinas: { fin: true, errores: 1, ms: 83000 },
    tango: { fin: true, errores: 2, pistas: 1 },
    zip: { hechos: 3, ultimo: 125000 },
    desenredo: { hechos: 4, ultimo: 151000 },
    anio: anio.estado(pa, pa.hitos.map(h => h.year + 3)),
    final: { reinas: { fin: true, errores: 0 } },
  };
  for (const [id, e] of Object.entries(casos)) {
    const l = desglose(id, e, { T, fmt, mmss });
    assert.ok(l.length && l.every(x => typeof x === 'string' && x.length > 10 && !x.includes('{') && !x.includes('undefined')), id);
  }
  assert.match(desglose('tango', casos.tango, { T, fmt, mmss }).join(' '), /se restan 20 .*1 pista, que resta 15/);
  assert.match(desglose('zip', casos.zip, { T, fmt, mmss }).join(' '), /3 niveles.*30 puntos.*2:05/);
  assert.deepEqual(desglose('reinas', { fin: false, errores: 0 }, { T, fmt, mmss }), [T.bdNotSolved]);
  n++;
}

test('la copa no usa la temática de Brasil (D-111)', () => {
  const codigos = [...CODIGOS, ...Array.from({ length: 200 }, (_, i) => 'ABCDEFGHJKLMNPQRSTUVWXYZ'.slice(i % 19, i % 19 + 5))];
  for (const c of codigos) assert.ok(!Object.values(temasDeLaCopa(c)).includes('brasil'), c);
});

test('todos los juegos puntúan de 0 a 100 (D-113)', () => {
  const tope = { linea: linea.puntaje({ aciertos: 9, marcas: Array(9).fill(true) }), numero: numero.puntaje({ resuelto: true, usados: 1 }),
    conexiones: conexiones.puntaje({ resueltos: [0, 1, 2, 3], errores: 0 }), reinas: reinas.puntaje({ fin: true, ms: 1000 }),
    letras: letras.puntaje({ encontradas: 5, resuelto: true, usados: 1 }), zip: zip.puntaje({ hechos: 99 }), desenredo: desenredo.puntaje({ hechos: desenredo.NIVELES }),
    tango: tango.puntaje({ fin: true, errores: 0, pistas: 0 }), anio: anio.puntaje({ filas: [{}, {}], total: 200 }),
    donde: donde.puntaje({ filas: [{}, {}, {}, {}, {}], total: 500 }) };
  for (const [id, s] of Object.entries(tope)) assert.equal(s, 100, id);
});

const { LOCALES: TEXTOS } = await import('../rules.js');
const { LOCALES } = await import('./word/palabras.js');
const { DECKS: TODOS } = await import('../../timeline/decks/index.js');
const AUD = await import('./audiencia.js');
test('el público de la copa decide qué contenido local entra (D-186, D-187)', () => {
  const { local } = donde;
  const { fuera, audienciaDe } = AUD;
  const pais = { chile: 'cl', brasil: 'br' };
  const cartaLocal = new Map(TODOS.flatMap(d => d.cards.filter(c => c.local).map(c => [c.id, c.local])));
  assert.ok(cartaLocal.size >= 2);
  const codigos = [...CODIGOS, ...Array.from({ length: 80 }, (_, i) => 'ABCDEFGHJKLMNPQRSTUVWXYZ'.slice(i % 19, i % 19 + 5))];
  const vistos = { global: new Set(), cl: new Set(), br: new Set() };
  for (const aud of ['global', 'cl', 'br']) for (const c of codigos) for (const lang of ['es', 'en', 'pt', 'de']) {
    const o = { lang, palabras: lang, aud };
    const temas = Object.values(temasDeLaCopa(c, { aud }));
    temas.forEach(t => vistos[aud].add(t));
    for (const t of temas) assert.ok(!fuera(pais[t], aud), `${aud} ${c}: temática ${t}`);
    for (let d = 1; d <= 7; d += 3) {
      const l = JUEGOS.linea.generar(c, d, o), y = JUEGOS.anio.generar(c, d, o), f = JUEGOS.final.generar(c, d, o);
      for (const x of [l.base, ...l.mano, ...y.hitos, f.linea.base, ...f.linea.mano, ...f.anio.hitos]) assert.ok(!fuera(cartaLocal.get(x.id), aud), `${aud} ${c} ${d}: ${x.id}`);
      const g = conexiones.grillaDe(c, { lang, aud });
      assert.ok(!fuera(g.local, aud), `${aud} ${c} ${lang}: grilla ${g.id}`);
      assert.equal(JUEGOS.conexiones.generar(c, d, o).id, g.id);
      if (fuera('cl', aud)) assert.ok(!LOCALES.has(JUEGOS.letras.generar(c, d, o).secreto), `${aud} ${c} ${d}: palabra local`);
      for (const x of [...JUEGOS.donde.generar(c, d, o).ciudades, ...JUEGOS.donde.ensayo(c, d, o).ciudades]) assert.ok(!fuera(local(x), aud), `${aud} ${c} ${d}: ${x.ciudad}`);
      const e = JUEGOS.linea.ensayo(c, d, o);
      assert.ok(!fuera(pais[e.tema], aud) && !temas.includes(e.tema), `ensayo ${aud} ${c}: ${e.tema}`);
    }
  }
  // Cada público tiene lo suyo: Chile juega la temática Chile y Brasil la de Brasil
  assert.ok(vistos.cl.has('chile') && !vistos.cl.has('brasil'));
  assert.ok(vistos.br.has('brasil') && !vistos.br.has('chile'));
  assert.ok(!vistos.global.has('chile') && !vistos.global.has('brasil'));
  // Grillas de sobra para cada público en cada idioma
  for (const aud of ['global', 'cl', 'br']) for (const M of [GRILLAS_MOD, GRILLAS_EN, GRILLAS_PT, GRILLAS_DE]) assert.ok(M.GRILLAS.filter(g => !fuera(g.local, aud)).length >= 7, aud);
  // El público de una copa: el suyo; global si era de las `intl`; y sin él, como las de antes
  assert.equal(audienciaDe({ aud: 'br' }), 'br');
  assert.equal(audienciaDe({ intl: true }), 'global');
  assert.equal(audienciaDe({}), null);
  assert.equal(audienciaDe({ aud: 'xx' }), null);
  assert.ok(codigos.some(c => Object.values(temasDeLaCopa(c)).includes('chile')));
  assert.ok(!codigos.some(c => Object.values(temasDeLaCopa(c)).includes('brasil')));
});

test('las instrucciones de cada juego son concisas, en los tres idiomas (U-18, D-184)', () => {
  for (const lang of ['es', 'en', 'pt', 'de']) for (const [id, J] of Object.entries(TEXTOS[lang].juegos)) {
    assert.ok(J.como.length <= 3, `${lang} ${id}: ${J.como.length} puntos en "Cómo se juega" (máximo 3)`);
    const largo = J.como.join(' ').length;
    assert.ok(largo <= 280, `${lang} ${id}: "Cómo se juega" tiene ${largo} caracteres (máximo 280)`);
    assert.ok(J.puntaje.length <= 170, `${lang} ${id}: el puntaje tiene ${J.puntaje.length} caracteres (máximo 170)`);
    // La meta, no la descripción de lo que se ve
    assert.ok(!/^(Hay|There (is|are)|Há) /.test(J.como[0]), `${lang} ${id}: el primer punto describe la pantalla en vez de decir qué hacer`);
  }
});

test('Conexiones agrupa por significado, no por juegos de palabras (D-128)', () => {
  for (const g of GRILLAS) for (const x of g.grupos) {
    assert.ok(!/___|escond|empiezan|terminan|riman|tienen (dientes|cuello|ojos)/i.test(x.nombre), `${g.id}: "${x.nombre}" parece un juego de palabras`);
  }
});

test('una copa ya en su día de Conexiones conserva la grilla de antes (D-128)', () => {
  const { GRILLAS_ANTES_D128, CAMBIO_D128 } = GRILLAS_MOD;
  assert.equal(GRILLAS_ANTES_D128.length, GRILLAS.length);
  for (const c of CODIGOS) {
    const i = GRILLAS.indexOf(conexiones.grillaDe(c));
    assert.equal(conexiones.grillaDe(c, { desde: CAMBIO_D128 - 1 }), GRILLAS_ANTES_D128[i]);
    assert.equal(conexiones.grillaDe(c, { desde: CAMBIO_D128 }), GRILLAS[i]);
    assert.equal(conexiones.generar(c, 3, { desde: CAMBIO_D128 - 1 }).id, GRILLAS_ANTES_D128[i].id);
  }
});

// ── Inglés y portugués (D-170) ──

test('grillas en inglés y portugués: las mismas reglas que las de español', () => {
  for (const [lang, M] of Object.entries({ en: GRILLAS_EN, pt: GRILLAS_PT, de: GRILLAS_DE })) {
    assert.ok(M.GRILLAS.length >= 12, lang);
    assert.equal(new Set(M.GRILLAS.map(g => g.id)).size, M.GRILLAS.length, lang);
    for (const g of [...M.GRILLAS, M.GRILLA_ENSAYO]) {
      assert.equal(g.grupos.length, 4, `${lang}/${g.id}`);
      const todas = g.grupos.flatMap(x => x.palabras);
      assert.equal(todas.length, 16, `${lang}/${g.id}`);
      assert.equal(new Set(todas).size, 16, `${lang}/${g.id}: palabra repetida`);
      for (const w of todas) {
        assert.equal(w, w.toLocaleUpperCase(lang), `${lang}/${g.id}: ${w} no va en mayúsculas`);
        assert.ok(w.length <= 14, `${lang}/${g.id}: ${w} es muy larga`);
      }
      assert.ok(g.grupos.every(x => x.nombre && x.nombre.length <= 40), `${lang}/${g.id}`);
      for (const x of g.grupos) assert.ok(!/___|hidden|start with|end with|rhym|escond|começam|terminam|rimam/i.test(x.nombre), `${lang}/${g.id}: "${x.nombre}" parece un juego de palabras`);
    }
  }
});

test('conexiones: la grilla sale del idioma de las palabras de la copa', () => {
  for (const c of CODIGOS) {
    assert.ok(GRILLAS_EN.GRILLAS.includes(conexiones.grillaDe(c, { lang: 'en' })), c);
    assert.ok(GRILLAS_PT.GRILLAS.includes(conexiones.grillaDe(c, { lang: 'pt' })), c);
    // La interfaz en otro idioma no cambia la grilla: manda `palabras`, el idioma de la copa
    assert.deepEqual(conexiones.generar(c, 3, { lang: 'en', palabras: 'es' }), conexiones.generar(c, 3));
  }
  assert.ok(conexiones.ensayo('KQRST', 1, { palabras: 'pt' }).orden.includes('MAÇÃ'));
});

test('letras: palabras en inglés y portugués, y teclado sin Ñ', () => {
  for (const [lang, lista] of Object.entries({ en: PALABRAS_EN, pt: PALABRAS_PT, de: PALABRAS_DE })) {
    assert.ok(lista.length >= 100, lang);
    assert.equal(new Set(lista).size, lista.length, `${lang}: palabra repetida`);
    for (const w of lista) assert.ok(/^[A-Z]{5}$/.test(w) && letras.valido(w), `${lang}: ${w}`);
    assert.ok(!letras.alfabeto(lang).includes('Ñ'), lang);
    assert.ok(lista.includes(letras.generar('KQRST', 5, { palabras: lang }).secreto), lang);
  }
  assert.ok(letras.alfabeto('es').includes('Ñ'));
  // La palabra es la del idioma de la copa, aunque la pantalla esté en otro
  assert.deepEqual(letras.generar('KQRST', 5, { lang: 'pt', palabras: 'es' }), letras.generar('KQRST', 5));
  assert.equal(JUEGOS.final.generar('KQRST', 7, { lang: 'en', palabras: 'pt' }).letras.lang, 'pt');
});

test('¿En qué año? y Línea: las mismas cartas en todos los idiomas, con su texto', () => {
  const es = anio.generar('KQRST', 2), en = anio.generar('KQRST', 2, { lang: 'en' });
  assert.deepEqual(en.hitos.map(h => h.id), es.hitos.map(h => h.id));
  assert.notEqual(en.hitos[0].texto, es.hitos[0].texto);
  assert.equal(anio.anioLabel(-44, 'en'), '44 BC');
  assert.equal(anio.anioLabel(-44, 'pt'), '44 a.C.');
  assert.equal(anio.anioLabel(-44, 'de'), '44 v. Chr.');
  assert.equal(anio.anioLabel(-44), '44 a. C.');
  const l = linea.generar('KQRST', 1, { lang: 'pt' });
  assert.deepEqual(l.mano.map(c => c.id), linea.generar('KQRST', 1).mano.map(c => c.id));
});

test('¿Dónde queda?: todos los países en inglés y portugués', () => {
  for (const c of CIUDADES) assert.ok(PAISES[c.pais], `${c.pais} sin traducir`);
  for (const k of Object.keys(NOMBRES_CIUDADES)) assert.ok(CIUDADES.some(c => c.ciudad === k), `${k} no es una ciudad del juego`);
  const cairo = CIUDADES.find(c => c.ciudad === 'El Cairo');
  assert.equal(donde.nombre(cairo), 'El Cairo, Egipto');
  assert.equal(donde.nombre(cairo, 'en'), 'Cairo, Egypt');
  assert.equal(donde.nombre(cairo, 'pt'), 'Cairo, Egito');
  assert.equal(donde.nombre(CIUDADES.find(c => c.ciudad === 'Singapur'), 'en'), 'Singapore');
  assert.equal(donde.km(1250, 'en'), '1,250 km');
});

console.log(`copa/juegos: ${n} tests OK`);
