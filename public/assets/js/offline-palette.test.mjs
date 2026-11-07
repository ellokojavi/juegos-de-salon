// Run: node public/assets/js/offline-palette.test.mjs
// The offline palette (D-538, PR 8) is readable: white text, the accents used as text, and the
// "📡 Con señal" tag pass WCAG AA (4.5:1) on its backgrounds. Game pages keep their own colours.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isGamePage } from './offline-ui.js';

const css = readFileSync(new URL('../css/base.css', import.meta.url), 'utf8');
const block = css.slice(css.indexOf('html.offline-shell {'));
const token = n => (block.match(new RegExp(`--${n}:\\s*(#[0-9a-f]{6})`, 'i')) || [])[1];
const lum = hex => {
  const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
/** A colour with alpha over a solid one. */
const over = (rgb, a, bg) => '#' + [1, 3, 5].map((i, k) => Math.round(rgb[k] * a + parseInt(bg.slice(i, i + 2), 16) * (1 - a)).toString(16).padStart(2, '0')).join('');

const bgs = ['bg1', 'bg2', 'bg3'].map(token);
assert.ok(bgs.every(Boolean), 'the three backgrounds are set');
for (const bg of bgs) {
  assert.ok(ratio('#ffffff', bg) >= 4.5, `white text on ${bg}`);
  for (const t of ['pink', 'yellow', 'orange', 'cyan', 'lime']) assert.ok(ratio(token(t), bg) >= 4.5, `--${t} ${token(t)} as text on ${bg}: ${ratio(token(t), bg).toFixed(2)}`);
  // The tag: white on --well-deep (black at 30 %) over the dimmed card (45 % opacity over the page)
  const tag = over([0, 0, 0], 0.3, bg);
  assert.ok(ratio(over([255, 255, 255], 0.45, bg), over([0, 0, 0], 0.3 * 0.45, bg)) >= 4.5 || ratio('#ffffff', tag) >= 4.5, `the tag on ${bg}`);
}
// Muted text (white at 72 %)
for (const bg of bgs) assert.ok(ratio(over([255, 255, 255], 0.72, bg), bg) >= 4.5, `muted text on ${bg}`);

assert.equal(isGamePage('/zip/'), true);
assert.equal(isGamePage('/hangman/index.html'), true);
assert.equal(isGamePage('/'), false, 'the home page takes the palette');
assert.equal(isGamePage('/today/'), false, 'Uno al día takes the palette');
assert.equal(isGamePage('/labs/'), false);
console.log('✓ offline palette: readable (WCAG AA) on its three backgrounds; game pages keep their colours');
