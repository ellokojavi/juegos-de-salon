import assert from 'node:assert/strict';
import { parse, plan } from './launch.mjs';
const o = parse(['--flag', 'stick', '--flag', 'stack', '--splash', 'shinobi-babel', '--not-before', '2026-11-02T08:00:00Z', '--apply']);
assert.deepEqual(o.flags, ['stick', 'stack']); assert.equal(o.apply, true);
assert.deepEqual(plan(o, 5), [['flags/stick', 'PUT', { state: 'all', at: 5 }], ['flags/stack', 'PUT', { state: 'all', at: 5 }], ['splash/shinobi-babel', 'PATCH', { on: true, at: 5 }]]);
assert.throws(() => parse([]), /Nothing/); assert.throws(() => parse(['--flag', '../x']), /Not an id/); assert.throws(() => parse(['--flag', 'a', '--not-before', 'x']), /Not a date/);
const u = parse(['--splash', 'flap-soon', '--until', '2026-11-09T08:00:00Z', '--first']);
assert.deepEqual(plan(u, 7), [['splash/flap-soon', 'PATCH', { on: true, at: 7, until: '2026-11-09T08:00:00Z', order: -1 }]]);
assert.throws(() => parse(['--splash', 'a', '--until', 'sunday']), /Not a date/);
// Sudoku's launch: its flag and splash on, Aletazo's promotion off, at the same moment
const k = parse(['--flag', 'sudoku', '--splash', 'sudoku-ya', '--off', 'aletazo-ya', '--first']);
assert.deepEqual(plan(k, 9), [['flags/sudoku', 'PUT', { state: 'all', at: 9 }], ['splash/sudoku-ya', 'PATCH', { on: true, at: 9, order: -1 }], ['splash/aletazo-ya', 'PATCH', { on: false, at: 9 }]]);
assert.deepEqual(plan(parse(['--off', 'aletazo-ya']), 1), [['splash/aletazo-ya', 'PATCH', { on: false, at: 1 }]]);
console.log('✓ launch');
