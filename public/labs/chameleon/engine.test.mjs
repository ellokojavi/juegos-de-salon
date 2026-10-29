// El Camaleón: the word packs and the rules of a round (node public/labs/chameleon/engine.test.mjs)
import assert from 'node:assert/strict';
import * as E from './engine.js';
import { LOCALES, TOPIC_IDS, TOPIC_EMOJI, GRID, TARGET } from './rules.js';

// Packs: every language has every topic, 16 distinct words each, and the same interface keys
const keys = Object.keys(LOCALES.es.ui).sort();
for (const [lang, L] of Object.entries(LOCALES)) {
  assert.deepEqual(Object.keys(L.ui).sort(), keys, `${lang}: same interface keys as es`);
  for (const k of keys) assert.ok(L.ui[k].trim(), `${lang}.${k} is not empty`);
  assert.deepEqual(Object.keys(L.topics), TOPIC_IDS, `${lang}: the topics, in order`);
  for (const t of TOPIC_IDS) {
    const { name, words } = L.topics[t];
    assert.ok(name, `${lang}.${t} has a name`);
    assert.equal(words.length, GRID, `${lang}.${t} has ${GRID} words`);
    assert.equal(new Set(words.map(w => w.toLowerCase())).size, GRID, `${lang}.${t}: no repeated words`);
    for (const w of words) assert.ok(w.length <= 16, `${lang}.${t}: "${w}" fits a cell at 320 px`);
  }
}
for (const t of TOPIC_IDS) assert.ok(TOPIC_EMOJI[t], `${t} has an emoji`);
// The same placeholders in every language
const holes = s => [...s.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join();
for (const k of keys) for (const lang of ['en', 'pt', 'de']) assert.equal(holes(LOCALES[lang].ui[k]), holes(LOCALES.es.ui[k]), `${lang}.${k}: same {placeholders} as es`);

// Names
assert.equal(E.validateNames(['Ana', ' ', 'Beto']).error, 'few');
assert.equal(E.validateNames(['Ana', 'beto', 'Beto']).error, 'repeated');
assert.deepEqual(E.validateNames([' Ana ', 'Beto', 'Cata', '']), { error: null, names: ['Ana', 'Beto', 'Cata'] });
assert.equal(E.validateNames(Array.from({ length: 9 }, (_, i) => `P${i}`)).error, 'many');

// A random topic never repeats the last one
for (let k = 0; k < 200; k++) { const r = Math.random(); assert.notEqual(E.randomTopic('food', () => r), 'food'); }

// A seeded generator for the rounds
const seq = (...xs) => { let i = 0; return () => xs[i++ % xs.length]; };

// A round: cards go around from the starter, everyone sees the word but the chameleon
let s = E.newGame(['Ana', 'Beto', 'Cata', 'Dani']);
E.startRound(s, 'animals', seq(0.5, 0.3)); // secret 8, chameleon 1
assert.equal(s.r.secret, 8); assert.equal(s.r.chameleon, 1); assert.equal(s.r.starter, 0); assert.equal(s.r.phase, 'cards');
const seen = [];
while (s.r.phase === 'cards') { const seat = E.cardHolder(s); seen.push([seat, E.cardFor(s, seat)]); E.cardSeen(s); }
assert.deepEqual(seen, [[0, 8], [1, null], [2, 8], [3, 8]]);
assert.equal(s.r.phase, 'clues');
E.cardSeen(s); assert.equal(s.r.seen, 4, 'no extra cards after the last');

// Wrong accusation: the chameleon escapes, +2
E.toVote(s); E.accuse(s, 2);
assert.equal(s.r.outcome, 'escaped'); assert.equal(s.players[1].score, 2); assert.equal(s.r.phase, 'result');
assert.equal(s.winners, null);

// Next round: the starter rotates; caught and guesses → +1 for the chameleon
E.startRound(s, 'food', seq(0.1, 0.9)); // secret 1, chameleon 3
assert.equal(s.r.starter, 1); assert.equal(E.cardHolder(s), 1);
for (let k = 0; k < 4; k++) E.cardSeen(s);
E.accuse(s, 3); assert.equal(s.r.phase, 'clues', 'no accusing before the vote');
E.toVote(s); E.accuse(s, 3);
assert.equal(s.r.phase, 'guess');
E.guess(s, 1);
assert.equal(s.r.outcome, 'guessed'); assert.equal(s.players[3].score, 1);

// Caught and misses → +1 for everyone else
E.startRound(s, 'sports', seq(0, 0)); // secret 0, chameleon 0
for (let k = 0; k < 4; k++) E.cardSeen(s);
E.toVote(s); E.accuse(s, 0); E.guess(s, 5);
assert.equal(s.r.outcome, 'caught');
assert.deepEqual(s.players.map(p => p.score), [0, 3, 1, 2]);
assert.equal(s.history.length, 3);
assert.deepEqual(E.standings(s).map(p => p.name), ['Beto', 'Dani', 'Cata', 'Ana']);

// First to TARGET wins; a tie names everyone at the top
s = E.newGame(['Ana', 'Beto', 'Cata']);
s.players[0].score = TARGET - 1; s.players[1].score = TARGET - 1;
E.startRound(s, 'jobs', seq(0, 0.9)); // chameleon 2
for (let k = 0; k < 3; k++) E.cardSeen(s);
E.toVote(s); E.accuse(s, 2); E.guess(s, 3);
assert.deepEqual(s.winners, [0, 1]);

// Saved games
assert.equal(E.fromSaved(null), null);
assert.equal(E.fromSaved({ state: { players: [{}, {}] } }), null);
assert.ok(E.fromSaved({ state: s }));

console.log('✓ chameleon engine: packs in 4 languages, cards, vote, guess, points and winners');
