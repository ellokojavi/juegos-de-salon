/**
 * Drift's calibration (the owner, 2026-11-27): simulated people of three levels lap every circuit in
 * both views, through the real controls' curve, and the game must give each what was asked:
 *   - the expert laps in a reasonable time (at most 15 % over par), crashing in few laps;
 *   - the intermediate, at the pace that takes 1.5× the expert's time, laps with no crash and no missed gate;
 *   - the novice, at the pace that takes 2× the expert's time, the same.
 * A change to the car, the controls or the circuits that breaks this is a change in how the game
 * plays for people: solve the paces again (drift-humans.mjs) and look at why.
 *   node tools/generators/drift-humans.test.mjs
 */
import assert from 'node:assert/strict';
import * as H from './drift-humans.mjs';
import { STAGES, TRACKS } from '../../public/labs/drift/tracks.js';
import { DEFAULT_VIEW } from '../../public/labs/drift/tuning.js';

const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
const runs = 2, par = mean(STAGES.map(id => TRACKS[id].par / 1000));
for (const scene of ['2d', '3d']) {
  H.useView(scene);
  const opts = { ids: STAGES, runs, reach: DEFAULT_VIEW.reach, scheme: scene === '3d' ? DEFAULT_VIEW.scheme3d : DEFAULT_VIEW.scheme };
  const expert = H.laps('expert', H.EXPERT_PACE, opts), eTime = mean(expert.map(x => x.t));
  assert.ok(expert.every(x => x.done), `${scene}: every expert lap finishes`);
  assert.ok(eTime <= par * 1.15, `${scene}: the expert laps in ${eTime.toFixed(1)} s, par ${par.toFixed(1)} s`);
  assert.ok(expert.filter(x => x.crashes).length <= expert.length * 0.15, `${scene}: the expert crashes in ${expert.filter(x => x.crashes).length} of ${expert.length} laps`);
  console.log(`✓ ${scene}: the expert laps in ${(eTime / par).toFixed(2)}× par, crashing in ${expert.filter(x => x.crashes).length} of ${expert.length} laps`);
  for (const level of ['intermediate', 'novice']) {
    const m = H.PACES[scene][level], r = H.laps(level, { grip: H.EXPERT_PACE.grip * m, top: m }, opts), ratio = mean(r.map(x => x.t)) / eTime;
    assert.ok(Math.abs(ratio - H.TARGET[level]) <= 0.15, `${scene}: the ${level} takes ${ratio.toFixed(2)}× the expert's time, not about ${H.TARGET[level]}×`);
    const crashes = r.reduce((s, x) => s + x.crashes, 0), missed = r.reduce((s, x) => s + x.missed, 0);
    assert.ok(r.every(x => x.done) && crashes === 0 && missed === 0, `${scene}: the ${level} crashed ${crashes} times and missed ${missed} gates in ${r.length} laps`);
    console.log(`✓ ${scene}: the ${level} laps in ${ratio.toFixed(2)}× the expert's time, with no crash and no missed gate in ${r.length} laps`);
  }
}
