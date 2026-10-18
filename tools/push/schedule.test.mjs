// Which La Copa notification is due, to whom and when (D-224), with made-up clocks over a 7-day cup
// built with cup/engine.js. Usage: node tools/push/schedule.test.mjs
import assert from 'node:assert/strict';
import { cupNotifications, testNotifications, localHour, merge, sentToday, CAP } from './schedule.mjs';
import { nuevaMeta } from '../../public/cup/engine.js';

let n = 0;
const test = async (name, fn) => { try { await fn(); n++; } catch (e) { console.error(`✗ ${name}`); throw e; } };
const HOUR = 3600e3;

const TZ = 'America/Santiago';
const meta = nuevaMeta({ nombre: 'Los Primos', dias: 7, inicio: '2026-10-12', tz: TZ, admin: 'aaaaaa', creada: Date.parse('2026-10-05T12:00:00Z') });
const baseCup = () => ({
  meta: JSON.parse(JSON.stringify(meta)),
  players: { aaaaaa: { name: 'Ana', at: 1 }, bbbbbb: { name: 'Beto', at: 2 } },
  results: {}, started: {},
});
const S1 = 'a'.repeat(32), S2 = 'b'.repeat(32);
const subs = { [S1]: { lang: 'es', tz: TZ }, [S2]: { lang: 'pt', tz: 'America/Sao_Paulo' } };
const wants = (p = { dia: true, plazo: true, at: 0 }) => ({ aaaaaa: { [S1]: p }, bbbbbb: { [S2]: p } });
/** The local hour `hh` of day `d` of the cup, in Santiago. */
const onDay = (d, hh) => meta.win[d].a + hh * HOUR;
const of = (out, sub) => out.filter(x => x.subId === sub);

await test("the recipient's local hour", () => {
  assert.equal(localHour(onDay(1, 9), TZ), 9);
  assert.equal(localHour(Date.parse('2026-10-12T12:00:00Z'), 'Europe/Berlin'), 14);
  assert.equal(localHour(Date.parse('2026-10-12T12:00:00Z'), 'no/existe'), 12);
});

await test('the day opened: from 9 for the recipient, with the game, once', () => {
  const cup = baseCup();
  assert.equal(cupNotifications({ code: 'KQRST', cup, wants: wants(), subs, now: onDay(2, 8) }).length, 0, 'at 8 not yet');
  const out = cupNotifications({ code: 'KQRST', cup, wants: wants(), subs, now: onDay(2, 9.25) });
  const ana = of(out, S1)[0];
  assert.deepEqual(ana.keys, ['dia:2']);
  assert.equal(ana.notification.title, '🏆 La Copa: Los Primos');
  assert.match(ana.notification.body, /^🔢 Día 2: .+\. Ya puedes jugar\.$/);
  assert.equal(ana.notification.url, 'https://juegosdesalon.cl/cup/?KQRST&day=2&notif=day', 'opens that day (D-229)');
  assert.deepEqual(ana.notification.acciones.map(a => [a.action, a.title, a.url]), [['jugar', 'Jugar', ana.notification.url], ['silenciar', 'Silenciar esta copa', 'https://juegosdesalon.cl/cup/?KQRST&mute']]);
  assert.equal(ana.notification.tag, 'copa-KQRST-d2');
  assert.match(of(out, S2)[0].notification.body, /^🔢 Dia 2: .+\. Já dá para jogar\.$/, "in each subscription's language");
  const sent = { [S1]: { 'dia:2': 1 } };
  assert.equal(of(cupNotifications({ code: 'KQRST', cup, wants: wants(), subs, sent, now: onDay(2, 10) }), S1).length, 0, 'not repeated');
});

await test("whoever already played or started the day does not get the day's notification", () => {
  const cup = baseCup();
  cup.results[2] = { aaaaaa: { s: 80, ms: 1000 } };
  cup.started[2] = { bbbbbb: 123 };
  assert.equal(cupNotifications({ code: 'KQRST', cup, wants: wants(), subs, now: onDay(2, 11) }).length, 0);
});

await test('whoever turned off "When a day opens" does not get it', () => {
  const out = cupNotifications({ code: 'KQRST', cup: baseCup(), wants: wants({ dia: false, plazo: true, at: 0 }), subs, now: onDay(2, 11) });
  assert.equal(out.length, 0);
});

await test('nothing is sent at night', () => {
  const out = cupNotifications({ code: 'KQRST', cup: baseCup(), wants: wants(), subs: { [S1]: subs[S1] }, now: onDay(2, 23) });
  assert.equal(out.length, 0);
});

await test('the deadline: the grace day, 4 hours before closing or from 20:00, only if not played', () => {
  const cup = baseCup();
  // She played day 1: missing day 2 is 0 points, not out of the cup (that case goes below, D-347)
  cup.results[1] = { aaaaaa: { s: 1, ms: 1 } };
  const q = { aaaaaa: { [S1]: { dia: false, plazo: true, at: 0 } } };
  // Day 2 can be played until midnight of day 3 (its grace day)
  assert.equal(cupNotifications({ code: 'KQRST', cup, wants: q, subs, now: onDay(3, 18) }).length, 0, 'at 18:00 there are 6 hours left: not yet');
  const night = cupNotifications({ code: 'KQRST', cup, wants: q, subs, now: onDay(3, 20.1) });
  assert.deepEqual(night[0].keys, ['plazo:2']);
  assert.equal(night[0].notification.body, '⏳ Te quedan 4 horas para jugar el día 2. Si no lo juegas, son 0 puntos.');
  assert.equal(night[0].notification.tag, 'copa-KQRST-d2', "replaces that day's morning notification");
  cup.results[2] = { aaaaaa: { s: 1, ms: 1 } };
  assert.equal(cupNotifications({ code: 'KQRST', cup, wants: q, subs, now: onDay(3, 21) }).length, 0, 'already played');
  const one = cupNotifications({ code: 'KQRST', cup: { ...baseCup(), results: { 1: { aaaaaa: { s: 1, ms: 1 } } } }, wants: q, subs, now: onDay(3, 21.5) });
  assert.match(one[0].notification.body, /^⏳ Te quedan 3 horas/);
  const last = cupNotifications({ code: 'KQRST', cup: baseCup(), wants: q, subs, now: onDay(4, -0.6) });
  assert.equal(last.length, 0, 'at 23:24 it is night: not sent');
});

await test('the deadline beats another notification in the same round: one per cup and phone', () => {
  const out = cupNotifications({ code: 'KQRST', cup: baseCup(), wants: { aaaaaa: { [S1]: { dia: true, plazo: true, at: 0 } } }, subs, now: onDay(3, 20.5) });
  assert.equal(out.length, 1);
  assert.deepEqual(out[0].keys, ['plazo:2']);
});

await test('The Grand Final: with their place in the table, even if they turned off the day ones', () => {
  const cup = baseCup();
  for (let d = 1; d <= 6; d++) cup.results[d] = { aaaaaa: { s: 90, ms: 1000 }, bbbbbb: { s: 50, ms: 1000 } };
  const q = wants({ dia: false, plazo: false, at: 0 });
  const out = cupNotifications({ code: 'KQRST', cup, wants: q, subs, now: onDay(7, 10) });
  assert.equal(of(out, S1)[0].notification.body, '🏁 Hoy es La Gran Final y vale doble. Vas 1º: ¡a defender el primer lugar!');
  assert.equal(of(out, S2)[0].notification.body, '🏁 Hoje é a Grande Final e vale o dobro. Você está em 2º, a 12 pontos de Ana.');
  assert.deepEqual(of(out, S1)[0].keys, ['final']);
});

await test('The Grand Final tied on points with 1st (lost the tiebreak): no "0 points behind"', () => {
  const cup = baseCup();
  cup.players.cccccc = { name: 'Caro', at: 3 };
  const r = (a, b, c) => ({ aaaaaa: { s: a, ms: 1000 }, bbbbbb: { s: b, ms: 1000 }, cccccc: { s: c, ms: 1000 } });
  cup.results[1] = r(90, 50, 10);
  cup.results[2] = r(10, 50, 90);
  // Days 3 to 6 tied for everyone, so nobody is out of the cup (D-347) and the totals stay equal
  for (let d = 3; d <= 6; d++) cup.results[d] = r(50, 50, 50);
  const out = cupNotifications({ code: 'KQRST', cup, wants: wants({ dia: false, plazo: false, at: 0 }), subs, now: onDay(7, 10) });
  assert.equal(of(out, S2)[0].notification.body, '🏁 Hoje é a Grande Final e vale o dobro. Você está em 3º, com os mesmos pontos que Ana.');
});

await test('the cup ended: who won, for one day', () => {
  const cup = baseCup();
  for (let d = 1; d <= 7; d++) cup.results[d] = { aaaaaa: { s: 90, ms: 1000 }, bbbbbb: { s: 50, ms: 1000 } };
  const out = cupNotifications({ code: 'KQRST', cup, wants: wants(), subs, now: meta.end + 10 * HOUR });
  assert.equal(of(out, S1)[0].notification.body, '🥇 ¡Ganaste la copa!');
  assert.equal(of(out, S2)[0].notification.body, '🥇 Ana ganhou. Você ficou em 2º.');
  assert.equal(cupNotifications({ code: 'KQRST', cup, wants: wants(), subs, now: meta.end + 34 * HOUR }).length, 0, 'after a day, no more');
});

await test('the admin ended it early: the closing notification still goes out', () => {
  const cup = baseCup();
  cup.results[1] = { aaaaaa: { s: 90, ms: 1000 }, bbbbbb: { s: 50, ms: 1000 } };
  cup.fin = onDay(3, 11);
  const out = cupNotifications({ code: 'KQRST', cup, wants: wants(), subs, now: onDay(3, 12) });
  assert.deepEqual(of(out, S1)[0].keys, ['fin']);
});

await test('to the admin: who signed up since they asked for notifications, together', () => {
  const cup = baseCup();
  const now = onDay(1, -38); // two days before starting, at 10:00
  cup.players.cccccc = { name: 'Cata', at: now - 2 * HOUR };
  cup.players.dddddd = { name: 'Dani', at: now - HOUR };
  const q = { aaaaaa: { [S1]: { dia: true, plazo: true, at: 2 } }, bbbbbb: { [S2]: { dia: true, plazo: true, at: 0 } } };
  const out = cupNotifications({ code: 'KQRST', cup, wants: q, subs, now: now });
  assert.equal(out.length, 1, 'only the admin');
  assert.equal(out[0].notification.body, 'Cata y Dani se inscribieron en tu copa. Ya son 4 jugadores inscritos.');
  assert.deepEqual(out[0].keys, ['insc:cccccc', 'insc:dddddd']);
  const one = cupNotifications({ code: 'KQRST', cup, wants: q, subs, sent: { [S1]: { 'insc:cccccc': 1 } }, now: now });
  assert.equal(one[0].notification.body, 'Dani se inscribió en tu copa. Ya son 4 jugadores inscritos.');
});

await test('no subscription, removed player or deleted cup: nothing', () => {
  const cup = baseCup();
  cup.players.bbbbbb.out = true;
  const out = cupNotifications({ code: 'KQRST', cup, wants: { ...wants(), aaaaaa: { ['c'.repeat(32)]: { dia: true } } }, subs, now: onDay(2, 10) });
  assert.equal(out.length, 0);
  assert.deepEqual(cupNotifications({ code: 'KQRST', cup: null, wants: wants(), subs, now: 0 }), []);
});

await test("cap (D-229): at most 2 notifications of a cup per phone in a recipient's day", () => {
  assert.equal(CAP, 2);
  const cup = baseCup();
  const q = { aaaaaa: { [S1]: { dia: true, plazo: true, at: 0 } } };
  const now = onDay(3, 20.5);
  const today = { [S1]: { 'dia:3': onDay(3, 9.1), 'insc:cccccc': onDay(3, 11) } };
  assert.equal(sentToday(today[S1], now, TZ), 2);
  assert.equal(cupNotifications({ code: 'KQRST', cup, wants: q, subs, sent: today, now: now }).length, 0, '2 already today: the deadline does not go out');
  const yesterday = { [S1]: { 'dia:2': onDay(2, 9.1), 'plazo:1': onDay(2, 20.1), 'dia:3': onDay(3, 9.1) } };
  assert.equal(sentToday(yesterday[S1], now, TZ), 1, "yesterday's do not count");
  assert.deepEqual(cupNotifications({ code: 'KQRST', cup, wants: q, subs, sent: yesterday, now: now })[0].keys, ['plazo:2']);
  // Several keys recorded in the same delivery are a single notification
  assert.equal(sentToday({ 'insc:a': 5, 'insc:b': 5 }, 5, TZ), 1);
});

await test('the final and the day before expire at once: a single notification with both (D-229)', () => {
  const cup = baseCup();
  for (let d = 1; d <= 5; d++) cup.results[d] = { aaaaaa: { s: 1, ms: 1 } }; // she played until day 5: not out (D-347)
  const q = { aaaaaa: { [S1]: { dia: false, plazo: true, at: 0 } } };
  const out = cupNotifications({ code: 'KQRST', cup, wants: q, subs, now: onDay(7, 20.5) });
  assert.equal(out.length, 1);
  assert.deepEqual(out[0].keys, ['plazo:6', 'plazo:7']);
  assert.equal(out[0].notification.body, '⏳ Te quedan 4 horas para jugar los días 6 y 7. Si no los juegas, son 0 puntos.');
  assert.equal(out[0].notification.url, 'https://juegosdesalon.cl/cup/?KQRST&day=6&notif=deadline', 'opens the oldest: the one lost first');
});

await test('a tie for first place (D-229): both won, in plural', () => {
  const cup = baseCup();
  cup.players.cccccc = { name: 'Caro', at: 3 };
  for (let d = 1; d <= 7; d++) cup.results[d] = { aaaaaa: { s: 90, ms: 1000 }, bbbbbb: { s: 90, ms: 1000 }, cccccc: { s: 10, ms: 1000 } };
  const S3 = 'c'.repeat(32);
  const s3 = { ...subs, [S3]: { lang: 'en', tz: TZ } };
  const q = { ...wants(), cccccc: { [S3]: { dia: true, plazo: true, at: 0 } } };
  const out = cupNotifications({ code: 'KQRST', cup, wants: q, subs: s3, now: meta.end + 10 * HOUR });
  assert.equal(of(out, S1)[0].notification.body, '🥇 ¡Ganaste la copa junto con Beto!');
  assert.equal(of(out, S2)[0].notification.body, '🥇 Você ganhou a copa junto com Ana!');
  assert.equal(of(out, S3)[0].notification.body, '🥇 Ana and Beto won. You finished #3.');
  assert.equal(of(out, S1)[0].notification.acciones, undefined, 'the closing one has no buttons: it opens the podium');
  assert.equal(of(out, S1)[0].notification.url, 'https://juegosdesalon.cl/cup/?KQRST&notif=end', 'with its kind, to count the taps (D-233)');
});

await test('new days of several cups for one phone: a single notification (D-229)', () => {
  const other = { ...baseCup(), meta: { ...JSON.parse(JSON.stringify(meta)), name: 'La Oficina' } };
  const a = cupNotifications({ code: 'KQRST', cup: baseCup(), wants: wants(), subs, now: onDay(2, 9.5) });
  const b = cupNotifications({ code: 'MNPQR', cup: other, wants: wants(), subs, now: onDay(2, 9.5) });
  const deadline = { subId: S1, pid: 'aaaaaa', code: 'WXYZA', kind: 'plazo', keys: ['plazo:1'], notification: { body: 'p' } };
  const out = merge([...a, ...b, deadline], subs, { KQRST: 'Los Primos', MNPQR: 'La Oficina' });
  const ana = of(out, S1);
  assert.equal(ana.length, 2, 'the two days in one, and the deadline apart');
  const merged = ana.find(x => x.kind === 'dia');
  assert.equal(merged.notification.title, '🏆 La Copa');
  assert.equal(merged.notification.body, '🎲 Tienes un día nuevo en 2 copas: Los Primos y La Oficina.');
  assert.equal(merged.notification.url, 'https://juegosdesalon.cl/cup/?notif=cups');
  assert.deepEqual(merged.perCup, [{ code: 'KQRST', keys: ['dia:2'] }, { code: 'MNPQR', keys: ['dia:2'] }]);
  assert.deepEqual(ana.find(x => x.kind === 'plazo').perCup, [{ code: 'WXYZA', keys: ['plazo:1'] }]);
  assert.equal(of(out, S2)[0].notification.body, '🎲 Você tem um dia novo em 2 copas: Los Primos e La Oficina.');
  const alone = merge(a, subs, {});
  assert.equal(of(alone, S1)[0].notification.url, 'https://juegosdesalon.cl/cup/?KQRST&day=2&notif=day', 'a single cup: stays the same');
});

await test('the test notification: to each phone of the cup, in its language, at any time', () => {
  const out = testNotifications({ code: 'KQRST', cup: baseCup(), wants: wants(), subs });
  assert.equal(out.length, 2);
  assert.equal(of(out, S1)[0].notification.body, 'Así se verán los avisos de esta copa.');
  assert.equal(of(out, S2)[0].notification.body, 'É assim que vão ficar os avisos desta copa.');
  assert.deepEqual(of(out, S1)[0].keys, []);
  assert.equal(of(out, S1)[0].notification.url, 'https://juegosdesalon.cl/cup/?KQRST&notif=test');
});

await test('out of the cup (D-347): the deadline warns before, and whoever is out gets nothing more', () => {
  const cup = baseCup();
  const q = { aaaaaa: { [S1]: { dia: true, plazo: true, at: 0 } } };
  // Ana missed day 1: if she doesn't play day 2 before it closes, she is out
  const due = cupNotifications({ code: 'KQRST', cup, wants: q, subs, now: onDay(3, 20.1) });
  assert.equal(due.find(x => x.kind === 'plazo').notification.body, '⏳ Te quedan 4 horas para jugar el día 2. Si no lo juegas, quedas fuera de la copa: ya te perdiste el anterior.');
  // Days 1 and 2 closed without her: day 4's notification no longer comes
  assert.equal(cupNotifications({ code: 'KQRST', cup, wants: q, subs, now: onDay(4, 10) }).length, 0);
  // The admin brought her back: it comes again
  cup.players.aaaaaa.back = onDay(4, 9);
  assert.equal(cupNotifications({ code: 'KQRST', cup, wants: q, subs, now: onDay(4, 10) })[0].kind, 'dia');
});

console.log(`schedule: ${n} cases green`);
