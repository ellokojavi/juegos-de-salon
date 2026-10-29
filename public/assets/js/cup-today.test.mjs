// La Copa's ▶ Jugar hoy on the home page (flag copa-hoy): which cup and day it opens, from what La Copa kept
import assert from 'node:assert/strict';
import { nuevaMeta, porJugar } from '../../cup/engine.js';
import { pendingCup } from './cup-today.js';

const H = 60 * 60 * 1000;
const meta = nuevaMeta({ nombre: 'Copa', dias: 7, inicio: '2026-09-28', tz: 'America/Santiago', admin: 'aaaaaa', creada: 0 });
const dia = k => meta.win[1].a + k * 24 * H + 12 * H;
const players = { aaaaaa: { name: 'Ana', at: 1 }, bbbbbb: { name: 'Beto', at: 2 } };
const L = { meta, players, results: { 1: { aaaaaa: { s: 5, ms: 1 } } } };

// What La Copa keeps (engine `porJugar`)
assert.deepEqual(porJugar(L, 'aaaaaa', dia(0)).map(x => x[0]), [2, 3, 4, 5, 6, 7], 'day 1 played: the rest');
assert.deepEqual(porJugar(L, 'bbbbbb', dia(0))[0], [1, meta.win[1].a, meta.win[1].b], 'each with when it opens and closes');
assert.deepEqual(porJugar(L, 'zzzzzz', dia(0)), [], 'not in the cup');
assert.deepEqual(porJugar({ ...L, players: { ...players, bbbbbb: { ...players.bbbbbb, out: 1 } } }, 'bbbbbb', dia(0)), [], 'taken out');
assert.deepEqual(porJugar(L, 'bbbbbb', meta.end), [], 'over');
assert.ok(porJugar({ ...L, fin: dia(1) }, 'bbbbbb', dia(0)).every(([, , b]) => b <= dia(1)), 'an early close cuts the days');

// What the home page reads
const store = (pid, cups = [{ code: 'K7Q2X' }]) => {
  const m = { 'juegos-de-salon:copa:mias': JSON.stringify(cups), 'juegos-de-salon:copa:hoy:K7Q2X': JSON.stringify(porJugar(L, pid, dia(0))) };
  return { getItem: k => m[k] ?? null };
};
assert.deepEqual(pendingCup(store('bbbbbb'), dia(0)), { code: 'K7Q2X', dia: 1 }, 'day 1 not played: play it');
assert.equal(pendingCup(store('aaaaaa'), dia(0)), null, 'played today: nothing on the card');
assert.deepEqual(pendingCup(store('aaaaaa'), dia(1)), { code: 'K7Q2X', dia: 2 }, 'the next day, once it opens');
assert.deepEqual(pendingCup(store('bbbbbb'), dia(1)), { code: 'K7Q2X', dia: 1 }, 'yesterday in its grace day goes first');
assert.equal(pendingCup(store('bbbbbb'), meta.win[1].a - H), null, 'before the cup starts');
assert.equal(pendingCup(store('bbbbbb', []), dia(0)), null, 'no cups');
assert.equal(pendingCup({ getItem: () => '{bad' }, dia(0)), null, 'a broken storage');
assert.equal(pendingCup(null, dia(0)), null, 'no storage');
console.log('cup-today: ok');
