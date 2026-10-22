// The home page search's order (D-397): the game's name first, then its keywords, its type, its tagline.
import assert from 'node:assert/strict';
import { ranked, relevance } from './search.js';
import { PORTADA } from './games.js';

const first = (q, lang = 'es') => ranked(q, PORTADA, lang).map(g => g.id);
assert.equal(first('toque')[0], 'toque-y-fama', 'the name wins over a tagline that says «toquen», and the shorter name over the longer');
assert.ok(first('toque').indexOf('reinas') > first('toque').indexOf('letras'), 'a tagline match goes last');
assert.equal(first('fama')[0], 'toque-y-fama');
assert.equal(first('cartas')[0], 'julepe', 'a keyword beats the coarse type Cartas/Dados');
assert.equal(first('dados')[0], 'dudo');
assert.equal(first('queens', 'en')[0], 'reinas', 'the name in the player\'s language');
const g = PORTADA.find(x => x.id === 'reinas');
assert.ok(relevance('reinas', g) > relevance('colores', g), 'its name scores above its keywords');
assert.equal(relevance('xyz', g), 0);
assert.deepEqual(ranked('', PORTADA), []);
console.log('search: the name first, green');

// Everything on the home page can be searched, in every language of the app (D-404): a game (or La Copa)
// without keywords in one of them fails here, so a new one cannot ship unindexed
import { KEYWORDS, search } from './search.js';
const LANGS = ['es', 'en', 'pt', 'de'];
const missing = PORTADA.flatMap(x => LANGS.filter(l => !(KEYWORDS[x.id]?.[l]?.length >= 3)).map(l => `${x.id}:${l}`));
assert.deepEqual(missing, [], 'every game on the home page has at least three search keywords in es, en, pt and de: add them to KEYWORDS in search.js');
assert.deepEqual(Object.keys(KEYWORDS).filter(id => !PORTADA.some(x => x.id === id)), [], 'no keywords left for a game that is no longer on the home page');
// Each language finds by what a game is, not only by its name
const finds = (q, id) => search(q, PORTADA)?.has(id);
assert.ok(finds('würfel', 'dudo') && finds('wurfel', 'generala') && finds('dados', 'dudo') && finds('dice', 'dudo'), 'dice, in all four');
assert.ok(finds('kartenspiel', 'julepe') && finds('baralho', 'julepe'), 'cards, in German and Portuguese');
assert.ok(finds('rätsel', 'reinas') && finds('quebra-cabeça', 'tango'), 'puzzles, in German and Portuguese');
// The tournament types lead to La Copa (D-404): its length and its audience
assert.ok(['torneo', 'turnier', 'torneio', 'tournament', '7 dias', '3 tage', 'chile', 'brasilien'].every(q => finds(q, 'copa')), 'every kind of tournament finds La Copa');
console.log('search: every game indexed in four languages, green');
