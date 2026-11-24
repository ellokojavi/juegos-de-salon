// Another player's profile at a glance (player-peek.js): only public facts, only the achievements they can tell
import assert from 'node:assert/strict';
import { peekFacts, peekBadges, tableOf, PUBLIC_BADGES, rowContext, unitWord } from './player-peek.js';
import { SOLO_TABLES } from './games.js';
import { BADGES } from './badges.js';
import { TEXTS } from './profile-texts.js';

const day = iso => String(Math.round(Date.parse(`${iso}T00:00:00Z`) / 86400000));
const hist = {};
for (let i = 0; i < 12; i++) hist[day(`2026-11-${String(10 + i).padStart(2, '0')}`)] = { s: 1 };
const f = peekFacts({
  jid: 'abcd1234',
  perfil: { n: 'Ana', co: 'CL', at: Date.parse('2026-09-01'), juegos: { ahorcado: { n: 120 }, nope: { n: 5 }, sudoku: { n: 3 } } },
  hist,
  podios: { C1: { name: 'Copa', end: 1, p: { a: { j: 'abcd1234', l: 1, n: 'Ana' } } } },
  general: [{ jid: 'zzzz9999', puesto: 1 }, { jid: 'abcd1234', puesto: 4 }],
  months: [{ period: 's2026-10', top: [{ jid: 'abcd1234', puesto: 2 }] }],
  today: '2026-11-21', now: Date.parse('2026-11-21'),
});
assert.equal(f.n, 'Ana');
assert.equal(f.streak, 12, 'the streak comes from their public Uno al día');
assert.deepEqual(f.byGame.map(g => g.id), ['ahorcado', 'sudoku'], 'an unknown game is left out, most played first');
assert.equal(f.plays, 123);
assert.equal(f.medals.gold, 1);
assert.equal(f.allRounder, 4);
const ids = peekBadges(f).map(b => b.id);
for (const id of ['streak-10', 'plays-100', 'specialist', 'cup-podium', 'cup-champion', 'month-podium', 'all-rounder']) assert.ok(ids.includes(id), id);
assert.ok(ids.every(id => PUBLIC_BADGES.has(id)), 'only what public data can tell');
assert.equal(peekBadges(f)[0].tier, 'gold', 'the best metal first');
for (const id of PUBLIC_BADGES) assert.ok(BADGES.some(b => b.id === id), `${id} is a badge`);
assert.equal(peekFacts({ jid: 'x', perfil: { n: 'B', at: 1 } }).allRounder, null);
// Nothing to hide (D-605): a profile with the old `oculto` still shows everything
assert.deepEqual(peekBadges(peekFacts({ jid: 'abcd1234', perfil: { n: 'Ana', at: 1, oculto: true, juegos: { ahorcado: { n: 120 } } }, hist, today: '2026-11-21', now: Date.parse('2026-11-21') })).map(b => b.id).filter(id => ['streak-10', 'plays-100'].includes(id)).sort(), ['plays-100', 'streak-10']);
// Each most played game shows a place in its all-time table, never a count (the owner, 2026-11-22)
assert.deepEqual(tableOf('reinas'), { t: 'reinas', wins: false });
for (const [id, t] of Object.entries(SOLO_TABLES)) assert.equal(tableOf(id).t, t, `${id} reads ${t}`);
for (const l of ['es', 'en', 'pt']) assert.ok(TEXTS[l].peekGamePlace.includes('{place}') && !/\d/.test(TEXTS[l].peekGamePlace), `${l}: the place, no count`);
for (const l of ['es', 'en', 'pt']) for (const k of ['peekOpen', 'peekLoading', 'peekError', 'peekClose', 'peekPlace', 'peekGames', 'peekGamePlace', 'peekNoGames', 'peekBadges', 'peekBadgesOne', 'peekBadgesNone', 'peekNoBadges', 'publicTitle', 'publicHint', 'seePublic'])
  assert.ok(TEXTS[l][k], `${l}.${k}`);
assert.ok(!/chapita/i.test(JSON.stringify(TEXTS.es)), 'logros, never chapitas');
console.log('✓ profile peek');
for (const l of ['es', 'en', 'pt']) for (const k of ['peekHidden', 'showActivity', 'showActivityHint', 'publicBubbleTitle', 'publicBubbleText', 'publicError'])
  assert.equal(TEXTS[l][k], undefined, `${l}.${k}: no switch, no hidden sheet (D-605)`);

// Where a name was tapped heads the sheet (the owner, 2026-11-23): the table, its tab and the row as drawn
const node = (o = {}) => ({ textContent: o.text || '', dataset: o.data || {}, querySelector: s => o.q?.[s] || null, closest: s => o.closest?.[s] || null });
const tabOn = node({ text: 'Esta semana', data: { p: 'semana' } });
const box = node({ data: { tabla: 'sudoku_easy', pestana: 'semana' }, q: { '.rk-seg .on': tabOn, '.rk-titulo': node({ text: '🧩  Ranking de Sudoku' }) } });
const row = node({ data: { jid: 'abcd1234', k: 'score', puesto: '2' }, closest: { '.rk-ranking, .rk-campeones': box }, q: { '.rk-puesto': node({ text: '🥈' }), '.rk-puntos': node({ text: '120' }), '.rk-tiempo': node({ text: '1:02' }) } });
// The place as a number (its medal's metal comes from it), each figure with its unit (option A, the owner, 2026-11-23)
assert.deepEqual(rowContext(row), { label: '🧩 Ranking de Sudoku · Esta semana', place: '2', values: [{ v: '120', unit: 'pts' }, { v: '1:02', unit: 'time' }], allTime: 'sudoku_easy' });
const kind = (k, s, t) => rowContext(node({ data: { k, puesto: '7' }, closest: { '.rk-ranking, .rk-campeones': box }, q: { '.rk-puntos': node({ text: s }), '.rk-tiempo': node({ text: t }) } })).values;
assert.deepEqual(kind('wins', '12', '🏆'), [{ v: '12', unit: 'wins' }], 'a wins table counts wins, no time');
assert.deepEqual(kind('plays', '340', '🎲'), [{ v: '340', unit: 'plays' }]);
assert.deepEqual(kind('streak', '21', '🔥'), [{ v: '🔥 21', unit: 'streak' }]);
assert.deepEqual(kind('points', '180', '🔥9'), [{ v: '180', unit: 'pts' }, { v: '🔥 9', unit: 'streak' }]);
for (const l of ['es', 'en', 'pt']) for (const k of ['peekUnitPts', 'peekUnitTime', 'peekUnitWins', 'peekUnitPlays', 'statStreak']) assert.ok(TEXTS[l][k], `${l}.${k}`);
// From the all-time tab there is no second all-time line; the Cups' medal table has no tabs and shows the medals
const always = node({ data: { tabla: 'sudoku_easy', pestana: 'siempre' }, q: { '.rk-seg .on': node({ text: 'Siempre', data: { p: 'siempre' } }) } });
assert.equal(rowContext(node({ closest: { '.rk-ranking, .rk-campeones': always }, q: {} })).allTime, null);
const champs = node({ data: {}, q: { '.rk-titulo': node({ text: '🏅 Campeones' }) } });
assert.deepEqual(rowContext(node({ closest: { '.rk-ranking, .rk-campeones': champs }, q: { '.rk-puesto': node({ text: '1' }), '.rk-medallas': node({ text: '🥇2 🥈0 🥉1' }) } })),
  { label: '🏅 Campeones', place: '1', values: [{ v: '🥇2 🥈0 🥉1' }], allTime: null });
const general = node({ data: { tabla: 'todoterreno', pestana: 'semana' }, q: { '.rk-seg .on': tabOn } });
assert.equal(rowContext(node({ closest: { '.rk-ranking, .rk-campeones': general }, q: {} })).allTime, null, 'the overall place is already the sheet\'s own line');
console.log('✓ the sheet says where it was opened');

// One is singular (U-6): «1 victoria», «🔥 1 día seguido», never «1 victorias» (the usability review of #1827)
for (const l of ['es', 'en', 'pt']) {
  const T = TEXTS[l];
  for (const [u, many, one] of [['wins', 'peekUnitWins', 'peekUnitWin'], ['plays', 'peekUnitPlays', 'peekUnitPlay'], ['streak', 'statStreak', 'peekUnitStreakOne']]) {
    assert.ok(T[one] && T[one] !== T[many], `${l}.${one}`);
    assert.equal(unitWord(T, u, u === 'streak' ? '🔥 1' : '1'), T[one], `${l}: 1 ${u} is singular`);
    assert.equal(unitWord(T, u, u === 'streak' ? '🔥 12' : '12'), T[many], `${l}: 12 ${u} is plural`);
  }
  assert.equal(unitWord(T, 'pts', '1'), T.peekUnitPts);
}
console.log('✓ one is singular');
