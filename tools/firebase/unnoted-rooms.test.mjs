// Run: node tools/firebase/unnoted-rooms.test.mjs (no key needed: only the pure part)
import assert from 'node:assert/strict';
import { unnoted, expired } from './unnoted-rooms.mjs';

const H = 60 * 60 * 1000;
const now = 20741 * 24 * H;
const rooms = {
  CUFM: { createdAt: now - 20 * H, game: 'batalla-naval' },
  MBGJ: { createdAt: now - 21 * H, game: 'batalla-naval', players: { A: { name: 'Tomáximo', online: true } } },
  HBHV: { createdAt: now - 21 * H, game: 'batalla-naval' },
  LIVE: { createdAt: now - H, lastAt: now - 60000, game: 'generala' },
};
const days = { 20740: { lastAt: now - 20 * H, rooms: { CUFM: true } } };
const found = unnoted(rooms, days, now);
assert.deepEqual(found.map(r => r.code), ['MBGJ', 'HBHV', 'LIVE'], 'the unnoted ones, oldest first');
assert.deepEqual(found.filter(r => r.expired).map(r => r.code).sort(), ['HBHV', 'MBGJ']);
assert.equal(found.find(r => r.code === 'LIVE').expired, false, 'a live room is not deleted');
assert.deepEqual(unnoted(null, null, now), []);
assert.deepEqual(unnoted({ AAAA: { createdAt: now } }, { 1: { rooms: { AAAA: true } }, 2: null }, now), [], 'a note in any bucket counts');
assert.equal(expired({ createdAt: now - H, lastAt: now - 31 * 60000 }, now), true, 'half an hour idle');
assert.equal(expired({ createdAt: now - 7 * H, lastAt: now }, now), true, 'six hours since created');
console.log('ok unnoted-rooms');
