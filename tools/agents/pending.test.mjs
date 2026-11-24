// Pending work nobody is watching (D-441): which open PRs count as stuck and which branches as
// stranded. A PR its session is still working on, and a branch about to get its PR, are left alone.
import assert from 'node:assert/strict';
import { stuck, stranded, issueBody, TITLE, stall, nudgeBody, MARK, contribStall, rerunBody, RERUN_MARK } from './pending.mjs';

const now = Date.parse('2026-10-24T17:00:00Z');
const ago = h => new Date(now - h * 3600 * 1000).toISOString();
const pr = o => stuck({ draft: false, autoMerge: true, conflict: false, red: [], createdAt: ago(1), pushedAt: ago(1), ...o }, now);

assert.deepEqual(pr({}), [], 'fresh, green, auto-merge on: moving');
assert.deepEqual(pr({ red: ['end-to-end'], pushedAt: ago(2) }), [], 'red two hours ago: its session is probably fixing it');
assert.match(pr({ red: ['end-to-end'], createdAt: ago(30), pushedAt: ago(20) })[0], /red for 20 h: end-to-end/);
assert.match(pr({ conflict: true, createdAt: ago(10), pushedAt: ago(8) })[0], /conflict/);
assert.deepEqual(pr({ autoMerge: false, createdAt: ago(5) }), [], 'just opened without auto-merge: not yet');
assert.match(pr({ autoMerge: false, createdAt: ago(30) })[0], /without auto-merge.*owner's review/, 'a day without auto-merge: the owner is reviewing it (D-429), or it was forgotten');
assert.match(pr({ createdAt: ago(60), pushedAt: ago(1) })[0], /open 2 days/, 'green with auto-merge but open two days: something is wrong');
assert.deepEqual(pr({ draft: true, autoMerge: false, createdAt: ago(100) }), [], 'a draft is somebody\'s on purpose');
assert.match(pr({ draft: true, createdAt: ago(200) })[0], /draft for 8 days/);

const br = o => stranded({ name: 'tyf-puntaje', ahead: 3, openPr: false, lastDate: ago(48), ...o }, now);
assert.match(br({}), /3 commit\(s\) not on main, last 2 day\(s\) ago, no PR/);
assert.match(br({ mergedPr: 558 }), /pushed after #558 merged/, 'commits after the PR merged were never reviewed');
assert.equal(br({ lastDate: ago(3) }), null, 'pushed this morning: its PR may be on the way');
assert.equal(br({ ahead: 0 }), null, 'everything already on main');
assert.equal(br({ openPr: true }), null, 'its PR is open: the PR rules apply');
for (const name of ['main', 'gh-pages', 'failure-log', 'reserve/D-441', 'reserva/D-300']) assert.equal(br({ name }), null, `${name} is never stranded`);

const body = issueBody({ prs: [{ number: 9, title: 'X', why: ['red for 20 h: tests'] }], branches: [{ name: 'claude/a-b', why: '1 commit(s) not on main' }] });
assert.match(body, /#9 X: red for 20 h/);
assert.match(body, /compare\/main\.\.\.claude%2Fa-b/, 'each branch links to what it holds');
assert.match(body, /closes itself/);
assert.doesNotMatch(issueBody({ prs: [], branches: [] }), /Stuck PRs|Branches/);
assert.equal(TITLE, 'Pending work', 'processes.mjs keeps this title out of the owner\'s backlog');

const st = o => stall({ author: 'ellokojavi', draft: false, red: ['end-to-end'], pushedAt: ago(2), ...o }, now);
assert.equal(st({}), 'nudge', 'red with no push for two hours: nudge its session');
assert.equal(st({ pushedAt: ago(0.5) }), null, 'pushed half an hour ago: its session is on it');
assert.equal(st({ red: [] }), null, 'green: nothing to do');
assert.equal(st({ draft: true }), null, 'a draft is left alone');
assert.equal(st({ author: 'Chanicua' }), null, "a contributor's PR is the contributions agent's (D-568)");
assert.equal(st({ nudgedAt: ago(1) }), null, 'nudged an hour ago: give the session time');
assert.equal(st({ nudgedAt: ago(3) }), 'takeover', 'nudged three hours ago and the same commit: take it over');
assert.ok(nudgeBody('abc', ['tests']).startsWith(MARK('abc')), 'the mark ties the nudge to its commit, so a push starts over');

// A contributor's red commit (D-616): one rerun after an hour with no push, never twice for one commit
const cs = o => contribStall({ draft: false, red: ['end-to-end'], pushedAt: ago(2), ...o }, now);
assert.equal(cs({}), 'rerun');
assert.equal(cs({ pushedAt: ago(0.5) }), null, 'pushed half an hour ago: the contributor is on it');
assert.equal(cs({ red: [] }), null);
assert.equal(cs({ draft: true }), null);
assert.equal(cs({ rerunAt: ago(1) }), null, 'reran once for this commit: the contributions agent reads it now');
assert.ok(rerunBody('abc', ['end-to-end']).startsWith(RERUN_MARK('abc')));
assert.match(rerunBody('abc', ['end-to-end']), /not your code/);

console.log('✓ pending: stuck PRs and stranded branches, with a grace period for work in progress');
