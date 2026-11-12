/**
 * Transfer: the rules as a pure state machine (C-2): no DOM, no global state, testable in node.
 *
 * A level is a small invented metro map, a starting platform (station, line and the terminal the
 * train heads to), a destination and a hand of route cards. The player orders some cards into the
 * plan's slots; the train then runs the plan card by card and stops at the first one that breaks.
 *
 * Cards: { t: 'ride', n } rides n stations · { t: 'end' } rides to the end of the line ·
 * { t: 'turn' } changes to the other platform (the opposite direction) ·
 * { t: 'change', line, toward } changes to `line`, heading to its terminal `toward`.
 * A closed station cannot be ridden through nor stopped at; a `via` station must be passed or stopped at.
 */

/** The stations of `line` in order. */
const stopsOf = (level, line) => level.lines.find(l => l.id === line)?.stops || null;

/** Runs `plan` (an array of cards) on `level`: the path, each step's station, and how it ended. */
export function run(level, plan) {
  let { station, line, toward } = level.start;
  const closed = new Set(level.closed || []);
  const visited = [station];
  const steps = [];                     // one per card: { station, path: [stations ridden], line, toward (after it) }
  const fail = (i, reason, extra = {}) => ({ ok: false, failAt: i, reason, steps, visited, at: station, ...extra });

  for (let i = 0; i < plan.length; i++) {
    const card = plan[i];
    const stops = stopsOf(level, line);
    const here = stops.indexOf(station);
    const dir = stops.indexOf(toward) > here ? 1 : -1;
    if (card.t === 'turn') {
      toward = dir > 0 ? stops[0] : stops[stops.length - 1];
      steps.push({ station, path: [], line, toward });
      continue;
    }
    if (card.t === 'change') {
      const next = stopsOf(level, card.line);
      if (!next || !next.includes(station)) return fail(i, 'noChange', { line: card.line });
      if (next.indexOf(card.toward) === next.indexOf(station)) return fail(i, 'atTerminal', { line: card.line });
      line = card.line; toward = card.toward;
      steps.push({ station, path: [], line, toward });
      continue;
    }
    // ride n, or ride to the end
    const n = card.t === 'end' ? Math.abs(stops.indexOf(toward) - here) : card.n;
    if (n === 0) return fail(i, 'atTerminal');
    const path = [];
    for (let k = 1; k <= n; k++) {
      const s = stops[here + dir * k];
      if (s === undefined) { steps.push({ station, path, line, toward }); return fail(i, 'pastEnd'); }
      if (closed.has(s)) { steps.push({ station, path, line, toward }); return fail(i, 'closed', { closed: s }); }
      station = s; path.push(s); visited.push(s);
    }
    steps.push({ station, path, line, toward });
  }
  if (station !== level.goal) return fail(plan.length, 'notGoal');
  if (level.via && !visited.includes(level.via)) return fail(plan.length, 'missedVia', { via: level.via });
  return { ok: true, steps, visited, at: station };
}

/** A new run of `levels`: every level with 3 hearts. */
export function newGame(levels, { hearts = 3 } = {}) {
  return { level: 0, maxHearts: hearts, hearts, stars: [], plan: Array(levels[0].slots).fill(null), hinted: 0, done: false };
}

/** Puts hand card `card` (its index in the hand) in the first empty slot; the same state if it does not fit. */
export function place(state, card) {
  if (state.done || state.plan.includes(card)) return state;
  const i = state.plan.indexOf(null);
  if (i < 0) return state;
  const plan = state.plan.slice(); plan[i] = card;
  return { ...state, plan };
}

/** Takes the card out of slot `i` (hinted slots stay). */
export function unplace(state, i) {
  if (state.done || i < state.hinted || state.plan[i] === null) return state;
  const plan = state.plan.slice(); plan[i] = null;
  return { ...state, plan };
}

/** The plan as cards (empty slots dropped). */
export const planCards = (level, state) => state.plan.filter(c => c !== null).map(c => level.hand[c]);

/**
 * Sends the train: { state, result }. A good plan earns the level's stars (the hearts left) and moves
 * on; a bad one costs a heart, and with none left the level is lost (0 stars) and the run moves on.
 */
export function go(levels, state) {
  const level = levels[state.level];
  const result = run(level, planCards(level, state));
  if (result.ok) return { state: advance(levels, state, state.hearts), result };
  const hearts = state.hearts - 1;
  if (hearts <= 0) return { state: advance(levels, state, 0), result: { ...result, lost: true } };
  return { state: { ...state, hearts }, result };
}

function advance(levels, state, stars) {
  const all = [...state.stars, stars];
  const next = state.level + 1;
  if (next >= levels.length) return { ...state, stars: all, hearts: stars, done: true };
  return { ...state, stars: all, level: next, hearts: state.maxHearts, plan: Array(levels[next].slots).fill(null), hinted: 0 };
}

/** A hint costs a heart (never the last): the slots up to the next one get the solution's cards, the rest are emptied. */
export function hint(levels, state) {
  const level = levels[state.level];
  if (state.done || state.hearts <= 1 || state.hinted >= level.solution.length) return state;
  const i = state.hinted;
  const plan = state.plan.map((c, k) => (k <= i ? level.solution[k] : null));
  return { ...state, plan, hinted: i + 1, hearts: state.hearts - 1 };
}

export const isOver = state => state.done;
export const totalStars = state => state.stars.reduce((a, b) => a + b, 0);
