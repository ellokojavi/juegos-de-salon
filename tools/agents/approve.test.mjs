// One-tap decisions (D-273): which checkbox counts, who may check it and which actions are accepted.
import assert from 'node:assert/strict';
import { plan, checkedWithoutResult, question, checkboxes, newlyChecked, readActions, invalidAction, recordDone, doneSet, normalizeAction, OWNER } from './approve.mjs';
import { decisionsBody } from './processes.mjs';

const decisions = {
  title: 'Processes: 2026-10-11',
  summary: 'Two things to decide.',
  decisions: [
    { question: 'Merge the docs of the 11th', context: 'PR #300, green.', yes: [{ type: 'merge', pr: 300 }], no: [{ type: 'close-pr', pr: 300, reason: 'no' }] },
    { question: 'Close #276', yes: [{ type: 'close-issue', issue: 276 }] },
  ],
};
const body = decisionsBody(decisions);
const check = (c, op) => c.replace(new RegExp(`- \\[ \\](.*?<!-- op:${op} -->)`), '- [x]$1');
const event = (before, after, extra = {}) => ({
  action: 'edited', sender: { login: OWNER },
  issue: { number: 9, state: 'open', user: { login: OWNER }, labels: [{ name: 'processes' }], body: after },
  changes: { body: { from: before } }, ...extra,
});

// The body processes.mjs builds can be read back
assert.deepEqual(checkboxes(body), { '1:si': false, '1:no': false, '2:si': false, '2:no': false });
assert.deepEqual(readActions(body)['1:si'], [{ type: 'merge', pr: 300 }]);
assert.deepEqual(readActions(body)['2:no'], [{ type: 'nothing' }], 'a No without actions is only noted');
assert.match(body, /Merge the docs of the 11th/);
assert.match(body, /Check one box on each/);

// Each checkbox says what it does, and the comment names the question
assert.match(body, /^- \[ \] Yes: merges #300 <!-- op:1:si -->$/m);
assert.match(body, /^- \[ \] No: closes #300 <!-- op:1:no -->$/m);
assert.equal(question(body, 2), 'Close #276');
assert.equal(question(body, 7), 'Decision 7');

// Checking a box: a plan with its actions
const yes1 = check(body, '1:si');
assert.deepEqual(newlyChecked(body, yes1), ['1:si']);
assert.deepEqual(plan(event(body, yes1)).plans, [{ decision: '1', option: 'si', actions: [{ type: 'merge', pr: 300 }] }]);

// Only the owner, on their own issue, with the label and open
assert.match(plan({ ...event(body, yes1), sender: { login: 'other' } }).ignore, /other/);
assert.match(plan(event(body, yes1, { issue: { ...event(body, yes1).issue, user: { login: 'other' } } })).ignore, /opened by other/);
assert.equal(plan(event(body, yes1, { issue: { ...event(body, yes1).issue, user: { login: 'github-actions[bot]' } } })).plans.length, 1, 'the bot opens the decisions issues');
assert.match(plan(event(body, yes1, { issue: { ...event(body, yes1).issue, labels: [] } })).ignore, /label/);
assert.equal(plan(event(body, yes1, { issue: { ...event(body, yes1).issue, labels: [{ name: 'procesos' }] } })).plans.length, 1, 'the label before D-316 still counts');
assert.match(plan(event(body, yes1, { issue: { ...event(body, yes1).issue, state: 'closed' } })).ignore, /closed/);
assert.match(plan({ ...event(body, yes1), action: 'opened' }).ignore, /not an edit/);

// A checkbox cannot bring new actions in the same edit
const cheat = yes1.replace('"pr":300', '"pr":301');
assert.match(plan(event(body, cheat)).ignore, /actions block changed/);

// Unchecking or editing text does nothing
assert.match(plan(event(yes1, body)).ignore, /no new checkbox/);
assert.match(plan(event(body, body + '\nnote')).ignore, /no new checkbox/);

// A decision made is not made again; Yes and No at once: the first one counts
const done = recordDone(yes1, '1', 'si', '✅ #300 merged');
assert.ok(doneSet(done).has('1'));
assert.match(done, /<!-- op:1:si --> — ✅ #300 merged <!-- hecho:1 -->/);
const p = plan(event(done, check(done, '1:no')));
assert.equal(p.plans.length, 0);
assert.match(p.warnings[0], /^Merge the docs of the 11th: already answered/);
const both = plan(event(body, check(yes1, '1:no')));
assert.equal(both.plans.length, 1);
assert.equal(both.warnings.length, 1);

// A failed attempt does not make the decision, and the retry replaces its result
const failed = recordDone(yes1, '1', 'si', '❌ the checks did not pass', false);
assert.equal(doneSet(failed).size, 0);
assert.match(recordDone(failed, '1', 'si', '✅ ok'), /<!-- op:1:si --> — ✅ ok <!-- hecho:1 -->$/m);
assert.doesNotMatch(recordDone(failed, '1', 'si', '✅ ok'), /❌/);

// Two decisions in the same edit
assert.equal(plan(event(body, check(yes1, '2:si'))).plans.length, 2);

// The closed list of actions, in English and in Spanish (issues before D-316)
assert.equal(invalidAction({ type: 'merge', pr: 3 }), null);
assert.equal(invalidAction({ tipo: 'fusionar', pr: 3 }), null);
assert.equal(invalidAction({ type: 'run', workflow: 'e2e.yml' }), null);
assert.equal(invalidAction({ tipo: 'comentar', en: 4, texto: 'hi' }), null);
assert.match(invalidAction({ type: 'run', workflow: 'other.yml' }), /only/);
assert.match(invalidAction({ type: 'delete-branch', branch: 'main' }), /unknown/);
assert.match(invalidAction({ type: 'merge', pr: '3' }), /without a PR number/);
assert.throws(() => decisionsBody({ title: 'x', decisions: [{ question: 'y', yes: [{ type: 'shell', cmd: 'rm' }] }] }), /unknown/);
assert.deepEqual(normalizeAction({ tipo: 'cerrar-pr', pr: 2, motivo: 'old' }), { type: 'close-pr', pr: 2, reason: 'old' });
assert.deepEqual(normalizeAction({ tipo: 'encolar', tarea: 't' }), { type: 'queue', task: 't' });

// A cancelled run does not lose its decision: the next one does the checked boxes without a result
const three = check(check(yes1, '2:si'), '2:si');
const withOne = recordDone(three, '1', 'si', '✅ #300 merged');
assert.deepEqual(checkedWithoutResult(withOne), ['2:si']);
const late = plan(event(yes1, check(yes1, '2:si')), OWNER, withOne);
assert.deepEqual(late.plans.map(p => `${p.decision}:${p.option}`), ['2:si'], 'another run already did 1; 2 gets done');
assert.deepEqual(checkedWithoutResult(recordDone(withOne, '2', 'si', '❌ failed', false)), [], 'a failed one is not retried by itself');

// Issues opened before D-316 (in Spanish) still parse: the markers and the Spanish actions
const old = ['### 1. Fusionar el #300', '- [ ] Sí: fusiona #300 <!-- op:1:si -->', '- [ ] No <!-- op:1:no -->', '',
  `<!-- acciones ${JSON.stringify({ '1:si': [{ tipo: 'fusionar', pr: 300 }], '1:no': [{ tipo: 'nada' }] })} -->`].join('\n');
assert.equal(question(old, 1), 'Fusionar el #300');
assert.deepEqual(plan(event(old, check(old, '1:si'))).plans, [{ decision: '1', option: 'si', actions: [{ type: 'merge', pr: 300 }] }]);
assert.ok(doneSet(recordDone(check(old, '1:si'), '1', 'si', '✅ #300 fusionado')).has('1'));

console.log('approve: ok');

// D-409: "Yes, and publish" is a third box; checking it and "Yes, in Labs" together carries out one
const labOrPub = decisionsBody({ decisions: [{ question: 'Choose the box', yes: [{ type: 'queue', task: 'build it' }] }] });
const pubChecked = check(labOrPub, '1:pub');
assert.deepEqual(plan(event(labOrPub, pubChecked)).plans, [{ decision: '1', option: 'pub', actions: [{ type: 'queue', task: '[publish] build it' }] }]);
const labAndPub = check(pubChecked, '1:si');
const twoBoxes = plan(event(labOrPub, labAndPub));
assert.equal(twoBoxes.plans.length, 1);
assert.match(twoBoxes.warnings[0], /already answered/);
