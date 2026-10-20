// Pips (D-381): rules, one solution per board, laying dominoes, the help and the score.
import assert from 'node:assert/strict';
import { cumple, etiqueta, resolver, generar, nuevaPartida, lugar, poner, sacar, valores, estadoZonas, resuelto, lleno, ayudar, puntaje, tarjeta, NIVELES, MAXIMO, PUNTOS_TABLERO, RESTA_AYUDA, unida } from './engine.js';

// The rules, full and partial
assert.equal(cumple({ tipo: 'suma', n: 6 }, [2, 4]), true);
assert.equal(cumple({ tipo: 'suma', n: 6 }, [2, 3]), false);
assert.equal(cumple({ tipo: 'suma', n: 6 }, [2, null]), null, 'open while it can still reach 6');
assert.equal(cumple({ tipo: 'suma', n: 6 }, [0, null, null]), null);
assert.equal(cumple({ tipo: 'suma', n: 13 }, [0, null]), false, 'cannot reach 13 with one more');
assert.equal(cumple({ tipo: 'igual' }, [3, 3, 3]), true);
assert.equal(cumple({ tipo: 'igual' }, [3, 4, null]), false);
assert.equal(cumple({ tipo: 'distinto' }, [1, 2, 3]), true);
assert.equal(cumple({ tipo: 'distinto' }, [1, 1, null]), false);
assert.equal(cumple({ tipo: 'menor', n: 5 }, [1, 3]), true);
assert.equal(cumple({ tipo: 'menor', n: 5 }, [5, null]), false);
assert.equal(cumple({ tipo: 'mayor', n: 9 }, [6, 4]), true);
assert.equal(cumple({ tipo: 'mayor', n: 9 }, [4, null]), null);
assert.equal(cumple({ tipo: 'mayor', n: 9 }, [1, null]), false, 'cannot pass 9 with one more');
assert.equal(cumple({ tipo: 'mayor', n: 9 }, [1, 2]), false);
assert.equal(cumple({ tipo: 'libre' }, [0, 6]), true);
assert.deepEqual(['suma', 'igual', 'distinto', 'menor', 'mayor', 'libre'].map(tipo => etiqueta({ tipo, n: 7 })), ['7', '=', '≠', '<7', '>7', '']);

// Every board has exactly one solution, uses different dominoes, and is the same for the same seed
for (const semilla of ['a', 'b', 'c', 'dia:2026-10-19', 'e2e1']) {
  for (const { id, fichas } of NIVELES) {
    const t = generar(semilla, id);
    assert.equal(t.fichas.length, fichas, `${semilla}/${id}: ${fichas} dominoes`);
    assert.equal(t.celdas.length, fichas * 2);
    assert.equal(new Set(t.fichas.map(([x, y]) => [Math.min(x, y), Math.max(x, y)].join())).size, fichas, 'no domino twice');
    assert.equal(resolver(t, 2).length, 1, `${semilla}/${id}: exactly one solution`);
    assert.deepEqual(generar(semilla, id), t, 'the same seed, the same board');
    // Every cell is in exactly one zone
    const vistas = t.zonas.flatMap(z => z.celdas).sort((a, b) => a - b);
    assert.deepEqual(vistas, t.celdas.map((_, i) => i));
    // Laying the solution solves it
    const p = nuevaPartida(t);
    for (const s of t.solucion) assert.ok(poner(p, s.f, { a: s.a, b: s.b }).ok);
    assert.ok(resuelto(p), `${semilla}/${id}: the solution solves it`);
  }
}

// Laying and taking off dominoes
const t = generar('e2e1', 'facil');
const p = nuevaPartida(t);
const s0 = t.solucion[0];
assert.deepEqual(poner(p, s0.f, null), { ok: false, motivo: 'fuera' });
assert.ok(poner(p, s0.f, { a: s0.a, b: s0.b }).ok);
const otra = t.solucion[1].f;
assert.deepEqual(poner(p, otra, { a: s0.a, b: s0.b }), { ok: false, motivo: 'ocupada' }, 'a taken cell refuses');
assert.equal(valores(p)[s0.a], t.fichas[s0.f][0]);
assert.ok(!lleno(p) && !resuelto(p));
sacar(p, s0.f);
assert.ok(valores(p).every(v => v === null));
// lugar: a quarter turn at a time, x|y, x over y, y|x, y over x
const c0 = t.celdas.findIndex((c, i) => lugar(t, i, 0) && lugar(t, i, 1));
if (c0 >= 0) {
  const h = lugar(t, c0, 0), v = lugar(t, c0, 1), h2 = lugar(t, c0, 2), v2 = lugar(t, c0, 3);
  assert.equal(h.a, c0); assert.equal(v.a, c0); assert.equal(h2.b, c0); assert.equal(v2.b, c0);
  assert.equal(t.celdas[h.b].c, t.celdas[c0].c + 1); assert.equal(t.celdas[v.b].r, t.celdas[c0].r + 1);
}
// Zones are decided only when full
assert.ok(estadoZonas(nuevaPartida(t)).every(x => x === null));

// The help lays one domino of the solution, moving what was in the way, and counts
const q = nuevaPartida(t);
const s1 = t.solucion[1];
poner(q, s1.f, { a: s0.a, b: s0.b });   // a domino in another's place
const primera = ayudar(q);
assert.equal(primera, s0.f, 'the help lays the first domino not already right');
assert.deepEqual(q.puestas[s0.f], { a: s0.a, b: s0.b });
assert.equal(q.puestas[s1.f], null, 'and takes off the one that was in its way');
let k = 1; while (ayudar(q) >= 0) k++;
assert.ok(resuelto(q), 'enough helps solve it');
assert.equal(q.ayudas, t.fichas.length);
assert.equal(k, t.fichas.length);

// The score: 20 a board, up to 40 for speed with all three, −10 a help, never below 0
assert.equal(MAXIMO, 100);
assert.equal(puntaje({ resueltos: 3, ms: 3 * 60000, ayudas: 0 }), 100);
assert.equal(puntaje({ resueltos: 3, ms: 8 * 60000, ayudas: 0 }), 80);
assert.equal(puntaje({ resueltos: 3, ms: 20 * 60000, ayudas: 1 }), 50);
assert.equal(puntaje({ resueltos: 2, ms: 60000, ayudas: 0 }), 2 * PUNTOS_TABLERO, 'speed only with all three');
assert.equal(puntaje({ resueltos: 0, ms: 0, ayudas: 3 }), 0);
assert.equal(RESTA_AYUDA, 10);
assert.equal(tarjeta({ resueltos: 2, ayudas: 1 }), '✅✅⬜ 2 de 3 · 💡 1');

// Not every board adds up (D-386): over many seeds, at most 70% of the cells sit in an exact-sum
// zone, every kind of rule shows up, and a zone never holds both halves of a domino with two
// different numbers (turned round, it would be a second answer), and every zone is one piece
{
  let celdas = 0, enSuma = 0;
  const tipos = new Set();
  for (const nivel of NIVELES.map(x => x.id)) for (let s = 0; s < 25; s++) {
    const t = generar(`mezcla${s}`, nivel);
    const zonaDe = []; t.zonas.forEach((z, k) => z.celdas.forEach(i => { zonaDe[i] = k; }));
    for (const z of t.zonas) { celdas += z.celdas.length; if (z.tipo === 'suma') enSuma += z.celdas.length; tipos.add(z.tipo); }
    for (const z of t.zonas) assert.ok(unida(t.celdas, z.celdas), `${nivel} ${s}: a zone in two pieces`);
    for (const { f, a, b } of t.solucion) {
      const [x, y] = t.fichas[f];
      assert.ok(x === y || zonaDe[a] !== zonaDe[b], `${nivel} ${s}: a domino inside one zone`);
    }
  }
  assert.ok(enSuma / celdas <= 0.7, `cells under an exact sum: ${Math.round(100 * enSuma / celdas)}%`);
  for (const tipo of ['suma', 'igual', 'distinto', 'menor', 'mayor']) assert.ok(tipos.has(tipo), `some zone asks ${tipo}`);
}

console.log('✓ pips engine');
