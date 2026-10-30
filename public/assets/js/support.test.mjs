// "☕ Buy me a coffee" at the end of a game (support.js): when it asks, and that it says the same in
// the four languages.
import assert from 'node:assert/strict';
import { dueSupport, supportOpened, supportPaid, TEXTS, MIN_GAMES, EVERY_DAYS, REST_AFTER_OPEN_DAYS, EVENTS, newPayment } from './support.js';

const store = () => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) }; };
const DAY = 24 * 60 * 60 * 1000;
const t0 = Date.UTC(2026, 9, 25, 15);

// Not during the first games of a device
let s = store();
for (let i = 0; i < MIN_GAMES; i++) assert.equal(dueSupport(s, t0 + i), false, `game ${i + 1} is too early`);
assert.equal(dueSupport(s, t0 + 10), true, 'the first game after the first few asks');

// At most once every EVERY_DAYS days
assert.equal(dueSupport(s, t0 + DAY), false, 'not again the next day');
assert.equal(dueSupport(s, t0 + EVERY_DAYS * DAY + 10), true, 'again a week later');

// An ending that already shows the inbox waits for another one
s = store();
for (let i = 0; i < MIN_GAMES; i++) dueSupport(s, t0);
assert.equal(dueSupport(s, t0, { busy: true }), false, 'one quiet link per ending');
assert.equal(dueSupport(s, t0 + 1), true, 'and the next ending gets it');

// Opening the page rests a month; paying never asks again
s = store();
for (let i = 0; i < MIN_GAMES; i++) dueSupport(s, t0);
supportOpened(s, t0);
assert.equal(dueSupport(s, t0 + (REST_AFTER_OPEN_DAYS - 1) * DAY), false, 'resting after opening the page');
assert.equal(dueSupport(s, t0 + (REST_AFTER_OPEN_DAYS + 1) * DAY), true, 'back after the rest');
supportPaid(s, t0);
assert.equal(dueSupport(s, t0 + 400 * DAY), false, 'never after paying');

// No storage: never asks, never throws
assert.equal(dueSupport(null, t0), false);

// The same texts in the four languages
const keys = o => Object.keys(o).sort().join();
for (const lang of ['en', 'pt']) {
  assert.equal(keys(TEXTS[lang]), keys(TEXTS.es), `${lang} has the same texts as es`);
  assert.equal(TEXTS[lang].points.length, TEXTS.es.points.length, `${lang} has every point`);
}
assert.deepEqual(EVENTS, ['shown', 'open', 'pay', 'thanks'], 'the events the Firebase rules accept');

console.log('✓ support: asks after the first games, once a week, never with the inbox, rests after opening, stops after paying');

// Stripe's way back counts a payment once per real id (the Oct 26 2026 false "paid")
{
  const m = new Map(); const store = { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
  assert.equal(newPayment(null, store), false, 'no id: an address typed or reopened');
  assert.equal(newPayment('{CHECKOUT_SESSION_ID}', store), false, 'the placeholder unfilled');
  assert.equal(newPayment('cs_live_a1B2c3D4e5', store), true, 'a new payment');
  assert.equal(newPayment('cs_live_a1B2c3D4e5', store), false, 'the same one again');
  assert.equal(newPayment('cs_live_zzZZ99887766', store), true, 'another payment');
}
