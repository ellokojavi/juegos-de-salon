// The home page search's order (D-397): the game's name first, then its keywords, its type, its tagline.
import assert from 'node:assert/strict';
import { ranked, relevance } from './search.js';
import { PORTADA } from './games.js';

const first = (q, lang = 'es') => ranked(q, PORTADA, lang).map(g => g.id);
assert.equal(first('toque')[0], 'toque-y-fama', 'the name wins over a tagline that says «toquen», and the shorter name over the longer');
assert.ok(first('toque').indexOf('reinas') > first('toque').indexOf('letras'), 'a tagline match goes last');
assert.equal(first('fama')[0], 'toque-y-fama');
assert.equal(first('cubilete')[0], 'generala', 'a keyword finds its game');
assert.ok(!first('cartas').includes('julepe') && !first('julepe').includes('julepe'), 'Julepe, kept in La Bodega, is not searched (D-434)');
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
const LANGS = ['es', 'en', 'pt'];
const missing = PORTADA.flatMap(x => LANGS.filter(l => !(KEYWORDS[x.id]?.[l]?.length >= 3)).map(l => `${x.id}:${l}`));
assert.deepEqual(missing, [], 'every game on the home page has at least three search keywords in es, en and pt: add `keywords` to its entry in games.js');
assert.deepEqual(Object.keys(KEYWORDS).filter(id => !PORTADA.some(x => x.id === id)), [], 'no keywords left for a game that is no longer on the home page');
// Each language finds by what a game is, not only by its name
const finds = (q, id) => search(q, PORTADA)?.has(id);
assert.ok(finds('dados', 'dudo') && finds('dice', 'dudo'), 'dice, in every language');
// The tournament types lead to La Copa (D-404): its length and its audience
assert.ok(['torneo', 'torneio', 'tournament', '7 dias', 'chile'].every(q => finds(q, 'copa')), 'every kind of tournament finds La Copa');
console.log('search: every game indexed in every language, green');
