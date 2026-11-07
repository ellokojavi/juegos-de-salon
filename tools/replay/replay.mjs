/**
 * Replay (#1249, step 10, docs/REPLAY.md): runs a recorded game, { seed, actions[] }, to its final
 * state. The seed seeds azar.js's random source for the whole run, so whatever the game draws from
 * it comes out the same; `start` builds the first state, `step` applies one action, `finish` reads
 * the end. Pure: no DOM, runs under node.
 */
import { withSeed } from '../../public/assets/js/azar.js';

export function replay({ seed, actions = [], start, step, finish = s => s }) {
  return withSeed(seed, () => {
    let s = start();
    for (const a of actions) s = step(s, a);
    return finish(s);
  });
}
