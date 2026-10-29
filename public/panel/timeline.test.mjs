// The panel's timeline of key events (D-408). Run: node public/panel/timeline.test.mjs
import assert from 'node:assert/strict';
import { nuevaMeta } from '../cup/engine.js';
import { DAY, dayOf, diaPanel } from './aggregate.js';
import { keyEvents, periods, periodOf, periodLabel, byHour, hourOf, countKinds, KINDS } from './timeline.js';

// Tue Oct 20 2026, 19:30 Pacific (PDT, UTC-7) = Oct 21, 02:30 UTC: the UTC day is already the next one
const now = Date.UTC(2026, 9, 21, 2, 30);
const today = dayOf(now);
assert.equal(diaPanel(now), '2026-10-20');
assert.equal(hourOf(now), 19);

const H = 3600000;
const days = {
  [today]: {
    rooms: {
      // Finished with a winner
      ABCD: { game: 'dudo', at: now - H, players: { A: 'Javi', B: 'Cata' }, co: { A: 'CL', B: 'AR' }, end: { winner: 'A', name: 'Javi', at: now - 30 * 60000 } },
      // A tie is an ending too
      TIEE: { game: 'ahorcado', at: now - 2 * H, players: { A: 'Ana', B: 'Leo' }, end: { winner: 'tie', at: now - 90 * 60000 } },
      // Opened and never finished: not a key event
      OPEN: { game: 'dudo', at: now - 3 * H, players: { A: 'Fran', B: 'Nico' } },
      // Nobody else joined
      SOLO: { game: 'dudo', at: now - 3 * H, players: { A: 'Fausto' } },
    },
    live: {
      a: { game: 'generala', mode: 'cpu', name: 'Sofi', co: 'PE', at: now - 50 * 60000, beat: now - 40 * 60000, fin: { at: now - 40 * 60000, g: 'Sofi' } },
      b: { game: 'reinas', mode: 'uno-al-dia', name: 'Seba', co: 'CL', at: now - 20 * 60000, beat: now - 15 * 60000, fin: { at: now - 15 * 60000, d: '2:10' } },
      // Left halfway: not a key event
      c: { game: 'reinas', mode: 'solo', name: 'Pía', at: now - 10 * 60000, beat: now - 9 * 60000 },
      // A La Copa day sends its signal too: counted from the cup instead
      d: { game: 'copa', mode: 'copa', name: 'Javi', at: now - 5 * 60000, beat: now - 4 * 60000, fin: { at: now - 4 * 60000 } },
    },
  },
  // Ten days ago: out of a 7-day range
  [today - 10]: { rooms: { OLDD: { game: 'dudo', at: (today - 10) * DAY + H, players: { A: 'X', B: 'Y' }, end: { winner: 'B', name: 'Y', at: (today - 10) * DAY + 2 * H } } } },
};

// A 3-day cup that started two days ago and already ended
const Z = 'America/Los_Angeles';
const start = diaPanel(now - 3 * DAY);
const meta = nuevaMeta({ nombre: 'Thursday Guys #4', dias: 3, inicio: start, tz: Z, admin: 'aaaaaa', creada: now - 4 * DAY });
assert.ok(meta.end <= now, 'the cup is over');
const torneos = {
  JUEVE: {
    meta,
    players: { aaaaaa: { name: 'Javier', at: now - 4 * DAY, co: 'CL' }, bbbbbb: { name: 'Seba', at: now - 4 * DAY + H } },
    started: [null, { aaaaaa: meta.win[1].a + H }, {}, {}],
    results: [null, { aaaaaa: { s: 90, ms: 60000, at: meta.win[1].a + H + 60000 } }, {}, {}],
  },
};
const feedback = { f1: { texto: 'Love it', at: now - 5 * 60000, nombre: 'Cata', tipo: 'sugerencia' }, bad: { texto: 'no time' } };

const range = { from: today - 6, to: today };
const ev = keyEvents({ days, torneos, feedback }, range, now);
const kinds = ev.map(e => e.kind);

// Rooms: the finished ones only, a tie included
const rooms = ev.filter(e => e.kind === 'room');
assert.deepEqual(rooms.map(e => e.game).sort(), ['ahorcado', 'dudo']);
assert.equal(rooms.find(e => e.game === 'dudo').winner, 'Javi');
assert.equal(rooms.find(e => e.game === 'ahorcado').tie, true);
assert.deepEqual(rooms.find(e => e.game === 'dudo').to, ['sala', ['ABCD', today]]);

// Offline and One a Day: finished only, La Copa's own signal left out
assert.deepEqual(ev.filter(e => e.kind === 'offline').map(e => e.who[0].name), ['Sofi']);
assert.deepEqual(ev.filter(e => e.kind === 'daily').map(e => e.who[0].name), ['Seba']);
assert.ok(!ev.some(e => e.who.some(w => w.name === 'Pía')), 'a game left halfway is not a key event');

// The cup: created, Seba joined, Javier played day 1 (with its start), it ended with Javier ahead
const cupGame = ev.find(e => e.kind === 'cup-game');
assert.equal(cupGame.who[0].name, 'Javier');
assert.equal(cupGame.cup.name, 'Thursday Guys #4');
assert.equal(cupGame.cup.day, 1);
assert.equal(cupGame.startedAt, meta.win[1].a + H);
assert.equal(cupGame.s, 90);
assert.ok(kinds.includes('cup-new') && kinds.includes('cup-join'));
assert.equal(ev.find(e => e.kind === 'cup-join').who[0].name, 'Seba', 'the admin creates; the others join');
assert.equal(ev.find(e => e.kind === 'cup-end').winner, 'Javier');

// Feedback: one with a time; the broken one is skipped
assert.deepEqual(ev.filter(e => e.kind === 'feedback').map(e => e.who[0].name), ['Cata']);

// Newest first, the old room out of the range
assert.ok(ev.every((e, i) => !i || ev[i - 1].at >= e.at));
assert.ok(!ev.some(e => e.who.some(w => w.name === 'Y')));
// Pacific day: the room finished at 19:00 PDT on the 20th belongs to the 20th, not to UTC's 21st
assert.equal(rooms.find(e => e.game === 'dudo').day, '2026-10-20');

// Periods: every day of the range, empty ones included
const byDay = periods(ev, range, 'day', now);
assert.equal(byDay.length, 7);
assert.equal(byDay.at(-1).key, '2026-10-20', 'the range ends on today\'s Pacific date, not UTC\'s');
assert.equal(byDay.reduce((k, p) => k + p.total, 0), ev.length);
assert.equal(byDay.find(p => p.key === '2026-10-20').byKind.room, 2);
assert.equal(periodOf('2026-10-21', 'week'), '2026-10-19', 'weeks start on Monday');
assert.equal(periodOf('2026-10-21', 'month'), '2026-10');
assert.equal(periodLabel('2026-10-19', 'week'), 'Week of Oct 19');
assert.equal(periodLabel('2026-10', 'month'), 'Oct 2026');
assert.equal(periodLabel('2026-10-20', 'day'), 'Tue, Oct 20');
const months = periods(ev, { from: today - 60, to: today }, 'month', now);
assert.deepEqual(months.map(p => p.key), ['2026-08', '2026-09', '2026-10']);

// By hour and by kind
const h = byHour(ev);
assert.equal(h.length, 24);
assert.equal(h.reduce((k, x) => k + x.total, 0), ev.length);
const c = countKinds(ev);
assert.deepEqual(Object.keys(c), KINDS);
assert.equal(c.room, 2);

// Nothing at all draws nothing, without breaking
assert.deepEqual(keyEvents({}, range, now), []);

console.log('timeline.test.mjs ✓');

// Campaigns seen (D-503): a splash and the donation card, each with who saw it
{
  const seen = { [today]: { seen: {
    s1: { c: 'tres-juegos-demo', at: now - 5 * 60000, name: 'Cata', co: 'AR' },
    s2: { c: 'support', at: now - 6 * 60000 },
    bad: { at: now },
  } } };
  const evs = keyEvents({ days: seen }, { from: today - 6, to: today }, now);
  assert.deepEqual(evs.map(e => [e.kind, e.campaign, e.who[0].name]), [['campaign', 'tres-juegos-demo', 'Cata'], ['campaign', 'support', '']]);
  assert.equal(countKinds(evs).campaign, 2);
}
console.log('timeline campaigns ok');
