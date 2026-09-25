// Ejecutar: node toque-y-fama/engine.test.mjs
import { score, isValid, randomSecret, sha256, verifyPlayer } from './engine.js';
import assert from 'node:assert/strict';

assert.deepEqual(score('1356', '1234'), { famas: 1, toques: 1 });
assert.deepEqual(score('4321', '1234'), { famas: 0, toques: 4 });
assert.deepEqual(score('1234', '1234'), { famas: 4, toques: 0 });
assert.deepEqual(score('5678', '1234'), { famas: 0, toques: 0 });
assert.deepEqual(score('012', '210'), { famas: 1, toques: 2 });

assert.equal(isValid('1234', 4), true);
assert.equal(isValid('1123', 4), false);
assert.equal(isValid('123', 4), false);
assert.equal(isValid('12a4', 4), false);
assert.equal(isValid('0123', 4), true);
assert.equal(isValid('0123', 4, { zeroFirst: false }), false);

for (let i = 0; i < 200; i++) { assert.ok(isValid(randomSecret(4), 4)); assert.ok(isValid(randomSecret(5, { zeroFirst: false }), 5, { zeroFirst: false })); }
assert.equal((await sha256('abc')), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');

const commit = await sha256('1234' + 'n1');
assert.equal((await verifyPlayer({ secret: '1234', salt: 'n1', commit, repliesGiven: [{ value: '1356', famas: 1, toques: 1 }] })).ok, true);
assert.equal((await verifyPlayer({ secret: '1234', salt: 'n1', commit, repliesGiven: [{ value: '1356', famas: 2, toques: 1 }] })).ok, false);
assert.equal((await verifyPlayer({ secret: '1235', salt: 'n1', commit, repliesGiven: [] })).ok, false);
console.log('engine: todos los tests OK');
