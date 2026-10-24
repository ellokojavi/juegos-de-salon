// The processes round's watchdog (D-440): behind only when a commit the round has not looked at is
// older than a day; a quiet day and a round that caught up are never behind.
import assert from 'node:assert/strict';
import { behind, issueBody, LIMIT_HOURS, TITLE } from './round-watch.mjs';

const now = Date.parse('2026-10-24T17:17:00Z');
const at = h => new Date(now - h * 3600 * 1000).toISOString();

assert.equal(behind({ pending: [], lastRound: '2026-10-24', now }).behind, false, 'nothing new on main: up to date');
assert.equal(behind({ pending: [], lastRound: '2026-10-01', now }).behind, false, 'a long quiet spell is not a missed round');

const fresh = behind({ pending: [{ sha: 'b', date: at(2) }, { sha: 'a', date: at(5) }], lastRound: '2026-10-24', now });
assert.equal(fresh.behind, false, 'merges from this morning wait for tomorrow\'s round');
assert.equal(fresh.count, 2);

const missed = behind({ pending: [{ sha: 'c', date: at(3) }, { sha: 'b', date: at(20) }, { sha: 'a', date: at(LIMIT_HOURS + 5) }], lastRound: '2026-10-23', now });
assert.equal(missed.behind, true, 'a commit unreviewed for more than a day: the round was missed');
assert.equal(missed.oldest, 'a', 'the oldest unreviewed commit decides');
assert.match(missed.why, /3 commit\(s\).*29 hour/);

assert.equal(behind({ pending: [{ sha: 'a', date: at(LIMIT_HOURS) }], now }).behind, false, 'exactly the limit is not yet behind');
assert.equal(behind({ pending: null, lastRound: '2026-10-11', now }).behind, true, 'checkedUpTo out of the recent history: far behind');

const body = issueBody(missed);
assert.match(body, /Last recorded round: 2026-10-23/);
assert.match(body, /closes itself/, 'the owner knows nobody has to close it');
assert.ok(!/\bD-\d+\b.*\bD-\d+\b.*\bD-\d+\b/.test(body), 'readable from a phone, not a list of decisions');
assert.equal(TITLE, 'Processes round missed', 'processes.mjs keeps this title out of the owner\'s backlog');

console.log('✓ round-watch: behind only after a day unreviewed, quiet days and caught-up rounds are fine');
