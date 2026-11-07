// Hangman replays (#1249, step 10, docs/REPLAY.md): recorded games kept as regressions.
// Uso: node public/hangman/replay.test.mjs
import assert from 'node:assert/strict';
import { replay } from '../../tools/replay/replay.mjs';
import { random } from '../assets/js/azar.js';
import { DECKS } from './decks/index.js';
import { dealWords, buildState, normalize } from './engine.js';

/**
 * A Hangman game from { seed, deck, players, config, actions }: the seed draws the deal seed from
 * azar.js (so the same seed deals the same words), each action is one play as the engine reads it.
 */
function playHangman({ seed, deck = DECKS[0].id, lang = 'es', players, config, actions }) {
  const cards = DECKS.find(d => d.id === deck).cards;
  return replay({
    seed, actions,
    start: () => {
      const dealt = dealWords({ cards, seed: Math.floor(random() * 2 ** 32), roles: players });
      const words = Object.fromEntries(players.map(p => [p, normalize(cards.find(c => c.id === dealt[p])[lang].w)]));
      return { words, plays: [] };
    },
    step: (s, play) => ({ ...s, plays: [...s.plays, play] }),
    finish: s => ({ words: s.words, state: buildState({ players, config, words: s.words, plays: s.plays, lang }) }),
  });
}

// The same seed deals the same words: the base every replay stands on
const trato = s => playHangman({ seed: s, players: ['A', 'B', 'C'], config: {}, actions: [] }).words;
assert.deepEqual(trato('replay-1'), trato('replay-1'), 'same seed, same deal');

// A full recorded game, the model for future bug replays: two players in turns, A solves, B is hanged
{
  const players = ['A', 'B'];
  const config = { lives: 6, turns: true };
  const { words } = playHangman({ seed: 'hangman-full-1', players, config, actions: [] });
  // The recording: A plays its word's letters in order; B only letters its word lacks
  const aLetters = [...new Set(words.A.replace(/\s/g, ''))];
  const bMiss = 'ÑWKXZQJ'.split('').filter(l => !words.B.toUpperCase().includes(l)).slice(0, 6);
  const actions = [];
  for (let i = 0; i < Math.max(aLetters.length, bMiss.length); i++) {
    if (aLetters[i]) actions.push({ from: 'A', letter: aLetters[i], ms: 1000 });
    if (bMiss[i]) actions.push({ from: 'B', letter: bMiss[i], ms: 1000 });
  }
  const a = playHangman({ seed: 'hangman-full-1', players, config, actions });
  const b = playHangman({ seed: 'hangman-full-1', players, config, actions });
  assert.deepEqual(a.words, b.words, 'the replay deals the same words twice');
  assert.equal(a.state.phase, 'done');
  assert.ok(a.state.st.A.solved && a.state.st.A.lives === 6, 'A solves it without a miss');
  assert.ok(a.state.st.B.hanged, 'B is hanged');
  assert.deepEqual(a.state.winner, ['A']);
  assert.deepEqual(a.state.rank, ['A', 'B']);
}

// D-61, the bug from the first multi-phone test: all three hanged and the screen crowned the one
// who had revealed no letter. Replayed: nobody wins, and among the hanged the furthest goes first.
{
  const players = ['A', 'B', 'C'];
  const config = { lives: 5 };
  const { words } = playHangman({ seed: 'hangman-d61', players, config, actions: [] });
  const misses = w => 'ÑWKXZQJYVHF'.split('').filter(l => !w.toUpperCase().includes(l)).slice(0, 5);
  const hits = w => [...new Set(w.replace(/\s/g, ''))];
  const actions = [
    ...hits(words.A).slice(0, 2).map(letter => ({ from: 'A', letter })),   // A reveals two letters
    ...hits(words.B).slice(0, 1).map(letter => ({ from: 'B', letter })),   // B one
    ...['A', 'B', 'C'].flatMap(p => misses(words[p]).map(letter => ({ from: p, letter }))),
  ];
  const { state } = playHangman({ seed: 'hangman-d61', players, config, actions });
  assert.equal(state.phase, 'done');
  assert.ok(players.every(p => state.st[p].hanged), 'all three hanged');
  assert.deepEqual(state.winner, [], 'nobody is crowned (D-61)');
  assert.deepEqual(state.rank, ['A', 'B', 'C'], 'among the hanged, the one who got furthest first (D-61)');
}

console.log('✓ Hangman replays: the same seed deals the same game, and D-61 stays fixed');
