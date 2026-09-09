// Ejecutar: node toque-y-fama/engine.test.mjs
import { score, isValid, randomSecret, allCandidates, Solver, sha256, verifyPlayer, randomRoomCode } from './engine.js';
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
assert.equal(allCandidates(4).length, 5040);
assert.equal(allCandidates(4, { zeroFirst: false }).length, 4536);
assert.equal(allCandidates(3).length, 720);

// El solver siempre encuentra el secreto y en pocos intentos
let total = 0, max = 0;
for (let i = 0; i < 100; i++) {
  const secret = randomSecret(4);
  const s = new Solver(4);
  let tries = 0, g;
  do { g = s.next(); tries++; const r = score(g, secret); if (r.famas === 4) break; s.learn(g, r); } while (tries < 20);
  assert.equal(g, secret, 'solver falló');
  total += tries; max = Math.max(max, tries);
}
console.log(`solver: promedio ${(total / 100).toFixed(2)} intentos, máximo ${max}`);
assert.ok(max <= 10);

assert.ok(/^[A-Z]{4}$/.test(randomRoomCode()));
assert.equal((await sha256('abc')), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');

const commit = await sha256('1234' + 'n1');
assert.equal((await verifyPlayer({ secret: '1234', salt: 'n1', commit, repliesGiven: [{ value: '1356', famas: 1, toques: 1 }] })).ok, true);
assert.equal((await verifyPlayer({ secret: '1234', salt: 'n1', commit, repliesGiven: [{ value: '1356', famas: 2, toques: 1 }] })).ok, false);
assert.equal((await verifyPlayer({ secret: '1235', salt: 'n1', commit, repliesGiven: [] })).ok, false);
console.log('engine: todos los tests OK');
