// Uno al día's first attempt counts from its start (D-433): the marker, going on where it was, the
// 0 for an attempt left unfinished (today, on a past day, or started on another phone), and the
// streak that a lost day keeps.
import assert from 'node:assert/strict';
import { markStarted, unfinished, forfeit, settleStarted, startedAttempt, dailySave, estado, leer, anotar, SAVE_PREFIX } from './uno-al-dia.js';

const mem = () => {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), m };
};
const at = (f, h = 12) => new Date(`${f}T${String(h).padStart(2, '0')}:00:00`).getTime();

// Without a marker nothing changes: only starting today's first attempt writes it
{
  const storage = mem();
  assert.equal(settleStarted({ storage, ahora: at('2026-10-08') }), null);
  assert.equal(unfinished('2026-10-08', { storage }), null);
  assert.deepEqual(leer(storage).dias, {});
}

// Started today and left: still today's, it goes on with its moves and time
{
  const storage = mem();
  assert.equal(markStarted('2026-10-08', 'reinas', { storage, ahora: at('2026-10-08', 10) }), true);
  dailySave('2026-10-08', 'reinas', { storage }).guardar([{ x: 1 }], 42000);
  assert.equal(settleStarted({ storage, ahora: at('2026-10-08', 11) }), null, 'the same day it is not lost');
  assert.equal(unfinished('2026-10-08', { storage })?.j, 'reinas');
  const g = dailySave('2026-10-08', 'reinas', { storage });
  assert.deepEqual(g.jugadas, [{ x: 1 }], 'the moves come back');
  assert.equal(g.ms, 42000, 'and the time');
  assert.equal(markStarted('2026-10-08', 'reinas', { storage, ahora: at('2026-10-08', 11) }), true, 'marking again keeps the first start');
  assert.equal(startedAttempt(storage).at, at('2026-10-08', 10));
}

// Finished: the marker and the save go on the next screen
{
  const storage = mem();
  markStarted('2026-10-08', 'reinas', { storage, ahora: at('2026-10-08', 10) });
  dailySave('2026-10-08', 'reinas', { storage }).guardar([], 1000);
  anotar('2026-10-08', { j: 'reinas', s: 80, ms: 60000 }, { storage });
  assert.equal(unfinished('2026-10-08', { storage }), null);
  assert.equal(settleStarted({ storage, ahora: at('2026-10-09') }), null, 'a finished day is not touched');
  assert.equal(leer(storage).dias['2026-10-08'].s, 80);
  assert.equal(startedAttempt(storage), null, 'the marker is gone');
  assert.ok(![...storage.m.keys()].some(k => k.startsWith(SAVE_PREFIX)), 'and the save');
  assert.equal(markStarted('2026-10-08', 'reinas', { storage }), false, 'a day with its result is not started again');
}

// Left a group game halfway today: it counts 0, and the next one is practice
{
  const storage = mem();
  markStarted('2026-10-08', 'ahorcado', { storage, ahora: at('2026-10-08', 10) });
  const r = forfeit('2026-10-08', { storage, ahora: at('2026-10-08', 10) + 90000 });
  assert.equal(r.primera, true);
  assert.equal(r.dia.s, 0, 'it scores 0');
  assert.equal(r.dia.j, 'ahorcado');
  assert.equal(r.dia.ms, 90000, 'charged the time since it started');
  assert.equal(anotar('2026-10-08', { j: 'ahorcado', s: 100, ms: 1 }, { storage }).primera, false, 'the next attempt is practice');
  assert.equal(leer(storage).dias['2026-10-08'].s, 0, 'and the day stays at 0');
  assert.equal(forfeit('2026-10-08', { storage }), null, 'a day with its result is not forfeited twice');
}

// Started on another phone: no marker here, the game and the start come from Firebase
{
  const storage = mem();
  const r = forfeit('2026-10-08', { j: 'dudo', at: at('2026-10-08', 9), storage, ahora: at('2026-10-08', 10) });
  assert.deepEqual([r.dia.j, r.dia.s, r.dia.ms], ['dudo', 0, 3600000]);
}

// A day that ended unfinished counts 0 for that day, and the streak goes on through it
{
  const storage = mem();
  anotar('2026-10-07', { j: 'anio', s: 70, ms: 1 }, { storage, ahora: at('2026-10-07') });
  markStarted('2026-10-08', 'reinas', { storage, ahora: at('2026-10-08', 22) });
  const e = estado({ storage, ahora: at('2026-10-09', 9) });
  assert.equal(e.dias['2026-10-08'].s, 0, 'yesterday counts 0');
  assert.equal(e.racha, 2, 'and the streak was kept: starting counts as playing');
  assert.equal(startedAttempt(storage), null);
  assert.ok(e.dias['2026-10-08'].ms <= 86400000, 'charged at most a day');
}

console.log('✓ daily attempt: marked at the start, goes on the same day, 0 when left unfinished, the streak kept');
