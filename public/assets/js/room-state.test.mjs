// The shared room machine of the online games (lobby → playing, rematch offers).
import assert from 'node:assert/strict';
import { roomMessage, roomPhase } from './room-state.js';

const match = () => ({ players: null, names: {}, rematch: {}, seen: new Set() });
const opts = { minPlayers: 2 };

// lobby → playing only through the host's start, with enough named players
let M = match();
assert.equal(roomPhase(M), 'lobby');
roomMessage(M, { t: 'hello', from: 'A', name: 'Ana' }, opts);
roomMessage(M, { t: 'start', from: 'A', order: ['A', 'B'] }, opts);
assert.equal(roomPhase(M), 'lobby', 'B has not said hello: not enough players');
roomMessage(M, { t: 'hello', from: 'B', name: 'Beto' }, opts);
roomMessage(M, { t: 'start', from: 'B', order: ['A', 'B'] }, opts);
assert.equal(roomPhase(M), 'lobby', 'only the host starts');
roomMessage(M, { t: 'start', from: 'A', order: ['A', 'B', 'C'] }, opts);
assert.deepEqual(M.players, ['A', 'B'], 'unnamed seats are left out');
roomMessage(M, { t: 'start', from: 'A', order: ['B', 'A'] }, opts);
assert.deepEqual(M.players, ['A', 'B'], 'a second start does not reorder the table');

// hello while playing renames (reconnect), it does not reopen the lobby
roomMessage(M, { t: 'hello', from: 'B', name: 'Beto 2' }, opts);
assert.equal(M.names.B, 'Beto 2'); assert.equal(roomPhase(M), 'playing');

// rematch: first offer wins
roomMessage(M, { t: 'rematch', from: 'A', code: 'AAAA' }, opts);
roomMessage(M, { t: 'rematch', from: 'A', code: 'BBBB' }, opts);
assert.equal(M.rematch.A, 'AAAA');

// repeats are dropped; game messages are left to the game
M = match();
assert.equal(roomMessage(M, { id: 'x', t: 'hello', from: 'A', name: 'Ana' }, opts), 'handled');
assert.equal(roomMessage(M, { id: 'x', t: 'hello', from: 'A', name: 'Otra' }, opts), 'seen');
assert.equal(M.names.A, 'Ana');
assert.equal(roomMessage(M, { t: 'roll', from: 'A' }, opts), null);

// onStart runs once, on the real start
M = match(); let starts = 0;
for (const r of ['A', 'B']) roomMessage(M, { t: 'hello', from: r, name: r }, opts);
const o = { minPlayers: 2, onStart: () => starts++ };
roomMessage(M, { t: 'start', from: 'A', order: ['A', 'B'] }, o);
roomMessage(M, { t: 'start', from: 'A', order: ['A', 'B'] }, o);
assert.equal(starts, 1);
// onHello: a seat's hello can carry more (Julep's key); it runs on every hello, a reconnect too
M = match(); const keys = {};
roomMessage(M, { t: 'hello', from: 'B', name: 'Beto', pub: 'k1' }, { onHello: m => { if (m.pub) keys[m.from] = m.pub; } });
assert.deepEqual(keys, { B: 'k1' }); assert.equal(M.names.B, 'Beto');

// A two-seat game with no host start: hello and rematch only
M = match();
roomMessage(M, { t: 'hello', from: 'A', name: 'Ana' });
roomMessage(M, { t: 'rematch', from: 'B', code: 'X' }); roomMessage(M, { t: 'rematch', from: 'B', code: 'Y' });
assert.equal(M.rematch.B, 'X'); assert.equal(roomPhase(M), 'lobby');
console.log('room-state ok');
