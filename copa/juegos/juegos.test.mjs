// Tests de los minijuegos de La Copa: node copa/juegos/juegos.test.mjs
import assert from 'node:assert/strict';
import { hash32, azar } from './semilla.js';
import * as numero from './numero.js';
import * as linea from './linea.js';
import * as anio from './anio.js';
import * as dudo from './dudo.js';
import * as solitario from './solitario.js';
import * as conexiones from './conexiones.js';
import * as final from './final.js';
import { GRILLAS } from './grillas.js';
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
  assert.equal(numero.puntaje(e1), 10);
  const e2 = numero.estado(p, ['5678', '1243']);
  assert.equal(e2.fin, false);
  assert.equal(numero.tarjeta(e2), '⚪⚪⚪⚪\n🟢🟢🟡🟡');
  const e3 = numero.estado(p, Array(10).fill('5678'));
  assert.ok(e3.fin && !e3.resuelto);
  assert.equal(numero.puntaje(e3), 0);
  assert.equal(numero.puntaje(numero.estado(p, [...Array(9).fill('5678'), '1234'])), 1);
});

test('temas: línea, años y final distintos', () => {
  for (const c of CODIGOS) {
    const t = temasDeLaCopa(c);
    assert.equal(new Set([t.linea, t.anio, t.final]).size, 3);
  }
});

test('línea: 8 cartas de años separados, puntaje y estado', () => {
  for (const c of CODIGOS) {
    const p = linea.generar(c, 1);
    const todas = [p.base, ...p.mano];
    assert.equal(todas.length, 8);
    const ys = todas.map(x => x.year).sort((a, b) => a - b);
    for (let i = 1; i < ys.length; i++) assert.ok(ys[i] - ys[i - 1] >= 2, `${c} ${ys}`);
    assert.ok(todas.every(x => x.texto && x.emoji));
  }
  const p = { base: { id: 'b', year: 1950 }, mano: [{ id: 'x', year: 1900 }, { id: 'y', year: 2000 }, { id: 'z', year: 1960 }] };
  const e = linea.estado(p, [0, 0, 2]); // 1900 bien; 2000 mal (va al final); 1960 bien entre 1950 y 2000
  assert.deepEqual(e.marcas, [true, false, true]);
  assert.deepEqual(e.linea.map(x => x.year), [1900, 1950, 1960, 2000]);
  assert.ok(e.fin);
  assert.equal(linea.puntaje(e), 2);
  assert.equal(linea.tarjeta(e), '🟩🟥🟩');
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
  assert.equal(anio.puntaje(e), 600);
  assert.equal(anio.anioLabel(-44), '44 a. C.');
});

test('dudo: manos creíbles pero no regaladas, puntos por probabilidad', () => {
  for (const c of CODIGOS) {
    const p = dudo.generar(c, 5);
    assert.equal(p.manos.length, 8);
    for (const m of p.manos) {
      assert.equal(m.mios.length, 5);
      assert.equal(m.total, 5 + m.otros.flat().length);
      const cr = dudo.creible(m);
      assert.ok(cr >= 0.03 && cr <= 0.97, cr);
      const a = dudo.puntos(m, 'creo'), b = dudo.puntos(m, 'dudo');
      assert.ok(Math.abs(a + b - 100) <= 1);
    }
    assert.deepEqual(dudo.generar(c, 5), p);
  }
  const p = dudo.generar('KQRST', 5);
  const mejores = p.manos.map(m => (dudo.creible(m) >= 0.5 ? 'creo' : 'dudo'));
  const e = dudo.estado(p, mejores);
  assert.ok(e.fin);
  assert.ok(e.filas.every(f => f.mejor));
  assert.ok(!dudo.tarjeta(e).includes('😬'));
  const peores = mejores.map(x => (x === 'creo' ? 'dudo' : 'creo'));
  assert.ok(dudo.puntaje(dudo.estado(p, peores)) < dudo.puntaje(e));
});

test('solitario: solución única, reglas del Bimaru y rápido', () => {
  const t0 = Date.now();
  let peor = 0;
  for (const c of CODIGOS) {
    for (const [nn, flota] of [[8, solitario.FLOTA], [6, solitario.FLOTA_CHICA]]) {
      const t = Date.now();
      const p = solitario.generar(c, 4, { n: nn, flota });
      peor = Math.max(peor, Date.now() - t);
      const sol = solitario.solucion(p);
      const cells = flota.reduce((s, f) => s + f.size, 0);
      assert.equal(sol.reduce((s, v) => s + v, 0), cells);
      assert.equal(p.filas.reduce((s, v) => s + v, 0), cells);
      // única
      assert.equal(solitario.resolver(p, { tope: 2 }).cuantas, 1, `${c} ${nn}`);
      // no se tocan ni en diagonal: cada casilla de barco solo tiene vecinas de su propio barco
      for (const f of flota) {
        const pos = p.layout[f.id];
        const mias = new Set(Array.from({ length: f.size }, (_, i) => (pos.dir === 'h' ? pos.r * nn + pos.c + i : (pos.r + i) * nn + pos.c)));
        for (const i of mias) {
          const r = Math.floor(i / nn), cc = i % nn;
          for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
            const rr = r + dr, c2 = cc + dc;
            if (rr < 0 || c2 < 0 || rr >= nn || c2 >= nn) continue;
            const j = rr * nn + c2;
            assert.ok(!sol[j] || mias.has(j), `${c} se tocan`);
          }
        }
      }
      assert.ok(p.pistas.length >= 1 && p.pistas.length < nn * nn / 2, `${p.pistas.length} pistas`);
    }
  }
  assert.ok(peor < 1500, `generar tardó ${peor} ms`);
  console.log(`  solitario: el más lento tardó ${peor} ms (total ${Date.now() - t0} ms)`);
});

test('solitario: marcas, errores y puntaje', () => {
  const p = solitario.generar('KQRST', 4);
  let m = solitario.marcasIniciales(p);
  const sol = solitario.solucion(p);
  assert.ok(solitario.errores(p, m) > 0);
  const q = p.pistas[0];
  assert.deepEqual(solitario.tocar(p, m, q.r * p.n + q.c), m); // las pistas no se tocan
  sol.forEach((v, i) => { if (v && m[i] !== solitario.BARCO) m = solitario.tocar(p, solitario.tocar(p, m, i), i); });
  assert.equal(solitario.errores(p, m), 0);
  const { fil } = solitario.cuentas(p, m);
  assert.deepEqual(fil, p.filas);
  assert.equal(solitario.puntaje({ resuelto: true, fallidas: 0 }), 100);
  assert.equal(solitario.puntaje({ resuelto: true, fallidas: 2 }), 70);
  assert.equal(solitario.puntaje({ resuelto: true, fallidas: 9 }), 10);
  assert.equal(solitario.puntaje({ resuelto: false, fallidas: 1 }), 0);
  assert.equal(solitario.tarjeta({ resuelto: true, fallidas: 1 }), '⚓❌✅');
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

test('final: cinco rondas, de 0 a 500', () => {
  const p = final.generar('KQRST', 7);
  assert.equal(p.linea.mano.length, 3);
  assert.equal(p.numero.secreto.length, 3);
  assert.equal(p.solitario.n, 6);
  assert.equal(p.dudo.manos.length, 3);
  assert.equal(p.anio.hitos.length, 2);
  const perfecto = {
    linea: linea.estado(p.linea, p.linea.mano.map((c, i, arr) => linea.huecoCorrecto(linea.estado(p.linea, arr.slice(0, i).map((cc, j) => linea.huecoCorrecto(linea.estado(p.linea, []).linea, cc))).linea, c))),
    numero: numero.estado(p.numero, [p.numero.secreto], final.NUMERO_INTENTOS),
    solitario: { resuelto: true, fallidas: 0 },
    dudo: dudo.estado(p.dudo, p.dudo.manos.map(m => (dudo.creible(m) >= 0.5 ? 'creo' : 'dudo'))),
    anio: anio.estado(p.anio, p.anio.hitos.map(h => h.year)),
  };
  const s = final.puntaje(perfecto);
  assert.ok(s > 400 && s <= 500, s);
  assert.equal(final.puntaje({}), 0);
  assert.match(final.tarjeta(perfecto), /^⏳\d+ 🔢100 ⚓100 🎲\d+ 📅100$/);
});

console.log(`copa/juegos: ${n} tests OK`);
