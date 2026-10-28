// The region textures (#896, D-481): one per region, all different, and wrapping past the last one.
import assert from 'node:assert/strict';
import { PATTERNS, pattern, withPatterns } from './region-patterns.js';

assert.equal(new Set(PATTERNS).size, PATTERNS.length, 'two regions share a texture');
assert.ok(PATTERNS.length >= 8, 'the biggest Queens board has 8 regions');
assert.equal(pattern(0), 'none');
assert.equal(pattern(PATTERNS.length + 1), PATTERNS[1]);
const classes = new Set();
const node = { classList: { add: c => classes.add(c) } };
assert.equal(withPatterns(node), node);
assert.ok(classes.has('tramas'), 'the board gets its textures');
console.log('✓ region patterns');
