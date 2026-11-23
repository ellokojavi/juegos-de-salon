// Run: node public/assets/js/connection.test.mjs
// Offline mode's detector (D-538, PR 3): on at once when the browser says offline or after two bad
// probes, off only after two good probes STEADY apart, and testers can force it.
import assert from 'node:assert/strict';
import { createConnection, FORCE_KEY, PROBE_TIMEOUT, STEADY, EVERY_ONLINE, RETRIES, CONFIRM, RETURN_WAIT, TOUCH_GAP, REFUSED_AGAIN } from './connection.js';

function rig({ online = true } = {}) {
  const t = { now: 0, jobs: [] };
  const timer = {
    set: (f, ms) => { const j = { f, at: t.now + ms, id: Symbol() }; t.jobs.push(j); return j.id; },
    clear: id => { t.jobs = t.jobs.filter(j => j.id !== id); },
  };
  const advance = async ms => {
    const end = t.now + ms;
    for (let i = 0; i < 20; i++) await Promise.resolve();
    for (;;) {
      t.jobs.sort((a, b) => a.at - b.at);
      const j = t.jobs[0];
      if (!j || j.at > end) break;
      t.jobs.shift(); t.now = j.at; j.f();
      for (let i = 0; i < 20; i++) await Promise.resolve();
    }
    t.now = end;
  };
  const net = { mode: 'up' };   // up | down | slow
  const fetcher = () => (net.mode === 'up' ? Promise.resolve({ status: 200 })
    : net.mode === 'down' ? Promise.reject(new TypeError('offline')) : new Promise(() => {}));
  const handlers = {};
  const win = { addEventListener: (k, f) => { handlers[k] = f; }, dispatchEvent() {} };
  const nav = { onLine: online };
  const doc = { documentElement: { dataset: {} }, visibilityState: 'visible', addEventListener: (k, f) => { handlers[k] = f; } };
  const ls = new Map();
  const storage = { getItem: k => ls.get(k) ?? null, setItem: (k, v) => ls.set(k, v), removeItem: k => ls.delete(k) };
  const c = createConnection({ nav, win, doc, storage, fetcher, now: () => t.now, timer, probeUrl: 'https://x/precache.json' });
  const seen = [];
  c.onChange(m => seen.push(m));
  return { c, t, net, nav, handlers, doc, storage, seen, advance };
}

// The browser says offline: on at once
{
  const r = rig();
  r.c.start();
  assert.equal(r.c.mode(), 'online');
  r.nav.onLine = false; r.net.mode = 'down';
  r.handlers.offline();
  assert.equal(r.c.mode(), 'offline', 'the offline event switches at once');
  assert.equal(r.doc.documentElement.dataset.connection, 'offline', 'and marks <html>');
  assert.deepEqual(r.seen, ['offline']);
}

// A poor connection: one slow probe is not enough, two are
{
  const r = rig();
  r.c.start();
  await r.advance(0);
  assert.equal(r.c.mode(), 'online', 'a first good probe');
  r.net.mode = 'slow';
  await r.advance(EVERY_ONLINE + PROBE_TIMEOUT);
  assert.equal(r.c.mode(), 'online', 'one slow probe does not switch');
  await r.advance(EVERY_ONLINE + PROBE_TIMEOUT);
  assert.equal(r.c.mode(), 'offline', 'two in a row do');
}

// Airplane mode on an iPhone: the browser keeps saying online and sends no event; a refused probe is
// asked again half a second later, and two refusals switch (the owner, 2026-11-23: it must be immediate)
{
  const r = rig();
  r.c.start();
  await r.advance(0);
  r.net.mode = 'down';   // navigator.onLine stays true
  await r.advance(EVERY_ONLINE);
  assert.equal(r.c.mode(), 'online', 'one refusal is not enough');
  await r.advance(REFUSED_AGAIN);
  assert.equal(r.c.mode(), 'offline', 'the second, half a second later, switches');
  assert.ok(EVERY_ONLINE + REFUSED_AGAIN <= 6000, 'offline within 6 s at most, without the browser\'s word');
}

// A hiccup (one refusal, then an answer) never paints the room offline
{
  const r = rig();
  r.c.start();
  await r.advance(0);
  r.net.mode = 'down';
  await r.advance(EVERY_ONLINE);
  r.net.mode = 'up';
  await r.advance(REFUSED_AGAIN + EVERY_ONLINE * 3);
  assert.deepEqual(r.seen, [], 'no flash');
}

// Offline only by refusals: one good answer brings it back at once
{
  const r = rig();
  r.c.start();
  await r.advance(0);
  r.net.mode = 'down';
  await r.advance(EVERY_ONLINE + REFUSED_AGAIN);
  assert.equal(r.c.mode(), 'offline');
  r.net.mode = 'up';
  await r.c.probe();
  assert.equal(r.c.mode(), 'online', 'one good probe is the way back when the browser never said offline');
}

// A request the page cancelled (AbortError) says nothing
{
  const r = rig();
  r.c.start();
  await r.advance(0);
  const abort = Object.assign(new Error('aborted'), { name: 'AbortError' });
  const c = createConnection({ nav: { onLine: true }, fetcher: () => Promise.reject(abort), timer: { set: () => 0, clear() {} }, probeUrl: 'https://x/p' });
  await c.probe(); await c.probe();
  assert.equal(c.mode(), 'online', 'aborted probes do not count');
}

// A touch of the screen probes at once (at most every TOUCH_GAP): switch airplane mode on, tap, offline
{
  const r = rig();
  r.c.start();
  await r.advance(TOUCH_GAP);
  r.net.mode = 'down';
  r.handlers.pointerdown();
  await r.advance(REFUSED_AGAIN);
  assert.equal(r.c.mode(), 'offline', 'the tap that follows airplane mode shows it in half a second');
}
{
  const r = rig();
  r.c.start();
  await r.advance(0);
  r.net.mode = 'down';
  r.handlers.pointerdown();   // a probe ran a moment ago
  await r.advance(0);
  assert.equal(r.c.mode(), 'online', 'taps do not probe more often than TOUCH_GAP');
}

// Airplane mode switched on with the app in the background: back in front, it looks at once
{
  const r = rig();
  r.c.start();
  await r.advance(0);
  r.doc.visibilityState = 'hidden';
  r.net.mode = 'down';
  await r.advance(EVERY_ONLINE * 3);
  assert.equal(r.c.mode(), 'online', 'a hidden page does not probe');
  r.doc.visibilityState = 'visible';
  r.handlers.visibilitychange();
  await r.advance(RETURN_WAIT - 1);
  assert.equal(r.c.mode(), 'online', 'the radio gets a moment to wake up first');
  await r.advance(1 + CONFIRM);
  assert.equal(r.c.mode(), 'offline', 'back in front: a probe and its confirmation, seconds');
}

// Back online: at once when the browser says so and a probe agrees, on the same screen
{
  const r = rig({ online: false });
  r.net.mode = 'down';
  r.c.start();
  assert.equal(r.c.mode(), 'offline', 'starts offline when the browser says so');
  r.nav.onLine = true; r.net.mode = 'up';
  r.handlers.online();
  await r.advance(0);
  assert.equal(r.c.mode(), 'online', 'the online event and one good probe: back at once');
  assert.deepEqual(r.seen, ['online']);
}

// The online event with a probe that fails: still offline
{
  const r = rig({ online: false });
  r.net.mode = 'down';
  r.c.start();
  r.nav.onLine = true;
  r.handlers.online();
  await r.advance(0);
  assert.equal(r.c.mode(), 'offline', 'the browser says online but nothing answers');
}

// Out of airplane mode: the online event arrives before the route, the first probe fails; a quick retry brings it back
{
  const r = rig({ online: false });
  r.net.mode = 'down';
  r.c.start();
  r.nav.onLine = true;
  r.handlers.online();
  await r.advance(0);
  assert.equal(r.c.mode(), 'offline', 'no route yet');
  r.net.mode = 'up';
  await r.advance(RETRIES[0]);
  assert.equal(r.c.mode(), 'online', 'back on the first retry, seconds later');
}

// Switched back from the phone's settings with the page in the background: back in front, it looks again
{
  const r = rig({ online: false });
  r.net.mode = 'down';
  r.c.start();
  r.nav.onLine = true; r.net.mode = 'up';
  r.handlers.visibilitychange();
  await r.advance(0);
  assert.equal(r.c.mode(), 'online', 'the page coming back to the front rechecks at once');
}

// Without the browser's word (a poor connection that recovers): two good probes STEADY apart
{
  const r = rig();
  r.c.start();
  await r.advance(0);
  r.net.mode = 'slow';
  await r.advance(2 * (EVERY_ONLINE + PROBE_TIMEOUT));
  assert.equal(r.c.mode(), 'offline');
  r.net.mode = 'up';
  assert.equal(await r.c.probe(), true);
  assert.equal(r.c.mode(), 'offline', 'one good probe is not enough');
  r.t.now += STEADY;
  await r.c.probe();
  assert.equal(r.c.mode(), 'online', 'two good probes STEADY apart switch back');
}

// A bad probe in between starts the count again
{
  const r = rig({ online: false });
  r.net.mode = 'down';
  r.c.start();
  r.nav.onLine = true; r.net.mode = 'up';
  assert.equal(await r.c.probe(), true);
  r.net.mode = 'down';
  assert.equal(await r.c.probe(), false);
  r.net.mode = 'up';
  r.t.now += STEADY;
  await r.c.probe();
  assert.equal(r.c.mode(), 'offline', 'the good probe before the bad one does not count');
}

// Testers force it; it stays forced across pages (storage) and comes back off
{
  const r = rig();
  r.c.start();
  r.c.force(true);
  assert.equal(r.c.mode(), 'offline', 'forced');
  assert.equal(r.storage.getItem(FORCE_KEY), '1', 'kept on this phone');
  await r.advance(EVERY_ONLINE * 3);
  assert.equal(r.c.mode(), 'offline', 'good probes do not undo a forced mode');
  r.c.force(false);
  assert.equal(r.c.mode(), 'online');
  assert.deepEqual(r.seen, ['offline', 'online']);
}

// '0' keeps it off whatever happens (end-to-end scripts that test a screen's own network error)
{
  const r = rig();
  r.storage.setItem(FORCE_KEY, '0');
  r.c.start();
  r.nav.onLine = false; r.net.mode = 'down';
  r.handlers.offline();
  assert.equal(r.c.mode(), 'online', 'kept online');
  assert.equal(r.c.forced(), false);
}

console.log('✓ connection: offline at once (event) or in half a second (two refusals, touch), no flash on a hiccup, poor after two probes, online after two steady ones, testers can force it');
