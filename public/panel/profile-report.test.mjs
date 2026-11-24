// 🎖️ Profile (D-615): the pure accounts of the panel's section.
import assert from 'node:assert/strict';
import { LAUNCH_DAY, dayNum, dayStr, eventTotals, distinct, pulseByDay, pulse, whoRows, accountsByDay, beforeAfter, returns, countedSince } from './profile-report.js';
import { toPacificDays } from './wbr.js';

assert.equal(dayStr(LAUNCH_DAY), '2026-11-22', 'the launch was the evening of the 22nd, Pacific');
const L = LAUNCH_DAY;
const pt = {
  [L + 1]: { perfil: { 'visit-guest': 2, 'visit-signed': 3, 'via-pill': 4, 'tab-rankings': 2, 'create-profile': 1, 'signin-other': 2 }, perfilIds: { a: 1, b: 1 }, activos: { a: 1, b: 1, c: 1, d: 1 } },
  [L + 2]: { perfil: { 'visit-signed': 1 }, perfilIds: { a: 1 }, activos: { a: 1, c: 2 } },
  [L + 3]: { activos: { b: 1 } },
};
assert.deepEqual(eventTotals(pt, { from: L + 1, to: L + 2 })['visit-signed'], 4);
assert.deepEqual(distinct(pt, { from: L + 1, to: L + 2 }), { browsers: 2, active: 4, share: 0.5 });
const byDay = pulseByDay(pt, { from: L + 1, to: L + 3 });
assert.equal(byDay.length, 3, 'every day, empty ones too');
assert.deepEqual([byDay[0].visits, byDay[0].browsers, byDay[0].share], [5, 2, 0.5]);
assert.equal(byDay[2].share, 0);
const p = pulse(pt, { from: L + 1, to: L + 2 }, { from: L - 1, to: L });
assert.equal(p.visits, 6); assert.equal(p.visitsPrev, 0); assert.equal(p.prev.browsers, 0);
assert.equal(countedSince(pt), L + 1);
assert.equal(countedSince({}), null);

// Coming back: a and b opened it on L+1; a came back the next day, b within the week; c (not) came back, d did not
const r = returns(pt, { from: L + 1, to: L + 1, today: L + 20 });
assert.deepEqual(r.visitors.next, { back: 1, of: 2, rate: 0.5 });
assert.deepEqual(r.visitors.week, { back: 2, of: 2, rate: 1 });
assert.deepEqual(r.others.next, { back: 1, of: 2, rate: 0.5 });
assert.equal(returns(pt, { from: L + 1, to: L + 1, today: L + 2 }).visitors.next.of, 0, 'a day whose next day is not over is left out');

// Who: names, first and last day, days with a visit in the range, fields summed
const uso = {
  abcd1234: { [dayStr(L + 1)]: { v: 2, b: 1 }, [dayStr(L + 5)]: { v: 1, p: 3 } },
  zzzz0000: { [dayStr(L + 2)]: { v: 1, i: 1 } },
  old00000: { [dayStr(L - 40)]: { v: 1 } },
};
const who = whoRows(uso, { abcd1234: 'Ana' }, { from: L, to: L + 6 });
assert.deepEqual(who.map(x => x.name), ['Ana', 'zzzz0000'], 'most recent first; the name when known; outside the range left out');
assert.deepEqual([who[0].first, who[0].last, who[0].days, who[0].v, who[0].p, who[0].b], [dayStr(L + 1), dayStr(L + 5), 2, 3, 3, 1]);

// Accounts: created by day from the players, the counters by place; before and after the launch
const pd = ts => Math.floor((ts - 8 * 3600e3) / 864e5);
const players = { x: { at: (L - 3) * 864e5 + 20 * 3600e3 }, y: { at: (L + 1) * 864e5 + 20 * 3600e3 }, z: { at: (L + 1) * 864e5 + 21 * 3600e3 } };
const acc = accountsByDay(pt, players, { from: L - 5, to: L + 3 }, pd);
assert.equal(acc.find(x => x.day === L + 1).created, 2);
assert.equal(acc.find(x => x.day === L + 1).createProfile, 1);
assert.equal(acc.find(x => x.day === L - 3).counted, false, 'no counters before');
const ba = beforeAfter(acc, { today: L + 3 });
assert.equal(ba.after.days, 2, 'whole days after the launch, today out');
assert.equal(ba.before.days, 2, 'the same number of days before');
assert.equal(ba.after.created, 1);

// The stats day: perfilPt and perfilIdPt land on their Pacific date
const days = { 20500: { perfilPt: { 20499: { peek: 2 }, 20500: { peek: 1 } }, perfilIdPt: { 20499: { a: 1 } } }, 20501: { perfilPt: { 20500: { peek: 4 } } } };
const out = toPacificDays(days);
assert.equal(out[20500].perfil.peek, 5, 'summed across the UTC buckets');
assert.deepEqual(out[20499].perfilIds, { a: 1 });
assert.equal(out[20500].perfilPt, undefined);
assert.equal(dayNum('1970-01-02'), 1);
console.log('✓ profile report');
