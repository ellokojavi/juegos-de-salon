// Ejecutar: node tools/e2e/grupos.test.mjs
// Los grupos de la punta a punta (D-307): parejos, deterministas, con todos los guiones una vez, y
// sin pasar del objetivo salvo que un solo guion lo pase. Y que los del repo quepan en los runners.
import assert from 'node:assert/strict';
import { agrupar, duracion, leerDuraciones, OBJETIVO_S, MAXIMO, SIN_MEDIDA_S } from './grupos.mjs';
import { trabajos } from './ci.mjs';

const dur = { a: 200, b: 150, c: 120, d: 100, e: 60, f: 30 };
const g = agrupar(Object.keys(dur), dur, { objetivo: 250 });
assert.equal(g.length, 3, '660 s en grupos de hasta 250: tres');
assert.deepEqual(g.flatMap(x => x.guiones).sort(), Object.keys(dur), 'cada guion, una vez');
assert.ok(g.every(x => x.s <= 250), `ninguno pasa del objetivo: ${g.map(x => x.s)}`);
assert.deepEqual(agrupar(Object.keys(dur), dur, { objetivo: 250 }), g, 'los mismos datos, los mismos grupos');
assert.match(g[0].nombre, /^g01 · \S+ \+\d+$/);
// Un guion más largo que el objetivo manda: va solo en su grupo, y el objetivo pasa a ser él
assert.deepEqual(agrupar(['largo', 'x', 'y'], { largo: 500, x: 10, y: 20 }, { objetivo: 100 }).map(g => g.guiones), [['largo'], ['y', 'x']]);
assert.equal(agrupar([], dur).length, 0);
assert.equal(duracion('nuevo.mjs', {}), SIN_MEDIDA_S, 'un guion sin medir cuenta como 90 s');
assert.equal(agrupar(['a', 'b', 'c'], {}, { objetivo: 1, maximo: 2 }).length, 2, 'nunca más que el máximo');

// Los del repo: en grupos que caben de una en los runners (los sin medir cuentan como 90 s)
const medidas = leerDuraciones();
const sinMedir = trabajos().filter(t => !(t in medidas));
if (sinMedir.length) console.log(`  sin medir todavía (cuentan como ${SIN_MEDIDA_S} s): ${sinMedir.join(', ')}`);
const reales = agrupar(trabajos(), medidas);
assert.ok(reales.length <= MAXIMO, `${reales.length} grupos: más que los runners`);
const mayor = Math.max(...trabajos().map(t => duracion(t, medidas)));
assert.ok(reales[0].s <= Math.max(OBJETIVO_S, mayor) * 1.15, `el grupo más cargado (${reales[0].s} s) pasa de lejos el objetivo`);
console.log(`grupos: en verde · ${reales.length} grupos, el más largo ${reales[0].s} s`);
