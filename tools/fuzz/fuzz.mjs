/**
 * Property-based fuzzing (#1249, step 11, docs/REPLAY.md): plays many random games against a pure
 * state machine and checks invariants after every action. No npm: the randomness is azar.js's seeded
 * source, so each game is one seed and a failure is printed as { seed, actions }, the format
 * tools/replay/replay.mjs runs, ready to keep as a replay test (rule 10).
 *
 *   fuzz({ games, seed, start, legal, step, invariant, illegal, maxSteps, finalCheck })
 *
 *  start()                builds the first state, drawing from azar.js's random() (the setup)
 *  legal(state)           the legal actions; empty when the game is over
 *  step(state, action)    the next state (pure)
 *  invariant(state)       throws or returns a string when the state is wrong
 *  illegal(state, rand)   optional: an action that must be rejected (step returns the same state)
 *  finalCheck(state)      optional: checks the end (throws or returns a string)
 *  maxSteps               a game that has not ended after this many actions is a failure
 */
import { withSeed, random } from '../../public/assets/js/azar.js';
import { replay } from '../replay/replay.mjs';

const check = (fn, s, what) => {
  const r = fn(s);
  if (typeof r === 'string' && r) throw new Error(`${what}: ${r}`);
};

/** Plays one game; returns { actions, steps } or throws an Error carrying `.actions`. */
function playOne({ seed, start, legal, step, invariant, illegal, illegalRate, maxSteps, finalCheck }) {
  const actions = [];
  try {
    return withSeed(seed, () => {
      let s = start();
      check(invariant, s, 'invalid start');
      for (let n = 0; ; n++) {
        const options = legal(s);
        if (!options.length) break;
        if (n >= maxSteps) throw new Error(`did not end within ${maxSteps} actions`);
        if (illegal && random() < illegalRate) {
          const bad = illegal(s, random);
          if (bad) {
            actions.push(bad);
            const same = step(s, bad);
            if (same !== s) throw new Error(`illegal action accepted: ${JSON.stringify(bad)}`);
          }
        }
        const a = options[Math.floor(random() * options.length)];
        actions.push(a);
        s = step(s, a);
        check(invariant, s, `invalid state after ${JSON.stringify(a)}`);
      }
      if (finalCheck) check(finalCheck, s, 'wrong end');
      return { actions, steps: actions.length };
    });
  } catch (e) {
    e.actions = actions;
    throw e;
  }
}

/** Runs `games` random games; throws on the first failure after printing its replay. */
export function fuzz({ games = 1000, seed = 'fuzz', illegalRate = 0.1, maxSteps = 1000, ...rest }) {
  let total = 0;
  for (let i = 0; i < games; i++) {
    const gameSeed = `${seed}-${i}`;
    try {
      total += playOne({ seed: gameSeed, illegalRate, maxSteps, ...rest }).steps;
    } catch (e) {
      const rec = { seed: gameSeed, actions: e.actions || [] };
      console.error(`✗ fuzz failure (${e.message}). Keep it as a replay test:\n${JSON.stringify(rec)}`);
      e.replay = rec;
      throw e;
    }
  }
  return { games, actions: total };
}

/** Re-runs a printed failure: the same start and actions through replay.mjs. */
export const rerun = ({ seed, actions }, { start, step }) => replay({ seed, actions, start, step });
