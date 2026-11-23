// The profile's badges (lab flag profile): each one is earned by what it says, stays earned, and is new once.
import assert from 'node:assert/strict';
import { BADGES, GROUPS, earned, fullMonths, EARLY_GAMES, EARLY_DAYS, weekendsOf, cupsInAWeek, premieres, lastOnDay, daysPlayed, withAnnounced } from './badges.js';

const ids = BADGES.map(b => b.id);
assert.equal(new Set(ids).size, ids.length, 'one id per badge');
for (const b of BADGES) {
  assert.ok(GROUPS.includes(b.group), `${b.id}: a known group`);
  assert.ok(['bronze', 'silver', 'gold'].includes(b.tier), `${b.id}: a known tier`);
  assert.ok(b.icon, `${b.id}: an icon`);
}
assert.ok(BADGES.some(b => b.secret), 'some badges are secret (the owner, 2026-11-21)');

const of = (facts, seen) => Object.fromEntries(earned(facts, seen).list.map(b => [b.id, b]));
const NOW = Date.UTC(2026, 10, 21, 12);

// Nothing played: nothing earned, the streaks show their progress, the secret ones none
let x = of({ now: NOW });
assert.ok(Object.values(x).every(b => !b.got), 'nothing earned with no facts');
assert.deepEqual(x['streak-10'].progress, [0, 10]);
assert.equal(x['night-owl'].progress, null, 'a secret badge tells no progress');

// Streaks and counts
x = of({ now: NOW, bestStreak: 14, medals: { gold: 3, silver: 1 }, cups: 5, plays: 120, gamesPlayed: 12, gamesTotal: 40 });
assert.ok(x['streak-10'].got && !x['streak-30'].got);
assert.deepEqual(x['streak-30'].progress, [14, 30]);
assert.ok(x['cup-champion'].got && x['cup-champion'].count === 3, 'a Cup champion counts each cup');
assert.equal(x['cup-podium'].count, 4);
assert.ok(x['cup-five'].got && x['plays-100'].got && x.explorer.got && !x.collector.got);
assert.deepEqual(x.collector.progress, [12, 40]);

// The early bird: 3 games before 7 on 7 mornings (the owner's example); 2 games a morning do not count
const mornings = (k, games) => Object.fromEntries([...Array(k)].map((_, i) => [`2026-11-${String(i + 1).padStart(2, '0')}`, { e: games }]));
assert.ok(of({ now: NOW, hours: mornings(EARLY_DAYS, EARLY_GAMES) })['early-bird'].got);
assert.ok(!of({ now: NOW, hours: mornings(EARLY_DAYS, EARLY_GAMES - 1) })['early-bird'].got);
assert.deepEqual(of({ now: NOW, hours: mornings(4, 3) })['early-bird'].progress, [4, 7]);
assert.ok(of({ now: NOW, hours: { '2026-11-02': { n: 3 } } })['night-owl'].got, 'the night owl: 3 games in one night');

// Months of Uno al día
assert.ok(of({ now: NOW, months: [{ period: 's2026-10', place: 1 }] })['month-champion'].got);
assert.ok(of({ now: NOW, months: [{ period: 's2026-10', place: 3 }] })['month-podium'].got);
assert.ok(!of({ now: NOW, months: [{ period: 's2026-10', place: null }] })['month-podium'].got);
const october = Object.fromEntries([...Array(31)].map((_, i) => [`2026-10-${String(i + 1).padStart(2, '0')}`, true]));
assert.deepEqual(fullMonths(october, '2026-11-21'), ['2026-10']);
assert.deepEqual(fullMonths(october, '2026-10-30'), [], 'a month is full only once it has ended');
assert.deepEqual(fullMonths({ ...october, '2026-10-31': undefined }, '2026-11-21').length, 1);
const missing = { ...october }; delete missing['2026-10-15'];
assert.deepEqual(fullMonths(missing, '2026-11-21'), []);

// The triple crown, secret, needs the three
assert.ok(of({ now: NOW, medals: { gold: 1 }, months: [{ place: 1 }], firsts: 1 })['triple-crown'].got);
assert.ok(!of({ now: NOW, medals: { gold: 1 }, firsts: 1 })['triple-crown'].got);
// One year since the player was created
assert.ok(of({ now: NOW, since: NOW - 366 * 86400000 })['one-year'].got);
assert.ok(!of({ now: NOW, since: NOW - 100 * 86400000 })['one-year'].got);

// Earned once, earned for good; new only the first time
const first = earned({ now: NOW, firsts: 1 }, {});
assert.ok(first.list.find(b => b.id === 'number-one').new, 'new the first time');
assert.equal(first.seen['number-one'], NOW);
const later = earned({ now: NOW + 1000, firsts: 0 }, first.seen);
const one = later.list.find(b => b.id === 'number-one');
assert.ok(one.got && !one.new, 'a first place lost this week keeps its badge, no longer new');
// 😬 Se llama obsesión: one same game 10 times in a row (the owner, 2026-11-21)
const obs = f => earned({ now: NOW, ...f }).list.find(b => b.id === 'obsession');
assert.deepEqual(obs({ bestRun: 7 }).progress, [7, 10]);
assert.ok(!obs({ bestRun: 9 }).got && obs({ bestRun: 10 }).got);

// The badges of 2026-11-22 (the owner)
const got = (id, f) => earned({ now: NOW, ...f }).list.find(b => b.id === id);
// 🛋️ Finde a tope: Saturday and Sunday on 4 weekends, from Uno al día's days and the phone's marks
const weekend = sat => ({ [sat]: true, [new Date(Date.parse(`${sat}T12:00:00Z`) + 86400000).toISOString().slice(0, 10)]: true });
const days3 = { ...weekend('2026-10-31'), ...weekend('2026-11-07'), ...weekend('2026-11-14'), '2026-11-21': true };
assert.equal(weekendsOf(days3), 3, 'a Saturday without its Sunday is no weekend');
assert.deepEqual(got('weekends', { dailyDays: days3 }).progress, [3, 4]);
assert.ok(got('weekends', { dailyDays: days3, marks: { wk: ['2026-11-21'] } }).got, 'the phone adds its weekend');
assert.equal(weekendsOf(days3, ['2026-11-07']), 3, 'a weekend counts once');
// ☕ Odio los lunes: 4 Mondays before 8
assert.ok(got('mondays', { marks: { mon: ['2026-11-02', '2026-11-09', '2026-11-16', '2026-11-23'] } }).got);
assert.deepEqual(got('mondays', { marks: { mon: ['2026-11-02'] } }).progress, [1, 4]);
// 🥂 El canapé: 3 cups within 7 days
const D = 86400000;
assert.equal(cupsInAWeek([{ at: NOW }, { at: NOW + 3 * D }, { at: NOW + 6.9 * D }]), 3);
assert.equal(cupsInAWeek([{ at: NOW }, { at: NOW + 3 * D }, { at: NOW + 7 * D }]), 2, 'the seventh day after is another week');
assert.ok(got('party', { cupList: [{ at: NOW }, { at: NOW + D }, { at: NOW + 2 * D }] }).got);
assert.ok(!got('party', { cupList: [{ at: NOW }, { at: NOW + 10 * D }, { at: NOW + 20 * D }] }).got);
// 🎓 Especialista: 50 games of one same game
assert.ok(got('specialist', { byGame: [{ id: 'queens', n: 50 }] }).got);
assert.deepEqual(got('specialist', { byGame: [{ id: 'queens', n: 30 }, { id: 'tango', n: 40 }] }).progress, [40, 50]);
// 🎬 De estreno: a game first finished in its launch week
assert.equal(premieres({ a: '2026-10-15', b: '2026-10-21', c: '2026-10-22', d: '2026-10-14', e: '2026-11-01' }, { a: '2026-10-15', b: '2026-10-15', c: '2026-10-15', d: '2026-10-15' }), 2);
assert.ok(got('premiere', { marks: { first: { a: '2026-10-16' } }, launches: { a: '2026-10-15' } }).got);
// 🧗 El Alpinista: won a cup after being last on day 1
assert.ok(lastOnDay({ a: { s: 100 }, b: { s: 70 }, c: { s: 70 } }, 'b'), 'last, tied');
assert.ok(!lastOnDay({ a: { s: 100 }, b: { s: 80 }, c: { s: 70 } }, 'b'));
assert.ok(!lastOnDay({ a: { s: 100 }, b: { s: 100 } }, 'b'), 'all tied: nobody is last');
assert.ok(lastOnDay({ a: { s: 100 } }, 'b'), 'did not play day 1');
assert.ok(!lastOnDay({}, 'b'), 'a day nobody played');
assert.equal(got('climber', { climbs: 2 }).count, 2);
// 🏠 De la casa: 100 days with a game, not in a row (the owner, 2026-11-22)
assert.equal(daysPlayed({ '2026-11-01': true, '2026-11-02': true }, ['2026-11-02', '2026-11-05']), 3, 'a day counts once');
const hundred = [...Array(100)].map((_, i) => new Date(Date.UTC(2026, 0, 1 + 2 * i)).toISOString().slice(0, 10));
assert.ok(got('regular', { marks: { played: hundred } }).got);
assert.deepEqual(got('regular', { dailyDays: { '2026-11-01': true }, marks: { played: hundred.slice(0, 36) } }).progress, [37, 100]);
// The secret dates (Martes 13 left: too hard to earn, the owner 2026-11-22)
assert.ok(!earned({ now: NOW }).list.some(b => b.id === 'tuesday-13'));
for (const [id, k] of [['fiestas', 'fiestas'], ['halloween', 'halloween'], ['xmas', 'xmas'], ['new-year', 'newyear']]) {
  assert.ok(got(id, { marks: { days: { [k]: true } } }).got, id);
  assert.ok(got(id, {}).secret && !got(id, {}).got, `${id}: secret until earned`);
}

// A badge the window celebrated stays earned on the profile, new until the profile shows it; a server one does not
{
  const list = earned({}, {}).list;
  const done = { premiere: 1, 'triple-crown': 1 };
  const out = withAnnounced(list, done, new Set(['premiere']), {});
  const p = out.find(b => b.id === 'premiere');
  assert.ok(p.got && p.new && p.progress === null, 'an announced local badge is earned and new');
  assert.ok(!out.find(b => b.id === 'triple-crown').got, 'a server badge is not earned by the phone announcing it');
  assert.equal(withAnnounced(list, done, new Set(['premiere']), { premiere: 1 }).find(b => b.id === 'premiere').new, false, 'shown before: not new');
}
console.log('profile badges: ok');
