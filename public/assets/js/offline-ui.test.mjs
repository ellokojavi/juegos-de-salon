// Run: node public/assets/js/offline-ui.test.mjs
// What offline mode shows (D-538, PR 4): which links need signal, and the chip's words.
import assert from 'node:assert/strict';
import { needsSignal, KEPT, chipText, pendingCount, PENDING_KEY, uploadText } from './offline-ui.js';
import { offlineOk, ALL_GAMES } from './games.js';

const root = new URL('https://juegosdesalon.cl/');
const at = new URL('https://juegosdesalon.cl/liars-dice/');
for (const g of ALL_GAMES) {
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
assert.equal(uploadText({ sent: 1 }, 'es'), 'Se subió 1 partida ✓');
assert.equal(uploadText({ sent: 3, old: 1 }, 'es'), 'Se subieron 3 partidas ✓ Sin subir: 1 con más de 30 días.');
assert.equal(uploadText({ sent: 0, full: 2 }, 'en'), 'Not uploaded: 2 that did not fit (200 at most).');
assert.equal(uploadText({ sent: 0 }, 'pt'), '', 'nothing to say, no toast');
console.log('✓ offline-ui: the upload toast says how many went and why any did not;');
console.log('✓ offline-ui: what needs signal is exactly what the phone does not keep; the chip in three languages');

// A minigame's own cover (Shinobi, Zip…) is found by COVER: it lives in #screen-jugar as an .intro-hero,
// which is not the waiting room of La Copa (body.antesala). Missing it left every minigame cover in its
// normal colours offline (2026-11-07)
{
  const { COVER } = await import('./offline-ui.js');
  const { readFileSync } = await import('node:fs');
  assert.ok(COVER.includes('#screen-jugar.active .intro-hero'), 'COVER finds a minigame\'s cover');
  const game = readFileSync(new URL('../../cup/game.js', import.meta.url), 'utf8');
  assert.match(game, /class: 'intro-hero'/, 'cup/game.js still draws the minigame cover as .intro-hero (rename COVER with it)');
  const ui = readFileSync(new URL('./offline-ui.js', import.meta.url), 'utf8');
  assert.match(ui, /childList: true, attributes: true/, 'Start swaps the cover for the board with no class change: children are watched too');
}
