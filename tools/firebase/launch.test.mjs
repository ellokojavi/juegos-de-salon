import assert from 'node:assert/strict';
import { parse, plan } from './launch.mjs';
const o = parse(['--flag', 'stick', '--flag', 'stack', '--splash', 'shinobi-babel', '--not-before', '2026-11-02T08:00:00Z', '--apply']);
assert.deepEqual(o.flags, ['stick', 'stack']); assert.equal(o.apply, true);
assert.deepEqual(plan(o, 5), [['flags/stick', 'PUT', { state: 'all', at: 5 }], ['flags/stack', 'PUT', { state: 'all', at: 5 }], ['splash/shinobi-babel', 'PATCH', { on: true, at: 5 }]]);
assert.throws(() => parse([]), /Nothing/); assert.throws(() => parse(['--flag', '../x']), /Not an id/); assert.throws(() => parse(['--flag', 'a', '--not-before', 'x']), /Not a date/);
console.log('✓ launch');
