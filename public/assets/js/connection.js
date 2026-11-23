/**
 * Whether the app is online or in offline mode (D-538, docs/OFFLINE.md, PR 3). One state for the
 * whole page; screens only listen (`onChange`) and read it (`mode()`), they never probe themselves.
 *
 * - On at once when the browser says it is offline (`offline` event, `navigator.onLine === false`).
 * - On within REFUSED_AGAIN when a probe is refused outright twice (the request fails, no answer at
 *   all): the phone has no route, as in airplane mode. One refusal alone is a hiccup (a DNS miss, a
 *   Wi-Fi to mobile-data handoff) and must not paint a room in Candlelight; an aborted request is none. An iPhone there often keeps saying it is online and sends no
 *   `offline` event, so the probes are all there is; they run every EVERY_ONLINE while the page is in
 *   view, on each touch of the screen (at most every TOUCH_GAP), when the phone's network changes
 *   (`navigator.connection`, Android) and on coming back to the front.
 * - On when the connection is too poor to use: two probes in a row take over PROBE_TIMEOUT, the second
 *   CONFIRM after the first. A probe is a HEAD of `precache.json`, which the service worker never
 *   answers from its cache.
 * - Off at once when the browser says it is back online (`online` event) and a probe agrees; otherwise
 *   only after two good probes at least STEADY apart, so a flaky signal does not flip the screen.
 * - Testers can force it from the offline card in /labs/ or the T tab (FORCE_KEY '1' on this phone); players cannot.
 *   FORCE_KEY '0' keeps it off, for end-to-end scripts that cut the network on purpose.
 *
 * Started by instalable.js on every page, and only while the flag `offline` is on. The state is also
 * on `<html data-connection="online|offline">`, for CSS, and announced as a `connection` event.
 */
export const FORCE_KEY = 'juegos-de-salon:offline-forced';
export const PROBE_TIMEOUT = 4000;
export const STEADY = 10000;
// Online, a probe every EVERY_ONLINE while the page is in view (none while hidden). Airplane mode must
// show at once (the owner, 2026-11-23: 60 s and then 20 s rounds were "several seconds" too many)
export const EVERY_ONLINE = 5000;
export const CONFIRM = 1500;
// A refused probe is asked again this soon: airplane mode shows in about half a second, a hiccup does not
export const REFUSED_AGAIN = 500;
// A touch of the screen probes, at most this often: the player who just switched airplane mode on and
// taps sees the offline palette right away
export const TOUCH_GAP = 2000;
// Back in front while online, the radio may still be waking up (see RETRIES): the probe waits a moment,
// and a refusal right then is confirmed CONFIRM later, so an unlocked phone does not flash offline mid-room
export const RETURN_WAIT = 1000;
export const EVERY_OFFLINE = 15000;
/**
 * When the browser says it is back (or the page comes back to the front), the first probe often fails:
 * the phone has its radio on but no route yet. These quick retries keep the browser's word, so the
 * screen goes back within seconds instead of waiting for two slow probes (the owner, 2026-11-08: back
 * from airplane mode, it stayed in Candlelight).
 */
export const RETRIES = [2000, 4000, 8000];

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

  let lastProbe = -Infinity;
  let refusedLast = false;   // the last failed probe got no answer at all (not a slow one)
  let byRefusal = false;     // offline because the requests were refused, not because they were slow
  async function probe({ trusted = false, careful = false } = {}) {
    let ok = false;
    let refused = false;
    let aborted = false;
    let slow = null;
    lastProbe = now();
    try {
      const r = await Promise.race([
        fetcher(`${probeUrl}?probe=${now()}`, { method: 'HEAD', cache: 'no-store' }),
        new Promise((_, no) => { slow = timer.set(() => no(new Error('slow')), PROBE_TIMEOUT); }),
      ]);
      ok = !!r && r.status < 500;
    } catch (e) { ok = false; aborted = e?.name === 'AbortError'; refused = !aborted && e?.message !== 'slow'; }
    if (slow !== null) timer.clear(slow);
    // A request the page itself cancelled (leaving the page) says nothing about the connection
    if (aborted) return false;
    if (!ok) {
      lastGood = null;
      // Two failures in a row: refused ones are asked again REFUSED_AGAIN later, slow ones CONFIRM later,
      // and right after coming back to the front (a waking radio) CONFIRM later too
      refusedLast = refused && !careful;
      if (++fails >= 2 || nav?.onLine === false) { byRefusal = refused; set('offline'); }
    } else {
      fails = 0;
      // Offline only because requests were refused, and the browser never said offline: one good answer
      // is the route back, at once (a false flash lasts half a second, not half a minute)
      if (detected === 'offline' && byRefusal && nav?.onLine !== false) { byRefusal = false; set('online'); return ok; }
      // Back online only after two good probes STEADY apart, unless the browser itself said it is back
      // (the `online` event) and a probe agrees: then at once, on the screen the player is on (the
      // owner, 2026-11-07: it waited for the next page)
      if (detected === 'offline') {
        if (trusted && nav?.onLine !== false) set('online');
        else if (lastGood !== null && now() - lastGood >= STEADY) set('online');
        else if (lastGood === null) lastGood = now();
      }
    }
    return ok;
  }

  // The browser says it is back, or the page came back to the front: probe now, trusting a good answer
  // while the browser says online, and retry quickly while the route comes up
  async function recheck(left = RETRIES) {
    if (next !== null) { timer.clear(next); next = null; }
    lastGood = null;
    const ok = await probe({ trusted: true });
    if (!ok && left.length && nav?.onLine !== false) {
      next = timer.set(() => { next = null; recheck(left.slice(1)); }, left[0]);
      return;
    }
    schedule(after());
  }

  // The wait before the next probe: a failed one is confirmed soon, so a dead connection shows in seconds
  const after = () => (detected === 'offline' ? EVERY_OFFLINE : fails > 0 ? (refusedLast ? REFUSED_AGAIN : CONFIRM) : EVERY_ONLINE);
  const hidden = () => doc?.visibilityState === 'hidden';

  function schedule(ms, careful = false) {
    if (next !== null) timer.clear(next);
    next = timer.set(async () => {
      next = null;
      // A page out of sight does not probe (battery, data); it looks again when it comes back
      if (hidden()) return;
      await probe({ careful });
      schedule(after());
    }, ms);
  }
  // A probe soon, unless one ran a moment ago (touches, network changes)
  // Offline by refusals, a touch also looks for the way back
  const soon = () => { if ((detected === 'online' || byRefusal) && !hidden() && now() - lastProbe >= TOUCH_GAP) schedule(0); };

  const api = {
    mode,
    isOffline: () => mode() === 'offline',
    onChange(f) { listeners.add(f); return () => listeners.delete(f); },
    /**
     * Testers only (the T tab, the /labs/ card): force offline mode on this phone, or stop forcing it.
     * Forced is a real cut (offline-cut.js, sw.js): the service worker is told, and the page reloads so
     * nothing opened before keeps a connection.
     */
    async force(on) {
      try { if (on) storage?.setItem(FORCE_KEY, '1'); else storage?.removeItem(FORCE_KEY); } catch (_) { /* no storage */ }
      publish();
      try {
        const sw = await nav?.serviceWorker?.ready;
        const release = doc?.querySelector?.('meta[name="release"]')?.content || 'dev';
        // Waits for the worker to hold it (or 2 s): reloaded sooner, the page would come from the network
        if (sw?.active) await new Promise(done => {
          const ch = new MessageChannel();
          ch.port1.onmessage = done;
          setTimeout(done, 2000);
          sw.active.postMessage({ type: 'offline', on: true, release, forced: !!on }, [ch.port2]);
        });
      } catch (_) { /* no worker: the page's own cut still holds */ }
      try { win?.location?.reload(); } catch (_) { /* not a page */ }
    },
    forced,
    probe,
    start() {
      if (started) return api;
      started = true;
      shown = mode();
      if (doc?.documentElement) doc.documentElement.dataset.connection = shown;
      win?.addEventListener?.('offline', () => { lastGood = null; byRefusal = false; set('offline'); schedule(EVERY_OFFLINE); });
      win?.addEventListener?.('online', () => recheck());
      // A phone switched into or out of airplane mode from its settings: the page was in the background,
      // its timers asleep, and the `offline` or `online` event may never reach it. Back in front, it
      // looks again: out of offline with quick retries, into it with a probe confirmed CONFIRM later.
      // Once per return: `visibilitychange`, `pageshow` and `focus` often come together
      let lastBack = -Infinity;
      const back = () => {
        if (hidden() || now() - lastBack < 1000) return;
        lastBack = now();
        if (detected === 'offline') recheck();
        else schedule(RETURN_WAIT, true);
      };
      doc?.addEventListener?.('visibilitychange', back);
      win?.addEventListener?.('pageshow', back);
      win?.addEventListener?.('focus', back);
      win?.addEventListener?.('storage', e => { if (e.key === FORCE_KEY) publish(); });
      // The player touches the screen, or the phone's network changes (Android): look now
      doc?.addEventListener?.('pointerdown', soon, { capture: true, passive: true });
      // A handoff (Wi-Fi to mobile data) refuses requests for a moment: looked at like a return to the front
      try { nav?.connection?.addEventListener?.('change', () => (detected === 'offline' ? recheck() : schedule(RETURN_WAIT, true))); } catch (_) { /* no Network Information API */ }
      schedule(detected === 'offline' ? EVERY_OFFLINE : 0);
      return api;
    },
  };
  return api;
}

/** The page's one connection, started on first use. */
let one = null;
export const connection = () => (one ||= createConnection().start());
