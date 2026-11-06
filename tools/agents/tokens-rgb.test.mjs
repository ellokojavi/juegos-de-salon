// node tools/agents/tokens-rgb.test.mjs — a colour token used at an alpha has a channels companion,
// `--cyan: #2ee6d6; --cyan-rgb: 46 230 214;`, written as `rgb(var(--cyan-rgb) / 0.6)` (docs/DESIGN.md §1):
// the relative-colour form `rgb(from var(--cyan) r g b / 0.6)` is dropped by browsers before Chrome 119,
// Safari 16.4 and Firefox 128. The two are kept by hand, so this keeps them in sync, in every sheet:
// each `--x-rgb` equals the channels of the `--x` declared in the same rule, and a rule that
// (re)declares an `--x` that has a companion anywhere declares its `--x-rgb` too (Pintaminas' hard mode
// redeclares --bg1…--bg3 on body). tests.yml runs it with every *.test.mjs.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rules, sources } from './design-lint.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
let n = 0;
const test = (name, fn) => { try { fn(); n++; } catch (e) { console.error(`✗ ${name}`); throw e; } };

/** A colour's channels as `r g b`, or null: #rgb, #rrggbb, rgb()/rgba() with commas or spaces. */
export function channels(v) {
  v = v.trim().toLowerCase();
  let m = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (m) { const h = m[1].length === 3 ? [...m[1]].map(c => c + c).join('') : m[1]; return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)).join(' '); }
  m = v.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/);
  return m ? `${+m[1]} ${+m[2]} ${+m[3]}` : null;
}

test('channels() reads hex and rgb()', () => {
  assert.equal(channels('#2ee6d6'), '46 230 214');
  assert.equal(channels('#000'), '0 0 0');
  assert.equal(channels('rgba(0, 0, 0, 0.25)'), '0 0 0');
  assert.equal(channels('var(--x)'), null);
});

const sheets = sources().map(f => [f, rules(readFileSync(join(ROOT, f), 'utf8'))]);
const companions = new Set();
for (const [, rs] of sheets) for (const r of rs) for (const d of r.decls) if (/^--[\w-]+-rgb$/.test(d.prop)) companions.add(d.prop.slice(0, -4));

test('there are companions to check (base.css declares --cyan-rgb)', () => assert.ok(companions.has('--cyan')));

test('every --x-rgb equals the channels of the --x in the same rule, and every --x with a companion declares it', () => {
  const bad = [];
  for (const [f, rs] of sheets) for (const r of rs) {
    const own = Object.fromEntries(r.decls.filter(d => d.prop.startsWith('--')).map(d => [d.prop, d.value.trim()]));
    for (const [prop, value] of Object.entries(own)) {
      if (prop.endsWith('-rgb') && companions.has(prop.slice(0, -4))) {
        const base = own[prop.slice(0, -4)];
        if (base === undefined) bad.push(`${f}:${r.line} ${prop} without ${prop.slice(0, -4)} in the same rule`);
        else if (/^var\(--[\w-]+\)$/.test(base) ? value !== base.replace(/\)$/, '-rgb)') : channels(base) !== value.replace(/\s+/g, ' '))
          bad.push(`${f}:${r.line} ${prop}: ${value} is not ${prop.slice(0, -4)}: ${base}`);
      } else if (companions.has(prop) && own[`${prop}-rgb`] === undefined) bad.push(`${f}:${r.line} ${prop} redeclared without ${prop}-rgb`);
    }
  }
  assert.deepEqual(bad, []);
});

test('no stylesheet uses an --x-rgb nobody declares', () => {
  const bad = [];
  for (const [f] of sheets) for (const m of readFileSync(join(ROOT, f), 'utf8').matchAll(/var\((--[\w-]+)-rgb\)/g)) if (!companions.has(m[1])) bad.push(`${f} ${m[1]}-rgb`);
  assert.deepEqual(bad, []);
});

console.log(`✓ tokens-rgb: ${n} tests (${companions.size} companions)`);
