// Tests del motor de El caso (prototipo de laboratorio, D-256): node public/labs/case/engine.test.mjs
// Lo que importa: que cada caso se resuelva sin adivinar y que las pistas digan la verdad.
import assert from 'node:assert/strict';
import { N, coord, vecinos, generar, estado, marcar, deducibles, resolver, pistasVerdaderas, semillaDelDia } from './engine.js';

assert.equal(coord(0), 'A1');
assert.equal(coord(19), 'D5');
assert.deepEqual(vecinos(0), [1, 4, 5], 'la esquina tiene tres vecinos');
assert.equal(vecinos(5).length, 8, 'uno del medio tiene ocho, también en diagonal');

// El mismo código arma el mismo caso
assert.deepEqual(generar('abc').v, generar('abc').v);
assert.notDeepEqual(generar('abc').v, generar('abd').v);
assert.ok(generar(semillaDelDia('2026-10-09')).nombres.length === N);

for (let s = 0; s < 40; s++) {
  const caso = generar(`t${s}`);
  // Todas las pistas son verdad con la solución
  assert.ok(resolver(caso.pistas.filter(Boolean), caso.v.slice()), `t${s}: alguna pista es falsa`);
  assert.ok(caso.pistas.every(Boolean), `t${s}: alguien no tiene pista`);
  assert.ok(caso.nombres.every((n, i) => !i || n.localeCompare(caso.nombres[i - 1], 'es') > 0), `t${s}: los nombres van en orden alfabético`);
  // Se resuelve sin adivinar: siempre hay alguien más que se puede deducir
  let marcas = [];
  for (let vuelta = 0; vuelta < N; vuelta++) {
    const e = estado(caso, marcas);
    if (e.terminado) break;
    const d = deducibles(e.pistas, e.x);
    const ks = Object.keys(d).map(Number);
    assert.ok(ks.length > 0, `t${s}: el caso se traba en la vuelta ${vuelta}`);
    for (const i of ks) {
      assert.equal(d[i], caso.v[i], `t${s}: se deduce algo falso de ${coord(i)}`);
      assert.equal(marcar(caso, marcas, i, d[i]), 'ok');
      marcas.push(i);
    }
  }
  assert.ok(estado(caso, marcas).terminado, `t${s}: no se terminó`);
}

// Marcar: bien, mal, o todavía no se puede saber (y eso no dice si estaba bien)
{
  const caso = generar('marcar');
  const e = estado(caso, []);
  const d = deducibles(e.pistas, e.x);
  const i = Number(Object.keys(d)[0]);
  assert.equal(marcar(caso, [], i, d[i]), 'ok');
  assert.equal(marcar(caso, [], i, 1 - d[i]), 'error');
  assert.equal(marcar(caso, [], caso.inicio, 0), 'ya');
  const nose = Array.from({ length: N }, (_, j) => j).find(j => e.x[j] === -1 && !(j in d));
  if (nose !== undefined) {
    assert.equal(marcar(caso, [], nose, 0), 'falta');
    assert.equal(marcar(caso, [], nose, 1), 'falta');
  }
}

// Las pistas generadas son verdad una por una
{
  const caso = generar('x');
  let r = 0.3; const azar = () => (r = (r * 9301 + 49297) % 233280 / 233280);
  for (const p of pistasVerdaderas(caso, caso.v, azar)) assert.ok(resolver([p], caso.v.slice()), p.texto);
}

console.log('✓ El caso (labs)');
