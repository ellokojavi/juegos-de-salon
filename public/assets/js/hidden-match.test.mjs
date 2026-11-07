// The phases of Battleship and Bulls and Cows (hidden-match.js).
import assert from 'node:assert/strict';
import { hiddenPhase, phaseOf } from './hidden-match.js';

const f = (o = {}) => hiddenPhase({ seated: true, committed: true, done: true, revealed: true, ...o }, 'secret');
assert.equal(f({ seated: false, committed: false, done: false, revealed: false }), 'lobby');
assert.equal(f({ committed: false, done: false, revealed: false }), 'secret');
assert.equal(f({ done: false, revealed: false }), 'play');
assert.equal(f({ revealed: false }), 'reveal');
assert.equal(f(), 'done');
assert.equal(f({ seated: false }), 'lobby', 'a seat missing is the lobby, whatever came before');
assert.equal(f({ done: false }), 'play', 'an early reveal does not end the game');

const M = { names: { A: 'Ana' }, commits: {}, reveals: {} };
assert.equal(phaseOf(M, false, 'placing'), 'lobby');
M.names.B = 'Beto'; assert.equal(phaseOf(M, false, 'placing'), 'placing');
M.commits = { A: {}, B: {} }; assert.equal(phaseOf(M, false, 'placing'), 'play');
M.reveals.A = {}; assert.equal(phaseOf(M, true, 'placing'), 'reveal');
M.reveals.B = {}; assert.equal(phaseOf(M, true, 'placing'), 'done');
console.log('hidden-match ok');
