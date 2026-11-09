/**
 * El service worker de la app (D-221). Vive en la raíz para que su alcance sea todo el sitio.
 *
 * Muestra los avisos de La Copa (D-223) y, al tocarlos, abre la copa en el día que toca: enfoca
 * la pestaña de la app si ya está abierta, o abre una. En Android, los botones del aviso (D-229)
 * abren su propia dirección: Jugar, el día; Silenciar esta copa, la copa con `&mute`.
 *
 * Offline mode (D-538, docs/OFFLINE.md, PR 2), only while the page says the flag `offline` is on
 * for this visitor (a message from instalable.js; with it off nothing is cached and every request
 * goes to the network exactly as before, D-221):
 * - Pages: network first, with a timeout; the cache only when the network fails, so an online
 *   player always gets the latest version. A page never cached redirects to the home page.
 * - Files with `?h=` (every module and stylesheet, D-467): cache first. The hash is the content,
 *   so a cached one is never stale.
 * - Other files of the site (decks, pictures, music once played) and the Firebase SDK on gstatic:
 *   from the cache if there, else the network, and kept. Firebase's own traffic is never touched.
 * - The release's list (`precache.json`, tools/release/precache.mjs) is stored when the page
 *   reports a release this worker has not stored yet; then older releases' caches go.
 * - **Cut** (`forced`, the testers' switch, connection.js): the network is gone for this site, as in
 *   airplane mode. Every request this worker sees, of any site and method, is answered from the
 *   cache or fails; nothing reaches the network. The page cuts what a worker cannot see (sockets).
 */
const CONFIG = 'jds-config';
const RUNTIME = 'jds-runtime';
const release = r => `jds-release-${r}`;
const PAGE_TIMEOUT = 4000;
const SDK = /^https:\/\/www\.gstatic\.com\/firebasejs\//;

/** The stored setting: `{ on, release }`, from the last message of a page. */
async function config() {
  try { const r = await (await caches.open(CONFIG)).match('config'); return r ? await r.json() : {}; } catch (_) { return {}; }
}

async function setConfig(c) {
  await (await caches.open(CONFIG)).put('config', new Response(JSON.stringify(c), { headers: { 'content-type': 'application/json' } }));
}

/** Stores a release's list; a URL that fails is skipped, not the whole release. */
async function store(rel) {
  const res = await fetch('precache.json', { cache: 'no-store' });
  if (!res.ok) return false;
  const list = await res.json();
  const cache = await caches.open(release(list.release || rel));
  const missing = [];
  for (const u of list.urls) if (!(await cache.match(u))) missing.push(u);
  for (let i = 0; i < missing.length; i += 8) {
    await Promise.all(missing.slice(i, i + 8).map(u => fetch(u, { cache: 'no-cache' })
      .then(r => (r.ok ? cache.put(u, r) : null)).catch(() => null)));
  }
  for (const k of await caches.keys()) if (k.startsWith('jds-release-') && k !== release(list.release || rel)) await caches.delete(k);
  // Pages an earlier version of this worker kept in the runtime cache: they belong to an old release
  const rt = await caches.open(RUNTIME);
  for (const req of (await rt.keys?.()) || []) if (new URL(req.url).pathname.endsWith('/')) await rt.delete(req);
  return true;
}

/** Everything offline mode keeps, gone (the flag was turned off). */
async function forget() {
  for (const k of await caches.keys()) if (k.startsWith('jds-')) await caches.delete(k);
}

/** A message from a page: `{ type: 'offline', on, release, forced }`. */
async function told({ on, release: rel, forced = false }) {
  const c = await config();
  encendido = !!on;
  cortado = !!on && !!forced;
  if (!on) { if (c.on) await forget(); return; }
  if (c.on && c.release === rel && !!c.forced === cortado) return;
  await setConfig({ on: true, release: rel ?? c.release, forced: cortado });
  // Cut, there is no network to store a release from: what is kept is what there is
  if (rel && !cortado && !(c.on && c.release === rel)) await store(rel);
}

self.addEventListener('message', e => {
  // A reply port, when the page waits for the change to hold (the testers' switch reloads after it)
  if (e.data?.type === 'offline') e.waitUntil(told(e.data).finally(() => e.ports?.[0]?.postMessage('ok')));
});

// Whether offline mode is on, known without waiting: read at each worker start and kept up to date by
// told(). A page load always waits for it; a file asked before it is known goes to the network untouched
let encendido = null;
let cortado = null;
const leido = config().then(c => { encendido = !!c.on; cortado = !!c.on && !!c.forced; });

/** Cut: from the cache or nothing, like a phone with no signal. A page never kept goes home. */
async function cut(req) {
  if (req.method !== 'GET') return Response.error();
  const url = new URL(req.url);
  if (req.mode === 'navigate') {
    const page = await fromCache(url.origin + url.pathname);
    if (page) return page;
    const home = new URL('./', self.registration.scope).href;
    if (url.href !== home && await fromCache(home)) return Response.redirect(home, 302);
    return Response.error();
  }
  return (await fromCache(req)) || (url.origin === self.location.origin && await fromCache(req, { ignoreSearch: true })) || Response.error();
}

async function fromCache(req, opts) {
  // The runtime cache first: it holds the last version of a page seen online, newer than the release's
  const keys = (await caches.keys()).filter(k => k.startsWith('jds-') && k !== CONFIG).sort((a, b) => (b === RUNTIME) - (a === RUNTIME));
  for (const k of keys) { const r = await (await caches.open(k)).match(req, opts); if (r) return r; }
  return null;
}

async function page(req) {
  const url = new URL(req.url);
  const net = fetch(req).then(r => {
    // A page's fresh copy goes in the current release's cache, never the runtime one: its modules carry
    // that release's ?h=, so it must go when the release goes. Kept across releases, an old page asked
    // for files the new release no longer stores and drew blank (Shinobi, 2026-11-07)
    if (r.ok) { const copy = r.clone(); config().then(c => caches.open(release(c.release || 'dev'))).then(c => c.put(url.origin + url.pathname, copy)); }
    return r;
  });
  const timeout = new Promise(res => setTimeout(() => res(null), PAGE_TIMEOUT));
  try {
    const r = await Promise.race([net.catch(() => null), timeout]);
    if (r) return r;
  } catch (_) { /* to the cache */ }
  const cached = await fromCache(url.origin + url.pathname);
  if (cached) return cached;
  // A page never stored: send the browser to the home page, so its address is the home page's too.
  // Served under the old address, its relative links (assets/…) would miss and it drew unstyled
  const home = new URL('./', self.registration.scope).href;
  if (url.href !== home && await fromCache(home)) return Response.redirect(home, 302);
  return net;   // not even the home page: wait for the network after all
}

async function keep(req) {
  const hit = await fromCache(req);
  if (hit) return hit;
  let r;
  try { r = await fetch(req); } catch (e) {
    // No signal and not this exact file: another version of it (another ?h=) beats a page whose
    // modules fail to load, which leaves it half drawn (the home page without its buttons, 2026-11-07)
    const near = await fromCache(req, { ignoreSearch: true });
    if (near) return near;
    throw e;
  }
  if (r.ok || r.type === 'opaque') { const copy = r.clone(); caches.open(RUNTIME).then(c => c.put(req, copy)); }
  return r;
}

/** What an uncut worker does with a request, once it knows whether offline mode is on. */
function normal(req) {
  const url = new URL(req.url);
  const mine = url.origin === self.location.origin;
  if (req.method !== 'GET' || (!mine && !SDK.test(req.url))) return fetch(req);
  if (mine && (url.pathname.endsWith('/sw.js') || url.pathname.endsWith('/precache.json'))) return fetch(req);
  if (req.mode === 'navigate') return encendido ? page(req) : fetch(req);
  return encendido ? keep(req) : fetch(req);
}

self.addEventListener('fetch', e => {
  const req = e.request;
  // The way out of a cut with nothing cached to show (offline-cut.js): this address goes through and ends it
  if (cortado !== false && req.mode === 'navigate' && req.url.includes('connection=online')) {
    cortado = false;
    e.respondWith(config().then(c => setConfig({ ...c, forced: false })).then(() => fetch(req)));
    return;
  }
  if (cortado) { e.respondWith(cut(req)); return; }
  // Just woken, not yet known whether it is cut: every request waits for the answer
  if (cortado === null) { e.respondWith(leido.then(() => (cortado ? cut(req) : normal(req)))); return; }
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const mine = url.origin === self.location.origin;
  if (!mine && !SDK.test(req.url)) return;   // Firebase, analytics and everything else: untouched
  if (mine && (url.pathname.endsWith('/sw.js') || url.pathname.endsWith('/precache.json'))) return;
  if (req.mode === 'navigate') {
    if (encendido === false) return;
    e.respondWith(leido.then(() => (encendido ? page(req) : fetch(req))));
    return;
  }
  if (encendido) e.respondWith(keep(req));
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

/** Un aviso llega como JSON: `{ title, body, url, tag, acciones? }`. Lo que no se entiende no se muestra. */
self.addEventListener('push', e => {
  let a = null;
  try { a = e.data ? e.data.json() : null; } catch (_) { a = null; }
  if (!a || !a.title) return;
  const acciones = Array.isArray(a.acciones) ? a.acciones.filter(x => x && x.action && x.title).slice(0, 2) : [];
  // El aviso de Uno al día pone el globo del ícono (un 1: falta jugar el de hoy, D-230)
  if (String(a.tag || '').startsWith('uad-dia') && self.navigator?.setAppBadge) self.navigator.setAppBadge(1).catch(() => {});
  e.waitUntil(self.registration.showNotification(a.title, {
    body: a.body || '',
    icon: 'assets/icons/icon-192.png',
    tag: a.tag || undefined,
    renotify: !!a.tag,
    actions: acciones.map(({ action, title }) => ({ action, title })),
    data: { url: a.url || './', acciones: Object.fromEntries(acciones.map(x => [x.action, x.url || a.url || './'])) },
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const datos = e.notification.data || {};
  // Only a page of this site opens: a link to anywhere else goes to the site's home page instead.
  // The one exception is the repo's own GitHub run, where the owner's "not published" notification
  // points (tools/push/release.mjs, D-504)
  const scope = self.registration.scope;
  let url;
  try { url = new URL((e.action && datos.acciones?.[e.action]) || datos.url || './', scope); } catch (_) { url = null; }
  const repo = url && url.origin === 'https://github.com' && url.pathname.startsWith('/ellokojavi/juegos-de-salon/');
  if (repo) { e.waitUntil(self.clients.openWindow(url.href)); return; }
  url = url && url.origin === self.location.origin ? url.href : scope;
  e.waitUntil((async () => {
    const abiertas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const misma = abiertas.find(c => c.url === url) || abiertas.find(c => new URL(c.url).origin === self.location.origin);
    if (misma) {
      if (misma.url !== url && 'navigate' in misma) await misma.navigate(url);
      return misma.focus();
    }
    return self.clients.openWindow(url);
  })());
});

/*
 * La Copa offline with the app closed (D-544, Background Sync, Chrome on Android): a day played with
 * no signal asks for a `cup-outbox` sync, and the browser wakes this worker when the signal is back.
 * The page mirrors its queue in the cache `cup-sync` (`outbox`: `{ queue, apiKey, databaseURL }`,
 * assets/js/cup-outbox.js); this uploads it as the page would (the start, then the result) over the
 * database's REST API, signed in as the phone's own anonymous session, and writes what it did in
 * `done` for the next page to reconcile. With a window of the app on screen it does nothing: that
 * page uploads. A network failure rejects, so the browser tries again later.
 */
const SYNC_CACHE = 'cup-sync';
const SYNC_MARGIN = 10 * 60 * 1000;
const SV = { '.sv': 'timestamp' };

const syncRead = async key => { try { const r = await (await caches.open(SYNC_CACHE)).match(key); return r ? await r.json() : null; } catch (_) { return null; } };
const syncWrite = async (key, v) => (await caches.open(SYNC_CACHE)).put(key, new Response(JSON.stringify(v), { headers: { 'content-type': 'application/json' } }));

/** The phone's Firebase session, as the Firebase SDK keeps it in IndexedDB: its stsTokenManager, or null. */
function firebaseSession(apiKey) {
  return new Promise(resolve => {
    let open;
    try { open = indexedDB.open('firebaseLocalStorageDb'); } catch (_) { resolve(null); return; }
    open.onerror = () => resolve(null);
    open.onsuccess = () => {
      const db = open.result;
      try {
        const get = db.transaction('firebaseLocalStorage', 'readonly').objectStore('firebaseLocalStorage').get(`firebase:authUser:${apiKey}:[DEFAULT]`);
        get.onsuccess = () => { resolve(get.result?.value?.stsTokenManager || null); db.close(); };
        get.onerror = () => { resolve(null); db.close(); };
      } catch (_) { resolve(null); db.close(); }
    };
  });
}

/** A fresh ID token for the REST API: the kept one while it lasts, else one from the refresh token. */
async function syncToken(apiKey, now = Date.now()) {
  const s = await firebaseSession(apiKey);
  if (!s) return null;
  if (s.accessToken && s.expirationTime > now + 60000) return s.accessToken;
  if (!s.refreshToken) return null;
  const r = await fetch(`https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(s.refreshToken)}`,
  });
  if (!r.ok) return null;
  return (await r.json()).id_token || null;
}

/** Uploads the mirrored queue. Returns `{ sent, late, dup }` (ids); throws on a network failure. */
async function cupSync({ now = Date.now(), token = syncToken } = {}) {
  const box = await syncRead('outbox');
  const done = { sent: [], late: [], dup: [], ...((await syncRead('done')) || {}) };
  if (!box?.queue?.length) return done;
  const auth = await token(box.apiKey, now);
  if (!auth) return done;   // no session on this phone: the page uploads it when it opens
  const db = box.databaseURL.replace(/\/$/, '');
  const write = async (path, value) => {
    const r = await fetch(`${db}/.json?auth=${encodeURIComponent(auth)}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ [path]: value }) });
    if (r.ok) return true;
    if (r.status === 401 || r.status === 403) return false;
    throw new Error(`database ${r.status}`);
  };
  const there = async path => { const r = await fetch(`${db}/${path}.json`); if (!r.ok) throw new Error(`database ${r.status}`); return (await r.json()) != null; };
  const left = [];
  for (const x of box.queue) {
    if (!x.res) { if (now < x.b + SYNC_MARGIN) left.push(x); continue; }
    if (now >= x.b + SYNC_MARGIN) { done.late.push(x.id); continue; }
    const base = `torneos/${x.code}`;
    const started = `${base}/started/${x.d}/${x.pid}`, result = `${base}/results/${x.d}/${x.pid}`;
    if (!(await write(started, SV)) && !(await there(started))) { if (now >= x.b) done.late.push(x.id); else left.push(x); continue; }
    if (await write(result, { ...x.res, at: SV })) { done.sent.push(x.id); continue; }
    if (await there(result)) { done.dup.push(x.id); continue; }
    if (now >= x.b) done.late.push(x.id); else left.push(x);
  }
  await syncWrite('done', done);
  if (left.length) await syncWrite('outbox', { ...box, queue: left });
  else await (await caches.open(SYNC_CACHE)).delete('outbox');
  return done;
}

self.addEventListener('sync', e => {
  if (e.tag !== 'cup-outbox') return;
  e.waitUntil((async () => {
    // A page of the app on screen uploads it itself: two at once would count the day as played elsewhere
    const open = await self.clients.matchAll({ type: 'window' });
    if (open.some(c => c.visibilityState === 'visible')) return;
    await cupSync();
  })());
});
