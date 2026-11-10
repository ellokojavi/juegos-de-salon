// ¡Al toque!'s engine: node public/labs/microgames/engine.test.mjs
import assert from 'node:assert/strict';
import { RUN, newCode, speedAt, gamePoints, score, score100, runOrder } from './engine.js';

const IDS = Array.from({ length: 28 }, (_, i) => `g${i}`);

assert.deepEqual([0, 2, 3, 6, 9].map(speedAt), [1, 1, 1.1, 1.2, 1.3], 'speed goes up 10 % every three games');
assert.equal(gamePoints(3, 9), 39, '★★★ at ×1.3');
assert.equal(gamePoints(0, 5), 0);

const perfect = score(Array(RUN).fill(3));
assert.equal(perfect.points, perfect.max, 'a perfect run scores the max');
assert.equal(score([3, 3, 1, 3]).games.map(g => g.streak).join(), '0,5,0,0', 'a streak starts at the second ★★ in a row and breaks below ★★');
assert.equal(score([]).points, 0);

assert.equal(score100(Array(RUN).fill(3)), 100);
assert.equal(score100(Array(RUN).fill(0)), 0);
assert.ok(score100([0, 3, 3, 3, 3, 3, 3, 3, 3, 3]) > score100([3, 3, 3, 3, 3, 3, 3, 3, 3, 0]), 'a miss at high speed weighs more');

const a = runOrder(IDS, 'K7Q2X'), b = runOrder(IDS, 'K7Q2X'), c = runOrder(IDS, 'ABCDE');
assert.deepEqual(a, b, 'the same seed gives the same run on every phone');
assert.notDeepEqual(a, c, 'another seed, another run');
assert.equal(new Set(a).size, RUN, 'ten different games');
assert.equal(new Set(runOrder(IDS, '')).size, RUN, 'without a seed, still ten different');
assert.match(newCode(), /^[A-HJ-NP-Z]{5}$/, 'a run code: 5 letters, no I or O');
console.log('✓ microgames engine');
