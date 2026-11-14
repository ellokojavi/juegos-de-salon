// The decisions sweep (D-555): the three issues the owner found on 2026-11-14 are its cases.
import assert from 'node:assert/strict';
import { plan, same, subjects, linkedPrs, queuedTasks } from './sweep.mjs';
import { invalidAction } from './approve.mjs';
import { decisionsBody, repeatedIn, describeActions } from './processes.mjs';

const now = Date.parse('2026-11-14T18:00:00Z');
const BOT = 'github-actions[bot]', OWNER = 'ellokojavi';
const tick = (body, op, d) => body.replace(new RegExp(`- \\[ \\] (.*?<!-- op:${op} -->)`), `- [x] $1 — ✅ done <!-- hecho:${d} -->`);
const q = (question, task, no = [{ type: 'nothing' }]) => ({ question, context: 'I recommend Yes.', yes: [{ type: 'queue', task }], no });

// #1415, Nov 12: three questions, never answered
const old = decisionsBody({ decisions: [
  q('Open a PR for the ¡Al toque! polish branch (rules, hose)?', 'open a PR from al-toque-polish'),
  q('Open a PR for the «sube cada 3 juegos» line?', 'open a PR from microgames-feedback'),
  q('Delete the old weekly popularity branch from 2026-11-09?', 'delete branch auto/popularity-2026-11-09 (replaced)'),
] });
// #1435, Nov 13: the same three, worded differently, answered Yes
let newer = decisionsBody({ decisions: [
  q('Open a PR for the ¡Al toque! polish (rules on the cover)?', 'open a PR from al-toque-polish on a fresh branch off origin/main'),
  q('Open a PR for the ¡Al toque! speed-bonus line?', 'open a PR from microgames-feedback last commits on a fresh branch off origin/main'),
  q('Delete the old weekly popularity branch from November 9?', 'delete branch auto/popularity-2026-11-09'),
] });
for (const d of [1, 2, 3]) newer = tick(newer, `${d}:si`, d);
// #1381, Nov 11: an idea answered Yes, built in #1417
const idea = tick(decisionsBody({ decisions: [q('Try a paid hint in Broken Routes?', 'ideas routes-paid-hint: behind its flag')] }), '1:pub', 1);

assert.ok(subjects(old, 1).has('al-toque-polish'));
assert.ok(!subjects(newer, 1).has('origin/main'), 'origin/main names nothing');
assert.ok(same(old, 1, newer, 1) && same(old, 3, newer, 3), 'different words, same branch: the same question');
assert.ok(!same(old, 1, newer, 2), 'different branches: different questions');
assert.deepEqual(linkedPrs('already built: #1417 (flag, D-498); see https://github.com/x/y/pull/9'), [1417, 9]);
assert.equal(queuedTasks(1435, newer).length, 3);

const issues = [
  { number: 1381, author: BOT, createdAt: '2026-11-11T10:00:00Z', body: idea, comments: [{ author: OWNER, body: 'the queued task is already built: #1417' }] },
  { number: 1415, author: BOT, createdAt: '2026-11-12T10:00:00Z', body: old, comments: [] },
  { number: 1435, author: BOT, createdAt: '2026-11-13T10:00:00Z', body: newer, comments: [] },
  { number: 1500, author: 'stranger', createdAt: '2026-11-01T10:00:00Z', body: old, comments: [] },
];
const merged = n => n === 1417;
const p = plan(issues, { merged, now });
assert.deepEqual(p.settles.map(s => `${s.issue}:${s.decision}`), ['1415:1', '1415:2', '1415:3'], 'the older repeat is settled, never the newer');
assert.match(p.settles[0].note, /asked again in #1435/);
assert.deepEqual(p.closes.map(c => c.issue), [1381, 1415], 'built in a merged PR, and all asked again: closed');
assert.match(p.closes[0].why, /#1417/);
assert.match(p.closes[1].why, /asked again/);
assert.deepEqual(p.stale, [], '#1435 is a day old: not stale yet');
assert.ok(!p.closes.some(c => c.issue === 1500) && !p.settles.some(s => s.issue === 1500), 'an issue a stranger opened is never touched');

const later = plan(issues, { merged, now: now + 2 * 86400000 });
assert.deepEqual(later.stale.map(s => s.id), ['#1435:1', '#1435:2', '#1435:3'], 'answered, two days undone: reported');
const done = plan(issues, { merged, now: now + 2 * 86400000, queueDone: ['#1435:1', '#1435:2', '#1435:3'] });
assert.ok(done.closes.some(c => c.issue === 1435) && !done.stale.length, 'recorded by the round: closed');
assert.ok(!plan(issues, { now }).closes.some(c => c.issue === 1381), 'a PR not merged yet does not close it');
assert.ok(!plan([{ ...issues[0], comments: [{ author: 'stranger', body: '#1417' }] }], { merged, now }).closes.length, 'only the owner\'s account links the work');

// decide refuses asking again what is open and unanswered
assert.deepEqual(repeatedIn(old, [{ number: 1415, body: old }]).map(r => r.decision), ['1', '2', '3']);
assert.deepEqual(repeatedIn(old, [{ number: 1435, body: newer }]), [], 'already answered there: not a repeat');

// delete-branch: on the tick, never a protected branch
assert.equal(invalidAction({ type: 'delete-branch', branch: 'auto/popularity-2026-11-09' }), null);
for (const branch of ['main', 'gh-pages', 'reserve/D-1', 'x y', '']) assert.ok(invalidAction({ type: 'delete-branch', branch }), branch);
assert.equal(describeActions([{ type: 'delete-branch', branch: 'al-toque-polish' }]), 'deletes branch al-toque-polish');

console.log('sweep: OK');
