// node public/labs/transfer/engine.test.mjs: the rules (C-12)
import assert from 'node:assert/strict';
import { run, newGame, place, unplace, go, hint, planCards, isOver, totalStars } from './engine.js';
import { CITIES, LOCALES, HEARTS } from './rules.js';
const LEVELS = CITIES.santiago.levels, STATIONS = CITIES.santiago.stations;

// Every city: five levels, each solution arrives, every station and line it names exists, the steps grow
for (const [id, city] of Object.entries(CITIES)) {
  assert.equal(city.levels.length, 5, id);
  city.levels.forEach((level, i) => {
    const where = id + ' level ' + (i + 1);
    const r = run(level, level.solution.map(c => level.hand[c]));
    assert.ok(r.ok, where + ' solution: ' + r.reason);
    assert.ok(level.solution.length <= level.slots, where + ' fits');
    for (const l of level.lines) { assert.equal(l.ends.length, 2, where); for (const s of l.stops) assert.ok(city.stations[s], where + ': ' + s + ' exists'); }
    for (const c of level.hand) if (c.t === 'change') assert.ok(level.lines.some(l => l.id === c.line && l.stops.includes(c.toward)), where + ': ' + c.line + ' towards ' + c.toward);
    assert.ok(city.stations[level.goal] && city.stations[level.start.station], where);
    assert.ok(level.hand.some((_, c) => !run(level, [level.hand[c]]).ok), where + ': a wrong card exists');
  });
  // The same five steps everywhere: a closed station on the fourth, a station to pass on the fifth, and each bites
  assert.ok(city.levels[3].closed?.length && city.levels[4].via, id);
  assert.deepEqual(city.levels.map(l => l.slots), [1, 2, 3, 4, 5], id);
}

// Santiago's levels, one by one: its solution arrives, fits its slots, and every station it names exists
LEVELS.forEach((level, i) => {
  const r = run(level, level.solution.map(c => level.hand[c]));
  assert.ok(r.ok, 'level ' + (i + 1) + ' solution: ' + r.reason);
  assert.ok(level.solution.length <= level.slots, 'level ' + (i + 1) + ' fits');
  for (const l of level.lines) for (const s of l.stops) assert.ok(STATIONS[s], s + ' exists');
  assert.ok(STATIONS[level.goal] && STATIONS[level.start.station]);
});

// Each level is harder: more slots or a new rule
assert.deepEqual(LEVELS.map(l => l.slots), [1, 2, 3, 4, 5]);

// The rules, one by one
const [L1, L2, L3, L4, L5] = LEVELS;
assert.equal(run(L1, [{ t: 'ride', n: 2 }]).reason, 'notGoal');
assert.equal(run(L1, [{ t: 'ride', n: 9 }]).reason, 'pastEnd');
assert.equal(run(L2, [{ t: 'end' }, { t: 'end' }]).reason, 'atTerminal');
assert.equal(run(L3, [{ t: 'ride', n: 4 }, { t: 'change', line: 'l5', toward: 'armas' }]).reason, 'noChange', 'Universidad Católica is not on Line 5');
assert.equal(run(L4, [{ t: 'ride', n: 3 }]).reason, 'closed', 'Universidad de Chile is closed');
assert.equal(run(L4, [{ t: 'change', line: 'l2', toward: 'patronato' }, { t: 'ride', n: 2 }, { t: 'change', line: 'l3', toward: 'matta' }, { t: 'ride', n: 1 }]).ok, true, 'Line 3 from Puente Cal y Canto works too');
assert.equal(run(L5, [{ t: 'ride', n: 1 }, { t: 'change', line: 'l1', toward: 'baquedano' }, { t: 'ride', n: 2 }, { t: 'change', line: 'l3', toward: 'irarrazaval' }, { t: 'ride', n: 2 }]).reason, 'missedVia', 'the short way skips Bellas Artes');
// Every line's real terminals are named, and its stretch is in its real order
for (const level of LEVELS) for (const l of level.lines) assert.equal(l.ends.length, 2);

// Some wrong plan exists for every level from its own hand (the distractors bite)
for (const level of LEVELS) assert.ok(level.hand.some((_, c) => !run(level, [level.hand[c]]).ok));

// A game: place, unplace, a failed run costs a heart, a good one scores the hearts left
let s = newGame(LEVELS, { hearts: HEARTS });
s = place(s, 0);
assert.deepEqual(planCards(L1, s), [L1.hand[0]]);
assert.equal(place(s, 1), s, 'no empty slot');
let out = go(LEVELS, s);
assert.equal(out.result.ok, false);
assert.equal(out.state.hearts, 2);
s = unplace(out.state, 0);
s = place(s, 1);
out = go(LEVELS, s);
assert.ok(out.result.ok);
s = out.state;
assert.equal(s.level, 1);
assert.deepEqual(s.stars, [2]);
assert.equal(s.hearts, 3, 'a new level, full hearts');

// A hint fills the solution up to the next slot and costs a heart, never the last one
s = hint(LEVELS, s);
assert.deepEqual(s.plan, [L2.solution[0], null]);
assert.equal(s.hearts, 2);
assert.equal(unplace(s, 0), s, 'a hinted slot stays');
s = hint(LEVELS, s);
assert.equal(s.hearts, 1);
assert.equal(hint(LEVELS, s), s, 'not the last heart');
out = go(LEVELS, s);
assert.ok(out.result.ok);
s = out.state;

// Losing every heart moves on with zero stars
for (let k = 0; k < HEARTS; k++) out = go(LEVELS, place(s, 0)), s = k < HEARTS - 1 ? unplace(out.state, 0) : out.state;
assert.equal(s.level, 3);
assert.deepEqual(s.stars, [2, 1, 0]);

// The rest, solved: the run is over
for (const level of [L4, L5]) {
  for (const c of level.solution) s = place(s, c);
  s = go(LEVELS, s).state;
}
assert.ok(isOver(s));
assert.equal(totalStars(s), 2 + 1 + 0 + 3 + 3);

// The texts: the same keys in every language, none empty (C-3)
const keys = Object.keys(LOCALES.es.ui).sort();
for (const [lang, L] of Object.entries(LOCALES)) {
  assert.deepEqual(Object.keys(L.ui).sort(), keys, lang + ': same keys as es');
  for (const k of keys) assert.ok(L.ui[k].trim(), lang + '.' + k + ' is not empty');
  assert.ok(L.como.length <= 3, lang + ': up to three steps (U-18)');
}
console.log('transfer engine: ok');
