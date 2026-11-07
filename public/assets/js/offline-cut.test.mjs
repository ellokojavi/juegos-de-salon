// Run: node public/assets/js/offline-cut.test.mjs
// The testers' cut (D-538): forced offline mode takes the page's own ways out away, as airplane mode does.
import assert from 'node:assert/strict';
import { cutPage, isCut, ESCAPE } from './offline-cut.js';
import { FORCE_KEY } from './connection.js';

const store = v => ({ getItem: k => (k === FORCE_KEY ? v : null) });
assert.equal(isCut(store('1')), true, 'forced: cut');
assert.equal(isCut(store(null)), false, 'not forced: not cut');
assert.equal(isCut(store('0')), false, "'0' (end-to-end scripts keeping the mode off) is not a cut");
assert.equal(isCut({ getItem() { throw new Error('blocked'); } }), false, 'no storage: not cut');

class FakeXHR extends EventTarget { send() { this.reached = true; } }
const win = {
  fetch: async () => 'REACHED', XMLHttpRequest: FakeXHR, WebSocket: class { constructor() { this.reached = true; } }, EventSource: class {},
  ProgressEvent: Event, Event, CloseEvent: class extends Event { constructor(t, o) { super(t); Object.assign(this, o); } },
  navigator: { onLine: true, sendBeacon: () => true },
};
assert.equal(cutPage(win), true);
assert.equal(cutPage(win), false, 'once per page');
await assert.rejects(win.fetch('https://juegos-de-salon-default-rtdb.firebaseio.com/x.json'), TypeError, 'fetch fails like a fetch with no signal');
assert.equal(win.navigator.onLine, false, 'the browser says offline');
assert.equal(win.navigator.sendBeacon('/x'), false, 'a beacon is not sent');
const ws = new win.WebSocket('wss://x');
const wsEnd = await new Promise(res => { const seen = []; ws.addEventListener('error', () => seen.push('error')); ws.onclose = c => { seen.push(`close ${c.code}`); res(seen); }; });
assert.deepEqual(wsEnd, ['error', 'close 1006'], 'a socket errors and closes, never opens');
assert.equal(ws.readyState, win.WebSocket.CLOSED);
const x = new win.XMLHttpRequest(); x.send();
const xEnd = await new Promise(res => x.addEventListener('error', () => res('error')));
assert.equal(xEnd, 'error'); assert.equal(x.reached, undefined, 'an XHR never reaches the network');
assert.equal(ESCAPE, 'connection=online');

console.log('✓ offline-cut: forced, the page has no fetch, XHR, sockets or beacons, and says it is offline');
