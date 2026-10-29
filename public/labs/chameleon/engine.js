/**
 * El Camaleón — the rules, pure (C-2): no DOM, no storage. `rng` is injectable for the tests.
 * A game: players with points, rounds until someone reaches TARGET.
 * A round: phase 'cards' (the phone goes around, seat by seat from the starter) → 'clues' →
 * 'vote' → 'guess' (only if the chameleon was accused) → 'result'.
 */
import { GRID, TARGET, POINTS, TOPIC_IDS, MIN_PLAYERS, MAX_PLAYERS } from './rules.js';

/** A new game for these names (already validated). */
export function newGame(names, startedAt = Date.now()) {
  return { players: names.map(name => ({ name, score: 0 })), round: 0, lastTopic: null, r: null, history: [], winners: null, startedAt };
}

/** Checks the names typed in setup: trimmed, without blanks, 3 to 8, no repeats. */
export function validateNames(raw) {
  const names = raw.map(s => (s || '').trim()).filter(Boolean);
  if (names.length < MIN_PLAYERS) return { error: 'few', names };
  if (names.length > MAX_PLAYERS) return { error: 'many', names };
  if (new Set(names.map(n => n.toLocaleLowerCase())).size !== names.length) return { error: 'repeated', names };
  return { error: null, names };
}

/** A random topic, never the one of the last round. */
export function randomTopic(last, rng = Math.random) {
  const pool = TOPIC_IDS.filter(t => t !== last);
  return pool[Math.floor(rng() * pool.length)];
}

/** Starts the next round: secret word, chameleon and the starter (who rotates each round). */
export function startRound(state, topic, rng = Math.random) {
  const n = state.players.length;
  state.round++;
  state.lastTopic = topic;
  state.r = {
    topic,
    secret: Math.floor(rng() * GRID),
    chameleon: Math.floor(rng() * n),
    starter: (state.round - 1) % n,
    seen: 0,            // how many players have seen their card
    phase: 'cards',
    accused: null, guess: null, outcome: null,
  };
  return state;
}

/** The seat that holds the phone now in the cards phase, in order from the starter. */
export const seatAt = (state, k) => (state.r.starter + k) % state.players.length;
export const cardHolder = state => seatAt(state, state.r.seen);
/** What a seat sees: the secret word's index, or null for the chameleon. */
export const cardFor = (state, seat) => (seat === state.r.chameleon ? null : state.r.secret);

/** The current holder has seen the card; after the last one, the clues begin. */
export function cardSeen(state) {
  if (state.r.phase !== 'cards') return state;
  state.r.seen++;
  if (state.r.seen >= state.players.length) state.r.phase = 'clues';
  return state;
}

export function toVote(state) {
  if (state.r.phase === 'clues') state.r.phase = 'vote';
  return state;
}

/** The table accuses a seat. A wrong accusation lets the chameleon escape. */
export function accuse(state, seat) {
  const r = state.r;
  if (r.phase !== 'vote' || seat < 0 || seat >= state.players.length) return state;
  r.accused = seat;
  if (seat === r.chameleon) r.phase = 'guess';
  else finishRound(state, 'escaped');
  return state;
}

/** The caught chameleon names a word of the grid. */
export function guess(state, index) {
  const r = state.r;
  if (r.phase !== 'guess' || index < 0 || index >= GRID) return state;
  r.guess = index;
  finishRound(state, index === r.secret ? 'guessed' : 'caught');
  return state;
}

function finishRound(state, outcome) {
  const r = state.r;
  r.outcome = outcome;
  r.phase = 'result';
  if (outcome === 'caught') state.players.forEach((p, i) => { if (i !== r.chameleon) p.score += POINTS.caught; });
  else state.players[r.chameleon].score += POINTS[outcome];
  state.history.push({ topic: r.topic, secret: r.secret, chameleon: r.chameleon, accused: r.accused, guess: r.guess, outcome });
  const top = Math.max(...state.players.map(p => p.score));
  state.winners = top >= TARGET ? state.players.map((p, i) => (p.score === top ? i : -1)).filter(i => i >= 0) : null;
}

/** The players sorted by points, highest first (stable on ties). */
export const standings = state => state.players.map((p, i) => ({ ...p, seat: i })).sort((a, b) => b.score - a.score || a.seat - b.seat);

/** A saved game, or null if it does not look like one of ours. */
export function fromSaved(saved) {
  const s = saved?.state;
  if (!s || !Array.isArray(s.players) || s.players.length < MIN_PLAYERS) return null;
  return s;
}
