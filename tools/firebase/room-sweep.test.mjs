// Run: node tools/firebase/room-sweep.test.mjs (no key needed: only the pure part)
import assert from 'node:assert/strict';
import { plan } from './room-sweep.mjs';

const H = 60 * 60 * 1000;
const today = 20750;
const now = today * 24 * H + 10 * H;
const rooms = {
  OLDA: { createdAt: (today - 40) * 24 * H, game: 'ahorcado' },        // in a bucket 40 days old
  YEST: { createdAt: now - 20 * H, game: 'generala' },                // yesterday's bucket
  REUS: { createdAt: now - H, lastAt: now - 60000, game: 'dudo' },    // a live room reusing an old code
  LOOS: { createdAt: now - 30 * H, game: 'batalla-naval' },           // no bucket, expired
  LIVE: { createdAt: now - H, lastAt: now - 60000, game: 'julepe' },  // no bucket, alive
  TDAY: { createdAt: now - 2 * H, lastAt: now - H, game: 'ahorcado' },// today's bucket, expired idle
};
const days = {
  [today - 40]: { lastAt: (today - 40) * 24 * H, rooms: { OLDA: true, GONE: true } },
  [today - 1]: { lastAt: now - 20 * H, rooms: { YEST: true, REUS: true } },
  [today]: { lastAt: now - H, rooms: { TDAY: true } },
};
const p = plan(rooms, days, now);
assert.deepEqual(p.buckets, [String(today - 40), String(today - 1)], 'every past bucket six hours closed, however old; not today');
assert.deepEqual(p.rooms, ['LOOS', 'OLDA', 'YEST'], 'expired rooms only: noted in a swept bucket or in none');
assert.deepEqual(p.kept, ['REUS'], 'a live room reusing an old code is never deleted');
assert.deepEqual(p.note, [{ code: 'LIVE', day: today }, { code: 'REUS', day: today }], 'a live unnoted room is noted in its day, and so is a kept one whose only note goes with its bucket');
assert.ok(!p.rooms.includes('TDAY'), "today's bucket waits for a later night");

const fresh = { [today - 1]: { lastAt: now - 2 * H, rooms: { YEST: true } } };
assert.deepEqual(plan(rooms, fresh, now).buckets, [], 'a bucket touched less than six hours ago stays closed');
assert.deepEqual(plan(null, null, now), { buckets: [], rooms: [], note: [], kept: [] });
console.log('ok room-sweep');
