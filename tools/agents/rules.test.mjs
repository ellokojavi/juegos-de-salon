// The rule registry (D-541): every rule has its form, every check names files that exist, every
// judged rule names its reviewer, the usability marks agree with docs/USABILIDAD.md and the index is fresh
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

// the index in docs/RULES.md is generated and fresh
const doc = readFileSync(join(ROOT, 'docs', 'RULES.md'), 'utf8');
assert.equal(withIndex(doc, rules), doc, 'docs/RULES.md index is stale: node tools/agents/rules.mjs index');
console.log(`ok · rules: ${rules.length} registered`);
