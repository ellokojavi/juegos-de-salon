// Run: node public/assets/js/offline-ui.test.mjs
// What offline mode shows (D-538, PR 4): which links need signal, and the chip's words.
import assert from 'node:assert/strict';
import { needsSignal, KEPT, chipText, pendingCount, PENDING_KEY } from './offline-ui.js';
import { GAMES, SUELTOS, offlineOk } from './games.js';

const root = new URL('https://juegosdesalon.cl/');
const at = new URL('https://juegosdesalon.cl/liars-dice/');
for (const g of [...GAMES, ...SUELTOS]) {
  assert.equal(needsSignal(`https://juegosdesalon.cl/${g.path}`, { root }), !offlineOk(g), `${g.id}: needs signal exactly when it is not offline-capable`);
}
assert.equal(needsSignal('./', { root }), false, 'the home page is kept');
assert.equal(needsSignal('../', { root, base: at }), false, 'the home page from a game');
assert.equal(needsSignal('../records/', { root, base: at }), true, 'Rankings needs signal');
assert.equal(needsSignal('privacy/', { root }), true, 'a page not kept');
assert.equal(needsSignal('cup/?code=ABC', { root }), true, 'La Copa, whatever its link says');
assert.equal(needsSignal('zip/?lang=en', { root }), false, 'a kept game with a parameter');
assert.equal(needsSignal('#rules', { root, base: at }), false, 'an anchor in the page');
assert.equal(needsSignal('https://buymeacoffee.com/x', { root }), false, 'another site is not ours to dim');
assert.equal(needsSignal('assets/og/zip.jpg', { root }), false, 'a file, not a page');
assert.ok(KEPT.has('') && KEPT.has('zip') && !KEPT.has('cup'));

assert.equal(chipText(0, 'es'), '📴 Sin conexión');
assert.equal(chipText(2, 'es'), '📴 Sin conexión · 2 por subir');
assert.equal(chipText(1, 'en'), '📴 Offline · 1 to upload');
assert.equal(chipText(3, 'pt'), '📴 Sem conexão · 3 para enviar');
const ls = new Map([[PENDING_KEY, JSON.stringify([{}, {}])]]);
assert.equal(pendingCount({ getItem: k => ls.get(k) ?? null }), 2);
assert.equal(pendingCount({ getItem: () => 'not json' }), 0);
console.log('✓ offline-ui: what needs signal is exactly what the phone does not keep; the chip in three languages');
