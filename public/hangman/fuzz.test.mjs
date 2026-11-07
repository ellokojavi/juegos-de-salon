// Hangman fuzzing (#1249, step 11, docs/REPLAY.md): thousands of random games against the engine's
// invariants. Uso: node public/hangman/fuzz.test.mjs
import assert from 'node:assert/strict';
import { fuzz, rerun } from '../../tools/fuzz/fuzz.mjs';
import { random } from '../assets/js/azar.js';
import { DECKS } from './decks/index.js';
import { ALPHABETS, LIVES_OPTIONS, normalize, dealWords, initialState, view, legalActions, step } from './engine.js';

const GAMES = 2000;
const LANGS = ['es', 'en', 'pt'];
const pick = arr => arr[Math.floor(random() * arr.length)];

/** A random setup: 1 to 5 players, any deck, language, lives, buying and turns; the deal from the seed. */
function start() {
  const lang = pick(LANGS);
  const cards = pick(DECKS).cards;
  const players = ['A', 'B', 'C', 'D', 'E'].slice(0, 1 + Math.floor(random() * 5));
  const config = { lives: pick(LIVES_OPTIONS), buy: random() < 0.5, turns: random() < 0.5 };
  const dealt = dealWords({ cards, seed: Math.floor(random() * 2 ** 32), roles: players, same: random() < 0.2 });
  const words = Object.fromEntries(players.map(p => [p, normalize(cards.find(c => c.id === dealt[p])[lang].w)]));
  return initialState({ players, config, words, lang });
}

/** An action step must reject: someone out of turn, a used or foreign letter, a buy not allowed, junk. */
function illegal(s) {
  const v = view(s);
  const alpha = ALPHABETS[s.lang];
  const bad = [
    { from: 'Z', letter: 'A' },
    { from: pick(s.players), letter: '7' },
    { from: pick(s.players), letter: 'AB' },
    { from: pick(s.players), letter: '' },
  ];
  for (const p of s.players) {
    const st = v.st[p];
    if (st.used.length) bad.push({ from: p, letter: pick(st.used) });
    if (st.done) bad.push({ from: p, letter: pick(alpha) });
    if (!st.canBuy) bad.push({ from: p, buy: true });
    if (s.config.turns && v.current !== p) bad.push({ from: p, letter: pick(alpha) });
  }
  if (s.lang !== 'es') bad.push({ from: pick(s.players), letter: 'Ñ' });
  return pick(bad);
}

/** The state is valid: every derived number agrees with the plays and the words. */
function isValid(s) {
  const v = view(s);
  const max = s.config.lives;
  const alpha = ALPHABETS[s.lang];
  for (const p of s.players) {
    const st = v.st[p], w = s.words[p];
    if (!st.ready) return `${p} not ready`;
    if (st.wrong < 0 || st.wrong > max) return `${p} wrong=${st.wrong}`;
    if (st.lives !== max - st.wrong) return `${p} lives`;
    if (new Set(st.used).size !== st.used.length) return `${p} repeated letter`;
    if (st.used.some(l => !alpha.includes(l))) return `${p} letter outside the alphabet`;
    if (st.bought > st.wrong || st.boughtSet.size !== st.bought) return `${p} bought=${st.bought}`;
    const misses = st.used.filter(l => !w.includes(l) || st.boughtSet.has(l)).length;
    if (misses !== st.wrong) return `${p} wrong=${st.wrong} but ${misses} misses or buys`;
    const letters = w.replace(/ /g, '');
    const hidden = w.split('').filter(c => c !== ' ' && !st.used.includes(c)).length;
    if (st.total !== letters.length || st.left !== hidden) return `${p} left=${st.left}, expected ${hidden}`;
    const pattern = w.split('').map(c => (c === ' ' || st.used.includes(c) ? c : '.')).join('');
    if (st.pattern !== pattern) return `${p} pattern ${st.pattern} vs ${pattern}`;
    if (st.solved && st.hanged) return `${p} solved and hanged`;
    if (st.solved !== (st.left === 0)) return `${p} solved`;
    if (st.hanged !== (!st.solved && st.lives <= 0)) return `${p} hanged`;
    if (st.score !== (st.solved ? st.lives : 0) || st.score < 0) return `${p} score`;
    if (st.canBuy && (!s.config.buy || st.lives < 2 || st.done)) return `${p} canBuy`;
  }
  if (v.done !== s.players.every(p => v.st[p].done)) return 'done';
  if (v.phase !== (v.done ? 'done' : 'play')) return `phase ${v.phase}`;
  if (s.config.turns && !v.done && (!s.players.includes(v.current) || v.st[v.current].done)) return `current ${v.current}`;
  if (!s.config.turns && v.current !== null) return 'current without turns';
  if ([...v.rank].sort().join() !== [...s.players].sort().join()) return 'rank is not the players';
  return coherentRank(v, s.players);
}

/** D-61: the solved first, by margin then fewer letters; the hanged after, furthest first; hanged never wins. */
function coherentRank(v, players) {
  const st = v.st;
  for (let i = 1; i < v.rank.length; i++) {
    const a = st[v.rank[i - 1]], b = st[v.rank[i]];
    if (!a.solved && b.solved) return 'a hanged player above a solver (D-61)';
    if (a.solved && b.solved && (a.score < b.score || (a.score === b.score && a.used.length > b.used.length))) return 'solvers out of order';
    if (!a.solved && !b.solved && (a.total - a.left) < (b.total - b.left)) return 'hanged out of order (D-61)';
  }
  if (!v.done) return v.winner === null ? '' : 'winner before the end';
  if (v.winner.some(p => !st[p].solved)) return 'a hanged winner (D-61)';
  if (players.some(p => st[p].solved) !== v.winner.length > 0) return 'winner vs solved';
  if (v.winner.length && !v.winner.includes(v.rank[0])) return 'winner is not the top of the rank';
  return '';
}

/** The pure step: illegal actions give back the very same state, legal ones never mutate the old one. */
function stepChecked(s, a) {
  const before = s.plays.length;
  const next = step(s, a);
  assert.equal(s.plays.length, before, 'step mutated its input');
  return next;
}

const t0 = Date.now();
const LETTERS = ALPHABETS.es.length + 1;   // a bound: every letter once, plus the buys
const res = fuzz({
  games: GAMES, seed: 'hangman-fuzz', start, step: stepChecked, legal: s => legalActions(s), illegal,
  invariant: isValid, maxSteps: 5 * LETTERS * 2,
  finalCheck: s => (view(s).phase === 'done' ? '' : 'stuck: no legal action before the end'),
});
assert.equal(res.games, GAMES);

// A printed failure re-runs through replay.mjs to the same state
{
  const s = rerun({ seed: 'hangman-fuzz-7', actions: [] }, { start, step });
  assert.deepEqual(s.words, rerun({ seed: 'hangman-fuzz-7', actions: [] }, { start, step }).words);
}

console.log(`✓ Hangman fuzz: ${GAMES} random games, ${res.actions} actions, every invariant holds (${Date.now() - t0} ms)`);
