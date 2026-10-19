// The random dice (D-188, D-374): what it can pick from the registry. Uso: node public/assets/js/azar.test.mjs
import assert from 'node:assert/strict';
import { GAMES, SUELTOS } from './games.js';
import { alAzar, minimo } from './azar.js';

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
