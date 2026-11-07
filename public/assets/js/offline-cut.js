/**
 * The testers' cut (D-538, the T tab's switch): while offline mode is forced on this phone, the page
 * has no network, as in airplane mode, so a test of offline mode is not fooled by a signal it still
 * has. The service worker answers every request it sees from the cache or fails (sw.js); this cuts
 * what it cannot see or what runs before it: fetch, XMLHttpRequest, WebSocket (Firebase's live
 * connection), EventSource and sendBeacon, and makes the browser say it is offline
 * (`navigator.onLine` false). Loaded first by instalable.js on every page. Switching the cut on or
 * off reloads the page, so nothing opened before it keeps a connection. Stuck on a page that cannot
 * load, any address with `?connection=online` ends it (ESCAPE).
 */
import { FORCE_KEY } from './connection.js';

const NO = () => new TypeError('Failed to fetch (offline mode forced on this phone)');

/** Whether the cut is on for this phone. */
export function isCut(storage = globalThis.localStorage) {
  try { return storage?.getItem(FORCE_KEY) === '1'; } catch (_) { return false; }
}

/** Cuts the page's own ways out (once). Returns whether it did. */
export function cutPage(win = globalThis.window) {
  if (!win || win.__offlineCut) return false;
  win.__offlineCut = true;
  win.fetch = () => Promise.reject(NO());
  if (win.XMLHttpRequest) {
    const X = win.XMLHttpRequest;
    win.XMLHttpRequest = class extends X {
      send() { setTimeout(() => { this.dispatchEvent(new win.ProgressEvent('error')); this.dispatchEvent(new win.ProgressEvent('loadend')); }, 0); }
    };
  }
  // A socket that never opens: closes at once, as one with no signal does
  const dead = name => class extends EventTarget {
    constructor(url) {
      super(); this.url = String(url); this.readyState = 3; this.CONNECTING = 0; this.OPEN = 1; this.CLOSING = 2; this.CLOSED = 3;
      setTimeout(() => {
        this.dispatchEvent(new win.Event('error')); this.onerror?.(new win.Event('error'));
        if (name === 'WebSocket') { const c = new win.CloseEvent('close', { code: 1006, wasClean: false }); this.dispatchEvent(c); this.onclose?.(c); }
      }, 0);
    }
    send() { throw new DOMException('offline mode forced', 'InvalidStateError'); }
    close() {}
  };
  if (win.WebSocket) { const W = dead('WebSocket'); Object.assign(W, { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 }); win.WebSocket = W; }
  if (win.EventSource) win.EventSource = dead('EventSource');
  if (win.navigator) {
    try { Object.defineProperty(win.navigator, 'onLine', { get: () => false, configurable: true }); } catch (_) { /* read-only here */ }
    try { win.navigator.sendBeacon = () => false; } catch (_) { /* read-only here */ }
  }
  return true;
}

/**
 * The way out when nothing is cached to show (a page that never loaded offline): any address with
 * `?connection=online` ends the cut, here and in the service worker, which lets that page through.
 */
export const ESCAPE = 'connection=online';
if (globalThis.location?.search?.includes(ESCAPE)) { try { globalThis.localStorage?.removeItem(FORCE_KEY); } catch (_) { /* no storage */ } }

if (globalThis.window && isCut()) cutPage(globalThis.window);
