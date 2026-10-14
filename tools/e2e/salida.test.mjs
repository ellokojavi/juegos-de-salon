// Ejecutar: node tools/e2e/salida.test.mjs
// La carpeta de salida de los guiones (D-315): sin carpeta, o con un flag primero, nunca queda
// `undefined/` ni `--parte/` dentro de la copia de trabajo.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync, rmSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { salida, esCarpeta } from './salida.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));

assert.equal(salida(null, ['node', 'g.mjs', '/tmp/x']), '/tmp/x');
assert.equal(salida('/tmp/copa', ['node', 'torneo.mjs', '--parte', 'copa']), '/tmp/copa', 'un flag no es la carpeta');
assert.equal(salida('/tmp/copa', ['node', 'torneo.mjs']), '/tmp/copa');
assert.equal(salida('/tmp/copa', ['node', 'torneo.mjs', 'undefined']), '/tmp/copa', '`undefined` hecho texto no es la carpeta');
const nueva = salida(null, ['node', '/r/tools/e2e/sala-error.mjs']);
assert.ok(nueva.startsWith(join(tmpdir(), 'sala-error-')) && existsSync(nueva), `sin carpeta, una nueva en el temporal (${nueva})`);
rmSync(nueva, { recursive: true, force: true });
for (const mala of [undefined, null, '', 'undefined', 'undefined/p', '--parte', '--parte/p', '/x/undefined/p', 'null']) assert.equal(esCarpeta(mala), false, String(mala));
for (const buena of ['/tmp/copa', 'out', '/private/tmp/usabilidad-2026-10-14-capturas', '/tmp/undefinedo']) assert.equal(esCarpeta(buena), true, buena);

// Ningún guion lee la carpeta de process.argv[2] a mano: todos pasan por salida()
const guiones = [];
const recorrer = d => { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) recorrer(p); else if (n.endsWith('.mjs') && !n.endsWith('.test.mjs') && n !== 'salida.mjs') guiones.push(p); } };
recorrer(AQUI);
const aMano = guiones.filter(p => /process\.argv\[2\]/.test(readFileSync(p, 'utf8'))).map(p => relative(AQUI, p));
assert.deepEqual(aMano, [], `leen process.argv[2] sin salida() (D-315): ${aMano.join(', ')}`);

console.log(`✓ salida: ${guiones.length} guiones sin process.argv[2] a mano`);
