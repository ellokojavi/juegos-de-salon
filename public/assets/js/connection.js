/**
 * Whether the app is online or in offline mode (D-538, docs/OFFLINE.md, PR 3). One state for the
 * whole page; screens only listen (`onChange`) and read it (`mode()`), they never probe themselves.
 *
 * - On at once when the browser says it is offline (`offline` event, `navigator.onLine === false`).
 * - On when the connection is too poor to use: two probes in a row fail or take over PROBE_TIMEOUT.
 *   A probe is a HEAD of `precache.json`, which the service worker never answers from its cache.
 * - Off only after two good probes at least STEADY apart, so a flaky signal does not flip the screen.
 * - Testers can force it from the offline card in /labs/ (FORCE_KEY '1' on this phone); players cannot.
 *   FORCE_KEY '0' keeps it off, for end-to-end scripts that cut the network on purpose.
 *
 * Started by instalable.js on every page, and only while the flag `offline` is on. The state is also
 * on `<html data-connection="online|offline">`, for CSS, and announced as a `connection` event.
 */
export const FORCE_KEY = 'juegos-de-salon:offline-forced';
export const PROBE_TIMEOUT = 4000;
export const STEADY = 10000;
export const EVERY_ONLINE = 60000;
export const EVERY_OFFLINE = 15000;

export function createConnection({
  nav = globalThis.navigator,
  win = globalThis.window,
  doc = globalThis.document,
  storage = globalThis.localStorage,
  fetcher = (...a) => globalThis.fetch(...a),
  now = () => Date.now(),
  timer = { set: (f, ms) => setTimeout(f, ms), clear: id => clearTimeout(id) },
  probeUrl = new URL('../../precache.json', import.meta.url).href,
} = {}) {
  const listeners = new Set();
  let detected = nav?.onLine === false ? 'offline' : 'online';
  let fails = 0;
  let lastGood = null;
  let next = null;
  let started = false;

  const stored = () => { try { return storage?.getItem(FORCE_KEY); } catch (_) { return null; } };
  const forced = () => stored() === '1';
  // '0' keeps the mode off whatever the connection does: for end-to-end scripts that cut the network
  // to test a screen's own error (room-error.mjs), never shown to players or testers
  const mode = () => (forced() ? 'offline' : stored() === '0' ? 'online' : detected);
  let shown = mode();

  function publish() {
    const m = mode();
    if (m === shown) return;
    shown = m;
    if (doc?.documentElement) doc.documentElement.dataset.connection = m;
    for (const f of listeners) { try { f(m); } catch (_) { /* one listener never stops the others */ } }
    try { win?.dispatchEvent?.(new CustomEvent('connection', { detail: { mode: m } })); } catch (_) { /* no events here */ }
  }

  function set(m) { detected = m; publish(); }

  async function probe() {
    let ok = false;
    let slow = null;
    try {
      const r = await Promise.race([
        fetcher(`${probeUrl}?probe=${now()}`, { method: 'HEAD', cache: 'no-store' }),
        new Promise((_, no) => { slow = timer.set(() => no(new Error('slow')), PROBE_TIMEOUT); }),
      ]);
      ok = !!r && r.status < 500;
    } catch (_) { ok = false; }
    if (slow !== null) timer.clear(slow);
    if (!ok) {
      lastGood = null;
      if (++fails >= 2 || nav?.onLine === false) set('offline');
    } else {
      fails = 0;
      // Back online only after two good probes STEADY apart
      if (detected === 'offline') {
        if (lastGood !== null && now() - lastGood >= STEADY) set('online');
        else if (lastGood === null) lastGood = now();
      }
    }
    return ok;
  }

  function schedule(ms) {
    if (next !== null) timer.clear(next);
    next = timer.set(async () => { next = null; await probe(); schedule(detected === 'offline' ? EVERY_OFFLINE : EVERY_ONLINE); }, ms);
  }

  const api = {
    mode,
    isOffline: () => mode() === 'offline',
    onChange(f) { listeners.add(f); return () => listeners.delete(f); },
    /** Testers only (the /labs/ card): force offline mode on this phone, or stop forcing it. */
    force(on) {
      try { if (on) storage?.setItem(FORCE_KEY, '1'); else storage?.removeItem(FORCE_KEY); } catch (_) { /* no storage */ }
      publish();
    },
    forced,
    probe,
    start() {
      if (started) return api;
      started = true;
      shown = mode();
      if (doc?.documentElement) doc.documentElement.dataset.connection = shown;
      win?.addEventListener?.('offline', () => { lastGood = null; set('offline'); schedule(EVERY_OFFLINE); });
      win?.addEventListener?.('online', () => { lastGood = null; probe().then(() => schedule(STEADY)); });
      win?.addEventListener?.('storage', e => { if (e.key === FORCE_KEY) publish(); });
      schedule(detected === 'offline' ? EVERY_OFFLINE : 0);
      return api;
    },
  };
  return api;
}

/** The page's one connection, started on first use. */
let one = null;
export const connection = () => (one ||= createConnection().start());
