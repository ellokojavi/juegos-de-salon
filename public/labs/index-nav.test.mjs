// The lab's index: one link per card being tried, La Bodega left out.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { entries, GROUPS } from './index-nav.js';

// A tiny DOM stand-in, enough for entries()
const card = (id, title, hidden = false) => ({ id, hidden, querySelector: s => (s === ':scope > h2' && title ? { textContent: ` ${title} ` } : null) });
const group = (id, title, cards) => ({ id, querySelector: () => ({ textContent: title }), querySelectorAll: () => cards });
const groups = {
  activos: group('activos', '🎲 Juegos en prueba', [card('seccion-a', '🦎 A'), card('seccion-b', 'B', true)]),
  mejoras: group('mejoras', '✨ Mejoras en prueba', [card('seccion-offline', '📴 Modo sin conexión'), card('seccion-x', null)]),
  bodega: group('bodega', '📦 La Bodega', [card('seccion-old', 'Old')]),
};
const doc = { getElementById: id => groups[id] || null };
assert.deepEqual(entries(doc), [
  { group: 'activos', title: '🎲 Juegos en prueba', items: [{ id: 'seccion-a', label: '🦎 A' }] },
  { group: 'mejoras', title: '✨ Mejoras en prueba', items: [{ id: 'seccion-offline', label: '📴 Modo sin conexión' }] },
]);
assert.ok(!GROUPS.includes('bodega'));
// The page has the slot and draws it after the cards move to La Bodega
const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
assert.match(html, /<nav[^>]+id="indice"/);
assert.match(html, /moved\.then\(\(\) => import\('\.\/index-nav\.js'\)\)/);
console.log('✓ labs index: one link per card being tried, La Bodega left out');
