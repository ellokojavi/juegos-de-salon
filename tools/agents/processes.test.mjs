// The processes agent (D-273): which PRs count as "waiting", the queue of what was approved and the patterns.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { waits, backlog, queued, ideasWaiting, recordPattern, decisionsBody, FIX, toDispatch, MEMORY, EXECUTORS, resolveCommit } from './processes.mjs';
import { recordDone } from './approve.mjs';

const now = Date.parse('2026-10-11T12:00:00Z');
const pr = x => ({ createdAt: '2026-10-11T10:00:00Z', baseRefName: 'main', mergeable: 'MERGEABLE', autoMergeRequest: null, statusCheckRollup: [], ...x });

assert.deepEqual(waits(pr({}), now), [], 'a PR from today is not waiting yet');
assert.match(waits(pr({ createdAt: '2026-10-08T10:00:00Z' }), now)[0], /no auto-merge for 3 days/);
assert.deepEqual(waits(pr({ createdAt: '2026-10-08T10:00:00Z', autoMergeRequest: {} }), now), []);
assert.match(waits(pr({ baseRefName: 'docs-2026-10-11' }), now)[0], /stacked/);
assert.match(waits(pr({ mergeable: 'CONFLICTING' }), now)[0], /conflicts/);
assert.match(waits(pr({ statusCheckRollup: [{ name: 'tests', conclusion: 'FAILURE' }] }), now)[0], /red: tests/);
assert.deepEqual(waits(pr({ isDraft: true, mergeable: 'CONFLICTING' }), now), [], 'a draft waits for nobody');

// What was approved with "queue" stays queued only if it was checked and carried out
const body = decisionsBody({ decisions: [
  { question: 'Test for the share message', yes: [{ type: 'queue', task: 'write messages.test.mjs' }] },
  { question: 'Another', yes: [{ type: 'queue', task: 'not approved' }] },
] });
assert.deepEqual(queued([{ number: 5, body }]), []);
const approved = recordDone(body.replace(/- \[ \](.*?<!-- op:1:si -->)/, '- [x]$1'), '1', 'si', '✅');
assert.deepEqual(queued([{ number: 5, body: approved }]), [{ id: '#5:1', task: '[labs] write messages.test.mjs' }]);
// An issue from before D-316, with a Spanish "encolar", is still read
const old = `- [x] Sí <!-- op:1:si --> — ✅ <!-- hecho:1 -->\n<!-- acciones ${JSON.stringify({ '1:si': [{ tipo: 'encolar', tarea: 'vieja' }] })} -->`;
assert.deepEqual(queued([{ number: 3, body: old }]), [{ id: '#3:1', task: 'vieja' }]);

// Each checkbox says what it does; one that does nothing, just Yes or No
assert.match(body, /^- \[ \] Yes, in Labs: queues it for the next round, in Labs <!-- op:1:si -->$/m);
// D-409: a change answers in three; "Yes, and publish" queues the same task for everyone
assert.match(body, /^- \[ \] Yes, and publish: queues it for the next round, for everyone <!-- op:1:pub -->$/m);
const published = recordDone(body.replace(/- \[ \](.*?<!-- op:1:pub -->)/, '- [x]$1'), '1', 'pub', '✅');
assert.deepEqual(queued([{ number: 5, body: published }]), [{ id: '#5:1', task: '[publish] write messages.test.mjs' }]);
// A prepared PR offers publishing only with its own actions; a Yes that closes something, just Yes / No
const merge = decisionsBody({ decisions: [{ question: 'Merge the lab PR', yes: [{ type: 'merge', pr: 9 }] }, { question: 'Merge both', yes: [{ type: 'merge', pr: 9 }], publish: [{ type: 'merge', pr: 10 }] }] });
assert.doesNotMatch(merge, /op:1:pub/);
assert.match(merge, /^- \[ \] Yes: merges #9 <!-- op:1:si -->$/m);
assert.match(merge, /^- \[ \] Yes, and publish: merges #10 <!-- op:2:pub -->$/m);
assert.match(body, /^- \[ \] No <!-- op:1:no -->$/m);

// A pattern counts once per commit
const m = { patterns: [] };
assert.equal(recordPattern(m, 'share-message', 'the message did not name One a day', { date: 'a', commit: 'abc' }), 1);
assert.equal(recordPattern(m, 'share-message', 'again', { date: 'b', commit: 'abc' }), 1);
assert.equal(recordPattern(m, 'share-message', 'again', { date: 'b', commit: 'def' }), 2);

// The subjects that give away something that fell behind (the history is in Spanish)
assert.ok(FIX.test('Marketing: el video quedó atrás de ¿Dónde queda?'));
assert.ok(FIX.test('Ronda de usabilidad: marketing al día con D-203'));
assert.ok(FIX.test('Marketing: the video fell behind Where is it?'));
assert.ok(!FIX.test('Zip: diez niveles nuevos'));
assert.ok(!FIX.test('Uno al día con jugador: historia en Firebase'));
assert.ok(!FIX.test('Zip: ten new levels'));

// Whom to dispatch (D-276)
assert.deepEqual(toDispatch({ docCommits: 0, publicCommits: 0, usabilityDays: 2 }), [], 'without changes nobody is launched');
assert.deepEqual(toDispatch({ docCommits: 3, publicCommits: 0, usabilityDays: 2 }).map(d => d.agent), ['documentation']);
assert.deepEqual(toDispatch({ docCommits: 0, publicCommits: 0, usabilityDays: 2, emails: 2 }).map(d => d.agent), ['support'], 'emails at hola@ launch the support agent (D-318)');
assert.deepEqual(toDispatch({ docCommits: 0, publicCommits: 0, usabilityDays: 2, emails: null }), [], 'without the inbox user, nobody');
assert.deepEqual(toDispatch({ docCommits: 0, publicCommits: 2, usabilityDays: 1 }).map(d => d.agent), ['usability']);
assert.match(toDispatch({ docCommits: 0, publicCommits: null, usabilityDays: null })[0].reason, /never/);
assert.match(toDispatch({ docCommits: 0, publicCommits: 0, usabilityDays: 7 })[0].reason, /week/);
// The game-ideas agent, once a week (D-360)
assert.deepEqual(toDispatch({ docCommits: 0, publicCommits: 0, usabilityDays: 2, ideasDays: 6 }), [], 'six days: not yet');
assert.deepEqual(toDispatch({ docCommits: 0, publicCommits: 0, usabilityDays: 2, ideasDays: 7 }).map(d => [d.agent, d.reason]), [['ideas', 'a week since its last round (7 days)']]);
assert.deepEqual(toDispatch({ docCommits: 0, publicCommits: 0, usabilityDays: 2, ideasDays: null }).map(d => d.agent), ['ideas'], 'never dispatched: it goes');
assert.deepEqual(toDispatch({ docCommits: 2, publicCommits: 1, usabilityDays: 1, ideasDays: 9 }).map(d => d.agent), ['documentation', 'usability', 'ideas']);
// D-440: the ideas agent is not launched while its last issue still has unanswered questions
assert.deepEqual(toDispatch({ docCommits: 0, publicCommits: 0, usabilityDays: 2, ideasDays: 9, ideasWaiting: 556 }), [], 'the owner has not answered #556 yet: no ideas round');
assert.deepEqual(toDispatch({ docCommits: 0, publicCommits: 0, usabilityDays: 2, ideasDays: null, ideasWaiting: 556 }).map(d => d.agent), ['ideas'], 'never dispatched still goes');
{
  const box = (n, done) => `- [${done ? 'x' : ' '}] Yes <!-- op:${n}:si -->${done ? ` — ✅ noted <!-- hecho:${n} -->` : ''}`;
  const acts = '<!-- acciones {"1:si":[{"type":"nothing"}],"2:si":[{"type":"nothing"}]} -->';
  const lab = [{ name: 'processes' }];
  assert.equal(ideasWaiting([{ number: 556, title: 'Ideas: 2026-10-19', labels: lab, body: [box(1, true), box(2, false), acts].join('\n') }]), 556, 'one question unanswered: waiting');
  assert.equal(ideasWaiting([{ number: 556, title: 'Ideas: 2026-10-19', labels: lab, body: [box(1, true), box(2, true), acts].join('\n') }]), null, 'all answered: the round goes and records them');
  assert.equal(ideasWaiting([{ number: 600, title: 'Processes: 2026-10-20', labels: lab, body: [box(1, false), acts].join('\n') }]), null, 'a processes issue is not an ideas issue');
}
assert.deepEqual(backlog([{ number: 9, title: 'Processes round missed', labels: [], createdAt: '2026-10-20T00:00:00Z', author: { login: 'ellokojavi' } }]), [], "the watchdog's issue is not an owner's to-do (D-440)");
assert.deepEqual(backlog([{ number: 10, title: 'Pending work', labels: [], createdAt: '2026-10-20T00:00:00Z', author: { login: 'ellokojavi' } }]), [], "pending-watch's issue is not an owner's to-do (D-441)");

assert.ok(EXECUTORS.includes('ideas'), 'ideas can be recorded with dispatch');

// The repo's memory has the shape the tool reads (keys in English since D-316)
const memory = JSON.parse(readFileSync(MEMORY, 'utf8'));
for (const k of ['checkedUpTo', 'patterns', 'mechanisms', 'queueDone', 'dispatches', 'rounds']) assert.ok(k in memory, `docs/processes.json without "${k}"`);
for (const k of Object.keys(memory.dispatches)) assert.ok(EXECUTORS.includes(k), `unknown executor in dispatches: ${k}`);
for (const p of memory.patterns) assert.ok(p.key && p.what && Array.isArray(p.seen), `pattern without key, what or seen: ${JSON.stringify(p).slice(0, 80)}`);

console.log('processes: ok');

// The owner's backlog (D-339): issues with no label, oldest first; labelled ones and "main is red" stay out
{
  const i = (number, createdAt, labels = [], title = 'x', login = 'ellokojavi') => ({ number, title, createdAt, labels: labels.map(name => ({ name })), author: { login } });
  const b = backlog([i(5, '2026-10-10T00:00:00Z'), i(6, '2026-10-01T00:00:00Z'), i(7, '2026-10-01T00:00:00Z', ['feedback']), i(8, '2026-10-01T00:00:00Z', [], 'main is red: x'), i(11, '2026-10-01T00:00:00Z', [], 'x', 'stranger'), { ...i(12, '2026-10-01T00:00:00Z'), author: undefined }], now);
  assert.deepEqual(b.map(x => x.number), [6, 5]);
  assert.equal(b[0].days, 10);
}

// A Yes must say what it does (#607): empty is refused, and `nothing` when the text promises work
const q = (yes, context = '') => () => decisionsBody({ decisions: [{ question: 'Let the player tap the box?', context, yes }] });
assert.throws(q(undefined), /no Yes actions/);
assert.throws(q([]), /no Yes actions/);
assert.throws(q([{ type: 'nothing' }], 'It changes the shared keyboard, so it is queued rather than done blind.'), /does nothing/);
assert.throws(q([{ type: 'nothing' }], 'Built first behind the lab key.'), /does nothing/);
assert.doesNotThrow(q([{ type: 'nothing' }], 'A Yes only records your taste.'));
assert.match(decisionsBody({ decisions: [{ question: 'x', context: 'queued for the next round', yes: [{ type: 'queue', task: 'build it' }] }] }), /queues it for the next round/);

// record/dispatch refuse a commit that does not exist or is not on main (525888f, 2026-10-30)
const full = 'a'.repeat(40);
assert.equal(resolveCommit('aaaa', () => full), full);
assert.throws(() => resolveCommit('525888f', () => { throw new Error('bad'); }), /not a commit/);
assert.throws(() => resolveCommit('aaaa', a => { if (a[0] === 'merge-base') throw new Error('no'); return full; }), /not on origin\/main/);
