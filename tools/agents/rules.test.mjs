// The rule registry (D-541): every rule has its form, every check names files that exist, every
// judged rule names its reviewer, every canon is registered, the usability marks agree with docs/USABILIDAD.md and the index is fresh
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, readRegistry, problems, problemsOf, withIndex } from './rules.mjs';

// the shape check itself
const yes = () => true, no = () => false;
assert.deepEqual(problemsOf({ id: 'X', title: 't', doc: 'd', form: ['check'], enforcedBy: ['a.test.mjs'] }, yes), []);
assert.ok(problemsOf({ id: 'X', title: 't', doc: 'd', form: [] }, yes).some(p => /no form/.test(p)));
assert.ok(problemsOf({ id: 'X', title: 't', doc: 'd', form: ['check'] }, yes).some(p => /enforcedBy/.test(p)));
assert.ok(problemsOf({ id: 'X', title: 't', doc: 'd', form: ['check'], enforcedBy: ['gone.mjs'] }, no).some(p => /does not exist/.test(p)));
assert.ok(problemsOf({ id: 'X', title: 't', doc: 'd', form: ['ratchet'], enforcedBy: ['a'] }, yes).some(p => /debt/.test(p)));
assert.ok(problemsOf({ id: 'X', title: 't', doc: 'd', form: ['judged'] }, yes).some(p => /reviewer/.test(p)));

// the registry as it is
const rules = readRegistry();
assert.deepEqual(problems(rules), [], 'docs/rules.json');

// every U-n in docs/USABILIDAD.md is registered with the same mark
const marks = { '🤖': ['check'], '👁': ['judged'], '🤖👁': ['check', 'judged'] };
const usab = readFileSync(join(ROOT, 'docs', 'USABILIDAD.md'), 'utf8');
const byId = Object.fromEntries(rules.map(r => [r.id, r]));
const found = [...usab.matchAll(/^- (🤖👁|🤖|👁) \*\*(U-\d+) ·/gm)];
assert.ok(found.length >= 30, 'the U-n marks are read');
for (const [, m, id] of found) {
  assert.ok(byId[id], `${id} is in docs/USABILIDAD.md but not in docs/rules.json`);
  assert.deepEqual(byId[id].form, marks[m], `${id}: docs/USABILIDAD.md marks it ${m}`);
}

// every canon (C-n) in docs/CANONS.md is registered (#1249 step 3)
const canons = readFileSync(join(ROOT, 'docs', 'CANONS.md'), 'utf8');
const canonIds = [...canons.matchAll(/^## (C-\d+b?) ·/gm)].map(m => m[1]);
assert.ok(canonIds.length >= 20, 'the canons are read');
for (const id of canonIds) assert.ok(byId[id], `${id} is in docs/CANONS.md but not in docs/rules.json`);

// the index in docs/RULES.md is generated and fresh
const doc = readFileSync(join(ROOT, 'docs', 'RULES.md'), 'utf8');
assert.equal(withIndex(doc, rules), doc, 'docs/RULES.md index is stale: node tools/agents/rules.mjs index');
console.log(`ok · rules: ${rules.length} registered`);
