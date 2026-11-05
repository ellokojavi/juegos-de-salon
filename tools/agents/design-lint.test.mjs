// node tools/agents/design-lint.test.mjs — the design system's measurable rules (D-533, D-520): each
// rule on its own, and the ratchet: no stylesheet's count grows past docs/design-baseline.json.
// tests.yml runs it with every *.test.mjs.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normColour, rules, definedClasses, lintCss, tokens, lint, ratchet, counts, sources, allowlist } from './design-lint.mjs';

let n = 0;
const test = (name, fn) => { try { fn(); n++; } catch (e) { console.error(`✗ ${name}`); throw e; } };
const T = tokens();
const by = (hits, rule) => hits.filter(h => h.rule === rule);

test('a colour literal is normalised: #fff, #ffffff and rgb(255,255,255) are the same; alpha is kept', () => {
  assert.equal(normColour('#FFF'), 'ffffff');
  assert.equal(normColour('#ffffff'), 'ffffff');
  assert.equal(normColour('rgb(255, 255, 255)'), 'ffffff');
  assert.equal(normColour('rgba(255,255,255,0.72)'), 'ffffff/0.72');
  assert.equal(normColour('#ffffffb8'), 'ffffff/0.72');
  assert.equal(normColour('var(--pink)'), null);
});

test('the tokens of base.css: the scales are read from it, so a new step there is a new step here', () => {
  assert.ok(T.space.has(12) && T.space.has(32) && !T.space.has(13));
  assert.ok(T.radius.has(8) && T.radius.has(14) && T.radius.has(22) && T.radius.has(999) && !T.radius.has(18));
  assert.equal(T.colours['ff2e88'], '--pink');
  assert.equal(T.colours['ffffff/0.72'], '--muted');
  assert.ok(T.textSize.has(0.85) && T.textSize.has(0.9) && !T.textSize.has(0.95));
});

test('rules(): selectors, declarations and their lines; comments, @font-face and @keyframes skipped, @media flattened', () => {
  const css = `/* c */\n.a { color: red; padding: 4px }\n@media (max-width: 320px) { .b { gap: 8px; } }\n@keyframes k { from { top: 0 } to { top: 1px } }\n@font-face { font-family: X; src: url(x) }\n.c:active, .d { margin: 0 }`;
  const r = rules(css);
  assert.deepEqual(r.map(x => x.selector), ['.a', '.b', '.c:active, .d']);
  assert.equal(r[0].decls[1].prop, 'padding');
  assert.equal(r[0].line, 2);
  assert.equal(r[1].line, 3);
  assert.deepEqual([...definedClasses(css)].sort(), ['a', 'b', 'c', 'd']);
});

test('token-colour: a token written by hand says which token', () => {
  const h = lintCss('.x { color: #2ee6d6; background: rgba(255,255,255,0.08); }', 'public/g/style.css', T);
  assert.deepEqual(by(h, 'token-colour').map(x => x.fix), ['var(--cyan)', 'var(--glass)']);
});

test('colour: any other literal is a hit, except in the game\'s own --token declarations and in rgba(var(--x))', () => {
  const h = lintCss('.x { --mar: #0b1e3f; color: #ff8a8a; background: rgba(var(--g), 0.5); border-color: rgb(1,2,3); }', 'public/g/style.css', T);
  assert.deepEqual(by(h, 'colour').map(x => x.what), ['color: #ff8a8a', 'border-color: rgb(1,2,3)']);
});

test('radius: off the corner scale, with the neighbours named; 50%, 0 and the scale pass; calc() is skipped', () => {
  const h = lintCss('.x { border-radius: 18px; } .y { border-radius: 50%; } .z { border-radius: 12px 999px; } .w { border-radius: calc(var(--r-12) + 2px); }', 'public/g/style.css', T);
  assert.equal(by(h, 'radius').length, 1);
  assert.equal(by(h, 'radius')[0].fix, '--r-16 (16) or --r-22 (22)');
});

test('space: padding, margin and gap off the 2 px grid; 1 px is a hairline; positions (top, left) are not spacing', () => {
  const h = lintCss('.x { padding: 7px 11px; margin: -3px 0; gap: 1px; top: 5px; padding-bottom: calc(76px + env(safe-area-inset-bottom)); }', 'public/g/style.css', T);
  assert.deepEqual(by(h, 'space').map(x => x.fix), ['--s-6 (6) or --s-8 (8)', '--s-10 (10) or --s-12 (12)', '--s-2 (2) or --s-4 (4)']);
});

test('copied: a class of base.css or ranking.css redeclared, or a component phase 4 brings; a context (.g .btn) is not', () => {
  const h = lintCss('.btn { color: red } .btn--yellow:active { top: 0 } .g .btn { width: auto } .player-row input { color: red } .zzz-own { color: red }', 'public/g/style.css', T);
  assert.deepEqual(by(h, 'copied').map(x => x.what), ['.btn', '.btn--yellow:active', '.player-row input']);
  assert.equal(lintCss('.btn { color: red }', 'public/assets/css/base.css', T).length, 0, 'base.css defines them');
});

test('text-size: a rem size between two steps is the wrong step; the shared sheets are exempt', () => {
  assert.equal(by(lintCss('.x { font-size: 0.95rem } .y { font-size: 0.9rem } .z { font-size: 14px }', 'public/g/style.css', T), 'text-size').length, 1);
  assert.equal(by(lintCss('.x { font-size: 0.95rem }', 'public/assets/css/base.css', T), 'text-size').length, 0);
});

test('the allowlist: every entry has a reason and names a file git knows; none is stale', () => {
  const files = sources();
  for (const e of allowlist()) {
    assert.ok(e.reason && e.reason.length > 10, `${e.file} ${e.rule}: a reason`);
    assert.ok(files.includes(e.file), `${e.file}: a stylesheet git knows`);
  }
  const { stale } = lint();
  assert.deepEqual(stale.map(e => `${e.file} ${e.rule} ${e.what}`), [], 'stale allowlist entries');
});

test('the ratchet: no stylesheet\'s count grows past docs/design-baseline.json (node tools/agents/design-lint.mjs baseline after a migration), and the baseline names no file that is gone', () => {
  const { hits } = lint();
  const { grew, gone } = ratchet(hits);
  assert.deepEqual(grew.map(g => `${g.file} ${g.rule}: ${g.was} → ${g.now}`), [], 'a count grew: use the token or allowlist the hit with its reason (docs/DESIGN.md)');
  assert.deepEqual(gone, [], 'the baseline names a stylesheet that is gone: rewrite it');
  const base = JSON.parse(readFileSync(new URL('../../docs/design-baseline.json', import.meta.url), 'utf8'));
  const total = Object.values(counts(hits)).reduce((a, r) => a + Object.values(r).reduce((x, y) => x + y, 0), 0);
  assert.ok(total <= base.total, `the total grew: ${base.total} → ${total}`);
});

console.log(`✓ design-lint: ${n} tests`);
