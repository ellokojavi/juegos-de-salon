// Run: node tools/e2e/groups.test.mjs
// The end-to-end groups (D-307): even, deterministic, with every script once, and not over the
// target unless a single script is. And that the repo's fit in the runners.
import assert from 'node:assert/strict';
import { group, duration, readDurations, TARGET_S, MAXIMUM, UNMEASURED_S } from './groups.mjs';
import { jobs } from './ci.mjs';

const dur = { a: 200, b: 150, c: 120, d: 100, e: 60, f: 30 };
const g = group(Object.keys(dur), dur, { target: 250 });
assert.equal(g.length, 3, '660 s in groups of up to 250: three');
assert.deepEqual(g.flatMap(x => x.scripts).sort(), Object.keys(dur), 'each script, once');
assert.ok(g.every(x => x.s <= 250), `none goes over the target: ${g.map(x => x.s)}`);
assert.deepEqual(group(Object.keys(dur), dur, { target: 250 }), g, 'the same data, the same groups');
assert.match(g[0].name, /^g01 · \S+ \+\d+$/);
// A script longer than the target rules: it goes alone in its group, and becomes the target
assert.deepEqual(group(['long', 'x', 'y'], { long: 500, x: 10, y: 20 }, { target: 100 }).map(g => g.scripts), [['long'], ['y', 'x']]);
assert.equal(group([], dur).length, 0);
assert.equal(duration('new.mjs', {}), UNMEASURED_S, 'an unmeasured script counts as 90 s');
assert.equal(group(['a', 'b', 'c'], {}, { target: 1, maximum: 2 }).length, 2, 'never more than the maximum');

// The repo's: in groups that fit at once in the runners (the unmeasured ones count as 90 s)
const measured = readDurations();
const unmeasured = jobs().filter(t => !(t in measured));
if (unmeasured.length) console.log(`  not measured yet (count as ${UNMEASURED_S} s): ${unmeasured.join(', ')}`);
const real = group(jobs(), measured);
assert.ok(real.length <= MAXIMUM, `${real.length} groups: more than the runners`);
const longest = Math.max(...jobs().map(t => duration(t, measured)));
assert.ok(real[0].s <= Math.max(TARGET_S, longest) * 1.15, `the heaviest group (${real[0].s} s) goes far over the target`);
console.log(`groups: green · ${real.length} groups, the longest ${real[0].s} s`);
