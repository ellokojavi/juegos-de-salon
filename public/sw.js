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
 *   player always gets the latest version. A page never cached falls back to the home page.
 * - Files with `?h=` (every module and stylesheet, D-467): cache first. The hash is the content,
 *   so a cached one is never stale.
 * - Other files of the site (decks, pictures, music once played) and the Firebase SDK on gstatic:
 *   from the cache if there, else the network, and kept. Firebase's own traffic is never touched.
 * - The release's list (`precache.json`, tools/release/precache.mjs) is stored when the page
 *   reports a release this worker has not stored yet; then older releases' caches go.
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
  return true;
}

/** Everything offline mode keeps, gone (the flag was turned off). */
async function forget() {
  for (const k of await caches.keys()) if (k.startsWith('jds-')) await caches.delete(k);
}

/** A message from a page: `{ type: 'offline', on, release }`. */
async function told({ on, release: rel }) {
  const c = await config();
  encendido = !!on;
  if (!on) { if (c.on) await forget(); return; }
  if (c.on && c.release === rel) return;
  await setConfig({ on: true, release: rel });
  if (rel) await store(rel);
}

self.addEventListener('message', e => {
  if (e.data?.type === 'offline') e.waitUntil(told(e.data));
});

// Whether offline mode is on, known without waiting: read at each worker start and kept up to date by
// told(). A page load always waits for it; a file asked before it is known goes to the network untouched
let encendido = null;
const leido = config().then(c => { encendido = !!c.on; });

async function fromCache(req) {
  // The runtime cache first: it holds the last version of a page seen online, newer than the release's
  const keys = (await caches.keys()).filter(k => k.startsWith('jds-') && k !== CONFIG).sort((a, b) => (b === RUNTIME) - (a === RUNTIME));
  for (const k of keys) { const r = await (await caches.open(k)).match(req); if (r) return r; }
  return null;
}

async function page(req) {
  const url = new URL(req.url);
  const net = fetch(req).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(RUNTIME).then(c => c.put(url.origin + url.pathname, copy)); }
    return r;
  });
  const timeout = new Promise(res => setTimeout(() => res(null), PAGE_TIMEOUT));
  try {
    const r = await Promise.race([net.catch(() => null), timeout]);
    if (r) return r;
  } catch (_) { /* to the cache */ }
  const cached = await fromCache(url.origin + url.pathname) || await fromCache(new URL('./', self.registration.scope).href);
  return cached || net;   // nothing cached: wait for the network after all
}

async function keep(req) {
  const hit = await fromCache(req);
  if (hit) return hit;
  const r = await fetch(req);
  if (r.ok || r.type === 'opaque') { const copy = r.clone(); caches.open(RUNTIME).then(c => c.put(req, copy)); }
  return r;
}

self.addEventListener('fetch', e => {
  const req = e.request;
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
