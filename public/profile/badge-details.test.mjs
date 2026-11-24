// A badge's detail (lab flag badge-details): what each sheet says, pure.
import test from 'node:test';
import assert from 'node:assert/strict';
import { detailOf, DETAILED, hasDetail } from './badge-details.js';
import { BADGES } from './badges.js';
import { TEXTS } from './texts.js';

const games = [
  { id: 'reinas', emoji: '👑', name: { es: 'Reinas' }, path: 'queens/' },
  { id: 'tango', emoji: '☀️', name: 'Tango', path: 'tango/' },
  { id: 'rutas', emoji: '🚇', name: 'Rutas', path: 'routes/' },
];
const ctx = { T: TEXTS.es, lang: 'es', games, today: '2026-11-24' };

test('every detailed badge exists, none secret, and every language has the same detail keys', () => {
  for (const id of DETAILED) { const b = BADGES.find(x => x.id === id); assert.ok(b && !b.secret, id); }
  const keys = Object.keys(TEXTS.es.detail).sort();
  for (const l of Object.keys(TEXTS)) assert.deepEqual(Object.keys(TEXTS[l].detail).sort(), keys, l);
});

test('collector lists the games not played, with their link', () => {
  const d = detailOf('collector', { byGame: [{ id: 'reinas', n: 3 }], playedIds: ['tango'] }, ctx);
  assert.deepEqual(d.rows.map(r => r.href), ['../routes/']);
  assert.match(d.lead, /1 juego/);
  assert.equal(detailOf('explorer', { playedIds: ['reinas', 'tango', 'rutas'] }, ctx).lead, TEXTS.es.detail.allPlayed);
});

test('premiere names the game in its launch week and the days left', () => {
  const d = detailOf('premiere', { launches: { rutas: '2026-11-22', reinas: '2026-10-01' } }, ctx);
  assert.deepEqual(d.rows.map(r => [r.href, r.right]), [['../routes/', 'quedan 5 días']]);
  assert.equal(detailOf('premiere', { launches: {} }, ctx).lead, TEXTS.es.detail.noPremiere);
});

test('number-one sorts the games by best place', () => {
  const d = detailOf('number-one', {}, { ...ctx, places: { tango: { ever: { puesto: 4 }, week: { puesto: 2 } }, reinas: { ever: { puesto: 7 } } } });
  assert.deepEqual(d.rows.map(r => r.right), ['2.º', '7.º']);
});

test('month-full draws the month from Monday, with the days missed', () => {
  const d = detailOf('month-full', { dailyDays: { '2026-11-01': true, '2026-11-24': true } }, ctx);
  assert.equal(d.cal.first, 6); // 1 Nov 2026 is a Sunday
  assert.equal(d.cal.days.length, 30);
  assert.equal(d.cal.days.filter(x => x.s === 'miss').length, 22);
  assert.equal(d.cal.days[23].s, 'on');
});

test('a list longer than six keeps the rest for «Ver más»', () => {
  const many = Array.from({ length: 9 }, (_, i) => ({ id: `g${i}`, name: `G${i}`, path: `g${i}/` }));
  const d = detailOf('collector', {}, { ...ctx, games: many });
  assert.equal(d.rows.length, 6); assert.equal(d.more.length, 3);
});

test('a sheet that would only say «not yet» opens nothing; earned badges and real progress always open', () => {
  for (const id of ['month-champion', 'month-podium', 'cup-champion', 'cup-podium', 'early-bird', 'weekends', 'mondays', 'specialist'])
    assert.equal(hasDetail(id, false, {}, ctx), false, id);
  assert.equal(hasDetail('month-champion', false, { months: [{ period: 's2026-10', place: 2 }] }, ctx), false);
  assert.equal(hasDetail('month-podium', false, { months: [{ period: 's2026-10', place: 2 }] }, ctx), true);
  assert.equal(hasDetail('month-champion', true, { months: [{ period: 's2026-10', place: 1 }] }, ctx), true);
  assert.equal(hasDetail('mondays', false, { marks: { mon: ['2026-11-23'] } }, ctx), true);
  for (const id of ['collector', 'explorer', 'premiere', 'streak-10', 'month-full', 'party', 'all-rounder', 'number-one'])
    assert.equal(hasDetail(id, false, {}, ctx), true, id);
  assert.equal(hasDetail('plays-100', false, {}, ctx), false);
});
