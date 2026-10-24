// Agentes: the clue colors stay away from red and pink, which mean a mistake (the assassin, a cut
// clue). A player read the old pink clue as an error; this keeps every clue color, on the cards,
// the sign and the notice, out of the reds and away from the marks' yellow.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('./style.css', import.meta.url), 'utf8');

function hue([r, g, b]) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (!d) return null;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

const colores = new Map();
for (const [, k, rgb] of css.matchAll(/\.ag-(?:carta\.agente|pista|aviso)\.g(\d)[^{]*\{\s*(?:--g:\s*|color:\s*rgb\()([\d,\s]+)/g))
  colores.set(`g${k}: ${rgb.trim()}`, rgb.split(',').map(Number));
assert.ok(colores.size >= 4, 'the clue colors were not found in style.css');

for (const [nombre, rgb] of colores) {
  const h = hue(rgb);
  assert.ok(h !== null, `${nombre}: a gray is not a clue color`);
  // Red and pink run from magenta to orange; yellow is the marks'
  assert.ok(!(h >= 300 || h < 30), `${nombre}: hue ${Math.round(h)}° looks like an error (red or pink)`);
  assert.ok(!(h >= 40 && h < 65), `${nombre}: hue ${Math.round(h)}° is the marks' yellow`);
}
console.log(`✓ ${colores.size} clue colors, none red, pink or yellow`);
