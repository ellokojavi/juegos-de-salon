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

// A card left without its closing tags swallows every card after it into its folded <details> (#958)
const open = [];
for (const [tag, close, name] of labs.matchAll(/<(\/?)(section|details|div)\b[^>]*>/g).map(m => [m[0], m[1], m[2]])) {
  if (!close) { open.push(name); continue; }
  assert.equal(open.pop(), name, `public/labs/index.html: ${tag} closes the wrong tag, so a card is missing its closing tags`);
}
assert.deepEqual(open, [], `public/labs/index.html leaves <${open.join('>, <')}> open`);

let checked = 0;
for (const g of ['activos', 'mejoras']) for (const [, id, body] of cards(group(g))) {
  checked++;
  assert.ok(!body.includes('🚀'), `#${id} says 🚀 Lanzado but is still in #${g}: move it to La Bodega's ✨ Mejoras lanzadas (D-479)`);
  if (g === 'mejoras') assert.ok(named.includes(`lab: #${id}`),
    `#${id} is in ✨ Mejoras en prueba but no page asks the lab key for it any more: it reached everyone, so move it to La Bodega's ✨ Mejoras lanzadas (D-479)`);
}
assert.ok(checked >= 1, 'no card on trial found: did the groups in public/labs/index.html change?');
console.log(`✓ lab on trial: ${checked} card(s), none launched`);

// ✨ Mejoras lanzadas folds by launch day (#956): every card says it, so bodega.js can place it
const launched = group('bodega').slice(group('bodega').indexOf('id="bodega-mejoras"'));
const undated = [...launched.matchAll(/<section class="panel seccion[^"]*" id="([\w-]+)"(?! data-launched="\d{4}-\d{2}-\d{2}")/g)].map(m => m[1]);
assert.deepEqual(undated, [], `add data-launched="YYYY-MM-DD" (the day it reached everyone) to ${undated.map(id => `#${id}`).join(', ')}`);
const { periodOf, group: fold } = await import('./bodega.js');
const today = new Date('2026-10-28T12:00:00');
assert.deepEqual(periodOf('2026-10-28', today), { key: '2026-10-26', title: 'Semana del 26 de octubre' });
assert.deepEqual(periodOf('2026-10-25', today), { key: '2026-10-19', title: 'Semana del 19 de octubre' });
assert.deepEqual(periodOf('2026-09-30', today), { key: '2026-09', title: 'Septiembre 2026' });
assert.deepEqual(fold([{ launched: '2026-09-02' }, { launched: '2026-10-27' }, { launched: '2026-10-28' }], today).map(f => [f.key, f.cards.length]),
  [['2026-10-26', 2], ['2026-09', 1]]);
console.log('✓ La Bodega: every launched improvement is dated and folds by week and month');
