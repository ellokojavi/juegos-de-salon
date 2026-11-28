// node public/labs/cosmic-marble/engine.test.mjs: the score (C-12)
import assert from 'node:assert/strict';
import { stagePoints, runScore, beats, STAGES } from './engine.js';
import { LOCALES, COURSE_TEXTS } from './rules.js';

assert.equal(stagePoints(10, 20), 20, 'inside the par: 20');
assert.equal(stagePoints(20, 20), 20, 'on the par: 20');
assert.equal(stagePoints(30, 20), 15, 'half way to twice the par');
assert.equal(stagePoints(40, 20), 10, 'twice the par: 10');
assert.equal(stagePoints(400, 20), 10, 'never below 10');

const five = Array(STAGES).fill({ pts: 20 });
assert.deepEqual(runScore(five, 0), { done: true, base: 100, lost: 0, pts: 100 }, 'a perfect run is 100');
assert.equal(runScore(five, 2).pts, 94, '3 off per life');
assert.equal(runScore([], 3).pts, 0, 'never below 0');
assert.equal(runScore([{ pts: 20 }], 0).done, false);

assert.equal(beats({ pts: 0, time: 1 }, null), false, 'a run with no points is no record');
assert.equal(beats({ pts: 50, time: 90 }, null), true);
assert.equal(beats({ pts: 50, time: 90 }, { score: 50, time: 100 }), true, 'a tie in less time');
assert.equal(beats({ pts: 50, time: 100 }, { score: 50, time: 90 }), false);
assert.equal(beats({ pts: 40, time: 10 }, { score: 50, time: 90 }), false);

// The texts: the same keys in every language, none empty (C-3)
for (const set of [LOCALES, COURSE_TEXTS]) {
  const keys = Object.keys(set.es.ui).sort();
  for (const [lang, L] of Object.entries(set)) {
    assert.deepEqual(Object.keys(L.ui).sort(), keys, lang + ': same keys as es');
    for (const k of keys) {
      const v = L.ui[k];
      assert.ok(Array.isArray(v) ? v.length === set.es.ui[k].length : String(v).trim(), lang + '.' + k);
    }
  }
}
for (const L of Object.values(LOCALES)) assert.ok(L.como.length <= 3, 'up to three steps (U-18)');
console.log('cosmic-marble engine: ok');
