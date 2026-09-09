// Ejecutar: node batalla-naval/engine.test.mjs
import assert from 'node:assert/strict';
import { N, FLEET, cellName, parseCell, isCell, cellsOf, isValidPlacement, isValidLayout, randomLayout, occupancy, layoutKey, shoot, sunkShips, allSunk, Hunter, nextShooter, sha256, verifyPlayer } from './engine.js';

assert.equal(cellName(0, 0), 'A1'); assert.equal(cellName(9, 9), 'J10'); assert.deepEqual(parseCell('B4'), { r: 3, c: 1 }); assert.deepEqual(parseCell('J10'), { r: 9, c: 9 });
assert.ok(isCell('A1') && isCell('J10')); assert.ok(!isCell('K1') && !isCell('A11') && !isCell('A0'));
assert.deepEqual(cellsOf(3, { r: 0, c: 0, dir: 'h' }), [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }]);

const L = { carrier: { r: 0, c: 0, dir: 'h' }, battleship: { r: 1, c: 0, dir: 'h' }, cruiser: { r: 2, c: 0, dir: 'h' }, submarine: { r: 3, c: 0, dir: 'h' }, destroyer: { r: 4, c: 0, dir: 'h' } };
assert.ok(isValidLayout(L));
assert.ok(!isValidPlacement(L, 'destroyer', { r: 0, c: 4, dir: 'h' }), 'superpuesto con el portaaviones');
assert.ok(!isValidPlacement(L, 'destroyer', { r: 9, c: 9, dir: 'h' }), 'fuera del borde');
assert.ok(isValidPlacement(L, 'destroyer', { r: 9, c: 8, dir: 'h' }));
assert.ok(isValidPlacement(L, 'destroyer', { r: 5, c: 0, dir: 'h' }), 'los barcos pueden tocarse');
assert.ok(!isValidLayout({ ...L, destroyer: null }));
for (let i = 0; i < 200; i++) assert.ok(isValidLayout(randomLayout()), 'randomLayout válido');
assert.equal(Object.keys(occupancy(L)).length, 17);
assert.equal(layoutKey(L), 'carrier:0,0,h|battleship:1,0,h|cruiser:2,0,h|submarine:3,0,h|destroyer:4,0,h');

assert.deepEqual(shoot(L, [], 'J10'), { result: 'agua' });
assert.deepEqual(shoot(L, [], 'A5'), { result: 'tocado', ship: 'destroyer' });
assert.deepEqual(shoot(L, ['A5'], 'B5'), { result: 'hundido', ship: 'destroyer', cells: ['A5', 'B5'] });
assert.deepEqual(shoot(L, ['J10'], 'B5'), { result: 'tocado', ship: 'destroyer' });

assert.equal(nextShooter('A', 'agua', true), 'B'); assert.equal(nextShooter('A', 'tocado', true), 'A'); assert.equal(nextShooter('A', 'hundido', true), 'A'); assert.equal(nextShooter('A', 'tocado', false), 'B');

// La IA hunde cualquier flota, y en un número razonable de disparos
let total = 0, max = 0;
for (let g = 0; g < 100; g++) {
  const layout = randomLayout();
  const h = new Hunter();
  const prev = []; const replies = []; let shots = 0;
  while (!allSunk(replies) && shots < 100) {
    const cell = h.next();
    assert.ok(!prev.includes(cell), 'la IA no repite disparos');
    const reply = shoot(layout, prev, cell);
    prev.push(cell); replies.push({ cell, ...reply }); h.learn(cell, reply); shots++;
  }
  assert.ok(allSunk(replies), 'la IA hundió toda la flota');
  assert.equal(sunkShips(replies).length, FLEET.length);
  total += shots; max = Math.max(max, shots);
}
console.log(`IA: promedio ${(total / 100).toFixed(1)} disparos, máximo ${max}`);
assert.ok(max <= 100 && total / 100 < 70);

const salt = 's1'; const commit = await sha256(layoutKey(L) + salt);
assert.equal((await verifyPlayer({ layout: L, salt, commit, repliesGiven: [{ cell: 'A5', result: 'tocado', ship: 'destroyer' }, { cell: 'B5', result: 'hundido', ship: 'destroyer' }] })).ok, true);
assert.equal((await verifyPlayer({ layout: L, salt, commit, repliesGiven: [{ cell: 'A5', result: 'agua' }] })).ok, false, 'respuesta falsa');
assert.equal((await verifyPlayer({ layout: { ...L, destroyer: { r: 9, c: 0, dir: 'h' } }, salt, commit, repliesGiven: [] })).ok, false, 'flota distinta al compromiso');
console.log('engine: todos los tests OK');
