// Run: node public/sw.test.mjs
// The service worker's offline mode (D-538, PR 2), run in a fake worker: with the flag off it caches
// nothing and pages go to the network as before (D-221); on, it stores the release's list, serves
// pages network-first with the cache as fallback, and files with ?h= from the cache.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ORIGIN = 'https://juegosdesalon.cl';
const SRC = readFileSync(new URL('./sw.js', import.meta.url), 'utf8');

function worker({ site }) {
  const store = new Map();   // cache name → Map(url → body)
  const key = r => new URL(typeof r === 'string' ? r : r.url, ORIGIN + '/').href;
  const caches = {
    open: async name => {
      if (!store.has(name)) store.set(name, new Map());
      const m = store.get(name);
      return {
        match: async (r, o) => {
          if (m.has(key(r))) return new Response(m.get(key(r)));
          const near = o?.ignoreSearch && [...m.keys()].find(u => u.split('?')[0] === key(r).split('?')[0]);
          return near ? new Response(m.get(near)) : undefined;
        },
        put: async (r, res) => { m.set(key(r), await res.text()); },
        keys: async () => [...m.keys()].map(url => ({ url })),
        delete: async r => m.delete(key(r)),
      };
    },
    keys: async () => [...store.keys()],
    delete: async name => store.delete(name),
  };
  const net = { up: true, asked: [] };
  const fetch = async (r) => {
    const url = key(r);
    net.asked.push(url);
    if (!net.up) throw new TypeError('offline');
    const path = url.slice(ORIGIN.length);
    if (path.startsWith('/precache.json')) return new Response(JSON.stringify(site.list));
    if (url.startsWith('https://www.gstatic.com/')) return new Response('sdk');
    return site.files[path] != null ? new Response(site.files[path]) : new Response('', { status: 404 });
  };
  const handlers = {};
  const self = {
    addEventListener: (t, f) => (handlers[t] ||= []).push(f),
    location: new URL(ORIGIN + '/sw.js'),
    registration: { scope: ORIGIN + '/', showNotification() {} },
    clients: { claim: async () => {}, matchAll: async () => [] },
    skipWaiting() {},
  };
  vm.runInNewContext(SRC, { self, Response, caches, fetch, Response, URL, Promise, setTimeout, JSON, console });
  const event = (type, data) => {
    let waited = null, responded = null;
    const e = { ...data, waitUntil: p => { waited = p; }, respondWith: p => { responded = p; } };
    for (const h of handlers[type] || []) h(e);
    return { waited, responded };
  };
  return {
    store, net,
    async tell(msg) { await event('message', { data: msg }).waited; },
    async get(path, mode = 'no-cors') {
      const { responded } = event('fetch', { request: { url: new URL(path, ORIGIN + '/').href, method: 'GET', mode } });
      if (!responded) return 'UNTOUCHED';
      const r = await responded;
      return r.status === 302 ? `REDIRECT ${r.headers.get('location')}` : r.text();
    },
    ready: () => new Promise(r => setTimeout(r, 0)),
  };
}

const site = {
  files: { '/': 'home v1', '/zip/': 'zip v1', '/assets/js/ui.js?h=aaaa1111': 'ui', '/cup/': 'cup' },
  list: { release: '0.1.0-abc', urls: ['./', 'zip/', 'assets/js/ui.js?h=aaaa1111'] },
};

const w = worker({ site });
await w.ready();

// Off (the default, and for everyone until the flag is published): nothing changes
assert.equal(await w.get('/zip/', 'navigate'), 'UNTOUCHED', 'a page goes to the network untouched');
assert.equal(await w.get('/assets/js/ui.js?h=aaaa1111'), 'UNTOUCHED', 'a file is not even intercepted');
assert.equal([...w.store.keys()].filter(k => k !== 'jds-config').length, 0, 'nothing is cached');

// On: the release is stored
await w.tell({ type: 'offline', on: true, release: '0.1.0-abc' });
assert.ok(w.store.get('jds-release-0.1.0-abc')?.has(ORIGIN + '/zip/'), 'the release\'s pages are stored');
assert.ok(w.store.get('jds-release-0.1.0-abc')?.has(ORIGIN + '/assets/js/ui.js?h=aaaa1111'), 'and its files');

// Online, a page is the network's, so a newer version wins
site.files['/zip/'] = 'zip v2';
assert.equal(await w.get('/zip/', 'navigate'), 'zip v2', 'online: the newest page');

// A hashed file comes from the cache without asking the network
w.net.asked.length = 0;
assert.equal(await w.get('/assets/js/ui.js?h=aaaa1111'), 'ui');
assert.deepEqual(w.net.asked, [], 'a ?h= file is served from the cache');

// Offline: pages from the cache; one never cached falls back to the home page
w.net.up = false;
await w.ready();
assert.equal(await w.get('/zip/', 'navigate'), 'zip v2', 'offline: the last page seen');
assert.equal(await w.get('/zip/?lang=en', 'navigate'), 'zip v2', 'the query does not matter for a page');
assert.equal(await w.get('/cup/', 'navigate'), 'REDIRECT https://juegosdesalon.cl/', 'a page never cached: a redirect to the home page, so its relative links resolve (it drew unstyled under /labs/)');

// Offline, a module whose exact version is not stored: another stored version of it, not a failure
assert.equal(await w.get('/assets/js/ui.js?h=bbbb2222'), 'ui', 'a different ?h= of a stored file, when the network is out');

// Firebase's own traffic is never touched; the SDK is kept once loaded
assert.equal(await w.get('https://juegos-de-salon-default-rtdb.firebaseio.com/x.json'), 'UNTOUCHED');
w.net.up = true;
assert.equal(await w.get('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'), 'sdk');
w.net.up = false;
assert.equal(await w.get('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'), 'sdk', 'the SDK offline, once loaded');

// A new release replaces the old one
w.net.up = true;
site.list = { release: '0.2.0-def', urls: ['./', 'zip/'] };
await w.tell({ type: 'offline', on: true, release: '0.2.0-def' });
assert.ok(w.store.has('jds-release-0.2.0-def') && !w.store.has('jds-release-0.1.0-abc'), 'the old release\'s cache goes');

// A page seen online under the old release does not outlive it: offline, the new release's copy wins
w.net.up = false;
site.files['/zip/'] = 'zip v3';
assert.equal(await w.get('/zip/', 'navigate'), 'zip v2', 'the page stored with release 0.2.0 (fetched when it was stored)');
assert.ok(![...(w.store.get('jds-runtime')?.keys() || [])].some(u => u.endsWith('/zip/')), 'no page is kept in the runtime cache');
w.net.up = true;

// Off again: everything goes
await w.tell({ type: 'offline', on: false, release: '0.2.0-def' });
assert.deepEqual([...w.store.keys()], [], 'turning the flag off forgets everything');
assert.equal(await w.get('/assets/js/ui.js?h=aaaa1111'), 'UNTOUCHED');

console.log('✓ sw: off changes nothing; on stores the release, pages network-first, ?h= from the cache, old releases go');
