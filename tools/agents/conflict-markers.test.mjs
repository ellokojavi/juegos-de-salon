// No merge conflict left behind: a tracked text file with a line that starts with `<<<<<<< ` or
// `>>>>>>> `, or that is exactly `=======`, is a conflict someone committed half-solved. Binary files
// are skipped (`git grep -I`). tests.yml runs it with every *.test.mjs.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

// The markers are built, not written, so this file never matches itself
const [OURS, SEP, THEIRS] = ['<', '=', '>'].map(c => c.repeat(7));
export const MARKER = new RegExp(`^(${OURS} |${THEIRS} |${SEP}\\r?$)`);

// The rule on its own
assert.ok(MARKER.test(`${OURS} HEAD`) && MARKER.test(`${THEIRS} origin/main`) && MARKER.test(SEP) && MARKER.test(`${SEP}\r`));
assert.ok(!MARKER.test(` ${OURS} HEAD`), 'only at the start of a line');
assert.ok(!MARKER.test(`${SEP}=`) && !MARKER.test(`${SEP} x`), 'a longer rule of = (a Markdown underline, a banner) is not a marker');
assert.ok(!MARKER.test(OURS) && !MARKER.test(`${OURS}<`), 'the start and end markers are followed by a space');

// The repo: git grep exits 1 when nothing matches
let found = '';
try {
  found = execFileSync('git', ['grep', '-I', '-n', '-E', `^(${OURS} |${THEIRS} |${SEP}\r?$)`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
} catch (e) {
  if (e.status !== 1) throw e;
}
assert.equal(found.trim(), '', `merge conflict markers in tracked files: solve them\n${found}`);
console.log('✓ conflict-markers.test.mjs');
