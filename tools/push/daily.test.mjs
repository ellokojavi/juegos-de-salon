// Run: node tools/push/daily.test.mjs
// One a Day's notifications (D-230): when each one goes out, to whom, in which language and when not.
import assert from 'node:assert/strict';
import { dailyNotifications, liveStreak, stale } from './daily.mjs';
import { numDia, numeroDel } from '../../public/assets/js/uno-al-dia.js';

const sub = (tz = 'America/Santiago', lang = 'es') => ({ endpoint: 'https://x', keys: {}, lang, tz, uid: 'u', at: 0 });
// Santiago is at UTC-3 in October 2026: 12:00 UTC is 9:00 there
const at = (date, santiagoHour) => Date.parse(`${date}T00:10:00Z`) + (santiagoHour + 3) * 3600e3;
const N = numDia('2026-10-07');
const base = { h: 9, d: true, r: true, w: true, u: N - 1, c: 5, k: 0, m: 5 };
const run = (q, now, sent = {}, s = sub(), seasonsDone = ['2026-10']) => dailyNotifications({ wants: { a: q }, subs: { a: s }, sent: { a: sent }, now, seasonsDone });

// Today's: from their hour, with the streak and the number, without naming the game
assert.deepEqual(run(base, at('2026-10-07', 8)), [], 'before their hour it does not go out');
let r = run(base, at('2026-10-07', 9));
assert.equal(r.length, 1);
assert.equal(r[0].key, `dia:${N}`);
assert.equal(r[0].notification.body, `📅 Uno al día n.° ${numeroDel('2026-10-07')} ya está. 🔥 Racha: 5 días.`);
assert.match(r[0].notification.url, /today\/\?notif=dailyday$/, "the dashboard counts it apart from La Copa's");
assert.deepEqual(run(base, at('2026-10-07', 10), { [`dia:${N}`]: at('2026-10-07', 9) }), [], 'not repeated');
assert.deepEqual(run({ ...base, u: N }, at('2026-10-07', 10)), [], 'if they already played today, nothing');
assert.deepEqual(run({ ...base, d: false }, at('2026-10-07', 10)), [], 'if they turned off the daily one, nothing');
assert.equal(run({ ...base, u: N - 5, c: 0 }, at('2026-10-07', 9))[0].notification.body, `📅 Uno al día n.° ${numeroDel('2026-10-07')} ya está.`, "no streak, no streak line");

// The streak's: at 21:00, if they did not play and the streak is 2 or more; with a freeze, it says it spends it
r = run(base, at('2026-10-07', 21), { [`dia:${N}`]: at('2026-10-07', 9) });
assert.equal(r[0].key, `racha:${N}`);
assert.equal(r[0].notification.body, '🔥 Tu racha de 5 días se corta a medianoche. Te quedan 3 horas.');
assert.equal(run({ ...base, k: 1 }, at('2026-10-07', 21), { [`dia:${N}`]: 1 })[0].notification.body, '🧊 Si no juegas hoy, gastas un comodín para salvar tu racha de 5 días. Te quedan 3 horas.');
assert.equal(run({ ...base, u: N - 2, k: 1 }, at('2026-10-07', 21), { [`dia:${N}`]: 1 })[0].notification.body, '🔥 Tu racha de 5 días se corta a medianoche. Te quedan 3 horas.', 'if the freeze was already spent yesterday, none is left: the streak ends');
assert.equal(run({ ...base, c: 1 }, at('2026-10-07', 9))[0].notification.body, `📅 Uno al día n.° ${numeroDel('2026-10-07')} ya está.`, 'with a streak of 1, no "Racha: 1 días" (U-6)');
assert.deepEqual(run({ ...base, c: 1 }, at('2026-10-07', 21), { [`dia:${N}`]: at('2026-10-07', 9) }), [], 'a streak of 1 is not worth it');
assert.deepEqual(run(base, at('2026-10-07', 22)), [], 'never at night');
// At most 2 a day
assert.deepEqual(run(base, at('2026-10-07', 21), { x: at('2026-10-07', 9), y: at('2026-10-07', 12) }), [], 'at most 2 a day');

// The live streak: played yesterday; played the day before and has a freeze; otherwise, it ended
assert.equal(liveStreak({ u: N - 1, c: 4, k: 0 }, N), 4);
assert.equal(liveStreak({ u: N - 2, c: 4, k: 1 }, N), 4);
assert.equal(liveStreak({ u: N - 2, c: 4, k: 0 }, N), 0);

// The week: on Monday, if they played the week before
const monday = '2026-10-12', NL = numDia(monday);
r = run({ ...base, u: NL - 1, sp: 's2026-41', sn: 6 }, at(monday, 9));
assert.equal(r[0].key, 'semana:s2026-41');
assert.equal(r[0].notification.body, '📊 Tu semana: jugaste 6 de 7 días.');
assert.equal(run({ ...base, u: NL - 1, sp: 's2026-41', sn: 6 }, at(monday, 9), { 'semana:s2026-41': 1 })[0].key, `dia:${NL}`, "after the week's, today's");

// They calm down on their own: every other day after 14 days, and one last after 30
const calm = n => run({ ...base, u: N - n, c: 0 }, at('2026-10-07', 10));
assert.equal(calm(15).length + run({ ...base, u: N - 14, c: 0 }, at('2026-10-08', 10)).length, 1, 'after 14 days without playing, every other day');
r = calm(30);
assert.equal(r[0].key, 'adios');
assert.equal(r[0].remove, true);
assert.match(r[0].notification.body, /mejor racha fue de 5 días/);
assert.equal(run({ ...base, u: N - 30, c: 1, m: 1 }, at('2026-10-07', 10))[0].notification.body, '📅 Uno al día te espera cuando quieras.', 'with a best streak of 1, no "fue de 1 días" (U-6)');

// In the recipient's language
assert.match(run(base, Date.parse('2026-10-07T07:10:00Z'), {}, sub('Europe/Berlin', 'pt'))[0].notification.url, /&lang=pt$/);
// German left the app (D-514): a phone subscribed in German gets English
assert.match(run(base, Date.parse('2026-10-07T07:10:00Z'), {}, sub('Europe/Berlin', 'de'))[0].notification.url, /&lang=en$/);

// No subscription, nothing; the old is cleaned
assert.deepEqual(dailyNotifications({ wants: { a: base }, subs: {}, sent: {}, now: at('2026-10-07', 10) }), []);
assert.deepEqual(stale({ a: { 'dia:1': 0, 'dia:2': Date.parse('2026-10-07') } }, Date.parse('2026-10-08')), ['pushEnviadosDia/a/dia:1']);


// The season (D-424): on the 1st to the 3rd from their hour, once, if they played since last month began
{
  const NOV = numDia('2026-11-01');
  const q = { ...base, u: numDia('2026-10-28'), c: 0, d: false };
  let s = run(q, at('2026-11-01', 9));
  assert.equal(s.length, 1);
  assert.equal(s[0].key, 'temporada:2026-10');
  assert.equal(s[0].notification.body, '🏆 Terminó la temporada de octubre. Toca para ver el ranking final.');
  assert.match(s[0].notification.url, /\?recap=season&notif=dailyseason$/, 'it opens the season on the home page');
  assert.deepEqual(run(q, at('2026-11-01', 8)), [], 'not before their hour');
  assert.deepEqual(run(q, at('2026-11-01', 9), {}, sub(), []), [], 'not before the rebuild computed the month to its end: its link would open nothing');
  assert.deepEqual(run(q, at('2026-11-02', 10), { 'temporada:2026-10': at('2026-11-01', 9) }), [], 'once');
  assert.equal(run(q, at('2026-11-03', 9))[0]?.key, 'temporada:2026-10', 'still on the 3rd, if it could not go out before');
  assert.deepEqual(run(q, at('2026-11-04', 9)), [], 'not after the 3rd');
  assert.ok(run({ ...q, u: numDia('2026-09-29') }, at('2026-11-01', 9)).every(x => x.kind !== 'temporada'), 'not to whoever did not play that month');
  assert.equal(run({ ...q, u: NOV }, at('2026-11-01', 9))[0]?.key, 'temporada:2026-10', 'playing on the 1st does not take it away');
  s = run(q, at('2026-11-01', 9), {}, sub('America/Santiago', 'pt'));
  assert.equal(s[0].notification.body, '🏆 A temporada de outubro terminou. Toque para ver o ranking final.');
  assert.match(s[0].notification.url, /&lang=pt$/);
}

console.log('One a Day notifications: ok');
