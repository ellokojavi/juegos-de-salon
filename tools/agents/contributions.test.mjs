import assert from 'node:assert/strict';
import { needsLook, marker, staleDecision, SILENT_DAYS } from './contributions.mjs';
import { invalidAction } from './approve.mjs';
import { decisionsBody, requireOrigins } from './processes.mjs';

let fails = 0;
const check = (name, fn) => { try { fn(); console.log(`✓ ${name}`); } catch (e) { fails++; console.error(`✗ ${name}\n  ${e.message}`); } };

check('a PR never reviewed needs a look', () => {
  assert.match(needsLook({ sha: 'abc', comments: [] }), /new/);
  assert.match(needsLook({ sha: 'abc', comments: [{ body: 'hi' }] }), /new/);
});

check('nothing new after the marker: no look, whether reviewing or ready', () => {
  assert.equal(needsLook({ sha: 'abc', comments: [{ body: `ok\n${marker('abc', 'reviewing')}` }] }), null);
  assert.equal(needsLook({ sha: 'abc', comments: [{ body: 'old' }, { body: marker('abc', 'ready') }] }), null);
});

check('a new commit or a new comment after the marker needs a look', () => {
  assert.match(needsLook({ sha: 'def', comments: [{ body: marker('abc', 'ready') }] }), /commits/);
  assert.match(needsLook({ sha: 'abc', comments: [{ body: marker('abc', 'reviewing') }, { body: 'done, please look' }] }), /comment/);
});

check('only the last marker counts', () => {
  const comments = [{ body: marker('aaa', 'reviewing') }, { body: 'fixed' }, { body: marker('bbb', 'reviewing') }];
  assert.equal(needsLook({ sha: 'bbb', comments }), null);
});

const now = Date.parse('2026-11-24T12:00:00Z');
const ago = h => new Date(now - h * 3600 * 1000).toISOString();

check('red after the look (D-616): only once its one automatic rerun had an hour, and only once', () => {
  const seen = [{ body: marker('abc', 'ready'), at: ago(5) }];
  assert.equal(needsLook({ sha: 'abc', comments: seen, red: true }, now), null, 'red, not rerun yet: the rerun goes first');
  assert.equal(needsLook({ sha: 'abc', comments: seen, red: true, rerunAt: ago(0.5) }, now), null, 'the rerun is still running');
  assert.match(needsLook({ sha: 'abc', comments: seen, red: true, rerunAt: ago(2) }, now), /red after the automatic rerun/);
  assert.equal(needsLook({ sha: 'abc', comments: [{ body: marker('abc', 'red'), at: ago(1) }], red: true, rerunAt: ago(2) }, now), null, 'already explained (state=red)');
  assert.equal(needsLook({ sha: 'abc', comments: seen, red: false, rerunAt: ago(2) }, now), null, 'the rerun turned it green');
});

check(`a contributor silent ${SILENT_DAYS} days with something left: the owner decides (D-616)`, () => {
  assert.match(needsLook({ sha: 'abc', comments: [{ body: marker('abc', 'reviewing'), at: ago(SILENT_DAYS * 24 + 1) }] }, now), /silent/);
  assert.match(needsLook({ sha: 'abc', comments: [{ body: marker('abc', 'red'), at: ago(SILENT_DAYS * 24 + 1) }] }, now), /silent/);
  assert.equal(needsLook({ sha: 'abc', comments: [{ body: marker('abc', 'reviewing'), at: ago(24) }] }, now), null, 'a day: give them time');
  assert.equal(needsLook({ sha: 'abc', comments: [{ body: marker('abc', 'ready'), at: ago(30 * 24) }] }, now), null, 'ready waits on the owner, not on them');
  assert.equal(needsLook({ sha: 'abc', comments: [{ body: marker('abc', 'stale'), at: ago(30 * 24) }] }, now), null, 'already asked the owner');
});

check('the stale decision: Yes takes it over with the contributor as co-author, No closes it with thanks', () => {
  const d = staleDecision(1826, 'Chanicua', 'red since Nov 17');
  assert.match(d.title, /#1826.*@Chanicua.*7 days/);
  const [q] = d.decisions;
  for (const a of [...q.yes, ...q.no]) assert.equal(invalidAction(a), null, JSON.stringify(a));
  assert.match(q.yes[0].task, /Co-authored-by/);
  assert.deepEqual(q.no.map(a => a.type), ['comment', 'close-pr']);
  requireOrigins(d.decisions);
  assert.match(decisionsBody(d), /Yes, in Labs[\s\S]*Yes, and publish[\s\S]*No: comments on #1826 and closes #1826/, 'the issue processes.mjs decide opens');
});

if (fails) process.exit(1);
