// Run: node public/sw-sync.test.mjs
// La Copa offline with the app closed (D-544, Background Sync): the service worker uploads the queue
// the page mirrored, start before result, signed in as the phone's own session; it does nothing while
// a page of the app is on screen; it writes what it did for the page to reconcile.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { reconcile, OUTBOX_KEY } from './assets/js/cup-outbox.js';

const SRC = readFileSync(new URL('./sw.js', import.meta.url), 'utf8');
const DB = 'https://db.example';
const H = 3600000;
const NOW = Date.UTC(2026, 10, 8, 12);

function browser({ session, server = {}, visible = false } = {}) {
  const store = new Map();
  const caches = {
    open: async name => {
      if (!store.has(name)) store.set(name, new Map());
      const m = store.get(name);
      return {
        match: async k => (m.has(k) ? new Response(m.get(k)) : undefined),
        put: async (k, r) => { m.set(k, await r.text()); },
        delete: async k => m.delete(k),
      };
    },
    keys: async () => [...store.keys()],
    delete: async n => store.delete(n),
  };
  const net = { up: true, writes: [], refused: new Set() };
  const fetch = async (url, o = {}) => {
    if (!net.up) throw new TypeError('offline');
    if (url.startsWith('https://securetoken.googleapis.com/')) return new Response(JSON.stringify({ id_token: 'fresh' }));
    const u = new URL(url);
    if (o.method === 'PATCH') {
      const [[path, value]] = Object.entries(JSON.parse(o.body));
      if (u.searchParams.get('auth') !== 'fresh' && u.searchParams.get('auth') !== 'kept') return new Response('', { status: 401 });
      if (server[path] !== undefined || net.refused.has(path)) return new Response('', { status: 403 });
      server[path] = value; net.writes.push(path);
      return new Response('{}');
    }
    const path = u.pathname.replace(/^\//, '').replace(/\.json$/, '');
    return new Response(JSON.stringify(server[path] ?? null));
  };
  const indexedDB = { open: () => {
    const req = {};
    setTimeout(() => {
      req.result = { close() {}, transaction: () => ({ objectStore: () => ({ get: () => {
        const g = {}; setTimeout(() => { g.result = session ? { value: { stsTokenManager: session } } : undefined; g.onsuccess(); }, 0); return g;
      } }) }) };
      req.onsuccess();
    }, 0);
    return req;
  } };
  const handlers = {};
  const self = {
    addEventListener: (t, f) => (handlers[t] ||= []).push(f),
    location: new URL('https://juegosdesalon.cl/sw.js'),
    registration: { scope: 'https://juegosdesalon.cl/' },
    clients: { claim: async () => {}, matchAll: async () => (visible ? [{ visibilityState: 'visible' }] : []) },
    skipWaiting() {},
  };
  vm.runInNewContext(SRC, { self, caches, fetch, indexedDB, Response, URL, Promise, setTimeout, JSON, console, Date: { now: () => NOW } });
  return {
    caches, net, server,
    async sync() { let p; for (const h of handlers.sync || []) h({ tag: 'cup-outbox', waitUntil: x => { p = x; } }); return p; },
    async put(key, v) { await (await caches.open('cup-sync')).put(key, new Response(JSON.stringify(v))); },
    async read(key) { const r = await (await caches.open('cup-sync')).match(key); return r ? r.json() : null; },
  };
}
const entry = (d, b, extra = {}) => ({ id: `ABCDE:${d}:aaaaaa`, code: 'ABCDE', d, pid: 'aaaaaa', b, started: NOW - H, res: { s: 7, ms: 1000, t: 'x', r: '' }, at: NOW - H, ...extra });
const box = queue => ({ queue, apiKey: 'k', databaseURL: DB });

// The app closed, the signal back: day 2 goes up (start, then result), day 1 had closed: not played
{
  const b = browser({ session: { accessToken: 'old', expirationTime: NOW - 1, refreshToken: 'r' } });
  await b.put('outbox', box([entry(1, NOW - 2 * H), entry(2, NOW + 10 * H), { ...entry(3, NOW + 30 * H), res: undefined }]));
  await b.sync();
  assert.deepEqual(b.net.writes, ['torneos/ABCDE/started/2/aaaaaa', 'torneos/ABCDE/results/2/aaaaaa'], 'the start before the result, with a refreshed token');
  assert.deepEqual(b.server['torneos/ABCDE/results/2/aaaaaa'].at, { '.sv': 'timestamp' }, 'the server stamps the time');
  assert.deepEqual(await b.read('done'), { sent: ['ABCDE:2:aaaaaa'], late: ['ABCDE:1:aaaaaa'], dup: [] });
  assert.deepEqual((await b.read('outbox')).queue.map(x => x.d), [3], 'a day started and not finished stays');

  // The page that opens next reconciles: those days leave its queue, and the toast says so
  const m = new Map([[OUTBOX_KEY, JSON.stringify([entry(1, NOW - 2 * H), entry(2, NOW + 10 * H), { ...entry(3, NOW + 30 * H), res: undefined }])]]);
  const storage = { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: k => m.delete(k) };
  let told = null;
  const res = await reconcile({ storage, caches: b.caches, win: { dispatchEvent: e => { told = e.detail; } } });
  assert.deepEqual(res, { cupSent: 1, cupLate: 1, cupDup: 0 });
  assert.deepEqual(told, res);
  assert.deepEqual(JSON.parse(m.get(OUTBOX_KEY)).map(x => x.d), [3]);
  assert.equal(await b.read('done'), null, 'reconciled once');
}

// Played on another phone first: that one stays
{
  const b = browser({ session: { accessToken: 'kept', expirationTime: NOW + H }, server: { 'torneos/ABCDE/started/2/aaaaaa': 1, 'torneos/ABCDE/results/2/aaaaaa': { s: 1 } } });
  await b.put('outbox', box([entry(2, NOW + 10 * H)]));
  await b.sync();
  assert.deepEqual(await b.read('done'), { sent: [], late: [], dup: ['ABCDE:2:aaaaaa'] });
  assert.equal(await b.read('outbox'), null);
}

// Refused while the day is open (the seat): kept for the page
{
  const b = browser({ session: { accessToken: 'kept', expirationTime: NOW + H } });
  b.net.refused.add('torneos/ABCDE/started/2/aaaaaa');
  await b.put('outbox', box([entry(2, NOW + 10 * H)]));
  await b.sync();
  assert.equal((await b.read('outbox')).queue.length, 1);
}

// A page of the app on screen: the worker leaves it to the page
{
  const b = browser({ session: { accessToken: 'kept', expirationTime: NOW + H }, visible: true });
  await b.put('outbox', box([entry(2, NOW + 10 * H)]));
  await b.sync();
  assert.deepEqual(b.net.writes, []);
}

// No session on this phone, or no network: nothing lost; the network failure rejects so the browser retries
{
  const b = browser({ session: null });
  await b.put('outbox', box([entry(2, NOW + 10 * H)]));
  await b.sync();
  assert.equal((await b.read('outbox')).queue.length, 1);
  const c = browser({ session: { accessToken: 'kept', expirationTime: NOW + H } });
  await c.put('outbox', box([entry(2, NOW + 10 * H)]));
  c.net.up = false;
  await assert.rejects(c.sync());
  assert.equal((await c.read('outbox')).queue.length, 1);
}
console.log('✓ sw-sync: with the app closed the worker uploads La Copa\'s offline days, start first, as the phone\'s session; the page reconciles (D-544)');
