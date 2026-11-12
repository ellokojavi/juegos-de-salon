// No faux bold (the countdown's last digit was cut off on an iPad's Safari): a rule that sets the display
// font (Bangers) asks only for a weight base.css loads for it. WebKit fakes a missing weight by
// thickening each glyph to the right without widening its box, so the last letter sticks out and is
// clipped (on a composited layer, under a transform). base.css also sets `font-synthesis: none` on
// :root as the net, and the big display text carries --ink-overhang of inline padding.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(HERE, '..', '..');
const walk = dir => readdirSync(dir).flatMap(n => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const base = readFileSync(join(HERE, 'base.css'), 'utf8');

// The net: the browser never invents a weight or a slant
assert.match(base, /:root\s*{[^}]*font-synthesis:\s*none/, 'base.css sets font-synthesis: none on :root');
assert.match(base, /--ink-overhang:/, 'base.css defines --ink-overhang');

// The weights each family is loaded in
const loaded = {};
for (const [face] of base.matchAll(/@font-face\s*{[^}]*}/g)) {
  const fam = face.match(/font-family:\s*'([^']+)'/)[1];
  const w = Number(face.match(/font-weight:\s*(\d+)/)?.[1] ?? 400);
  (loaded[fam] ??= new Set()).add(w);
}
const bangers = loaded.Bangers;
assert.ok(bangers?.size, 'base.css loads Bangers');

const toNum = w => ({ normal: 400, bold: 700 })[w] ?? Number(w);
const bad = [];
for (const f of walk(PUBLIC).filter(f => f.endsWith('.css'))) {
  const css = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of css.matchAll(/([^{}]+){([^{}]*)}/g)) {
    const [, sel, body] = m;
    if (!/font-family:[^;]*(--font-display|Bangers)/.test(body)) continue;
    const w = body.match(/font-weight:\s*([a-z0-9]+)/)?.[1];
    if (w && /^(\d+|normal|bold)$/.test(w) && !bangers.has(toNum(w))) {
      bad.push(`${relative(PUBLIC, f)}: ${sel.trim()} asks Bangers for ${w}`);
    }
  }
}
assert.deepEqual(bad, [], `Bangers is loaded only in ${[...bangers]}: a heavier weight is faked by the browser and the last letter is cut off on Safari`);
console.log('font-synthesis: ok');
