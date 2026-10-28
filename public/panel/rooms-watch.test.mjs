// The panel reads live rooms without their messages (D-474): a fake database stands in for Firebase.
import assert from 'node:assert/strict';
import { watchRooms, shallowCodes } from './rooms-watch.js';

const now = Date.now();
const data = {
  NEWR: { createdAt: now - 60000, game: 'dudo', players: { A: { name: 'Ana' } }, counts: { bid: { n: 3, at: now } }, messages: { m1: { t: 'bid' } } },
  OLDR: { createdAt: now - 120000, game: 'dudo', messages: { m1: { t: 'bid', at: now } } },
  DEAD: { createdAt: now - 7 * 3600000, game: 'dudo', messages: { m1: { t: 'bid' } } },
};
const get = path => path.split('/').slice(1).reduce((o, k) => o?.[k], data);
const listeners = [];
const fb = {
  db: null,
  ref: (_, path) => path,
  onValue: (path, cb) => {
    const l = { path, cb, on: true };
    listeners.push(l);
    cb({ val: () => get(path) ?? null });
    return () => { l.on = false; };
  },
};
let rooms = null;
const stop = watchRooms({ fb, codes: async () => Object.keys(data), since: () => now - 6 * 3600000, onChange: r => { rooms = r; }, every: 1e9 });
await new Promise(r => setTimeout(r, 10));

const open = listeners.filter(l => l.on).map(l => l.path);
assert.ok(!open.includes('rooms/NEWR/messages'), 'a room with counters is read without its messages');
assert.ok(open.includes('rooms/OLDR/messages'), 'a room from before the counters is read with them');
assert.ok(!open.some(p => p.startsWith('rooms/DEAD/') && !p.endsWith('/createdAt')), 'an expired room downloads nothing else');
assert.deepEqual(rooms.NEWR.counts, data.NEWR.counts);
assert.equal(rooms.NEWR.messages, undefined);
assert.deepEqual(rooms.OLDR.messages, data.OLDR.messages);
assert.equal(rooms.DEAD, undefined);

// The old room gets its counters: its messages are dropped
const c = listeners.find(l => l.path === 'rooms/OLDR/counts');
c.cb({ val: () => ({ bid: { n: 1, at: now } }) });
assert.equal(listeners.find(l => l.path === 'rooms/OLDR/messages').on, false);
assert.equal(rooms.OLDR.messages, undefined);

stop();
assert.ok(listeners.every(l => !l.on), 'stopping closes every listener');

const codes = await shallowCodes('https://x', 't', async url => {
  assert.match(url, /rooms\.json\?shallow=true&auth=t$/);
  return { ok: true, status: 200, json: async () => ({ ABCD: true, bad: true }) };
});
assert.deepEqual(codes, ['ABCD']);
await assert.rejects(shallowCodes('https://x', 't', async () => ({ ok: false, status: 401 })), /permission_denied/);
console.log('rooms-watch: ok');
