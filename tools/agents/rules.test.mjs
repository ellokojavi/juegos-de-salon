// The rule registry (D-541): every rule has its form, every check names files that exist, every
// judged rule names its reviewer, every canon is registered, the usability marks agree with docs/USABILIDAD.md and the index is fresh
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, readRegistry, problems, problemsOf, withIndex, debtCount, buildReport, formatReport, repeatedFixes, lastRecorded, readDebtLog } from './rules.mjs';

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
// the rules round (#1249 step 16): debt per ratchet, judged without reviewer, repeated fixes
assert.equal(debtCount([1, 2, 3]), 3);
assert.equal(debtCount({ _about: 'x', entries: [1, 2] }), 2);
assert.equal(debtCount({ about: 'x', a: {}, b: {} }), 2);
assert.equal(debtCount({ about: 'x', paths: { a: { state: 'pending' }, b: { state: 'done' } } }), 1);
const fake = [
  { id: 'R', title: 't', doc: 'd', form: ['ratchet'], debt: 'list.json' },
  { id: 'C-4', title: 't', doc: 'd', form: ['judged'], reviewer: 'x' },
  { id: 'C-9', title: 't', doc: 'd', form: ['check'] },
  { id: 'J', title: 't', doc: 'd', form: ['judged'] },
];
const rep = buildReport({ rules: fake, read: () => [1, 2], date: '2026-11-07', log: { '2026-11-01': { R: 5 }, '2026-11-07': { R: 1 } },
  subjects: ['Fix C-4 sound', 'fix: C-4 again', 'Fix C-9 x', 'fixes C-9 y', 'Add C-4 thing', 'fix D-12 once'] });
assert.deepEqual(rep.debt, [{ id: 'R', debt: 'list.json', count: 2, last: 5, delta: -3 }], 'the trend is against the round before today');
assert.deepEqual(rep.unreviewed, ['J']);
assert.deepEqual(rep.repeated.map(c => [c.id, c.count]), [['C-4', 2]], 'a checked rule and a single fix are not candidates');
assert.match(formatReport(rep), /R: 2 in list\.json \(shrank by 3/);
assert.equal(repeatedFixes(['fix english x', 'fix english y'], [{ id: 'english', form: ['judged'] }])[0]?.id, 'english');

// the ratchet's teeth: a 📈 rule's debt never exceeds its last recorded count (docs/rules-debt.json)
const now = buildReport({ rules, log: readDebtLog() });
const recorded = lastRecorded(readDebtLog());
for (const d of now.debt) {
  assert.ok(recorded[d.id] !== undefined, `${d.id}: no count in docs/rules-debt.json: node tools/agents/rules.mjs report --record`);
  assert.ok(d.count <= recorded[d.id], `${d.id}: its debt grew to ${d.count} (last recorded ${recorded[d.id]}); pay it down, never add to it`);
}

console.log(`ok · rules: ${rules.length} registered`);
