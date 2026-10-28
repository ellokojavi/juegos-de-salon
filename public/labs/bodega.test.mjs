// What reached everyone goes to La Bodega (D-479): a card still under 🎲 Juegos en prueba or
// ✨ Mejoras en prueba must not say 🚀 Lanzado, and an improvement on trial must still be behind the
// lab key, so some page outside /labs/ names it with a `lab: #<id>` comment (D-409). Once the gate
// comes off, the card moves to ✨ Mejoras lanzadas in the same PR.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const PUBLIC = fileURLToPath(new URL('..', import.meta.url));
const labs = readFileSync(join(PUBLIC, 'labs/index.html'), 'utf8');
const walk = dir => readdirSync(dir).flatMap(f => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const named = walk(PUBLIC).filter(p => /\.(js|html)$/.test(p) && !relative(PUBLIC, p).startsWith('labs/'))
  .map(p => readFileSync(p, 'utf8')).join('\n');

const group = id => {
  const start = labs.indexOf(`<section class="grupo" id="${id}">`);
  assert.ok(start >= 0, `public/labs/index.html has no #${id} group`);
  const next = labs.indexOf('<section class="grupo"', start + 1);
  return labs.slice(start, next < 0 ? undefined : next);
};
const cards = html => [...html.matchAll(/<section class="panel seccion[^"]*" id="([\w-]+)">([\s\S]*?)(?=<section class="panel seccion|$)/g)];

let checked = 0;
for (const g of ['activos', 'mejoras']) for (const [, id, body] of cards(group(g))) {
  checked++;
  assert.ok(!body.includes('🚀'), `#${id} says 🚀 Lanzado but is still in #${g}: move it to La Bodega's ✨ Mejoras lanzadas (D-479)`);
  if (g === 'mejoras') assert.ok(named.includes(`lab: #${id}`),
    `#${id} is in ✨ Mejoras en prueba but no page asks the lab key for it any more: it reached everyone, so move it to La Bodega's ✨ Mejoras lanzadas (D-479)`);
}
assert.ok(checked >= 1, 'no card on trial found: did the groups in public/labs/index.html change?');
console.log(`✓ lab on trial: ${checked} card(s), none launched`);
