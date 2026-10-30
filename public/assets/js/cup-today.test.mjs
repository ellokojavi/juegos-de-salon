// La Copa's ▶ Jugar hoy on the home page (flag copa-hoy): which cup and day it opens, from what La Copa kept
import assert from 'node:assert/strict';
import { nuevaMeta, porJugar } from '../../cup/engine.js';
import { pendingCup, nextCupDay, untilText, finalPlayed } from './cup-today.js';

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
assert.deepEqual(nextCupDay(store('aaaaaa'), dia(0)), { code: 'K7Q2X', dia: 2, at: meta.win[2].a }, 'played today: day 2 is next');
assert.equal(nextCupDay(store('bbbbbb', []), dia(0)), null, 'no cups: no countdown');
assert.equal(untilText(5 * H + 12 * 60000), '5h');
assert.equal(untilText(27 * H), '1d 3h');
assert.equal(untilText(30000), '1m');
assert.equal(untilText(5 * H + 40 * 60000), '5h');
assert.equal(untilText(25 * 60000), '25m');
assert.equal(untilText(45 * 60000), '45m');
// The final played: nothing to come, the cup still open
const fin = meta.win[7].a + H;
const todo = { meta, players: { aaaaaa: players.aaaaaa }, results: Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map(d => [d, { aaaaaa: 1 }])) };
const lista = (x, cups = [{ code: 'K7Q2X' }]) => { const m = { 'juegos-de-salon:copa:mias': JSON.stringify(cups), 'juegos-de-salon:copa:lista:K7Q2X': JSON.stringify(x) }; return { getItem: k => m[k] ?? null }; };
assert.deepEqual(finalPlayed(lista(todo), fin), { code: 'K7Q2X', at: meta.end }, 'final played: closes at the end');
assert.equal(finalPlayed(lista({ ...todo, results: { 1: { aaaaaa: 1 } } }), fin), null, 'final not played: nothing');
assert.equal(finalPlayed(lista(todo), meta.end), null, 'closed: nothing');
assert.equal(finalPlayed(lista(todo), meta.win[6].a + H), null, 'not the last day yet');
assert.equal(finalPlayed(lista(todo, []), fin), null, 'no cups');
// A cup of the Rankings player joined on another phone: kept here, not in "Tus copas" (D-220)
const full = m => ({ getItem: k => m[k] ?? null, get length() { return Object.keys(m).length; }, key: i => Object.keys(m)[i] ?? null });
const otra = full({ 'juegos-de-salon:copa:mias': '[]', 'juegos-de-salon:copa:hoy:MENYF': JSON.stringify(porJugar(L, 'aaaaaa', dia(0))) });
assert.deepEqual(nextCupDay(otra, dia(0)), { code: 'MENYF', dia: 2, at: meta.win[2].a }, "a Rankings player's cup counts too");
assert.deepEqual(pendingCup(otra, dia(1)), { code: 'MENYF', dia: 2 }, "and its day to play");
console.log('cup-today: ok');
