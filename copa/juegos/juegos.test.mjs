// Tests de los minijuegos de La Copa: node copa/juegos/juegos.test.mjs
import assert from 'node:assert/strict';
import { hash32, azar } from './semilla.js';
import * as numero from './numero.js';
import * as linea from './linea.js';
import * as anio from './anio.js';
import * as reinas from './reinas.js';
import * as tango from './tango.js';
import * as zip from './zip.js';
import * as letras from './letras.js';
import { PALABRAS } from './palabras.js';
import * as conexiones from './conexiones.js';
import * as final from './final.js';
import { GRILLAS } from './grillas.js';
import * as GRILLAS_MOD from './grillas.js';
import { temasDeLaCopa } from './mazos.js';

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
  const toques = i => [i]; // un toque pone la reina (D-103)
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
  // El toque largo pone y saca la X, y no cuenta como error ni como reina
  e = reinas.estado(p, [reinas.toqueLargo(5), reinas.toqueLargo(6), reinas.toqueLargo(6)]);
  assert.equal(e.marcas[5], reinas.MARCA); assert.equal(e.marcas[6], reinas.VACIO); assert.equal(e.errores, 0);
  // Un toque sobre una X pone la reina; otro la saca
  e = reinas.estado(p, [reinas.toqueLargo(5), 5]);
  assert.equal(e.marcas[5], reinas.REINA);
  assert.equal(reinas.estado(p, [5, 5]).marcas[5], reinas.VACIO);
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

test('todos los minijuegos puntúan de 0 a 100 (D-113)', () => {
  const tope = { linea: linea.puntaje({ aciertos: 9, marcas: Array(9).fill(true) }), numero: numero.puntaje({ resuelto: true, usados: 1 }),
    conexiones: conexiones.puntaje({ resueltos: [0, 1, 2, 3], errores: 0 }), reinas: reinas.puntaje({ fin: true, ms: 1000 }),
    letras: letras.puntaje({ encontradas: 5, resuelto: true, usados: 1 }), zip: zip.puntaje({ hechos: 99 }),
    tango: tango.puntaje({ fin: true, errores: 0, pistas: 0 }), anio: anio.puntaje({ filas: [{}, {}], total: 200 }) };
  for (const [id, s] of Object.entries(tope)) assert.equal(s, 100, id);
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

console.log(`copa/juegos: ${n} tests OK`);
