// Merge lanes by blast radius (docs/LANES.md, D-519): the glob table and the PR lane.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { laneOf, laneOfPr, outsideReason, INSIDERS, globRe, decision, report, CONFIG, ORDER, approvalBlock, withApproval, APPROVAL_START } from './lanes.mjs';
import { invalidAction, closesWhenDone, plan, OWNER } from './approve.mjs';
import { decisionsBody } from './processes.mjs';

// Globs
assert.ok(globRe('docs/**').test('docs/a/b.md'));
assert.ok(globRe('**/*.test.mjs').test('a.test.mjs'));
assert.ok(globRe('**/*.test.mjs').test('tools/x/a.test.mjs'));
assert.ok(!globRe('*.md').test('docs/a.md'));
assert.ok(globRe('firebase/*.rules*').test('firebase/database.rules.json'));

// The table
const cases = {
  'firebase/database.rules.json': 'red',
  'public/privacy/texts.js': 'red',
  'tools/agents/send-mail.py': 'red',
  'tools/agents/feedback.mjs': 'red',
  'tools/push/notify.mjs': 'red',
  '.github/workflows/publish.yml': 'red',
  '.github/workflows/tests.yml': 'red',
  'tools/firebase/stats-retention.mjs': 'red',
  'tools/agents/approve.mjs': 'red',
  'tools/agents/lanes.json': 'red',
  'public/labs/babel/game.js': 'green',
  'docs/LANES.md': 'green',
  'changelog/x.md': 'green',
  'marketing/video/a.mp4': 'green',
  'README.md': 'green',
  'tools/agents/covers.test.mjs': 'green',
  'public/assets/js/i18n.js': 'yellow',
  'public/index.html': 'yellow',
  'public/hangman/game.js': 'yellow',
  'tools/e2e/affected.mjs': 'yellow',
  'tools/agents/covers.mjs': 'yellow',
  'somewhere/new.txt': 'yellow',
};
for (const [f, lane] of Object.entries(cases)) assert.equal(laneOf(f).lane, lane, f);

// Every rule names a lane; every file in the repo gets one; unknown is never green
for (const r of CONFIG.rules) assert.ok(ORDER.includes(r.lane) && r.reason, r.glob);
const files = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n').filter(Boolean);
for (const f of files) assert.ok(ORDER.includes(laneOf(f).lane), f);
assert.equal(laneOf('zzz/unknown').glob, null);

// A PR's lane is the highest of its files
assert.equal(laneOfPr([]).lane, 'green');
assert.equal(laneOfPr(['docs/a.md', 'public/labs/x/a.js']).lane, 'green');
assert.equal(laneOfPr(['docs/a.md', 'public/index.html']).lane, 'yellow');
const red = laneOfPr(['docs/a.md', 'public/index.html', 'firebase/database.rules.json']);
assert.equal(red.lane, 'red');
assert.deepEqual(red.by.map(x => x.file), ['firebase/database.rules.json']);
assert.match(report(red, 'x'), /^Lane: 🔴 red/);

// The owner's decision is a valid one-tap issue
const sha = 'b'.repeat(40);
const d = decision(12, sha, 'T', red.by);
assert.equal(invalidAction(d.decisions[0].yes[0]), null);
// Yes approves and then merges: an approved PR is not left waiting (it has no auto-merge)
assert.deepEqual(d.decisions[0].yes.map(a => a.type), ['approve-pr', 'merge']);
assert.equal(invalidAction(d.decisions[0].yes[1]), null);
assert.equal(d.decisions[0].yes[1].pr, 12);
assert.ok(closesWhenDone(d.title), 'its issue closes itself once carried out');
assert.ok(!closesWhenDone('Pending work') && !closesWhenDone('Owner approval: PR #12 and more'));
const body = decisionsBody(d);
assert.ok(body.includes(sha), 'the body names the commit, so a push asks again');
assert.match(body, /approve-pr/);

// The decision rides at the top of the PR's own description (D-531), replaced on every push
const block = approvalBlock(body);
const prBody = withApproval('What the PR does.', block);
assert.ok(prBody.startsWith(APPROVAL_START) && prBody.endsWith('What the PR does.'));
const sha2 = 'c'.repeat(40), block2 = approvalBlock(decisionsBody(decision(12, sha2, 'T', red.by)));
const pushed = withApproval(prBody, block2);
assert.ok(pushed.includes(sha2) && !pushed.includes(sha), 'a push replaces the question, it does not pile up');
assert.equal(pushed.split(APPROVAL_START).length, 2);
assert.ok(pushed.endsWith('What the PR does.'));
assert.equal(withApproval('', block), block);

// The owner's tick in the PR description is carried out, only for that PR and only by the owner
const tick = b => b.replace(/- \[ \](.*?<!-- op:1:si -->)/, '- [x]$1');
const prEvent = (before, after, extra = {}) => ({
  action: 'edited', sender: { login: OWNER },
  pull_request: { number: 12, state: 'open', user: { login: 'someone' }, labels: [{ name: 'needs-owner' }], body: after },
  changes: { body: { from: before } }, ...extra,
});
assert.deepEqual(plan(prEvent(prBody, tick(prBody))).plans[0].actions.map(a => a.type), ['approve-pr', 'merge']);
assert.match(plan({ ...prEvent(prBody, tick(prBody)), sender: { login: 'someone' } }).ignore, /not ellokojavi/);
assert.match(plan(prEvent(prBody, tick(prBody), { pull_request: { ...prEvent(prBody, tick(prBody)).pull_request, labels: [] } })).ignore, /needs-owner/);
// A PR body is written by whoever pushes: it cannot decide another PR or anything else
const other = approvalBlock(decisionsBody(decision(99, sha, 'T', red.by)));
assert.match(plan(prEvent(other, tick(other))).warnings[0], /only decides that PR \(#12\)/);
const closing = approvalBlock(decisionsBody({ decisions: [{ question: 'Q', yes: [{ type: 'close-issue', issue: 5 }] }] }));
assert.match(plan(prEvent(closing, tick(closing))).warnings[0], /not allowed in a PR/);

console.log('lanes ok');

// An outside PR (#1249 step 4): from a fork or not by the owner, it is red whatever its files
const repo = { full_name: 'ellokojavi/juegos-de-salon' };
const inside = { user: { login: 'ellokojavi' }, head: { repo }, base: { repo } };
assert.equal(outsideReason(inside), null);
assert.equal(laneOfPr(['docs/LANES.md'], { outside: outsideReason(inside) }).lane, 'green');
const fork = { user: { login: 'ellokojavi' }, head: { repo: { full_name: 'someone/juegos-de-salon' } }, base: { repo } };
assert.match(outsideReason(fork), /fork/);
const stranger = { user: { login: 'someone' }, head: { repo }, base: { repo } };
assert.match(outsideReason(stranger), /not the owner/);
assert.match(outsideReason({ user: { login: 'someone' }, head: { repo: null }, base: { repo } }), /fork/);
for (const pr of [fork, stranger]) {
  const r = laneOfPr(['docs/LANES.md', 'changelog/x.md'], { outside: outsideReason(pr) });
  assert.equal(r.lane, 'red', 'an outside PR with only green files is still red');
  assert.match(report(r), /outside PR/);
}
assert.ok(INSIDERS.includes(OWNER), 'the owner is an insider');
