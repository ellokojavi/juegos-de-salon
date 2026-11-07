// The random dice (D-188, D-374): what it can pick from the registry. Uso: node public/assets/js/azar.test.mjs
import assert from 'node:assert/strict';
import { GAMES, SUELTOS } from './games.js';
import { alAzar, minimo, hashSeed, seededRng, seedRandom, random, withSeed } from './azar.js';

assert.equal(minimo({ players: '4–6' }), 4);
assert.equal(minimo({ players: '1' }), 1);
assert.equal(minimo({ players: '2–10' }), 2);
const todos = [...GAMES, ...SUELTOS];
const ids = todos.filter(alAzar).map(g => g.id);
assert.ok(!ids.includes('cuarto-rey'), 'Cuarto Rey needs a group: the dice never picks it (D-374)');
assert.ok(!ids.includes('copa'), 'La Copa never comes out of the dice (D-188)');
assert.ok(ids.includes('dudo') && ids.includes('reinas'), 'games one or two can play stay in the dice');
for (const g of todos.filter(g => minimo(g) >= 3)) assert.ok(!ids.includes(g.id), `${g.id} needs ${minimo(g)}+ players: out of the dice`);
console.log(`✓ the dice picks among ${ids.length} games, none that needs a group`);

// Seeded randomness (#1249, step 10): the same seed, the same numbers; no seed, Math.random as before
const serie = r => Array.from({ length: 5 }, r);
assert.deepEqual(serie(seededRng('K7Q2X')), serie(seededRng('K7Q2X')), 'same seed, same stream');
assert.notDeepEqual(serie(seededRng('K7Q2X')), serie(seededRng('K7Q2Y')), 'another seed, another stream');
assert.equal(hashSeed(42), 42, 'a whole number seed passes as is');
assert.equal(seedRandom(null), null, 'no seed: unseeded');
const real = Math.random; Math.random = () => 0.25;
assert.equal(random(), 0.25, 'unseeded, the source is Math.random');
assert.deepEqual(withSeed('abc', () => serie(random)), serie(seededRng('abc')), 'withSeed seeds the source for the run');
assert.equal(random(), 0.25, 'and puts Math.random back after');
seedRandom('abc'); assert.deepEqual(serie(random), serie(seededRng('abc')), 'seedRandom seeds it until cleared');
seedRandom(null); Math.random = real;
console.log('✓ azar.js takes a seed, and without one stays on Math.random');
